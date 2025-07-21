'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  Building2, 
  Users, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import { ProductList } from '@/components/inventory/ProductList';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { CategoryManager } from '@/components/inventory/CategoryManager';
import { SupplierManager } from '@/components/inventory/SupplierManager';
import { WarehouseManager } from '@/components/inventory/WarehouseManager';
import { StockMovements } from '@/components/inventory/StockMovements';
import { AccessManager } from '@/components/inventory/AccessManager';
import { useAuthContext } from '@/hooks/useAuthContext';

export default function InventoryPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasEditAccess, setHasEditAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInventoryAccess();
  }, []);

  const checkInventoryAccess = async () => {
    try {
      // Check if user has edit access to inventory
      const response = await fetch('/api/inventory/access', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const userAccess = data.data.accessList.find((access: any) => 
          access.user._id === user?.id && access.accessLevel === 'edit'
        );
        setHasEditAccess(!!userAccess || user?.role === 'owner');
      }
    } catch (error) {
      console.error('Error checking inventory access:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Manage products, stock levels, and warehouse operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={hasEditAccess ? "default" : "secondary"}>
            {hasEditAccess ? "Edit Access" : "View Only"}
          </Badge>
          {user?.role === 'owner' && (
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Access
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            Categories
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            Stock Logs
          </TabsTrigger>
          {user?.role === 'owner' && (
            <TabsTrigger value="access" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Access
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <InventoryDashboard />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductList hasEditAccess={hasEditAccess} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManager hasEditAccess={hasEditAccess} />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <SupplierManager hasEditAccess={hasEditAccess} />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-6">
          <WarehouseManager hasEditAccess={hasEditAccess} />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <StockMovements />
        </TabsContent>

        {user?.role === 'owner' && (
          <TabsContent value="access" className="mt-6">
            <AccessManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
