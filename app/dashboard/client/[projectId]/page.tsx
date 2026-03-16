'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, FileText, Users, MessageSquare } from 'lucide-react'

interface RoadmapItem {
  day: number
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'pending'
  videoUrl?: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) throw new Error('Failed to fetch project')
        const data = await response.json()
        setProject(data)
        
        // Generate mock roadmap items (14 days)
        const items = Array.from({ length: 14 }, (_, i) => ({
          day: i + 1,
          title: `Phase ${Math.ceil((i + 1) / 4)} - Day ${i + 1}`,
          description: `Milestone ${i + 1} of your project implementation`,
          status: (i < 3 ? 'completed' : i < 7 ? 'in-progress' : 'pending') as RoadmapItem['status'],
          videoUrl: `https://www.youtube.com/embed/dQw4w9WgXcQ?start=${i * 60}`
        }))
        setRoadmapItems(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) fetchProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">{error || 'Project not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{project.name}</CardTitle>
              <CardDescription className="mt-2">{project.description}</CardDescription>
            </div>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{project.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Manager</p>
              <p className="font-medium">{project.manager}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-medium">${project.budget?.toLocaleString() || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roadmap">14-Day Roadmap</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <div className="space-y-3">
            {roadmapItems.map((item) => (
              <Card key={item.day}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Day {item.day}: {item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <Badge variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'in-progress' ? 'secondary' : 'outline'
                    }>
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                {item.videoUrl && (
                  <CardContent>
                    <div className="bg-black rounded-lg overflow-hidden aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={item.videoUrl}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{project.manager}</p>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                  </div>
                  <Badge>Lead</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No files uploaded yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Project Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Project Created</p>
                  <p className="text-sm text-muted-foreground">{new Date(project.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
