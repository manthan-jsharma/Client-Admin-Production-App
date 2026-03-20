import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, getProjectMessages, getUserById, getUnreadCount, getAllUsers } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'support_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all projects, then fetch last message + metadata for each
    const projects = await getAllProjects();

    const threads = await Promise.all(
      projects.map(async (project) => {
        const messages = await getProjectMessages(project._id!, 1);
        const client = await getUserById(project.clientId);
        const lastMessage = messages[0] || null;

        const unreadCount = await getUnreadCount(project._id!, decoded.userId);

        return {
          projectId: project._id,
          projectName: project.name,
          clientId: project.clientId,
          clientName: client?.name || 'Unknown',
          clientAvatar: client?.profilePicture || null,
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                senderName: lastMessage.senderName,
                senderRole: lastMessage.senderRole,
                createdAt: lastMessage.createdAt,
              }
            : null,
          projectStatus: project.status,
          unreadCount,
        };
      })
    );

    // Include inbox threads for clients without any project
    const allUsers = await getAllUsers();
    const clientsWithProject = new Set(projects.map(p => p.clientId));
    const inboxClients = allUsers.filter(u => u.role === 'client' && !clientsWithProject.has(u._id as string));
    const inboxThreads = await Promise.all(
      inboxClients.map(async (client) => {
        const inboxId = `inbox_${client._id}`;
        const messages = await getProjectMessages(inboxId, 1);
        if (messages.length === 0) return null;
        const unreadCount = await getUnreadCount(inboxId, decoded.userId);
        return {
          projectId: inboxId,
          projectName: 'General Inbox',
          clientId: client._id as string,
          clientName: client.name,
          clientAvatar: client.profilePicture || null,
          lastMessage: { message: messages[0].message, senderName: messages[0].senderName, senderRole: messages[0].senderRole, createdAt: messages[0].createdAt },
          projectStatus: 'active',
          unreadCount,
        };
      })
    );
    threads.push(...inboxThreads.filter(Boolean) as typeof threads);

    // Sort by most recent message first
    threads.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ success: true, data: threads });
  } catch (error) {
    console.error('Error fetching chat threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
