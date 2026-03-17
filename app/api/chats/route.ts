import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import {
  getProjectsByUserId, getProjectMessages, getMessagesSince,
  createMessage, getUserById, createTicket, getProjectById,
} from '@/lib/db';
import { getAIResponse, isAITagged, extractAIQuery } from '@/lib/openai';
import { ChatMessage, Ticket } from '@/lib/types';
import { ApiResponse } from '@/lib/types';
import { sendNewChatMessage, sendServiceInquiryReceived, sendTicketSubmitted } from '@/lib/email';

// GET /api/chats?projectId=xxx&since=ISO_DATE
// - projectId: optional; defaults to user's first project
// - since: optional; only return messages newer than this timestamp (for polling)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage[]>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    let projectId = searchParams.get('projectId');
    const sinceParam = searchParams.get('since');

    // Resolve projectId
    if (!projectId) {
      const projects = await getProjectsByUserId(payload.userId, payload.role);
      if (projects.length === 0) return NextResponse.json({ success: true, data: [] });
      projectId = projects[0]._id!;
    }

    // Verify access
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let messages: ChatMessage[];
    if (sinceParam) {
      const since = new Date(sinceParam);
      messages = await getMessagesSince(projectId, since);
    } else {
      messages = await getProjectMessages(projectId, 100);
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chats
// Body: { projectId?, message, type?, attachments?, ticket? }
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage | ChatMessage[]>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { message, type = 'text', attachments, ticket: ticketData } = body;
    let { projectId } = body;

    if (!message?.trim() && type !== 'file' && type !== 'voice' && type !== 'video') {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // Resolve projectId
    if (!projectId) {
      const projects = await getProjectsByUserId(payload.userId, payload.role);
      if (projects.length === 0) {
        return NextResponse.json({ success: false, error: 'No projects found' }, { status: 400 });
      }
      projectId = projects[0]._id!;
    }

    // Verify access
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const sender = await getUserById(payload.userId);
    if (!sender) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // Handle ticket submission from chat
    let embeddedTicket = undefined;
    if (type === 'ticket' && ticketData) {
      const { ticketType, title, description } = ticketData;
      if (!title?.trim() || !description?.trim()) {
        return NextResponse.json({ success: false, error: 'Ticket title and description are required' }, { status: 400 });
      }
      const validTypes = ['bug', 'feature_request'];
      if (!validTypes.includes(ticketType)) {
        return NextResponse.json({ success: false, error: 'Ticket type must be "bug" or "feature_request"' }, { status: 400 });
      }

      const newTicket: Ticket = {
        projectId,
        clientId: payload.userId,
        clientName: sender.name,
        subject: title.trim(),
        description: description.trim(),
        type: ticketType,
        status: 'open',
        priority: 'medium',
      };
      const createdTicket = await createTicket(newTicket);
      embeddedTicket = {
        ticketId: createdTicket._id!,
        type: ticketType as 'bug' | 'feature_request',
        title: title.trim(),
        status: 'open' as const,
      };
    }

    // Build the user message
    const userMessage: ChatMessage = {
      projectId,
      senderId: payload.userId,
      senderName: sender.name,
      senderRole: payload.role as 'admin' | 'client',
      message: message?.trim() || '',
      type: type as ChatMessage['type'],
      attachments: attachments || undefined,
      ticket: embeddedTicket,
      readBy: [payload.userId],
      createdAt: new Date(),
    };

    const savedMessage = await createMessage(userMessage);
    const responses: ChatMessage[] = [savedMessage];

    // ── Email notifications ─────────────────────────────────────────────────
    // Notify the other party about the new message (skip AI messages)
    if (payload.role === 'client') {
      // Client → admin: notify admin
      sendNewChatMessage({
        recipientEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        recipientName: 'Admin',
        senderName: sender.name,
        senderRole: 'client',
        projectName: project.name,
        messagePreview: message?.trim() || '[attachment]',
        projectId,
      });

      // Service inquiry detection: message auto-sent from services page contains this phrase
      if (message?.toLowerCase().includes("i'm interested in the") || message?.toLowerCase().includes('interested in the')) {
        const serviceMatch = message.match(/interested in the (.+?) \(/i);
        const serviceName = serviceMatch ? serviceMatch[1] : 'a service';
        sendServiceInquiryReceived({
          clientName: sender.name,
          clientEmail: sender.email,
          serviceName,
          messagePreview: message.trim(),
          projectId,
        });
      }
    } else if (payload.role === 'admin') {
      // Admin → client: look up client email and notify
      const clientUser = await getUserById(project.clientId);
      if (clientUser) {
        sendNewChatMessage({
          recipientEmail: clientUser.email,
          recipientName: clientUser.name,
          senderName: sender.name,
          senderRole: 'admin',
          projectName: project.name,
          messagePreview: message?.trim() || '[attachment]',
          projectId,
        });
      }
    }

    // Ticket-in-chat: email admin if a ticket message was just submitted
    if (type === 'ticket' && embeddedTicket && payload.role === 'client') {
      sendTicketSubmitted({
        clientName: sender.name,
        clientEmail: sender.email,
        subject: embeddedTicket.title,
        type: embeddedTicket.type,
        description: message?.trim() || '',
        priority: 'medium',
        ticketId: embeddedTicket.ticketId,
      });
    }

    // AI response — trigger when message contains @AI
    if (isAITagged(message)) {
      try {
        const query = extractAIQuery(message);

        // Build conversation history for context (last 8 messages)
        const history = await getProjectMessages(projectId, 8);
        const aiHistory = history
          .filter(m => m._id !== savedMessage._id)
          .map(m => ({
            role: (m.senderRole === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.message,
          }));

        const aiText = await getAIResponse(query || 'Hello', aiHistory);

        const aiMessage: ChatMessage = {
          projectId,
          senderId: 'ai-assistant',
          senderName: 'AI Assistant',
          senderRole: 'ai',
          message: aiText,
          type: 'text',
          isAI: true,
          readBy: [],
          createdAt: new Date(Date.now() + 100), // slight offset so it sorts after user msg
        };
        const savedAI = await createMessage(aiMessage);
        responses.push(savedAI);
      } catch (aiError) {
        // AI failure is non-fatal — log and continue
        console.error('AI response error:', aiError);
        const errorMsg: ChatMessage = {
          projectId,
          senderId: 'ai-assistant',
          senderName: 'AI Assistant',
          senderRole: 'ai',
          message: 'Sorry, I\'m having trouble connecting right now. Please try again or contact your admin directly.',
          type: 'text',
          isAI: true,
          readBy: [],
          createdAt: new Date(Date.now() + 100),
        };
        const savedError = await createMessage(errorMsg);
        responses.push(savedError);
      }
    }

    if (responses.length === 1) {
      return NextResponse.json({ success: true, data: responses[0] }, { status: 201 });
    }
    return NextResponse.json({ success: true, data: responses }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
