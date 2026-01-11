import { useState, useEffect } from 'react';
import type { OrderWithItems } from '../../types/database';
import { Package, Eye, X } from 'lucide-react';
import { api } from '../../lib/api';

export default function OrderManagement() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const data = await api.getOrders();
    setOrders(data as OrderWithItems[]);
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    try {
      await api.updateOrder({ id: orderId, status: newStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const updateTrackingNumber = async (orderId: string, trackingNumber: string) => {
    try {
      await api.updateOrder({ id: orderId, tracking_number: trackingNumber });
      alert('Tracking number updated successfully!');
      fetchOrders();
    } catch (error) {
      alert('Failed to update tracking number');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Order Management</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-slate-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Order</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">#{order.order_number}</p>
                      <p className="text-sm text-slate-600">
                        {order.order_items.length} item(s)
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{order.shipping_city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No orders found</p>
          </div>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                Order #{selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Order Status</h3>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Tracking Number</h3>
                <input
                  type="text"
                  defaultValue={selectedOrder.tracking_number || ''}
                  placeholder="Enter tracking number"
                  onBlur={(e) => {
                    if (e.target.value !== selectedOrder.tracking_number) {
                      updateTrackingNumber(selectedOrder.id, e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.products?.name}</p>
                        <p className="text-sm text-slate-600">
                          Size: {item.size} | Color: {item.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">Qty: {item.quantity}</p>
                        <p className="text-sm text-slate-600">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Total Amount</span>
                  <span className="text-xl font-bold text-slate-900">
                    Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
