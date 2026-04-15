import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, GripVertical, Smartphone, ShoppingBag, Shirt, ChevronRight, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';
// Dados devem vir do banco via API (sem mocks)
import { panelConfigService } from '@/src/services/panelConfigService';
import { IMAGE_BASE_URL } from '@/src/config/api';
import { Category } from '@/src/types/panelExtensions';
import { clsx } from 'clsx';

const icons = { Smartphone, ShoppingBag, Shirt } as const;

function normalizeImageUrl(url?: string) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;

  const clean = value.replace(/^\.\//, '').replace(/^\/+/, '');
  if (clean.startsWith('api-painel/uploads/')) return `${IMAGE_BASE_URL}/${clean.replace(/^api-painel\//, '')}`;
  if (clean.startsWith('api-painel/')) return `${IMAGE_BASE_URL}/${clean}`;
  if (clean.startsWith('uploads/')) return `${IMAGE_BASE_URL}/${clean}`;
  if (value.startsWith('/api-painel/uploads/')) return `${IMAGE_BASE_URL}${value.replace('/api-painel', '')}`;
  if (value.startsWith('/api-painel/')) return `${IMAGE_BASE_URL}${value}`;
  if (value.startsWith('/uploads/')) return `${IMAGE_BASE_URL}${value}`;
  if (value.startsWith('/')) return `${IMAGE_BASE_URL}${value}`;
  return `${IMAGE_BASE_URL}/${clean}`;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{type:'success'|'error', text:string}|null>(null);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{name:string;type:'category'|'subcategory';parentId:string;icon:string;status:'active'|'inactive';description:string;image:string}>({ name:'', type:'category', parentId:'', icon:'ShoppingBag', status:'active', description:'', image:'' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteFlow, setDeleteFlow] = useState<any>(null);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name:'', type:'category', parentId:'', icon:'ShoppingBag', status:'active', description:'', image:'' });
    setImageFile(null);
    setModalOpen(true);
  };
  const openEditModal = (cat:any) => {
    setEditingId(String(cat.id));
    setForm({
      name: String(cat.name || ''),
      type: (cat.type === 'subcategory' ? 'subcategory' : 'category'),
      parentId: String(cat.parentId || ''),
      icon: String(cat.icon || 'ShoppingBag'),
      status: (cat.status === 'inactive' ? 'inactive' : 'active'),
      description: String((cat as any).description || ''),
      image: String((cat as any).image || (cat as any).image_path || '')
    });
    setImageFile(null);
    setModalOpen(true);
  };
  const refreshCategories = async () => {
    const res:any = await panelConfigService.getCategories();
    if(Array.isArray(res.categories)){
      setCategories(res.categories.map((c:any)=>({ id:String(c.id), name:c.name, type:c.type || (c.parent_id ? 'subcategory' : 'category'), parentId:(c.parentId ?? c.parent_id)? String(c.parentId ?? c.parent_id):undefined, icon:c.icon || 'ShoppingBag', image:c.image || c.image_path || undefined, status:(c.status === 'inactive' || c.status === 0) ? 'inactive' : 'active', description: c.description || '' })) as any);
    }
  };
  const submitCategory = async () => {
    if(!form.name.trim()) { setNotice({type:'error', text:'Nome da categoria é obrigatório.'}); return; }
    try {
      setIsSaving(true);
      await panelConfigService.saveCategory({
        id: editingId || undefined,
        name: form.name.trim(),
        type: form.type,
        parent_id: form.type === 'subcategory' ? (form.parentId || null) : null,
        icon: form.icon,
        status: form.status,
        description: form.description.trim() || null,
        image_path: imageFile ? null : (form.image || null),
        use_image: !!(imageFile || form.image),
      }, imageFile);
      await refreshCategories();
      setModalOpen(false);
      setImageFile(null);
      setNotice({type:'success', text: editingId ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.'});
    } catch(e:any){
      setNotice({type:'error', text:e.message || 'Erro ao salvar categoria'});
    } finally {
      setIsSaving(false);
    }
  };


  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await panelConfigService.getCategories();
        if (!mounted) return;
        if (Array.isArray(res.categories)) {
          setCategories(res.categories.map((c:any) => ({
            id: String(c.id), name: c.name, type: c.type || (c.parentId ? 'subcategory' : 'category'),
            parentId: (c.parentId ?? c.parent_id) ? String(c.parentId ?? c.parent_id) : undefined,
            icon: c.icon || 'ShoppingBag', image: c.image || c.image_path || undefined,
            status: (c.status === 'inactive' || c.status === 0) ? 'inactive' : 'active',
            description: c.description || ''
          })) as any);
        }
      } catch (e:any) { setNotice({ type:'error', text: e.message || 'Erro ao carregar categorias' }); }
      finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 3000); return () => clearTimeout(t); }, [notice]);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [modalOpen]);

  const rows = useMemo(() => {
    const top = categories.filter(c => c.type === 'category');
    const ordered: Category[] = [];
    top.forEach(cat => {
      ordered.push(cat);
      categories.filter(s => s.type === 'subcategory' && s.parentId === cat.id).forEach(sub => ordered.push(sub));
    });
    categories.filter(c => !ordered.find(o => o.id === c.id)).forEach(c => ordered.push(c));
    return ordered.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchSearch = c.name.toLowerCase().includes(q) || (c.parentId && categories.find(x => x.id===c.parentId)?.name?.toLowerCase().includes(q));
      const matchFilter = filter === 'all' || filter === c.type || (filter === 'active' && c.status==='active') || (filter==='inactive' && c.status==='inactive');
      return matchSearch && matchFilter;
    });
  }, [categories, searchTerm, filter]);

  const moveItem = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setCategories(prev => {
      const arr = [...prev];
      const from = arr.findIndex(c => c.id === draggedId);
      const to = arr.findIndex(c => c.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from,1);
      arr.splice(to,0,item);
      return arr;
    });
  };


  const beginDeleteCategory = async (cat: any) => {
    try {
      const preview: any = await panelConfigService.previewDeleteCategory(cat.id);
      if (preview?.can_delete) {
        await panelConfigService.deleteCategory(cat.id);
        await refreshCategories();
        setNotice({ type: 'success', text: 'Categoria removida com sucesso.' });
        return;
      }
      setDeleteFlow({ category: cat, ...preview, targetCategoryId: String(preview?.other_categories?.[0]?.id || '') });
    } catch (e: any) {
      const payload = e?.message ? null : null;
      setNotice({ type: 'error', text: e.message || 'Erro ao remover categoria' });
    }
  };

  const confirmReassignAndDelete = async () => {
    if (!deleteFlow?.targetCategoryId) {
      setNotice({ type: 'error', text: 'Selecione uma categoria de destino para os produtos.' });
      return;
    }
    try {
      await panelConfigService.reassignAndDeleteCategory({ id: deleteFlow.category.id, target_category_id: Number(deleteFlow.targetCategoryId) });
      setDeleteFlow(null);
      await refreshCategories();
      setNotice({ type: 'success', text: 'Produtos movidos e categoria excluída com sucesso.' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Erro ao mover os produtos e excluir a categoria' });
    }
  };

  const handleTouchStart = (id: string) => setTouchDragId(id);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragId) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-category-id]') as HTMLElement | null;
    if (el?.dataset?.categoryId) setOverId(el.dataset.categoryId);
  };
  const handleTouchEnd = (targetId: string) => {
    if (touchDragId && overId && touchDragId !== overId) moveItem(touchDragId, overId);
    setTouchDragId(null);
    setOverId(null);
  };

  return (
    <div className="space-y-5 pb-8">
      {notice && <div className={`rounded-xl border px-4 py-3 text-sm ${notice.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{notice.text}</div>}
      {loading && <div className="text-xs text-slate-500">Carregando categorias...</div>}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar categoria..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none">
              <option value="all">Todas</option><option value="category">Categorias</option><option value="subcategory">Subcategorias</option><option value="active">Ativas</option><option value="inactive">Inativas</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              await panelConfigService.saveCategoryOrder(
                rows.map((r: any, idx: number) => ({
                  id: r.id,
                  parent_id: r.type === 'subcategory' ? (r.parentId || null) : null,
                  sort_order: idx + 1,
                }))
              );
              setNotice({ type: 'success', text: 'Ordem salva com sucesso.' });
            } catch (e: any) {
              setNotice({ type: 'error', text: e.message || 'Erro ao salvar ordem' });
            }
          }} className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold hover:bg-slate-50">Salvar ordem</button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold hover:bg-[#E66000] transition-all"><Plus className="w-4 h-4" />Nova</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50/60"><th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400">Ordem</th><th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400">Nome</th><th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400">Mídia</th><th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400">Status</th><th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(cat => {
                const Icon = icons[(cat.icon as keyof typeof icons) || 'ShoppingBag'] || ShoppingBag;
                const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                const dragging = dragId === cat.id;
                const dropOver = overId === cat.id;
                return (
                  <tr key={cat.id} draggable onDragStart={()=>setDragId(cat.id)} onDragOver={(e)=>{e.preventDefault(); setOverId(cat.id);}} onDragEnd={()=>{setDragId(null); setOverId(null);}} onDrop={(e)=>{e.preventDefault(); if(dragId) moveItem(dragId, cat.id); setDragId(null); setOverId(null);}}
                    className={clsx("transition-all", dragging && "opacity-50", dropOver && "bg-orange-50/60") }>
                    <td className="px-5 py-3"><div className="inline-flex items-center gap-2 text-slate-400"><GripVertical className="w-4 h-4" /><span className="text-xs">arrastar</span></div></td>
                    <td className="px-5 py-3">
                      {cat.type === 'subcategory' ? (
                        <div className="pl-6 relative">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute left-0 top-1" />
                          <div className="text-sm font-bold text-slate-900">{cat.name}</div>
                          <div className="text-xs text-slate-500">Subcategoria de {parent?.name || '—'}</div>
                        </div>
                      ) : (
                        <div><div className="text-sm font-bold text-slate-900">{cat.name}</div><div className="text-xs text-slate-500">Categoria principal</div></div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {cat.image ? (
                        <img src={normalizeImageUrl(cat.image)} alt={cat.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-slate-100" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><Icon className="w-4 h-4" /></div>
                      )}
                    </td>
                    <td className="px-5 py-3"><span className={clsx("text-xs font-bold", cat.status==='active' ? 'text-emerald-600' : 'text-slate-400')}>{cat.status==='active'?'Ativo':'Inativo'}</span></td>
                    <td className="px-5 py-3"><div className="flex justify-end gap-1"><button onClick={()=>openEditModal(cat)} className="p-2 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-500" /></button><button onClick={() => beginDeleteCategory(cat)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-3 space-y-3">
          {rows.map(cat => {
            const Icon = icons[(cat.icon as keyof typeof icons) || 'ShoppingBag'] || ShoppingBag;
            const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
            return <div key={cat.id} data-category-id={cat.id} draggable onDragStart={()=>setDragId(cat.id)} onDragOver={(e)=>{e.preventDefault(); setOverId(cat.id);}} onDrop={(e)=>{e.preventDefault(); if(dragId) moveItem(dragId, cat.id); setDragId(null); setOverId(null);}} onDragEnd={()=>{setDragId(null); setOverId(null);}} onTouchStart={() => handleTouchStart(cat.id)} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(cat.id)} className={clsx("rounded-xl border p-3 bg-white select-none", (overId===cat.id || touchDragId===cat.id) && 'border-orange-300 bg-orange-50/40')}><div className="flex items-start gap-3"><div className="mt-1 text-slate-400"><GripVertical className="w-4 h-4"/></div>{cat.image ? <img src={normalizeImageUrl(cat.image)} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-500"/></div>}<div className="flex-1 min-w-0"><p className={clsx('text-sm font-bold', cat.type==='subcategory' && 'pl-4')}>{cat.type==='subcategory' ? `↳ ${cat.name}` : cat.name}</p><p className="text-xs text-slate-500">{cat.type==='subcategory' ? `Subcategoria de ${parent?.name || '—'}` : 'Categoria principal'}</p><div className="mt-3 flex items-center gap-2"><button onClick={()=>openEditModal(cat)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><Edit2 className="w-3.5 h-3.5" /> Editar</button><button onClick={() => beginDeleteCategory(cat)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"><Trash2 className="w-3.5 h-3.5" /> Excluir</button></div></div></div></div>;
          })}
        </div>
      </div>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0" onClick={()=>setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{editingId ? 'Editar categoria' : 'Nova categoria'}</h3>
                <p className="text-xs text-slate-500">Configure nome, tipo, ícone e status mantendo o padrão visual do painel.</p>
              </div>
              <button onClick={()=>setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nome da categoria</label>
                <input value={form.name} onChange={(e)=>setForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20" placeholder="Ex.: Eletrônicos" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tipo</label>
                <select value={form.type} onChange={(e)=>setForm(v=>({...v,type:e.target.value as any,parentId:e.target.value==='subcategory'?v.parentId:''}))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white">
                  <option value="category">Categoria principal</option>
                  <option value="subcategory">Subcategoria</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={(e)=>setForm(v=>({...v,status:e.target.value as any}))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              {form.type === 'subcategory' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Categoria pai</label>
                  <select value={form.parentId} onChange={(e)=>setForm(v=>({...v,parentId:e.target.value}))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white">
                    <option value="">Selecione</option>
                    {categories.filter(c=>c.type==='category' && c.id!==editingId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ícone</label>
                <select value={form.icon} onChange={(e)=>setForm(v=>({...v,icon:e.target.value}))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white">
                  <option value="ShoppingBag">Sacola</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Shirt">Camisa</option>
                  <option value="package">Pacote</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Imagem da categoria</label>
                <label className="mt-1 flex h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-600 hover:border-[#FF6B00]/40 hover:bg-orange-50/30">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{imageFile ? imageFile.name : (form.image ? 'Trocar imagem atual' : 'Selecionar imagem')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const file=e.target.files?.[0] || null; setImageFile(file); if(file){ const reader=new FileReader(); reader.onload=()=>setForm(v=>({...v,image:String(reader.result || '')})); reader.readAsDataURL(file); } }} />
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Prévia</label>
                <div className="mt-1 h-[50px] rounded-xl border border-slate-200 bg-slate-50 flex items-center px-3 gap-3">
                  {form.image ? <img src={normalizeImageUrl(form.image)} alt={form.name || 'Categoria'} className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">{React.createElement((icons[(form.icon as keyof typeof icons)] || ShoppingBag), { className:'w-4 h-4 text-slate-600' })}</div>}
                  <div className="text-sm font-semibold text-slate-800 truncate">{form.name || 'Nome da categoria'}</div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Descrição (opcional)</label>
                <textarea value={form.description} onChange={(e)=>setForm(v=>({...v,description:e.target.value}))} rows={3} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 resize-none" placeholder="Descrição curta da categoria" />
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-slate-50/60 sticky bottom-0">
              <button onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold">Cancelar</button>
              <button disabled={isSaving} onClick={submitCategory} className="px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#E66000] disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar categoria')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteFlow && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></div><div><h3 className="text-lg font-black text-slate-900">Existem produtos nesta categoria</h3><p className="mt-1 text-sm text-slate-500">Mova os produtos para outra categoria antes de excluir <span className="font-bold">{deleteFlow?.category?.name}</span>.</p></div></div>
              <button onClick={() => setDeleteFlow(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Mover produtos para</label>
                <select value={deleteFlow.targetCategoryId} onChange={(e) => setDeleteFlow((v:any) => ({ ...v, targetCategoryId: e.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#FF6B00]/20">
                  <option value="">Selecione a categoria</option>
                  {(deleteFlow.other_categories || []).map((option:any) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Produtos vinculados</div>
                <div className="space-y-3">{(deleteFlow.linked_products || []).map((prod:any) => <div key={prod.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"><div className="min-w-0"><div className="truncate text-sm font-black text-slate-900">{prod.name}</div><div className="text-xs text-slate-500">Categoria atual: {prod.category || deleteFlow?.category?.name}</div></div><div className="text-xs font-bold text-slate-400">#{prod.id}</div></div>)}</div>
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row">
              <button onClick={() => setDeleteFlow(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button onClick={confirmReassignAndDelete} className="rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-black text-white hover:bg-[#E66000]">Mover produtos e excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
