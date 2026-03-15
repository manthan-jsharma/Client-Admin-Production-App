import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, getProjectMessages, createMessage, getUserById } from '@/lib/db';
import { ChatMessage, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage[]>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all projects for this user
    const projects = await getProjectsByUserId(payload.userId, payload.role);
    
    // Collect all messages from all projects, sorted by date
    let allMessages: ChatMessage[] = [];
    for (const project of projects) {
      const messages = await getProjectMessages(project._id!, 100);
      allMessages = [...allMessages, ...messages];
    }

    // Sort by creation date
    allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(
      {
        success: true,
        data: allMessages
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, projectId, type = 'text' } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get project ID if not provided (use first project)
    let actualProjectId = projectId;
    if (!actualProjectId) {
      const projects = await getProjectsByUserId(payload.userId, payload.role);
      if (projects.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No projects found' },
          { status: 400 }
        );
      }
      actualProjectId = projects[0]._id;
    }

    const sender = await getUserById(payload.userId);
    if (!sender) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const newMessage: ChatMessage = {
      projectId: actualProjectId,
      senderId: payload.userId,
      senderName: sender.name,
      senderRole: payload.role as 'admin' | 'client',
      message,
      type: type as 'text' | 'voice' | 'video' | 'file',
      createdAt: new Date()
    };

    const createdMessage = await createMessage(newMessage);

    return NextResponse.json(
      {
        success: true,
        data: createdMessage
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Error creating message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
