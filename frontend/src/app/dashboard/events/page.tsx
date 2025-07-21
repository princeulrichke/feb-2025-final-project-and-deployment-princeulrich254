'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'

export default function EventsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Event Management</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Events Module
          </CardTitle>
          <CardDescription>
            Event planning, scheduling, and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4" />
          </div>
          <p className="text-center text-muted-foreground">
            Event management features including calendar integration, event planning, attendee management, and scheduling coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
