import React from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Eye, Edit2, Copy, Archive, Trash2, ArrowUpDown, ImageOff, Package, Power, CheckCircle2 } from 'lucide-react';
import { Product } from '../../../aistudioTypes';
import { clsx } from 'clsx';

interface ProductTableProps {
  products: Product[];
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onArchive: (p: Product) => void;
  onDelete: (p: Product) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export default function ProductTable({
  products,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  sortConfig,
  onSort
}: ProductTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const left = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, rect.right - menuWidth));
    const top = rect.bottom + 8;
    if (openMenuId === productId) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    setOpenMenuId(productId);
    setMenuPosition({ top, left });
  };

  const SortIcon = ({ column }: { column: string }) => {
    const isActive = sortConfig?.key === column;
    return (
      <ArrowUpDown className={clsx(
        "w-3 h-3 transition-colors",
        isActive ? "text-orange-500" : "text-slate-300 group-hover:text-slate-400"
      )} />
    );
  };

  return (
    <div className="relative z-0 overflow-visible rounded-none border-0 bg-transparent shadow-none md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <button onClick={() => onSort('name')} className="flex items-center gap-2 group">
                  Produto
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <button onClick={() => onSort('price')} className="flex items-center gap-2 group">
                  Preço
                  <SortIcon column="price" />
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <button onClick={() => onSort('stock')} className="flex items-center gap-2 group">
                  Estoque
                  <SortIcon column="stock" />
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <button onClick={() => onSort('views')} className="flex items-center gap-2 group">
                  Views
                  <SortIcon column="views" />
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <button onClick={() => onSort('status')} className="flex items-center gap-2 group">
                  Status
                  <SortIcon column="status" />
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{product.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 uppercase">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                    {product.categoryName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </div>
                  {product.compareAtPrice && (
                    <div className="text-[10px] text-slate-400 line-through">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.compareAtPrice)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className={clsx(
                    "text-sm font-bold",
                    product.stock <= product.lowStockThreshold ? "text-rose-600" : "text-slate-700"
                  )}>
                    {product.stock} un.
                  </div>
                  {product.stock <= product.lowStockThreshold && (
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Estoque Baixo</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {product.views.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    product.status === 'active' 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block z-30">
                    <button 
                      onClick={(event) => openMenu(event, product.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {openMenuId === product.id && menuPosition && createPortal(
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => { setOpenMenuId(null); setMenuPosition(null); }} />
                        <div style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[100] animate-in fade-in zoom-in duration-200">
                          <button onClick={() => { onView(product); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                            <Eye className="w-4 h-4" /> Ver detalhes
                          </button>
                          <button onClick={() => { onEdit(product); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                            <Edit2 className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => { onDuplicate(product); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                            <Copy className="w-4 h-4" /> Duplicar
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={() => { onArchive(product); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                            {product.status === 'active' ? <Power className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {product.status === 'active' ? 'Desativar' : 'Ativar'}
                          </button>
                          {Number((product as any).salesCount || 0) === 0 && (
                          <button onClick={() => { onDelete(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        )}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {product.mainImage ? (
                    <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{product.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{product.sku}</div>
                </div>
              </div>
              <span className={clsx(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                product.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {product.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Preço</div>
                <div className="mt-1 text-xs font-black text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estoque</div>
                <div className={clsx("mt-1 text-xs font-black", product.stock <= product.lowStockThreshold ? "text-rose-600" : "text-slate-700")}>{product.stock} un.</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Views</div>
                <div className="mt-1 text-xs font-black text-slate-700">{product.views.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => onView(product)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition-colors">
                Ver
              </button>
              <button onClick={() => onEdit(product)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition-colors">
                Editar
              </button>
              <button onClick={(event) => openMenu(event, product.id)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {openMenuId === product.id && menuPosition && createPortal(
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => { setOpenMenuId(null); setMenuPosition(null); }} />
                  <div style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[100] animate-in fade-in zoom-in duration-200">
                    <button onClick={() => { onView(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                      <Eye className="w-4 h-4" /> Ver detalhes
                    </button>
                    <button onClick={() => { onEdit(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={() => { onDuplicate(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                      <Copy className="w-4 h-4" /> Duplicar
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button onClick={() => { onArchive(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                      {product.status === 'active' ? <Power className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {product.status === 'active' ? 'Desativar' : 'Ativar'}
                    </button>
                    {Number((product as any).salesCount || 0) === 0 && (
                      <button onClick={() => { onDelete(product); setOpenMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500">Tente ajustar seus filtros ou busca.</p>
        </div>
      )}
    </div>
  );
}
