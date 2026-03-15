import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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

    const db = getDatabase()
    const project = db.projects.find(p => p.id === params.projectId)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access to this project
    if (decoded.role === 'client' && project.clientId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const db = getDatabase()
    const projectIndex = db.projects.findIndex(p => p.id === params.projectId)

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate input
    if (body.name && typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 })
    }

    db.projects[projectIndex] = { ...db.projects[projectIndex], ...body }
    return NextResponse.json(db.projects[projectIndex])
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
