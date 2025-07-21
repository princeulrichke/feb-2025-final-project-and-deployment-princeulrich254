import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireOwner } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import {
  // Product controllers
  getProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  
  // Stock management
  updateStock,
  getStockMovements,
  
  // Category controllers
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Supplier controllers
  getSuppliers,
  createSupplier,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  
  // Warehouse controllers
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  
  // Inventory access controllers
  getInventoryAccess,
  grantInventoryAccess,
  revokeInventoryAccess,
  
  // Dashboard and reporting
  getLowStockProducts,
  getInventoryDashboard,
  
  // Access control middleware
  checkInventoryAccess
} from '../controllers/inventoryController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// PRODUCT ROUTES (with access control)
// =============================================================================
router.get('/products', checkInventoryAccess('view'), asyncHandler(getProducts));
router.post('/products', checkInventoryAccess('edit'), asyncHandler(createProduct));
router.get('/products/:id', checkInventoryAccess('view'), asyncHandler(getProduct));
router.put('/products/:id', checkInventoryAccess('edit'), asyncHandler(updateProduct));
router.delete('/products/:id', checkInventoryAccess('edit'), asyncHandler(deleteProduct));

// =============================================================================
// STOCK MANAGEMENT ROUTES (edit access required)
// =============================================================================
router.put('/products/:id/stock', checkInventoryAccess('edit'), asyncHandler(updateStock));
router.get('/stock-movements', checkInventoryAccess('view'), asyncHandler(getStockMovements));

// =============================================================================
// CATEGORY ROUTES
// =============================================================================
router.get('/categories', checkInventoryAccess('view'), asyncHandler(getCategories));
router.post('/categories', checkInventoryAccess('edit'), asyncHandler(createCategory));
router.put('/categories/:id', checkInventoryAccess('edit'), asyncHandler(updateCategory));
router.delete('/categories/:id', checkInventoryAccess('edit'), asyncHandler(deleteCategory));

// =============================================================================
// SUPPLIER ROUTES
// =============================================================================
router.get('/suppliers', checkInventoryAccess('view'), asyncHandler(getSuppliers));
router.post('/suppliers', checkInventoryAccess('edit'), asyncHandler(createSupplier));
router.get('/suppliers/:id', checkInventoryAccess('view'), asyncHandler(getSupplier));
router.put('/suppliers/:id', checkInventoryAccess('edit'), asyncHandler(updateSupplier));
router.delete('/suppliers/:id', checkInventoryAccess('edit'), asyncHandler(deleteSupplier));

// =============================================================================
// WAREHOUSE ROUTES
// =============================================================================
router.get('/warehouses', checkInventoryAccess('view'), asyncHandler(getWarehouses));
router.post('/warehouses', checkInventoryAccess('edit'), asyncHandler(createWarehouse));
router.put('/warehouses/:id', checkInventoryAccess('edit'), asyncHandler(updateWarehouse));
router.delete('/warehouses/:id', checkInventoryAccess('edit'), asyncHandler(deleteWarehouse));

// =============================================================================
// INVENTORY ACCESS ROUTES (owner only)
// =============================================================================
router.get('/access', requireOwner, asyncHandler(getInventoryAccess));
router.post('/access/grant', requireOwner, asyncHandler(grantInventoryAccess));
router.delete('/access/revoke/:userId', requireOwner, asyncHandler(revokeInventoryAccess));

// =============================================================================
// DASHBOARD AND REPORTING ROUTES
// =============================================================================
router.get('/dashboard', checkInventoryAccess('view'), asyncHandler(getInventoryDashboard));
router.get('/low-stock', checkInventoryAccess('view'), asyncHandler(getLowStockProducts));

export default router;
