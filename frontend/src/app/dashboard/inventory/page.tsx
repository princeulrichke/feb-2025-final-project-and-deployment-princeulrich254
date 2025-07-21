'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
  BarChart3,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { inventoryApi, Product, Category, Supplier, Warehouse, StockMovement, DashboardStats } from '@/services/inventoryApi';
import { ProductForm } from '@/components/inventory/ProductForm';
import { ProductList } from '@/components/inventory/ProductList';
import { CategoryForm } from '@/components/inventory/CategoryForm';
import { SupplierForm } from '@/components/inventory/SupplierForm';
import { WarehouseForm } from '@/components/inventory/WarehouseForm';
import toast from 'react-hot-toast';

// Temporary placeholder components until the actual components are available
function InventoryDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.totalValue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {dashboardData?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Products below minimum</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalWarehouses || 0}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.recentMovements && dashboardData.recentMovements.length > 0 ? (
              dashboardData.recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      movement.type === 'in' ? 'bg-green-500' : 
                      movement.type === 'out' ? 'bg-red-500' : 
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{movement.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-500">
                        {movement.warehouse?.name || 'No Warehouse'} • {movement.reason || 'No reason'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      movement.type === 'in' ? "default" : 
                      movement.type === 'out' ? "destructive" : 
                      "secondary"
                    }>
                      {movement.type.toUpperCase()} {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent stock movements</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryManager({ hasEditAccess }: { hasEditAccess: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getCategories();
      console.log('Categories API Response:', data);
      console.log('Categories type:', typeof data);
      console.log('Categories is array:', Array.isArray(data));
      console.log('Categories length:', data.length);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await inventoryApi.deleteCategory(category.id);
      toast.success('Category deleted successfully');
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleCategoryFormSuccess = () => {
    fetchCategories(); // Refresh the list after add/edit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        {hasEditAccess && (
          <Button onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Categories ({categories.length} categories)</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No categories found</p>
              {hasEditAccess && (
                <Button className="mt-4" onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Category
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <Card key={`${category.id}-${index}`} className="border">
                  <CardContent className="p-4">
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-400">
                        Created {new Date(category.createdAt).toLocaleDateString()}
                      </span>
                      {hasEditAccess && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Modal */}
      <CategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        onSuccess={handleCategoryFormSuccess}
        category={editingCategory}
      />
    </div>
  );
}

function SupplierManager({ hasEditAccess }: { hasEditAccess: boolean }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = () => {
    setEditingSupplier(undefined);
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      return;
    }

    try {
      await inventoryApi.deleteSupplier(supplier.id);
      toast.success('Supplier deleted successfully');
      fetchSuppliers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    }
  };

  const handleSupplierFormSuccess = () => {
    fetchSuppliers(); // Refresh the list after add/edit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Suppliers</h2>
          <p className="text-gray-600">Manage your product suppliers and vendors</p>
        </div>
        {hasEditAccess && (
          <Button onClick={handleAddSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers & Vendors ({suppliers.length} suppliers)</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No suppliers found</p>
              {hasEditAccess && (
                <Button className="mt-4" onClick={handleAddSupplier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Supplier
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Supplier</th>
                    <th className="text-left p-4">Contact</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier, index) => (
                    <tr key={`${supplier.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.contactPerson && (
                            <p className="text-sm text-gray-500">Contact: {supplier.contactPerson.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {supplier.email && <div>{supplier.email}</div>}
                          {supplier.phone && <div>{supplier.phone}</div>}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasEditAccess && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditSupplier(supplier)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Form Modal */}
      <SupplierForm
        open={showSupplierForm}
        onOpenChange={setShowSupplierForm}
        onSuccess={handleSupplierFormSuccess}
        supplier={editingSupplier}
      />
    </div>
  );
}

function WarehouseManager({ hasEditAccess }: { hasEditAccess: boolean }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>();

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      setError('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddWarehouse = () => {
    setEditingWarehouse(undefined);
    setShowWarehouseForm(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setShowWarehouseForm(true);
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      return;
    }

    try {
      await inventoryApi.deleteWarehouse(warehouse.id);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error('Failed to delete warehouse');
    }
  };

  const handleWarehouseFormSuccess = () => {
    fetchWarehouses(); // Refresh the list after add/edit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Warehouses</h2>
          <p className="text-gray-600">Manage warehouse locations and storage</p>
        </div>
        {hasEditAccess && (
          <Button onClick={handleAddWarehouse}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Locations ({warehouses.length} locations)</CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No warehouses found</p>
              {hasEditAccess && (
                <Button className="mt-4" onClick={handleAddWarehouse}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Warehouse
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((warehouse,index) => (
                <Card key={`${warehouse.id}-${index}`} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{warehouse.name}</h3>
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Code: {warehouse.code}</p>
                    {warehouse.address && (
                      <p className="text-sm text-gray-500 mb-2">
                        {warehouse.address.city}, {warehouse.address.state}
                      </p>
                    )}
                    {warehouse.description && (
                      <p className="text-sm text-gray-500 mb-4">{warehouse.description}</p>
                    )}
                    {warehouse.manager && (
                      <p className="text-sm text-gray-500 mb-4">
                        Manager: {warehouse.manager.name}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        Created {new Date(warehouse.createdAt).toLocaleDateString()}
                      </span>
                      {hasEditAccess && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditWarehouse(warehouse)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteWarehouse(warehouse)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warehouse Form Modal */}
      <WarehouseForm
        open={showWarehouseForm}
        onOpenChange={setShowWarehouseForm}
        onSuccess={handleWarehouseFormSuccess}
        warehouse={editingWarehouse}
      />
    </div>
  );
}

function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getStockMovements();
        setMovements(data);
      } catch (err) {
        console.error('Failed to fetch stock movements:', err);
        setError('Failed to load stock movements');
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stock Movement Logs</h2>
        <p className="text-gray-600">Track all inventory movements and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement History ({movements.length} movements)</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stock movements found</p>
              <p className="text-sm text-gray-400 mt-2">Stock movements will appear here when inventory changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      movement.type === 'in' ? 'bg-green-500' : 
                      movement.type === 'out' ? 'bg-red-500' : 
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{movement.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-500">
                        {movement.warehouse?.name || 'No Warehouse'} • {movement.reason || 'No reason provided'}
                      </p>
                      {movement.reference && (
                        <p className="text-xs text-gray-400">Ref: {movement.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      movement.type === 'in' ? "default" : 
                      movement.type === 'out' ? "destructive" : 
                      "secondary"
                    }>
                      {movement.type.toUpperCase()} {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {movement.previousQuantity} → {movement.newQuantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccessManager() {
  const [accessList, setAccessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccessList = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getInventoryAccess();
        setAccessList(data);
      } catch (err) {
        console.error('Failed to fetch access list:', err);
        setError('Failed to load access control data');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessList();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Access Control</h2>
          <p className="text-gray-600">Manage who can view and edit inventory data</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Grant Access
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Access Permissions ({accessList.length} users)</CardTitle>
        </CardHeader>
        <CardContent>
          {accessList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No additional access permissions found</p>
              <p className="text-sm text-gray-400 mt-2">Grant inventory access to team members</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Access Level</th>
                    <th className="text-left p-4">Granted</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessList.map((access) => (
                    <tr key={access.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{access.user?.name || 'Unknown User'}</div>
                          <p className="text-sm text-gray-500">{access.user?.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={access.accessLevel === 'edit' ? "default" : "secondary"}>
                          {access.accessLevel}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-500">
                          {new Date(access.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasEditAccess, setHasEditAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Use the existing auth store
  const { user, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check user authentication and inventory access
    const checkAccess = async () => {
      try {
        setLoading(true);
        
        // If not authenticated, redirect to login
        if (!isAuthenticated || !token || !user) {
          router.push('/auth/login');
          return;
        }

        // Check if user has edit access (owner always has edit access)
        if (user.role === 'owner') {
          setHasEditAccess(true);
        } else {
          // For non-owners, check inventory access permissions
          try {
            await inventoryApi.getProducts(); // This will fail if no access
            setHasEditAccess(false); // Assume view-only for now
            // TODO: Add separate endpoint to check access level
          } catch (err) {
            // No access at all - show error
            console.error('No inventory access:', err);
          }
        }
      } catch (error) {
        console.error('Failed to check access:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [isAuthenticated, token, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Authentication required</p>
          <Button onClick={() => router.push('/auth/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
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
            <Button variant="outline" size="sm" onClick={() => setActiveTab('access')}>
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