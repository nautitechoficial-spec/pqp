import React from 'react';
import { 
  ShoppingBag, User, Calendar, 
  ChevronRight, Copy, ExternalLink,
  MoreHorizontal, Truck, CheckCircle2,
  Clock, XCircle, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { Order } from '../../../aistudioTypes';

interface OrderListProps {
  orders: Order[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  loading?: boolean;
}

export default function OrderList({ orders, selectedOrderId, onSelectOrder, loading }: OrderListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      cancelled: 'Cancelado',
      awaiting_separation: 'Separação',
      ready_for_shipping: 'Pronto',
      label_generated: 'Etiqueta',
      shipped: 'Postado',
      in_transit: 'Trânsito',
      out_for_delivery: 'Entrega',
      delivered: 'Entregue',
      failed: 'Falha',
      returned: 'Devolvido'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-full h-24 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200">
          <ShoppingBag className="w-8 h-8 opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-slate-900">Sem pedidos no período</p>
          <p className="text-xs text-slate-500">Tente ajustar os filtros ou buscar outro termo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, i) => (
        <motion.button
          key={order.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectOrder(order.id)}
          className={clsx(
            "w-full text-left p-5 rounded-3xl border transition-all group relative overflow-hidden",
            selectedOrderId === order.id 
              ? "border-[#FF6B00] bg-orange-50/30 ring-1 ring-[#FF6B00]" 
              : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-100"
          )}
        >
          {/* Indicador de Seleção */}
          {selectedOrderId === order.id && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6B00]" />
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                selectedOrderId === order.id ? "bg-white border-orange-100" : "bg-slate-50 border-slate-100"
              )}>
                <ShoppingBag className={clsx("w-6 h-6", selectedOrderId === order.id ? "text-[#FF6B00]" : "text-slate-400")} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-slate-900">{order.id}</span>
                  <div className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    getStatusColor(order.statusPayment)
                  )}>
                    {getStatusLabel(order.statusPayment)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3 h-3" />
                  <span className="truncate font-medium">{order.customerName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 flex-1 md:justify-items-center">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data / Hora</div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logística</div>
                <div className={clsx(
                  "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  getStatusColor(order.statusLogistic)
                )}>
                  {getStatusLabel(order.statusLogistic)}
                </div>
              </div>

              <div className="space-y-1 hidden md:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canal</div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-slate-400" />
                  {order.channel === 'affiliate' ? 'Afiliado' : order.channel === 'marketplace' ? 'Marketplace' : 'Loja'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6">
              <div className="text-right">
                <div className="text-base font-black text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {order.paymentMethod}
                </div>
              </div>
              <ChevronRight className={clsx(
                "w-5 h-5 text-slate-300 transition-all",
                selectedOrderId === order.id ? "text-[#FF6B00] translate-x-1" : "group-hover:text-slate-400 group-hover:translate-x-1"
              )} />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
