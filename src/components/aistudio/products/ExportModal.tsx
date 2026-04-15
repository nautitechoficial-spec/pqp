import React, { useState } from 'react';
import { X, FileText, Download, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface ExportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  products?: any[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function ExportModal({ isOpen = true, onClose, products = [] }: ExportModalProps) {
  const [format, setFormat] = useState('csv');
  const [includeInactive, setIncludeInactive] = useState(true);
  if (!isOpen) return null;

  const handleExport = () => {
    const rows = (includeInactive ? products : products.filter((p: any) => p.status !== 'inactive')).map((p: any) => ({
      name: p.name, sku: p.sku, category: p.categoryName, price: p.price, stock: p.stock, status: p.status, image: p.mainImage || ''
    }));

    if (format === 'xlsx') {
      const table = `
        <table>
          <thead>
            <tr><th>Nome</th><th>SKU</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Imagem</th></tr>
          </thead>
          <tbody>
            ${rows.map((r: any) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.sku)}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.price)}</td><td>${escapeHtml(r.stock)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.image)}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
      downloadBlob(new Blob([`\ufeff${table}`], { type: 'application/vnd.ms-excel;charset=utf-8' }), `produtos-${new Date().toISOString().slice(0,10)}.xls`);
      onClose();
      return;
    }

    const csv = [Object.keys(rows[0] || {name:'',sku:'',category:'',price:'',stock:'',status:'',image:''}).join(','), ...rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `produtos-${new Date().toISOString().slice(0,10)}.csv`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="text-lg font-black text-slate-900">Exportar Produtos</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-3">{[{ id:'csv', label:'CSV (Planilha)', icon:FileText },{ id:'xlsx', label:'Excel (.xls)', icon:Download }].map(f => <button key={f.id} onClick={() => setFormat(f.id)} className={clsx("flex items-center gap-3 p-4 rounded-2xl border text-left transition-all", format===f.id ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500" : "bg-white border-slate-200 text-slate-600")}><f.icon className="w-5 h-5" /><span className="text-sm font-bold">{f.label}</span></button>)}</div>
          </div>
          <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Incluir Inativos</h4><p className="text-xs text-slate-500">Exportar produtos com status inativo.</p></div><button onClick={() => setIncludeInactive(!includeInactive)} className={clsx("w-12 h-6 rounded-full transition-all relative", includeInactive ? "bg-orange-500" : "bg-slate-200")}><div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", includeInactive ? "right-1" : "left-1")} /></button></div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3"><AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /><p className="text-[11px] text-amber-700">A exportação será gerada com os produtos atualmente carregados na página.</p></div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={handleExport} className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black">Exportar Agora</button></div>
      </motion.div>
    </div>
  );
}
