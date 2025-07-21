'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function StockMovements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stock Movement Logs</h2>
        <p className="text-gray-600">Track all inventory movements and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stock Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Stock movement tracking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
