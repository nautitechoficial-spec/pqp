import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus, Search, Edit2, Trash2, X, Check, Users, Wallet, TrendingUp,
  Trophy, Link as LinkIcon, Copy, Percent, Settings, BadgeDollarSign, BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';
import { extensionsService } from '@/src/services/extensionsService';

type Customer = { id: number | string; name: string; email: string; created_at?: string };
type Aff = any;

function initials(name?: string) {
  return String(name || '').split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('') || 'AF';
}
function money(v: any) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AfiliadosPage() {
  const [affiliates, setAffiliates] = useState<Aff[]>([]);
  const [ranking, setRanking] = useState<Aff[]>([]);
  const [stats, setStats] = useState<any>({ total_affiliates: 0, total_sales: 0, pending_commission: 0, avg_conversion_rate: 0 });
  const [settings, setSettings] = useState<any>({ default_commission_type: 'percentage', default_commission_value: 10 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'profile'|'commission'|'link'|'sales'>('profile');
  const [editingAffiliate, setEditingAffiliate] = useState<Aff | null>(null);
  const [affiliateToDelete, setAffiliateToDelete] = useState<Aff | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newAffiliateCommission, setNewAffiliateCommission] = useState(10);
  const [newCommissionType, setNewCommissionType] = useState<'percentage'|'fixed'>('percentage');
  const [newSlug, setNewSlug] = useState('');
  const [newStatus, setNewStatus] = useState<'active'|'pending'|'inactive'>('active');
  const [customerSearch, setCustomerSearch] = useState('');

  const load = async (q = '') => {
    setLoading(true);
    try {
      const r: any = await extensionsService.getAffiliatesSummary(q);
      setAffiliates(Array.isArray(r?.affiliates) ? r.affiliates : []);
      setRanking(Array.isArray(r?.ranking) ? r.ranking : []);
      setStats(r?.stats || {});
      setSettings(r?.settings || {});
    } catch (e: any) {
      alert(e.message || 'Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (q = '') => {
    try {
      const r: any = await extensionsService.searchAffiliateCustomers(q);
      setCustomers(Array.isArray(r?.customers) ? r.customers : []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filteredAffiliates = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return affiliates.filter((a) => !q || String(a.customer_name || '').toLowerCase().includes(q) || String(a.customer_email || '').toLowerCase().includes(q) || String(a.slug || '').toLowerCase().includes(q));
  }, [affiliates, searchTerm]);

  const handleAddAffiliate = async () => {
    if (!selectedCustomerId) return alert('Selecione um cliente');
    await extensionsService.createAffiliate({ customer_id: Number(selectedCustomerId), commission_type: newCommissionType, commission_value: newAffiliateCommission, slug: newSlug, status: newStatus });
    setIsAddModalOpen(false);
    setSelectedCustomerId(null);
    setNewSlug('');
    setCustomerSearch('');
    setNewStatus('active');
    await load(searchTerm);
  };

  const openManage = (a: Aff) => {
    setEditingAffiliate({ ...a });
    setManageTab('profile');
    setIsManageDrawerOpen(true);
  };

  const handleUpdateAffiliate = async () => {
    if (!editingAffiliate) return;
    await extensionsService.updateAffiliate({
      id: editingAffiliate.id,
      slug: editingAffiliate.slug,
      commission_type: editingAffiliate.commission_type,
      commission_value: Number(editingAffiliate.commission_value || 0),
      status: editingAffiliate.status,
    });
    setIsManageDrawerOpen(false);
    await load(searchTerm);
  };

  const saveDefault = async () => {
    await extensionsService.saveAffiliateSettings({
      default_commission_type: settings.default_commission_type || 'percentage',
      default_commission_value: Number(settings.default_commission_value || 10),
    });
    await load(searchTerm);
  };

  const statCards = [
    { label: 'Afiliados ativos', value: stats.active_affiliates ?? stats.total_affiliates ?? 0, icon: Users },
    { label: 'Vendas totais', value: money(stats.total_sales), icon: Wallet },
    { label: 'Comissão pendente', value: money(stats.pending_commission), icon: BadgeDollarSign },
    { label: 'Conversão média', value: `${Number(stats.avg_conversion_rate || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`, icon: TrendingUp },
  ];
  const topPartners = (ranking.length ? ranking : affiliates).slice().sort((a, b) => Number(b.total_sales || 0) - Number(a.total_sales || 0)).slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-[#F6F7FB] pb-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Afiliados</h1>
              <p className="text-slate-500 text-sm font-medium">Gerencie seus parceiros e impulsione suas vendas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar parceiro..." className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/10 focus:border-[#FF6B00]" />
              </div>
              <button onClick={() => setShowRules(true)} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50">Regras</button>
              <button onClick={() => { setIsAddModalOpen(true); loadCustomers(); }} className="px-6 py-2 bg-[#FF6B00] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#E66000] shadow-lg shadow-orange-500/20 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Novo Afiliado</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
              {statCards.map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4"><s.icon className="w-5 h-5 text-[#FF6B00]" /></div>
                  <div className="text-2xl font-black text-slate-900">{s.value}</div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Lista de Parceiros</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-slate-700">Padrão</span>
                  <select value={settings.default_commission_type || 'percentage'} onChange={e => setSettings({ ...settings, default_commission_type: e.target.value })} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                    <option value="percentage">Percentual</option><option value="fixed">Fixo</option>
                  </select>
                  <input type="number" value={settings.default_commission_value ?? 10} onChange={e => setSettings({ ...settings, default_commission_value: Number(e.target.value) })} className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-center" />
                  <button onClick={saveDefault} className="text-xs font-black uppercase tracking-widest text-[#FF6B00] hover:underline">Salvar padrão</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Identificação</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Link</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Vendas / Cliques</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!loading && filteredAffiliates.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">Nenhum afiliado encontrado.</td></tr>
                    )}
                    {filteredAffiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white font-black text-xs flex items-center justify-center shadow">{initials(a.customer_name)}</div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{a.customer_name}</div>
                              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{a.customer_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                            <LinkIcon className="w-3.5 h-3.5" /> /a/{a.slug}
                            <button onClick={() => navigator.clipboard?.writeText(`/a/${a.slug}`)} className="text-slate-400 hover:text-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-100 text-xs font-black">
                            {Number(a.commission_value || 0).toFixed(2)} {a.commission_type === 'fixed' ? 'R$' : '%'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', a.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : a.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100')}>
                            {a.status === 'active' ? 'Ativo' : a.status === 'pending' ? 'Pendente' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-800">{money(a.total_sales)}</div>
                          <div className="text-xs text-slate-500">{Number(a.clicks || 0)} cliques • {Number(a.conversions || 0)} conv.</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openManage(a)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setAffiliateToDelete(a)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside>
            <div className="bg-white p-5 xl:p-6 rounded-[2rem] border border-slate-200 shadow-sm sticky top-4 overflow-hidden">
              <div className="flex items-start gap-3 mb-5 min-w-0"><div className="w-12 h-12 shrink-0 rounded-2xl bg-orange-50 flex items-center justify-center"><Trophy className="w-5 h-5 text-[#FF6B00]" /></div><div className="min-w-0"><h3 className="text-xl xl:text-2xl font-black text-slate-900 leading-tight break-words">Top Parceiros</h3><div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mt-1 break-words">Ranking de performance</div></div></div>
              <div className="space-y-4">
                {topPartners.length === 0 && <div className="text-sm text-slate-400">Nenhum parceiro ainda.</div>}
                {topPartners.map((a, idx) => (
                  <div key={a.id || idx} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-xs shadow">{initials(a.customer_name)}<span className="absolute -top-1 -right-1 bg-slate-200 text-slate-700 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black">{idx + 1}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-900 truncate">{a.customer_name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">{money(a.total_sales)} em vendas</div>
                    </div>
                    <div className="max-w-[110px] shrink-0 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] xl:text-xs font-black text-right leading-tight break-words">+ {money(a.total_commission)}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><UserPlus className="w-5 h-5" /></div>
                <div>
                  <div className="text-2xl font-black text-slate-900">Novo Parceiro</div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Configuração de perfil e comissão</div>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Vincular cliente</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); loadCustomers(e.target.value); }} placeholder="Buscar por nome ou e-mail..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  </div>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="max-h-44 overflow-auto divide-y divide-slate-100">
                    {customers.map((c) => (
                      <button key={String(c.id)} onClick={() => setSelectedCustomerId(String(c.id))} className={clsx('w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50', selectedCustomerId === String(c.id) && 'bg-orange-50')}>
                        <div><div className="text-sm font-bold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{c.email}</div></div>
                        {selectedCustomerId === String(c.id) && <Check className="w-4 h-4 text-[#FF6B00]" />}
                      </button>
                    ))}
                    {customers.length === 0 && <div className="px-4 py-5 text-sm text-slate-400">Nenhum cliente encontrado.</div>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Identificador (slug)</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <span className="text-xs font-black text-slate-400 mr-2">/a/</span>
                    <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="slug-personalizado" className="bg-transparent flex-1 text-sm outline-none" />
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 font-bold">● Disponível para uso</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Modelo de remuneração</label>
                  <div className="mt-2 inline-flex p-1 rounded-2xl bg-slate-100 gap-1 w-full">
                    <button onClick={() => setNewCommissionType('percentage')} className={clsx('flex-1 py-2 rounded-xl text-xs font-black', newCommissionType === 'percentage' ? 'bg-white text-[#FF6B00] border border-orange-200' : 'text-slate-500')}>Percentual (%)</button>
                    <button onClick={() => setNewCommissionType('fixed')} className={clsx('flex-1 py-2 rounded-xl text-xs font-black', newCommissionType === 'fixed' ? 'bg-white text-[#FF6B00] border border-orange-200' : 'text-slate-500')}>Fixo (R$)</button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Valor da comissão</label>
                  <div className="mt-2 relative">
                    <input type="number" value={newAffiliateCommission} onChange={e => setNewAffiliateCommission(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{newCommissionType === 'fixed' ? 'R$' : '%'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Status da conta</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as any)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <option value="active">Ativo imediatamente</option>
                    <option value="pending">Aguardando aprovação</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-slate-600">Cancelar</button>
              <button onClick={handleAddAffiliate} className="px-6 py-2 rounded-xl bg-[#FF6B00] text-white font-bold hover:bg-[#E66000] shadow-lg shadow-orange-500/20">Cadastrar Parceiro</button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between"><h3 className="text-2xl font-black text-slate-900">Regras do Programa</h3><button onClick={() => setShowRules(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4 text-sm text-slate-700"><div>• Comissão padrão definida no painel é aplicada aos novos afiliados.</div><div>• Comissão contabilizada somente em pedidos pagos.</div><div>• Pedidos cancelados, devolvidos ou estornados não geram comissão.</div><div>• A administração controla aprovação e liberação financeira.</div><div>• Cada afiliado possui link exclusivo no formato <span className="font-black">/a/slug</span>.</div></div>
          </div>
        </div>
      )}

      {isManageDrawerOpen && editingAffiliate && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex justify-end">
          <div className="w-full max-w-[420px] md:max-w-[460px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><Settings className="w-4 h-4" /></div><div className="text-xl font-black text-slate-900">Gerenciar Parceiro</div></div>
              <button onClick={() => setIsManageDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center text-xl font-black">{initials(editingAffiliate.customer_name)}</div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{editingAffiliate.customer_name}</div>
                  <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">• conta {editingAffiliate.status === 'active' ? 'ativa' : editingAffiliate.status}</div>
                </div>
              </div>
            </div>

            <div className="px-4 border-b border-slate-100">
              <div className="grid grid-cols-4 text-center">
                {[
                  ['profile', 'Perfil', Users],
                  ['commission', 'Comissão', Percent],
                  ['link', 'Link', LinkIcon],
                  ['sales', 'Vendas', BarChart3],
                ].map(([id, label, Icon]: any) => (
                  <button key={id} onClick={() => setManageTab(id)} className={clsx('py-4 px-1 border-b-2', manageTab === id ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-400 hover:text-slate-700')}>
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {manageTab === 'profile' && (
                <>
                  <Field label="Nome completo" value={editingAffiliate.customer_name || ''} readOnly />
                  <Field label="E-mail de contato" value={editingAffiliate.customer_email || ''} readOnly />
                  <Field label="WhatsApp / telefone" value={editingAffiliate.phone || ''} placeholder="(00) 00000-0000" onChange={(v)=>setEditingAffiliate({ ...editingAffiliate, phone:v })} />
                </>
              )}
              {manageTab === 'commission' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Modelo</label>
                    <select value={editingAffiliate.commission_type || 'percentage'} onChange={e => setEditingAffiliate({ ...editingAffiliate, commission_type: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="percentage">Percentual</option><option value="fixed">Fixo</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Comissão</label>
                    <input type="number" value={editingAffiliate.commission_value || 0} onChange={e => setEditingAffiliate({ ...editingAffiliate, commission_value: Number(e.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Status</label>
                    <select value={editingAffiliate.status || 'active'} onChange={e => setEditingAffiliate({ ...editingAffiliate, status: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="pending">Pendente</option><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="blocked">Bloqueado</option></select>
                  </div>
                </>
              )}
              {manageTab === 'link' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Slug</label>
                    <input value={editingAffiliate.slug || ''} onChange={e => setEditingAffiliate({ ...editingAffiliate, slug: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 mb-2">Link do parceiro</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-800 truncate">/a/{editingAffiliate.slug || 'sem-slug'}</div>
                      <button onClick={() => navigator.clipboard?.writeText(`/a/${editingAffiliate.slug || ''}`)} className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"><Copy className="w-3.5 h-3.5" /> Copiar</button>
                    </div>
                  </div>
                </>
              )}
              {manageTab === 'sales' && (
                <div className="space-y-3">
                  <MetricCard icon={Wallet} label="Vendas totais" value={money(editingAffiliate.total_sales)} />
                  <MetricCard icon={BadgeDollarSign} label="Comissão total" value={money(editingAffiliate.total_commission)} />
                  <MetricCard icon={TrendingUp} label="Cliques / conversões" value={`${Number(editingAffiliate.clicks || 0)} / ${Number(editingAffiliate.conversions || 0)}`} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-5 flex items-center justify-between gap-3">
              <button onClick={() => setIsManageDrawerOpen(false)} className="px-4 py-2 font-bold text-slate-600">Fechar</button>
              <button onClick={handleUpdateAffiliate} className="px-6 py-3 rounded-2xl bg-[#FF6B00] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#E66000]">Salvar Perfil</button>
            </div>
          </div>
        </div>
      )}

      {affiliateToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div><div className="text-lg font-black text-slate-900">Excluir afiliado</div><div className="text-xs uppercase tracking-widest font-black text-slate-400 mt-1">Confirmação</div></div><button onClick={() => setAffiliateToDelete(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button></div>
            <div className="p-6"><div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Deseja realmente excluir o afiliado <span className="font-black">{affiliateToDelete.customer_name}</span>?</div></div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row justify-end gap-2"><button onClick={() => setAffiliateToDelete(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold">Cancelar</button><button onClick={async () => { try { await extensionsService.deleteAffiliate(affiliateToDelete.id); setAffiliateToDelete(null); await load(searchTerm); } catch (e:any) { alert(e.message || 'Erro ao excluir afiliado'); } }} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700">Excluir afiliado</button></div>
          </div>
        </div>
      )}

    </div>
  );
}

function Field({ label, value, onChange, placeholder, readOnly }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">{label}</label>
      <input readOnly={readOnly} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} className={clsx('mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm', readOnly ? 'bg-slate-100 text-slate-600' : 'bg-slate-50')} />

      

    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><Icon className="w-4 h-4" /></div>
      <div>
        <div className="text-xs uppercase tracking-widest font-black text-slate-400">{label}</div>
        <div className="text-sm font-black text-slate-900">{value}</div>
      </div>

      

    </div>
  );
}
