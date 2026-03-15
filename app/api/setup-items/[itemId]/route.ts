import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    if (typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const db = getDatabase()
    const itemIndex = db.setupItems.findIndex(item => item.id === params.itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Setup item not found' }, { status: 404 })
    }

    // Check if user has access to this item (if client)
    const item = db.setupItems[itemIndex]
    if (decoded.role === 'client' && item.clientId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    db.setupItems[itemIndex] = { 
      ...db.setupItems[itemIndex], 
      completed: body.completed,
      completedAt: body.completed ? new Date().toISOString() : null
    }

    return NextResponse.json(db.setupItems[itemIndex])
  } catch (error) {
    console.error('Error updating setup item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
