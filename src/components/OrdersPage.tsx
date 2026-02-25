import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Package, Loader2, AlertCircle, Truck, CheckCircle, XCircle, MapPin, Mail, Phone } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  selectedId: string | null;
  onSelectOrder: (order: Order) => void;
  loading?: boolean;
}

interface OrderDetailProps {
  order: Order | null;
}

function OrderCard({ order, isSelected, onClick }: { order: Order; isSelected: boolean; onClick: () => void }) {
  const statusColor = {
    paid: 'text-amber-400',
    shipped: 'text-blue-400',
    delivered: 'text-emerald-400',
    cancelled: 'text-red-400',
  }[order.status];

  const statusBg = {
    paid: 'bg-amber-500/10 border-amber-500/20',
    shipped: 'bg-blue-500/10 border-blue-500/20',
    delivered: 'bg-emerald-500/10 border-emerald-500/20',
    cancelled: 'bg-red-500/10 border-red-500/20',
  }[order.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        isSelected
          ? 'bg-blue-500/20 border-blue-500/30'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-slate-500 font-mono">#{order.order_id.slice(-8)}</p>
          <p className="text-sm font-semibold text-white">{order.buyer_name}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded border', statusBg, statusColor)}>
          {order.status}
        </span>
      </div>
      <p className="text-xs text-slate-400 truncate mb-2">{order.item_title}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-400">${order.item_price}</span>
        <span className="text-[10px] text-slate-500">{new Date(order.order_date).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

function OrderList({ orders, selectedId, onSelectOrder, loading }: OrderListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
        <Package className="w-8 h-8 opacity-30" />
        <span className="text-sm">No orders yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <OrderCard
          key={order.order_id}
          order={order}
          isSelected={selectedId === order.order_id}
          onClick={() => onSelectOrder(order)}
        />
      ))}
    </div>
  );
}

function OrderDetail({ order }: OrderDetailProps) {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-slate-500">
        <Package className="w-10 h-10" />
        <span className="text-sm">Select an order to view details</span>
      </div>
    );
  }

  const statusIcon = {
    paid: <AlertCircle className="w-5 h-5 text-amber-400" />,
    shipped: <Truck className="w-5 h-5 text-blue-400" />,
    delivered: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    cancelled: <XCircle className="w-5 h-5 text-red-400" />,
  }[order.status];

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto">
      {/* Status & Overview */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {statusIcon}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
            <p className="text-lg font-bold text-white capitalize">{order.status}</p>
          </div>
        </div>

        {/* Order ID & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Order ID</p>
            <p className="text-sm font-mono text-blue-400">{order.order_id}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Order Date</p>
            <p className="text-sm text-white">{new Date(order.order_date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Item Details</h3>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Title</p>
            <p className="text-sm text-white">{order.item_title}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Price</p>
              <p className="text-lg font-bold text-emerald-400">${order.item_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Quantity</p>
              <p className="text-lg font-bold text-white">{order.quantity}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-lg font-bold text-blue-400">${(order.item_price * order.quantity).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Buyer Information</h3>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Buyer ID</p>
              <p className="text-sm text-white font-mono">{order.buyer_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
              <p className="text-sm text-blue-400">{order.buyer_email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Shipping Address</h3>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-300">
                <p>{order.shipping_address.street}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.tracking_number && order.status !== 'paid' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Shipping</h3>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">Tracking Number</p>
            <p className="text-sm font-mono text-emerald-300">{order.tracking_number}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {order.status === 'paid' && (
        <button className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          Mark as Shipped
        </button>
      )}
    </div>
  );
}

// Mock Orders Data
const MOCK_ORDERS: Order[] = [
  {
    order_id: 'ORD-2026-001',
    buyer_id: 'buyer_abc123',
    buyer_name: 'John B.',
    buyer_email: 'john.b@email.com',
    item_id: '136645465618',
    item_title: 'Vintage Nike Air Jordan 11 Size 10',
    item_price: 89.99,
    quantity: 1,
    order_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'shipped',
    tracking_number: '1Z999AA10123456784',
    shipping_address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
  },
  {
    order_id: 'ORD-2026-002',
    buyer_id: 'buyer_xyz789',
    buyer_name: 'Sarah M.',
    buyer_email: 'sarah.m@email.com',
    item_id: '136645465620',
    item_title: 'Air Jordan 1 Retro High OG',
    item_price: 129.99,
    quantity: 1,
    order_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'delivered',
    tracking_number: '1Z999AA10123456789',
    shipping_address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'USA',
    },
  },
  {
    order_id: 'ORD-2026-003',
    buyer_id: 'buyer_def456',
    buyer_name: 'Mike R.',
    buyer_email: 'mike.r@email.com',
    item_id: '136645465625',
    item_title: 'Nike Dunk Low Retro',
    item_price: 79.99,
    quantity: 2,
    order_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'delivered',
    tracking_number: '1Z999AA10123456790',
    shipping_address: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA',
    },
  },
  {
    order_id: 'ORD-2026-004',
    buyer_id: 'buyer_ghi012',
    buyer_name: 'Lisa K.',
    buyer_email: 'lisa.k@email.com',
    item_id: '136645465630',
    item_title: 'Jordan 11 Cool Grey',
    item_price: 149.99,
    quantity: 1,
    order_date: new Date().toISOString(),
    status: 'paid',
    shipping_address: {
      street: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      country: 'USA',
    },
  },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from API, fall back to mock data
    fetch('/api/orders')
      .then(r => r.json())
      .then((data: { orders?: Order[]; success?: boolean } | Order[]) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders(MOCK_ORDERS);
        }
      })
      .catch(() => setOrders(MOCK_ORDERS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          Orders
        </h2>
        <span className="text-[10px] font-mono text-slate-500">
          {orders.filter(o => o.status === 'paid').length} awaiting shipment · {orders.length} total
        </span>
      </div>

      <div className="flex flex-1 min-h-0 gap-6">
        {/* Orders List */}
        <div className="w-[30%] min-w-[240px] flex flex-col border-r border-white/5 pr-4 overflow-y-auto">
          <OrderList
            orders={orders}
            selectedId={selectedOrder?.order_id ?? null}
            onSelectOrder={setSelectedOrder}
            loading={loading}
          />
        </div>

        {/* Order Detail */}
        <div className="flex-1 min-w-0 flex flex-col">
          <OrderDetail order={selectedOrder} />
        </div>
      </div>
    </div>
  );
}
