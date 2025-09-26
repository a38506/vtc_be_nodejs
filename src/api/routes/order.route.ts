import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware';
import {
  createOrder,
  listMyOrders,
  getOrderById,
  adminListAllOrders,
  adminUpdateOrderStatus,
  cancelMyOrder,
} from '../controllers/order.controller';

const router = express.Router();

// Tạo đơn hàng (khách hàng)
router.post('/', protect, createOrder);

// Danh sách đơn hàng của tôi (khách hàng)
router.get('/me', protect, listMyOrders);

// Danh sách toàn bộ đơn hàng (admin)
router.get('/', protect, authorize(1), adminListAllOrders);

// Xem chi tiết đơn hàng theo id (chủ đơn hoặc admin)
router.get('/:id', protect, getOrderById);

// Admin cập nhật trạng thái đơn hàng
router.patch('/:id/status', protect, authorize(1), adminUpdateOrderStatus);

// Khách hủy đơn của chính mình
router.post('/:id/cancel', protect, cancelMyOrder);

export default router;

