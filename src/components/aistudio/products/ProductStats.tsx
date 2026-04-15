import React from 'react';
import { Package, CheckCircle2, XCircle, AlertTriangle, ImageOff, Eye } from 'lucide-react';

interface ProductStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    noImage: number;
    views: number;
  };
}

export default function ProductStats({ stats }: ProductStatsProps) {
  const items = [
    { label: 'Total de produtos', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Produtos ativos', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Produtos inativos', value: stats.inactive, icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Estoque baixo', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Sem imagem', value: stats.noImage, icon: ImageOff, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Views (30 dias)', value: stats.views.toLocaleString(), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
