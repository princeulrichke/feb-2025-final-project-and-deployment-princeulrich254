'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus } from 'lucide-react'

export default function SalesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Sales Module
          </CardTitle>
          <CardDescription>
            Sales tracking, order management, and performance analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4" />
          </div>
          <p className="text-center text-muted-foreground">
            Sales features including order processing, quote generation, sales analytics, and commission tracking coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
