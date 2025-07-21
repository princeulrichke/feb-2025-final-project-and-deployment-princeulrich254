'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';

interface WarehouseManagerProps {
  hasEditAccess: boolean;
}

export function WarehouseManager({ hasEditAccess }: WarehouseManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Warehouses</h2>
          <p className="text-gray-600">Manage warehouse locations and storage</p>
        </div>
        {hasEditAccess && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Warehouse Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Warehouse management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
