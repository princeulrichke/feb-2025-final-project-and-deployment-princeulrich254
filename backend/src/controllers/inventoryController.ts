import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Warehouse } from '../models/Warehouse';
import { StockMovement } from '../models/StockMovement';
import { InventoryAccess } from '../models/InventoryAccess';
import { User } from '../models/User';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().min(1).max(50),
  category: z.string().min(1).optional(),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0),
  unit: z.string().min(1).max(20),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  supplier: z.string().optional(),
  warehouse: z.string().optional(),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional()
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentCategory: z.string().optional()
});

const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string()
  }).optional(),
  contactPerson: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    position: z.string()
  }).optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().max(1000).optional()
});

const createWarehouseSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string()
  }),
  capacity: z.number().min(0).optional(),
  manager: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string()
  }).optional()
});

const stockMovementSchema = z.object({
  product: z.string(),
  warehouse: z.string(),
  type: z.enum(['in', 'out', 'adjustment', 'transfer']),
  quantity: z.number().min(0.01),
  unitCost: z.number().min(0).optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  fromWarehouse: z.string().optional(),
  toWarehouse: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().max(500).optional()
});

const inventoryAccessSchema = z.object({
  user: z.string(),
  accessLevel: z.enum(['view', 'edit'])
});

// Middleware to check inventory access
export const checkInventoryAccess = (requiredLevel: 'view' | 'edit') => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const user = (req as any).user;
      const companyId = user.company;

      // Owner always has full access
      if (user.role === 'owner') {
        return next();
      }

      // Check if user has specific inventory access
      const access = await InventoryAccess.findOne({
        user: user._id,
        companyId,
        isActive: true
      });

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to access inventory.'
        });
      }

      if (requiredLevel === 'edit' && access.accessLevel === 'view') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You only have view permission for inventory.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking inventory access',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Function to check for low stock and send alerts
