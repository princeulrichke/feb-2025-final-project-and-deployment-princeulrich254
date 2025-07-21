'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Folder } from 'lucide-react';

interface CategoryManagerProps {
  hasEditAccess: boolean;
}

export function CategoryManager({ hasEditAccess }: CategoryManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        {hasEditAccess && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Category management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
