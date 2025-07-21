'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus } from 'lucide-react';

export function AccessManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Access Control</h2>
          <p className="text-gray-600">Manage who can view and edit inventory data</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Grant Access
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Access Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Access management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