const checkLowStockAndAlert = async (companyId: string) => {
  try {
    const lowStockProducts = await Product.find({
      companyId,
      status: 'active',
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    }).populate('category', 'name')
      .populate('supplier', 'name email')
      .populate('warehouse', 'name');

    if (lowStockProducts.length > 0) {
      // Get users who should receive alerts (owner + users with edit access)
      const owner = await User.findOne({ company: companyId, role: 'owner' }).populate('company', 'name');
      const editUsers = await InventoryAccess.find({
        companyId,
        accessLevel: 'edit',
        isActive: true
      }).populate('user', 'email firstName lastName');

      if (!owner) {
        logger.error('Owner not found for company:', companyId);
        return;
      }

      const recipients = [owner, ...editUsers.map(access => access.user)]
        .filter(user => user && typeof user === 'object' && 'email' in user && user.email);

      // Send email alerts
      for (const user of recipients) {
        if (!user || typeof user !== 'object' || !('email' in user)) continue;
        
        try {
          const userDoc = user as any;
          const companyName = typeof owner.company === 'object' && 'name' in owner.company 
            ? String(owner.company.name)
            : 'Your Company';

          await emailService.sendLowStockAlert(userDoc.email, {
            recipientName: `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
            companyName,
            lowStockProducts: lowStockProducts.map(product => ({
              name: product.name,
              sku: product.sku,
              currentStock: product.quantity,
              minQuantity: product.minQuantity,
              category: typeof product.category === 'object' && product.category && 'name' in product.category 
                ? String(product.category.name)
                : 'N/A',
              warehouse: typeof product.warehouse === 'object' && product.warehouse && 'name' in product.warehouse 
                ? String(product.warehouse.name)
                : 'N/A'
            }))
          });
        } catch (emailError) {
          const userDoc = user as any;
          logger.error(`Failed to send low stock alert to ${userDoc.email}:`, emailError);
        }
      }

      logger.info(`Low stock alert sent for ${lowStockProducts.length} products in company ${companyId}`);
    }
  } catch (error) {
    logger.error('Error checking low stock:', error);
  }
};

// =============================================================================
// PRODUCT CONTROLLERS
// =============================================================================

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, status, search, lowStock, warehouse } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minQuantity'] };
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name email phone')
      .populate('warehouse', 'name code')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ 
      sku: validatedData.sku, 
      companyId 
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    const product = new Product({
      ...validatedData,
      companyId
    });

    await product.save();
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' }
    ]);

    // Create initial stock movement record
    if (validatedData.quantity > 0) {
      const stockMovement = new StockMovement({
        product: product._id,
        warehouse: validatedData.warehouse,
        type: 'in',
        quantity: validatedData.quantity,
        unitCost: validatedData.cost,
        totalCost: (validatedData.cost || 0) * validatedData.quantity,
        reason: 'Initial stock',
        performedBy: userId,
        balanceAfter: validatedData.quantity,
        companyId
      });
      await stockMovement.save();
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const product = await Product.findOne({ _id: id, companyId })
      .populate('category', 'name description')
      .populate('supplier', 'name email phone address contactPerson')
      .populate('warehouse', 'name code address');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get recent stock movements for this product
    const recentMovements = await StockMovement.find({
      product: id,
      companyId
    })
      .populate('warehouse', 'name code')
      .populate('supplier', 'name')
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { 
        product,
        recentMovements 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createProductSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    // Check if updating SKU conflicts with existing product
    if (validatedData.sku) {
      const existingProduct = await Product.findOne({ 
        sku: validatedData.sku, 
        companyId,
        _id: { $ne: id }
      });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Another product with this SKU already exists'
        });
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    ).populate([
      { path: 'category', select: 'name' },
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' }
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const product = await Product.findOneAndDelete({ _id: id, companyId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// STOCK MANAGEMENT CONTROLLERS
// =============================================================================

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason, reference, unitCost, notes } = req.body;
    const validatedData = stockMovementSchema.parse({
      product: id,
      warehouse: req.body.warehouse,
      type,
      quantity: Math.abs(quantity),
      unitCost,
      reason,
      reference,
      notes
    });

    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    // Get current product
    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate new quantity based on movement type
    let newQuantity = product.quantity;
    switch (type) {
      case 'in':
        newQuantity += validatedData.quantity;
        break;
      case 'out':
        newQuantity -= validatedData.quantity;
        break;
      case 'adjustment':
        newQuantity = validatedData.quantity; // Set absolute quantity
        break;
    }

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this operation'
      });
    }

    // Create stock movement record
    const stockMovement = new StockMovement({
      ...validatedData,
      companyId,
      performedBy: userId,
      previousQuantity: product.quantity,
      newQuantity,
      balanceAfter: newQuantity
    });

    await stockMovement.save();

    // Update product quantity
    product.quantity = newQuantity;
    await product.save();

    // Check for low stock and send alerts
    await checkLowStockAndAlert(companyId);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { 
        product,
        stockMovement 
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, product, warehouse, type, startDate, endDate } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const movements = await StockMovement.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('supplier', 'name')
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await StockMovement.countDocuments(filter);

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// CATEGORY CONTROLLERS
// =============================================================================

export const getCategories = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const categories = await Category.find({ companyId })
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const companyId = (req as any).user.company;

    const category = new Category({
      ...validatedData,
      companyId
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createCategorySchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const category = await Category.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    // Check if category is used by any products
    const productsUsingCategory = await Product.countDocuments({ 
      category: id, 
      companyId 
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. It is being used by products.'
      });
    }

    const category = await Category.findOneAndDelete({ _id: id, companyId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// SUPPLIER CONTROLLERS
// =============================================================================

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(filter)
      .sort({ name: 1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Supplier.countDocuments(filter);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const validatedData = createSupplierSchema.parse(req.body);
    const companyId = (req as any).user.company;

    const supplier = new Supplier({
      ...validatedData,
      companyId
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const supplier = await Supplier.findOne({ _id: id, companyId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createSupplierSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: { supplier }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    // Check if supplier is used by any products
    const productsUsingSupplier = await Product.countDocuments({ 
      supplier: id, 
      companyId 
    });

    if (productsUsingSupplier > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier. It is being used by products.'
      });
    }

    const supplier = await Supplier.findOneAndDelete({ _id: id, companyId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// WAREHOUSE CONTROLLERS
// =============================================================================

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const warehouses = await Warehouse.find({ companyId })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { warehouses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const validatedData = createWarehouseSchema.parse(req.body);
    const companyId = (req as any).user.company;

    const warehouse = new Warehouse({
      ...validatedData,
      companyId
    });

    await warehouse.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { warehouse }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createWarehouseSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: { warehouse }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    // Check if warehouse is used by any products
    const productsUsingWarehouse = await Product.countDocuments({ 
      warehouse: id, 
      companyId 
    });

    if (productsUsingWarehouse > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse. It is being used by products.'
      });
    }

    const warehouse = await Warehouse.findOneAndDelete({ _id: id, companyId });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// INVENTORY ACCESS CONTROLLERS
// =============================================================================

export const getInventoryAccess = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const accessList = await InventoryAccess.find({ companyId, isActive: true })
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { accessList }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const grantInventoryAccess = async (req: Request, res: Response) => {
  try {
    const validatedData = inventoryAccessSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const grantedBy = (req as any).user._id;

    // Check if access already exists
    const existingAccess = await InventoryAccess.findOne({
      user: validatedData.user,
      companyId,
      isActive: true
    });

    if (existingAccess) {
      // Update existing access
      existingAccess.accessLevel = validatedData.accessLevel;
      existingAccess.grantedBy = grantedBy;
      existingAccess.grantedAt = new Date();
      await existingAccess.save();

      return res.json({
        success: true,
        message: 'Inventory access updated successfully',
        data: { access: existingAccess }
      });
    }

    // Create new access
    const access = new InventoryAccess({
      ...validatedData,
      companyId,
      grantedBy,
      grantedAt: new Date(),
      isActive: true
    });

    await access.save();

    res.status(201).json({
      success: true,
      message: 'Inventory access granted successfully',
      data: { access }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error granting inventory access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const revokeInventoryAccess = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const companyId = (req as any).user.company;

    const access = await InventoryAccess.findOneAndUpdate(
      { user: userId, companyId, isActive: true },
      { 
        isActive: false,
        revokedAt: new Date(),
        revokedBy: (req as any).user._id
      },
      { new: true }
    );

    if (!access) {
      return res.status(404).json({
        success: false,
        message: 'Inventory access not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory access revoked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error revoking inventory access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// DASHBOARD AND REPORTING CONTROLLERS
// =============================================================================

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const lowStockProducts = await Product.find({
      companyId,
      status: 'active',
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    })
      .populate('category', 'name')
      .populate('supplier', 'name email')
      .populate('warehouse', 'name code')
      .sort({ quantity: 1 });

    res.json({
      success: true,
      data: { products: lowStockProducts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getInventoryDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Product statistics
    const totalProducts = await Product.countDocuments({ companyId });
    const activeProducts = await Product.countDocuments({ companyId, status: 'active' });
    const lowStockProducts = await Product.countDocuments({
      companyId,
      status: 'active',
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });

    // Total inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { companyId, status: 'active' } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $match: { companyId, status: 'active' } },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $group: { _id: '$categoryInfo.name', count: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      { $sort: { count: -1 } }
    ]);

    // Top products by value
    const topProductsByValue = await Product.aggregate([
      { $match: { companyId, status: 'active' } },
      {
        $addFields: {
          totalValue: { $multiply: ['$quantity', '$price'] }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: 1,
          sku: 1,
          quantity: 1,
          price: 1,
          totalValue: 1
        }
      }
    ]);

    // Recent stock movements
    const recentMovements = await StockMovement.find({ companyId })
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Warehouse stock distribution
    const warehouseDistribution = await Product.aggregate([
      { $match: { companyId, status: 'active' } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouseInfo' } },
      { $unwind: { path: '$warehouseInfo', preserveNullAndEmptyArrays: true } },
      { 
        $group: { 
          _id: { $ifNull: ['$warehouseInfo.name', 'Unassigned'] }, 
          products: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        } 
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          totalInventoryValue: inventoryValue[0]?.totalValue || 0
        },
        charts: {
          categoryDistribution,
          topProductsByValue,
          warehouseDistribution
        },
        recentMovements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
