import { NextRequest, NextResponse } from 'next/server'
import { updateSetupItem } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    if (typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { itemId } = await params

    const updated = await updateSetupItem(itemId, {
      completed: body.completed,
      completedAt: body.completed ? new Date() : undefined,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Setup item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating setup item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
