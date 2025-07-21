'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { inventoryApi, Supplier } from '@/services/inventoryApi';
import { SupplierForm } from './SupplierForm';
import toast from 'react-hot-toast';

interface SupplierManagerProps {
  hasEditAccess: boolean;
}

export function SupplierManager({ hasEditAccess }: SupplierManagerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getSuppliers();
      setSuppliers(data);
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await inventoryApi.deleteSupplier(id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error: any) {
      console.error('Failed to delete supplier:', error);
      toast.error('Failed to delete supplier');
    }
  };

  const handleFormSuccess = () => {
    loadSuppliers();
    setEditingSupplier(undefined);
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingSupplier(undefined);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Suppliers</h2>
            <p className="text-gray-600">Manage your product suppliers and vendors</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading suppliers...</p>
            </div>
          </CardContent>
        </Card>
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
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Suppliers & Vendors ({suppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No suppliers found</p>
              {hasEditAccess && (
                <Button 
                  className="mt-4" 
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Supplier
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{supplier.name}</h3>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {hasEditAccess && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{supplier.phone}</span>
                      </div>
                      {supplier.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="truncate">
                            {supplier.address.city}, {supplier.address.state}
                          </span>
                        </div>
                      )}
                      {supplier.contactPerson && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-medium text-xs text-gray-600">CONTACT</p>
                          <p className="text-sm">{supplier.contactPerson.name}</p>
                          <p className="text-xs text-gray-500">{supplier.contactPerson.position}</p>
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

      <SupplierForm
        open={showForm}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
        supplier={editingSupplier}
      />
    </div>
  );
}
