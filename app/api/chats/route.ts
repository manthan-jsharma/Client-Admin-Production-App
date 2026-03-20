import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";
import {
  getProjectsByUserId,
  getProjectMessages,
  getMessagesSince,
  createMessage,
  getUserById,
  createTicket,
  getProjectById,
  getAllUsers,
} from "@/lib/db";
import { getAIResponse, isAITagged, extractAIQuery } from "@/lib/openai";
import { ChatMessage, Ticket } from "@/lib/types";
import { ApiResponse } from "@/lib/types";
import { sendServiceInquiryReceived } from "@/lib/email";
import { tgChatMessage, tgMentionNotify } from "@/lib/telegram";

// GET /api/chats?projectId=xxx&since=ISO_DATE
// - projectId: optional; defaults to user's first project
// - since: optional; only return messages newer than this timestamp (for polling)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChatMessage[]>>> {
  try {
    const token = extractToken(request.headers.get("Authorization"));
    if (!token)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    let projectId = searchParams.get("projectId");
    const sinceParam = searchParams.get("since");
    const beforeParam = searchParams.get("before");
    const PAGE_SIZE = 50;

    // Resolve projectId
    if (!projectId) {
      const projects = await getProjectsByUserId(payload.userId, payload.role);
      if (projects.length === 0) {
        // No project yet — use a personal inbox channel so client can still reach admin/AI
        projectId = `inbox_${payload.userId}`;
      } else {
        projectId = projects[0]._id!;
      }
    }

    // Verify access (skip for inbox channels — they are personal to the user)
    if (!projectId.startsWith("inbox_")) {
      const project = await getProjectById(projectId);
      if (!project)
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        );
      if (payload.role === "client" && project.clientId !== payload.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    } else if (
      projectId !== `inbox_${payload.userId}` &&
      payload.role !== "admin" &&
      payload.role !== "support_admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    let messages: ChatMessage[];
    let hasMore = false;

    if (sinceParam) {
      // Polling for new messages only
      const since = new Date(sinceParam);
      messages = await getMessagesSince(projectId, since);
    } else if (beforeParam) {
      // Infinite scroll — load older page
      const before = new Date(beforeParam);
      // Fetch one extra to detect hasMore
      messages = await getProjectMessages(projectId, PAGE_SIZE + 1, before);
      if (messages.length > PAGE_SIZE) {
        hasMore = true;
        messages = messages.slice(1); // drop the extra (oldest) one, keep PAGE_SIZE newest
      }
    } else {
      // Initial load — latest PAGE_SIZE messages
      messages = await getProjectMessages(projectId, PAGE_SIZE + 1);
      if (messages.length > PAGE_SIZE) {
        hasMore = true;
        messages = messages.slice(1);
      }
    }

    return NextResponse.json({ success: true, data: messages, hasMore });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chats
// Body: { projectId?, message, type?, attachments?, ticket? }
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChatMessage | ChatMessage[]>>> {
  try {
    const token = extractToken(request.headers.get("Authorization"));
    if (!token)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );

    const body = await request.json();
    const { message, type = "text", attachments, ticket: ticketData } = body;
    let { projectId } = body;

    if (
      !message?.trim() &&
      type !== "file" &&
      type !== "voice" &&
      type !== "video"
    ) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Resolve projectId
    if (!projectId) {
      const projects = await getProjectsByUserId(payload.userId, payload.role);
      projectId =
        projects.length > 0 ? projects[0]._id! : `inbox_${payload.userId}`;
    }

    // Verify access (skip for personal inbox channels)
    let project = null;
    if (!projectId.startsWith("inbox_")) {
      project = await getProjectById(projectId);
      if (!project)
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        );
      if (payload.role === "client" && project.clientId !== payload.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (
        payload.role === "dev" &&
        !project.assignedDevs?.includes(payload.userId)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden — dev not assigned to this project",
          },
          { status: 403 }
        );
      }
    } else if (
      projectId !== `inbox_${payload.userId}` &&
      payload.role !== "admin" &&
      payload.role !== "support_admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const sender = await getUserById(payload.userId);
    if (!sender)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );

    // Handle ticket submission from chat
    let embeddedTicket = undefined;
    if (type === "ticket" && ticketData) {
      const { ticketType, title, description } = ticketData;
      if (!title?.trim() || !description?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Ticket title and description are required",
          },
          { status: 400 }
        );
      }
      const validTypes = ["bug", "feature_request"];
      if (!validTypes.includes(ticketType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ticket type must be "bug" or "feature_request"',
          },
          { status: 400 }
        );
      }

      const newTicket: Ticket = {
        projectId,
        clientId: payload.userId,
        clientName: sender.name,
        subject: title.trim(),
        description: description.trim(),
        type: ticketType,
        status: "open",
        priority: "medium",
      };
      const createdTicket = await createTicket(newTicket);
      embeddedTicket = {
        ticketId: createdTicket._id!,
        type: ticketType as "bug" | "feature_request",
        title: title.trim(),
        status: "open" as const,
      };
    }

    // Build the user message
    const userMessage: ChatMessage = {
      projectId,
      senderId: payload.userId,
      senderName: sender.name,
      senderRole: (payload.role === 'support_admin' ? 'support_admin' : payload.role) as ChatMessage['senderRole'],
      message: message?.trim() || "",
      type: type as ChatMessage["type"],
      attachments: attachments || undefined,
      ticket: embeddedTicket,
      readBy: [payload.userId],
      createdAt: new Date(),
    };

    const savedMessage = await createMessage(userMessage);
    const responses: ChatMessage[] = [savedMessage];

    // ── @mention Telegram notifications ────────────────────────────────────
    if (message) {
      const mentionedHandles: string[] = [
        ...new Set<string>(
          (message.match(/@(\w+)/g) ?? []).map((m: string) => m.toLowerCase())
        ),
      ];
      if (mentionedHandles.length > 0) {
        const allUsers = await getAllUsers();
        for (const handle of mentionedHandles) {
          if (handle === "@ai") continue;
          // Match by role: @dev → first dev on project, @admin → project adminId, @client → project clientId
          let targetId: string | undefined;
          let mentionedRole: string | undefined;
          if (handle === "@admin") {
            targetId = project?.adminId;
            mentionedRole = "admin";
          } else if (handle === "@client") {
            targetId = project?.clientId;
            mentionedRole = "client";
          } else if (handle === "@dev") {
            targetId = project?.assignedDevs?.[0];
            mentionedRole = "dev";
          } else if (handle === "@support") {
            const sa = allUsers.find((u) => u.role === "support_admin");
            targetId = sa?._id;
            mentionedRole = "support_admin";
          } else {
            const slug = handle.slice(1).toLowerCase();
            const found = allUsers.find(
              (u) => u.name?.toLowerCase().replace(/\s+/g, "") === slug
            );
            targetId = found?._id;
            mentionedRole = found?.role;
          }
          if (targetId && targetId !== payload.userId) {
            void tgMentionNotify({
              mentionedUserId: targetId,
              mentionedHandle: handle,
              mentionedRole: mentionedRole ?? "client",
              senderName: sender.name,
              projectName: project?.name ?? "General Chat",
              messagePreview: message.trim(),
              projectId,
            });
          }
        }
      }
    }

    // ── Email notifications ─────────────────────────────────────────────────
    // Notify the other party about the new message (skip AI messages)
    if (payload.role === "client") {
      // Client → admin + support admins: notify
      const allUsersForNotify = await getAllUsers();
      const supportAdmins = allUsersForNotify.filter(u => u.role === 'support_admin');
      // For inbox chats (no project), find any admin to notify
      const adminId = project?.adminId || allUsersForNotify.find(u => u.role === 'admin')?._id as string || "";

      // Telegram to admin — throttled
      void tgChatMessage({
        projectId,
        projectName: project?.name ?? "General Inbox",
        senderName: sender.name,
        senderRole: "client",
        recipientId: adminId,
        messagePreview: message?.trim() || "[attachment]",
      });

      // Telegram to each support admin — throttled
      for (const sa of supportAdmins) {
        void tgChatMessage({
          projectId,
          projectName: project?.name ?? "General Chat",
          senderName: sender.name,
          senderRole: "client",
          recipientId: sa._id as string,
          messagePreview: message?.trim() || "[attachment]",
        });
      }

      // Service inquiry detection: message auto-sent from services page contains this phrase
      if (
        message?.toLowerCase().includes("i'm interested in the") ||
        message?.toLowerCase().includes("interested in the")
      ) {
        const serviceMatch = message.match(/interested in the (.+?) \(/i);
        const serviceName = serviceMatch ? serviceMatch[1] : "a service";
        sendServiceInquiryReceived({
          clientName: sender.name,
          clientEmail: sender.email,
          serviceName,
          messagePreview: message.trim(),
          projectId,
        });
      }
    } else if (payload.role === "dev") {
      // Dev → admin + support admins: notify
      const allUsersForNotify = await getAllUsers();
      const supportAdmins = allUsersForNotify.filter(u => u.role === 'support_admin');

      void tgChatMessage({
        projectId,
        projectName: project?.name ?? "General Chat",
        senderName: sender.name,
        senderRole: "dev",
        recipientId: project?.adminId ?? "",
        messagePreview: message?.trim() || "[attachment]",
      });

      for (const sa of supportAdmins) {
        void tgChatMessage({
          projectId,
          projectName: project?.name ?? "General Chat",
          senderName: sender.name,
          senderRole: "dev",
          recipientId: sa._id as string,
          messagePreview: message?.trim() || "[attachment]",
        });
      }
    } else if (payload.role === "admin" || payload.role === "support_admin") {
      // Admin/Support admin → client: look up client email and notify
      const clientUser = project?.clientId
        ? await getUserById(project.clientId)
        : null;
      if (clientUser) {
        // Telegram — throttled: skip if client was active in last 5 min
        void tgChatMessage({
          projectId,
          projectName: project?.name ?? "General Chat",
          senderName: sender.name,
          senderRole: "admin",
          recipientId: project?.clientId ?? "",
          messagePreview: message?.trim() || "[attachment]",
        });
      }
    }

    // AI response — trigger when message contains @AI
    if (isAITagged(message)) {
      try {
        const query = extractAIQuery(message);

        // Build conversation history for context (last 8 messages)
        const history = await getProjectMessages(projectId, 8);
        const aiHistory = history
          .filter((m) => m._id !== savedMessage._id)
          .map((m) => ({
            role: (m.senderRole === "ai" ? "assistant" : "user") as
              | "user"
              | "assistant",
            content: m.message,
          }));

        const aiText = await getAIResponse(query || "Hello", aiHistory);

        const aiMessage: ChatMessage = {
          projectId,
          senderId: "ai-assistant",
          senderName: "AI Assistant",
          senderRole: "ai",
          message: aiText,
          type: "text",
          isAI: true,
          readBy: [],
          createdAt: new Date(Date.now() + 100), // slight offset so it sorts after user msg
        };
        const savedAI = await createMessage(aiMessage);
        responses.push(savedAI);
      } catch (aiError) {
        // AI failure is non-fatal — log and continue
        console.error("AI response error:", aiError);
        const errorMsg: ChatMessage = {
          projectId,
          senderId: "ai-assistant",
          senderName: "AI Assistant",
          senderRole: "ai",
          message:
            "Sorry, I'm having trouble connecting right now. Please try again or contact your admin directly.",
          type: "text",
          isAI: true,
          readBy: [],
          createdAt: new Date(Date.now() + 100),
        };
        const savedError = await createMessage(errorMsg);
        responses.push(savedError);
      }
    }

    if (responses.length === 1) {
      return NextResponse.json(
        { success: true, data: responses[0] },
        { status: 201 }
      );
    }
    return NextResponse.json(
      { success: true, data: responses },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
