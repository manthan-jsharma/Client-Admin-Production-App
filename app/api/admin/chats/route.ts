import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, getProjectMessages, getUserById, getUnreadCount } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
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
