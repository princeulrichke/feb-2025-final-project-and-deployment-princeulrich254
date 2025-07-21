'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'

export default function ERPPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Enterprise Resource Planning</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            ERP Module
          </CardTitle>
          <CardDescription>
            Comprehensive enterprise resource planning and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4" />
          </div>
          <p className="text-center text-muted-foreground">
            ERP features including project management, resource allocation, and business process automation coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
