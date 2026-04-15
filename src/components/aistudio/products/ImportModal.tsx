import React, { useMemo, useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ImportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onImport?: (rows: any[]) => Promise<void> | void;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const row: any = {};
    headers.forEach((h, i) => row[h] = (cols[i] || '').trim());
    return row;
  });
}

export default function ImportModal({ isOpen = true, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handleFile = async (f: File | null) => {
    setFile(f);
    if (!f) return setPreview([]);
    const text = await f.text();
    setPreview(parseCsv(text).slice(0, 5));
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      await onImport?.(rows);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Importar Produtos</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <label className="block p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
            <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 mx-auto"><Upload className="w-6 h-6 text-orange-500" /></div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Selecione um arquivo CSV</h4>
            <p className="text-xs text-slate-500">Colunas aceitas: name, sku, price, stock, category, image</p>
          </label>
          {file && <div className="text-xs font-bold text-slate-700">Arquivo: {file.name}</div>}
          {preview.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Preço</th><th className="px-3 py-2">Estoque</th></tr></thead>
                <tbody>{preview.map((row, idx) => <tr key={idx} className="border-b border-slate-50 last:border-b-0"><td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.sku}</td><td className="px-3 py-2">{row.price}</td><td className="px-3 py-2">{row.stock}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3"><AlertCircle className="w-5 h-5 text-blue-500 shrink-0" /><p className="text-[11px] text-blue-700">Os produtos serão criados na loja atual. SKUs repetidos podem gerar duplicidade se o banco não tiver restrição.</p></div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
          <button disabled={!file || loading} onClick={handleImport} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-black disabled:opacity-50">{loading ? 'Importando...' : 'Confirmar Importação'}</button>
        </div>
      </motion.div>
    </div>
  );
}
