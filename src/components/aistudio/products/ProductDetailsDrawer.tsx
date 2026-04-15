import React from 'react';
import { 
  X, Edit2, Copy, Printer, ExternalLink, 
  Package, Truck, DollarSign, Layers, Eye,
  CheckCircle2, XCircle, AlertTriangle, ImageOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { Product } from '../../../aistudioTypes';

interface ProductDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (p: Product) => void;
}

export default function ProductDetailsDrawer({
  isOpen,
  onClose,
  product,
  onEdit
}: ProductDetailsDrawerProps) {
  if (!isOpen || !product) return null;

  const stats = [
    { label: 'Preço', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Estoque', value: `${product.stock} un.`, icon: Layers, color: product.stock <= product.lowStockThreshold ? 'text-rose-600' : 'text-emerald-600', bg: product.stock <= product.lowStockThreshold ? 'bg-rose-50' : 'bg-emerald-50' },
    { label: 'Views', value: product.views.toLocaleString(), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-slate-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {product.mainImage ? (
                <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ImageOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{product.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{product.sku}</span>
                <span className={clsx(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                  product.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>
                  {product.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-lg font-black text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Informações Gerais</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</div>
                  <div className="text-sm font-bold text-slate-700">{product.categoryName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição Curta</div>
                  <div className="text-sm text-slate-600">{product.shortDescription || 'Sem descrição.'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags?.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{tag}</span>
                    )) || <span className="text-xs text-slate-400 italic">Nenhuma tag.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Logística & Frete</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Frete</div>
                  <div className="text-sm font-bold text-slate-700 uppercase">{product.shippingType.replace('_', ' ')}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso</div>
                    <div className="text-sm font-bold text-slate-700">{product.weight} kg</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dimensões</div>
                    <div className="text-sm font-bold text-slate-700">{product.height}x{product.width}x{product.length} cm</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frete Grátis</div>
                  <div className={clsx(
                    "text-sm font-bold",
                    product.freeShipping ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {product.freeShipping ? 'Sim' : 'Não'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {product.galleryImages.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Galeria de Imagens</h3>
              <div className="grid grid-cols-4 gap-4">
                {product.galleryImages.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl border border-slate-100 overflow-hidden">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {product.hasVariants && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Variações ({product.variants.length})</h3>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {product.variants.map((v, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold text-slate-700">{v.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{v.sku}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{v.stock} un.</td>
                        <td className="px-4 py-3 font-black text-slate-900">R$ {v.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
              <Printer className="w-4 h-4" /> Imprimir Etiqueta
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
              <Copy className="w-4 h-4" /> Copiar Link
            </button>
          </div>
          <button 
            onClick={() => onEdit(product)}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <Edit2 className="w-4 h-4" /> Editar Produto
          </button>
        </div>
      </motion.div>
    </div>
  );
}
