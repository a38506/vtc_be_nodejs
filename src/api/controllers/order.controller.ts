import { Request, Response, NextFunction } from 'express';

// Tạm thời dùng bộ nhớ để lưu orders cho mục đích demo Postman
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type OrderItem = { productId: number; quantity: number; price: number };
type Order = {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

let orders: Order[] = [];
let autoIncrementId = 1;

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, note } = req.body as { items: OrderItem[]; note?: string };

    if (!req.user) {
      return res.status(401).json({ message: 'Không được phép' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách sản phẩm không hợp lệ' });
    }
    const invalidItem = items.find(
      (it) => !it || typeof it.productId !== 'number' || typeof it.quantity !== 'number' || typeof it.price !== 'number' || it.quantity <= 0 || it.price < 0
    );
    if (invalidItem) {
      return res.status(400).json({ message: 'Sản phẩm không hợp lệ trong danh sách' });
    }

    const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: autoIncrementId++,
      userId: req.user.id,
      items,
      totalAmount,
      status: 'pending',
      note,
      createdAt: now,
      updatedAt: now,
    };
    orders.push(newOrder);
    return res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    next(err);
  }
};

export const listMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Không được phép' });
    }
    const myOrders = orders.filter((o) => o.userId === req.user!.id);
    return res.status(200).json({ success: true, data: myOrders });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const order = orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Chỉ chủ đơn hoặc admin (role_id = 1) mới được xem
    if (!req.user || (req.user.role_id !== 1 && req.user.id !== order.userId)) {
      return res.status(403).json({ message: 'Không có quyền truy cập đơn hàng này' });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const adminListAllOrders = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: OrderStatus };
    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const order = orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const cancelMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const order = orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (!req.user || req.user.id !== order.userId) {
      return res.status(403).json({ message: 'Không có quyền hủy đơn' });
    }
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: 'Chỉ hủy khi đơn đang chờ hoặc đã xác nhận' });
    }
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const __testing = { _getOrders: () => orders, _reset: () => { orders = []; autoIncrementId = 1; } };

