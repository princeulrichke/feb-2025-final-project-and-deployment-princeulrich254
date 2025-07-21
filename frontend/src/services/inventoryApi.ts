// API service for inventory management
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  // Only access localStorage on client side
  if (typeof window !== 'undefined') {
    try {
      // Get token from auth store
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        const token = authData?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  return config;
});

// Types for API responses
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  category?: Category;
  supplier?: Supplier;
  warehouse?: Warehouse;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  capacity?: number;
  manager?: {
    name: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  userId: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  createdAt: string;
}

export interface InventoryAccess {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  accessLevel: 'view' | 'edit';
  grantedBy: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  totalWarehouses: number;
  recentMovements: StockMovement[];
}

// Helper function to extract data from API response wrapper
const extractData = (response: any) => {
  // Check if response has the wrapper format { success: true, data: ... }
  if (response.data && response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  // Otherwise return response.data directly
  return response.data;
};

// API Methods
export const inventoryApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/inventory/dashboard');
    return extractData(response);
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/inventory/products');
    const data = extractData(response);
    // Handle the case where backend returns { products: [...] } instead of [...]
    if (data && data.products && Array.isArray(data.products)) {
      return data.products;
    }
    return Array.isArray(data) ? data : [];
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/inventory/products/${id}`);
    return extractData(response);
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/inventory/products', product);
    return extractData(response);
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/inventory/products/${id}`, product);
    return extractData(response);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/products/${id}`);
  },

  // Stock Management
  updateStock: async (productId: string, data: {
    quantity: number;
    type: 'in' | 'out' | 'adjustment';
    reason?: string;
    reference?: string;
    warehouseId?: string;
  }): Promise<Product> => {
    const response = await apiClient.put(`/inventory/products/${productId}/stock`, data);
    return extractData(response);
  },

  getStockMovements: async (): Promise<StockMovement[]> => {
    const response = await apiClient.get('/inventory/stock-movements');
    const data = extractData(response);
    // Handle the case where backend returns { movements: [...] } instead of [...]
    if (data && data.movements && Array.isArray(data.movements)) {
      return data.movements;
    }
    return Array.isArray(data) ? data : [];
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/inventory/low-stock');
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/inventory/categories');
    const data = extractData(response);
    // Handle the case where backend returns { categories: [...] } instead of [...]
    if (data && data.categories && Array.isArray(data.categories)) {
      return data.categories;
    }
    return Array.isArray(data) ? data : [];
  },

  createCategory: async (category: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/inventory/categories', category);
    return extractData(response);
  },

  updateCategory: async (id: string, category: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/inventory/categories/${id}`, category);
    return extractData(response);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/categories/${id}`);
  },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await apiClient.get('/inventory/suppliers');
    const data = extractData(response);
    // Handle the case where backend returns { suppliers: [...] } instead of [...]
    if (data && data.suppliers && Array.isArray(data.suppliers)) {
      return data.suppliers;
    }
    return Array.isArray(data) ? data : [];
  },

  getSupplier: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/inventory/suppliers/${id}`);
    return extractData(response);
  },

  createSupplier: async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post('/inventory/suppliers', supplier);
    return extractData(response);
  },

  updateSupplier: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/inventory/suppliers/${id}`, supplier);
    return extractData(response);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/suppliers/${id}`);
  },

  // Warehouses
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await apiClient.get('/inventory/warehouses');
    const data = extractData(response);
    // Handle the case where backend returns { warehouses: [...] } instead of [...]
    if (data && data.warehouses && Array.isArray(data.warehouses)) {
      return data.warehouses;
    }
    return Array.isArray(data) ? data : [];
  },

  createWarehouse: async (warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await apiClient.post('/inventory/warehouses', warehouse);
    return extractData(response);
  },

  updateWarehouse: async (id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await apiClient.put(`/inventory/warehouses/${id}`, warehouse);
    return extractData(response);
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/warehouses/${id}`);
  },

  // Access Management (Owner only)
  getInventoryAccess: async (): Promise<InventoryAccess[]> => {
    const response = await apiClient.get('/inventory/access');
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },

  grantInventoryAccess: async (data: {
    userId: string;
    accessLevel: 'view' | 'edit';
  }): Promise<InventoryAccess> => {
    const response = await apiClient.post('/inventory/access/grant', data);
    return extractData(response);
  },

  revokeInventoryAccess: async (userId: string): Promise<void> => {
    await apiClient.delete(`/inventory/access/revoke/${userId}`);
  },
};

export default inventoryApi;
