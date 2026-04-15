import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Copy, Eye, X, Image as ImageIcon, Package, Check, Calendar } from 'lucide-react';
import { Collection, Product } from '@/src/types/panelExtensions';
import { panelConfigService } from '@/src/services/panelConfigService';
import { clsx } from 'clsx';

export default function ColecoesPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState<{type:'success'|'error', text:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const [formData, setFormData] = useState<Partial<Collection>>({
    name: '',
    label: 'Oferta limitada',
    subtitle: '',
    status: 'active',
    productIds: [],
    benefit1: '12x sem juros',
    benefit2: '-30% no Pix',
    featuredSlogan: 'Designs sem limites',
    featuredDescription: ''
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res: any = await panelConfigService.getCollections();
        if (!mounted) return;
        if (Array.isArray(res.collections)) {
          setCollections(res.collections as any);
        } else {
          setCollections([]);
        }
      } catch (e: any) {
        setNotice({ type: 'error', text: e.message || 'Erro ao carregar coleções' });
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleOpenModal = async (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData(collection);
    } else {
      setEditingCollection(null);
      setBannerFile(null);
    setFormData({
        name: '',
        label: 'Oferta limitada',
        subtitle: '',
        status: 'active',
        productIds: [],
        benefit1: '12x sem juros',
        benefit2: '-30% no Pix',
        featuredSlogan: 'Designs sem limites',
        featuredDescription: ''
      });
    }
    setIsModalOpen(true);
    // carrega produtos reais para seleção (sem alterar estilo)
    try {
      const res: any = await panelConfigService.getCollectionProducts('', '');
      if (Array.isArray(res.products)) setProducts(res.products as any);
      else setProducts([]);
    } catch {
      setProducts([]);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setNotice({ type: 'error', text: 'Nome é obrigatório' });
      return;
    }
    try {
      await panelConfigService.saveCollection({ ...formData, bannerFile });
      setNotice({ type: 'success', text: 'Coleção salva com sucesso.' });
      const res: any = await panelConfigService.getCollections();
      if (Array.isArray(res.collections)) setCollections(res.collections as any);
      setIsModalOpen(false);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Erro ao salvar coleção' });
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {notice && <div className={`rounded-xl border px-4 py-3 text-sm ${notice.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{notice.text}</div>}
      {loading && <div className="text-xs text-slate-500">Carregando coleções...</div>}
      <div className="flex justify-between items-end">
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white rounded-xl font-bold hover:bg-[#E66000] transition-all shadow-lg shadow-orange-100"
        >
          <Plus className="w-5 h-5" />
          Nova Coleção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map(col => (
          <div key={col.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="h-32 bg-slate-100 relative overflow-hidden">
              {col.banner ? (
                <img src={col.banner} alt={col.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={clsx(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  col.status === 'active' ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {col.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider mb-1">{col.label}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{col.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-1 mb-4">{col.subtitle}</p>
              
              <div className="flex items-center gap-4 py-3 border-y border-slate-50 mb-4">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Produtos</div>
                  <div className="text-sm font-bold text-slate-700">{col.productIds.length} vinculados</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Período</div>
                  <div className="text-sm font-bold text-slate-700">Indeterminado</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(col)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg"><Copy className="w-4 h-4" /></button><button onClick={() => setCollectionToDelete(col)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
                <button onClick={() => setViewingCollection(col)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      {viewingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div><h2 className="text-2xl font-black text-slate-900">{viewingCollection.name}</h2><p className="text-xs uppercase tracking-widest font-black text-slate-400">Visualização da coleção</p></div><button onClick={() => setViewingCollection(null)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl"><X className="w-5 h-5" /></button></div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.3fr_.9fr] gap-6">
              <div className="space-y-5">
                <div className="h-72 bg-slate-100 rounded-[1.5rem] overflow-hidden">{viewingCollection.banner ? <img src={viewingCollection.banner} alt={viewingCollection.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-10 h-10" /></div>}</div>
                <div className="grid grid-cols-2 gap-4"><div className="rounded-2xl bg-slate-50 border border-slate-100 p-4"><div className="text-[10px] font-bold text-slate-400 uppercase">Label</div><div className="text-sm font-bold text-slate-900">{viewingCollection.label || '—'}</div></div><div className="rounded-2xl bg-slate-50 border border-slate-100 p-4"><div className="text-[10px] font-bold text-slate-400 uppercase">Status</div><div className="text-sm font-bold text-slate-900">{viewingCollection.status === 'active' ? 'Ativa' : 'Inativa'}</div></div><div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 col-span-2"><div className="text-[10px] font-bold text-slate-400 uppercase">Subtítulo</div><div className="text-sm text-slate-700">{viewingCollection.subtitle || '—'}</div></div></div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4">Produtos vinculados</div><div className="space-y-3">{(viewingCollection.products || []).length ? (viewingCollection.products || []).slice(0,8).map((p:any) => <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3"><img src={p.image || p.image_path || p.main_image || ''} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100" /><div className="min-w-0"><div className="text-sm font-black text-slate-900 truncate">{p.name}</div><div className="text-xs text-slate-500">{p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : 'Preço indisponível'}</div></div></div>) : <div className="text-sm text-slate-400">Nenhum produto vinculado.</div>}</div></div>
            </div>
          </div>
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200">
            {/* Form Side */}
            <div className="flex-1 flex flex-col border-r border-slate-100">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">{editingCollection ? 'Editar Coleção' : 'Nova Coleção'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Label Pequeno</label>
                    <input type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="Ex: Oferta limitada" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Título da Coleção</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Drop de Inverno" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700">Subtítulo</label>
                    <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="Ex: Até 40% off em toda a linha Nomad" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Banner da Coleção</label>
                  <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#FF6B00] hover:bg-orange-50 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]||null; setBannerFile(f); if(f){ const url=URL.createObjectURL(f); setFormData({...formData, banner: url}); } }} />
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500">Upload do Banner</span>
                  </label>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="font-bold text-slate-900">Destaque da Coleção</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Produto Destaque</label>
                      <select 
                        value={formData.featuredProductId} 
                        onChange={e => setFormData({...formData, featuredProductId: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
                      >
                        <option value="">Selecionar produto</option>
                        {products.map(p => <option key={(p as any).id} value={(p as any).id}>{(p as any).name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Slogan do Destaque</label>
                      <input type="text" value={formData.featuredSlogan} onChange={e => setFormData({...formData, featuredSlogan: e.target.value})} placeholder="Ex: Designs sem limites" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700">Descrição do Destaque</label>
                      <textarea value={formData.featuredDescription} onChange={e => setFormData({...formData, featuredDescription: e.target.value})} rows={3} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Benefício 1</label>
                      <input type="text" value={formData.benefit1} onChange={e => setFormData({...formData, benefit1: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Benefício 2</label>
                      <input type="text" value={formData.benefit2} onChange={e => setFormData({...formData, benefit2: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">Seleção de Produtos</label>
                    <span className="text-xs text-slate-400">{formData.productIds?.length} selecionados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((p: any) => {
                      const isSelected = formData.productIds?.includes(p.id);
                      return (
                        <button 
                          key={p.id}
                          onClick={() => {
                            const current = formData.productIds || [];
                            const next = isSelected ? current.filter(id => id !== p.id) : [...current, p.id];
                            setFormData({...formData, productIds: next});
                          }}
                          className={clsx(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            isSelected ? "border-[#FF6B00] bg-orange-50" : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                        >
                          <img src={p.image || p.image_path || p.main_image || ''} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : ''}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#FF6B00]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-[#FF6B00] text-white rounded-xl font-bold text-sm hover:bg-[#E66000] shadow-lg shadow-orange-100">Salvar Coleção</button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="w-[400px] bg-slate-100 p-8 flex flex-col">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-4 text-center tracking-widest">Preview ao Vivo</div>
              <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
                <div className="h-48 bg-slate-200 relative">
                  {(formData.banner) && <img src={formData.banner} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider mb-1">{formData.label || 'LABEL'}</div>
                    <h3 className="text-2xl font-bold leading-tight mb-1">{formData.name || 'Nome da Coleção'}</h3>
                    <p className="text-xs text-white/80 line-clamp-1">{formData.subtitle || 'Subtítulo da coleção aqui'}</p>
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
                  {formData.featuredProductId && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex gap-4 mb-4">
                        <img 
                          src={(products as any).find((p:any) => String(p.id) === String(formData.featuredProductId))?.image || (products as any).find((p:any)=>String(p.id)===String(formData.featuredProductId))?.image_path || ''} 
                          className="w-20 h-20 rounded-xl object-cover" 
                        />
                        <div>
                          <div className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1">{formData.featuredSlogan}</div>
                          <div className="text-sm font-bold text-slate-900 mb-1">
                            {(products as any).find((p:any) => String(p.id) === String(formData.featuredProductId))?.name || ''}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{formData.featuredDescription}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white p-2 rounded-lg border border-slate-100 text-center">
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Benefício</div>
                          <div className="text-[10px] font-bold text-slate-700">{formData.benefit1}</div>
                        </div>
                        <div className="flex-1 bg-white p-2 rounded-lg border border-slate-100 text-center">
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Benefício</div>
                          <div className="text-[10px] font-bold text-slate-700">{formData.benefit2}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Seleção Especial</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {formData.productIds?.map(id => {
                        const p: any = (products as any).find((prod:any) => String(prod.id) === String(id));
                        if (!p) return null;
                        return (
                          <div key={id} className="space-y-2">
                            <img src={p.image || p.image_path || p.main_image || ''} className="w-full aspect-square rounded-xl object-cover bg-slate-100" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-900 truncate">{p.name}</div>
                              <div className="text-[10px] text-[#FF6B00] font-bold">{p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {collectionToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div><div className="text-lg font-black text-slate-900">Excluir coleção</div><div className="text-xs uppercase tracking-widest font-black text-slate-400 mt-1">Ação irreversível</div></div><button onClick={() => setCollectionToDelete(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4"><div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Tem certeza que deseja excluir a coleção <span className="font-black">{collectionToDelete.name}</span>?</div></div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row justify-end gap-2"><button onClick={() => setCollectionToDelete(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold">Cancelar</button><button onClick={async () => { try { await panelConfigService.deleteCollection(collectionToDelete.id); setCollectionToDelete(null); const res:any = await panelConfigService.getCollections(); if (Array.isArray(res.collections)) setCollections(res.collections as any); setNotice({ type:'success', text:'Coleção excluída com sucesso.' }); } catch (e:any) { setNotice({ type:'error', text:e.message || 'Erro ao excluir coleção' }); } }} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700">Excluir coleção</button></div>
          </div>
        </div>
      )}

    </div>
  );
}
