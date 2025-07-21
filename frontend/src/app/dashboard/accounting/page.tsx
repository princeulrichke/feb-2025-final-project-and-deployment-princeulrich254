'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Plus } from 'lucide-react'

export default function AccountingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Accounting & Finance</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Accounting Module
          </CardTitle>
          <CardDescription>
            Financial management, accounting, and reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <DollarSign className="h-12 w-12 mb-4" />
          </div>
          <p className="text-center text-muted-foreground">
            Accounting features including invoicing, expense tracking, financial reporting, and tax management coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
