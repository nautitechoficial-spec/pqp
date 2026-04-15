import React from 'react';
import { 
  ShoppingBag, CheckCircle2, Clock, XCircle, 
  TrendingUp, DollarSign, Percent, Truck 
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { Order } from '../../../aistudioTypes';

interface OrderStatsProps {
  orders: Order[];
  loading?: boolean;
}

export default function OrderStats({ orders, loading }: OrderStatsProps) {
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.statusPayment === 'paid').length;
  const pendingOrders = orders.filter(o => o.statusPayment === 'pending').length;
  const cancelledOrders = orders.filter(o => o.statusPayment === 'cancelled').length;
  const totalRevenue = orders.reduce((acc, o) => o.statusPayment === 'paid' ? acc + o.total : acc, 0);
  const avgTicket = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  const stats = [
    { 
      label: 'Total de Pedidos', 
      value: totalOrders, 
      icon: ShoppingBag, 
      color: 'text-slate-600', 
      bg: 'bg-slate-50' 
    },
    { 
      label: 'Pedidos Pagos', 
      value: paidOrders, 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Pendentes', 
      value: pendingOrders, 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Cancelados', 
      value: cancelledOrders, 
      icon: XCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Faturamento Total', 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue), 
      icon: DollarSign, 
      color: 'text-[#FF6B00]', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Ticket Médio', 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket), 
      icon: TrendingUp, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Conversão', 
      value: `${conversionRate.toFixed(1)}%`, 
      icon: Percent, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    }
  ];

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-7 lg:overflow-visible">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="min-w-[160px] flex-1 h-24 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-7 lg:overflow-visible">
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="min-w-[160px] flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
        >
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
            stat.bg
          )}>
            <stat.icon className={clsx("w-4 h-4", stat.color)} />
          </div>
          <div className="text-sm font-black text-slate-900 truncate">{stat.value}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
