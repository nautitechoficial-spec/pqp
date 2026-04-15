import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Clock3, Settings, X, CheckCircle2, ExternalLink, RefreshCw,
  Bell, AlertTriangle, Store, Package, Boxes, Tags, ArrowRight, Info, Check, Wand2
} from 'lucide-react';
import { clsx } from 'clsx';
import { extensionsService } from '@/src/services/extensionsService';

type Row = {
  provider: string;
  name: string;
  description?: string;
  status: string;
  catalog_status?: string;
  integration_id?: number | null;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_sync_message?: string | null;
  sync_catalog?: number;
  sync_orders?: number;
  sync_stock?: number;
  sync_prices?: number;
  linked_store_name?: string | null;
  connection_status?: string | null;
};

type Activity = {
  provider?: string;
  provider_name?: string;
  message?: string;
  level?: 'success'|'info'|'warning'|'error';
  created_at?: string;
};

const providerOrder = ['shopee','mercado_livre','amazon','magalu','shein','aliexpress','tiktok_shop'];
const providerMeta: Record<string, { color: string; desc: string; soon?: boolean; logo: string }> = {
  shopee: { color: 'bg-[#EE4D2D]', desc: 'Sincronize catálogo e pedidos automaticamente.', logo: 'https://cdn.simpleicons.org/shopee/EE4D2D' },
  mercado_livre: { color: 'bg-[#FFE600]', desc: 'Venda no maior marketplace da América Latina.', logo: 'https://images.seeklogo.com/logo-png/39/3/mercado-livre-logo-png_seeklogo-391236.png' },
  amazon: { color: 'bg-[#FF9900]', desc: 'Alcance milhões de clientes globais com facilidade.', logo: 'https://pngimg.com/d/amazon_PNG27.png' },
  magalu: { color: 'bg-[#0086FF]', desc: 'Integre com o ecossistema Magalu e venda mais.', logo: 'https://logodownload.org/wp-content/uploads/2014/06/magalu-logo-1.png' },
  shein: { color: 'bg-black', desc: 'Venda moda e lifestyle para todo o Brasil.', soon: true, logo: 'https://brandlogos.net/wp-content/uploads/2022/07/shein-logo_brandlogos.net_mxyew-300x300.png' },
  aliexpress: { color: 'bg-[#FF4747]', desc: 'Conecte sua loja ao mercado global.', soon: true, logo: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
  tiktok_shop: { color: 'bg-black', desc: 'Venda diretamente por vídeos curtos.', soon: true, logo: 'https://cdn.simpleicons.org/tiktok/000000' },
};

function statusLabel(row: Row) {
  if (row.status === 'connected') return 'Conectado';
  if (row.catalog_status === 'soon') return 'Em breve';
  return 'Disponível';
}

function fmtDate(v?: string | null) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR'); } catch { return String(v); }
}

function Dot({ level = 'info' }: { level?: string }) {
  return <span className={clsx('mt-1.5 w-2 h-2 rounded-full shrink-0', level === 'success' && 'bg-emerald-500', level === 'warning' && 'bg-orange-500', level === 'error' && 'bg-red-500', (!level || level === 'info') && 'bg-blue-500')} />;
}

export default function MarketplacesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all'|'integrated'|'available'|'soon'>('all');
  const [selected, setSelected] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({ auto_sync_enabled: 1, error_alerts_enabled: 1, mobile_notifications: 1 });
  const [form, setForm] = useState<any>({
    app_id: '', app_secret: '', environment: 'production', linked_store_name: '',
    sync_catalog: true, sync_orders: true, sync_stock: true, sync_prices: false,
    order_trigger: 'payment_confirmed', sync_frequency: '15min', status: 'installed'
  });
  const [drawerTab, setDrawerTab] = useState<'general'|'catalog'|'orders'|'stock'|'prices'>('general');

  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardProvider, setWizardProvider] = useState<Row | null>(null);
  const [wizardData, setWizardData] = useState<any>({ app_id: '', app_secret: '', sync_catalog: true, sync_orders: true, sync_stock: true, sync_prices: false, environment: 'production' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r: any = await extensionsService.getMarketplaces();
      const list = Array.isArray(r?.integrations) ? r.integrations : [];
      list.sort((a: Row, b: Row) => (providerOrder.indexOf(a.provider) - providerOrder.indexOf(b.provider)) || a.name.localeCompare(b.name));
      setRows(list);
      setActivities(Array.isArray(r?.activities) ? r.activities : []);
      setSettings(r?.settings || { auto_sync_enabled: 1, error_alerts_enabled: 1, mobile_notifications: 1 });
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar marketplaces');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.trim().toLowerCase();
    const matches = !q || r.name.toLowerCase().includes(q) || String(r.provider).toLowerCase().includes(q);
    if (!matches) return false;
    if (tab === 'all') return true;
    if (tab === 'integrated') return r.status === 'connected';
    if (tab === 'available') return r.catalog_status !== 'soon' && r.status !== 'connected';
    if (tab === 'soon') return r.catalog_status === 'soon';
    return true;
  }), [rows, search, tab]);

  const stats = useMemo(() => ({
    total: rows.length,
    connected: rows.filter(r => r.status === 'connected').length,
    pending: rows.filter(r => r.catalog_status !== 'soon' && r.status !== 'connected').length,
    soon: rows.filter(r => r.catalog_status === 'soon').length,
  }), [rows]);

  const openManage = async (row: Row) => {
    setSelected(row);
    setDrawerTab('general');
    setForm({
      provider: row.provider,
      app_id: '', app_secret: '', linked_store_name: row.linked_store_name || '', environment: 'production',
      sync_catalog: !!row.sync_catalog, sync_orders: !!row.sync_orders, sync_stock: !!row.sync_stock, sync_prices: !!row.sync_prices,
      status: row.status || 'installed', order_trigger: 'payment_confirmed', sync_frequency: '15min'
    });
    try {
      const d: any = await extensionsService.getMarketplaceDetail(row.provider);
      const i: any = d?.integration || {};
      setForm((prev: any) => ({
        ...prev,
        app_id: i.app_id || '',
        app_secret: i.app_secret || '',
        linked_store_name: i.linked_store_name || row.linked_store_name || '',
        environment: i.environment || 'production',
        sync_catalog: !!Number(i.sync_catalog ?? row.sync_catalog ?? 1),
        sync_orders: !!Number(i.sync_orders ?? row.sync_orders ?? 1),
        sync_stock: !!Number(i.sync_stock ?? row.sync_stock ?? 1),
        sync_prices: !!Number(i.sync_prices ?? row.sync_prices ?? 0),
        status: (i.connection_status === 'connected' || i.connection_status === 'authorized') ? 'connected' : (row.status || 'installed'),
      }));
    } catch {}
  };

  const saveManage = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await extensionsService.saveMarketplace({
        provider: selected.provider,
        app_id: form.app_id,
        app_secret: form.app_secret,
        linked_store_name: form.linked_store_name,
        environment: form.environment,
        sync_catalog: !!form.sync_catalog,
        sync_orders: !!form.sync_orders,
        sync_stock: !!form.sync_stock,
        sync_prices: !!form.sync_prices,
        status: form.status || 'connected',
        mark_synced: true,
        last_sync_status: 'success',
        log_level: 'success',
        log_message: `Configuração salva (${selected.name})`,
      }, 'save_connection');
      setSelected(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const saveGlobals = async (patch: any) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { await extensionsService.saveMarketplaceGlobals(next); }
    catch (e: any) { alert(e.message || 'Erro ao salvar configurações globais'); }
  };

  const startInstall = (row: Row) => {
    setWizardProvider(row);
    setWizardStep(1);
    setWizardData({ app_id: '', app_secret: '', sync_catalog: true, sync_orders: true, sync_stock: true, sync_prices: false, environment: 'production' });
    setInstallModalOpen(true);
  };

  const finishInstall = async () => {
    if (!wizardProvider) return;
    setSaving(true);
    try {
      await extensionsService.saveMarketplace({
        provider: wizardProvider.provider,
        app_id: wizardData.app_id,
        app_secret: wizardData.app_secret,
        linked_store_name: form.linked_store_name || 'Minha Loja Oficial',
        environment: wizardData.environment,
        sync_catalog: !!wizardData.sync_catalog,
        sync_orders: !!wizardData.sync_orders,
        sync_stock: !!wizardData.sync_stock,
        sync_prices: !!wizardData.sync_prices,
        status: 'connected',
        mark_synced: true,
        last_sync_status: 'success',
        log_level: 'success',
        log_message: `Integração instalada (${wizardProvider.name})`,
      }, 'save_connection');
      setInstallModalOpen(false);
      setWizardProvider(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao instalar integração');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-white pb-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full lg:w-fit overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todos' }, { id: 'integrated', label: 'Integrados' }, { id: 'available', label: 'Disponíveis' }, { id: 'soon', label: 'Em breve' }
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)} className={clsx('shrink-0 px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', tab === t.id ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full md:w-60">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar marketplace..." className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400" />
                </div>
                <button onClick={() => { const first = rows.find(r => r.catalog_status !== 'soon'); if (first) startInstall(first); }} className="px-5 py-2 rounded-2xl bg-[#FF6B00] text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:bg-[#E66000]">
                  <Plus className="w-4 h-4" /> Nova Integração
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[250px] rounded-[2rem] border border-slate-200 bg-white animate-pulse" />
              ))}
              {!loading && filtered.map((m) => {
                const meta = providerMeta[m.provider] || providerMeta.shopee;
                const isConnected = m.status === 'connected';
                const isSoon = m.catalog_status === 'soon';
                return (
                  <div key={m.provider} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden p-2"><img src={meta.logo} alt={m.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" /></div>
                      <span className={clsx('px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', isConnected && 'bg-emerald-50 border-emerald-100 text-emerald-600', !isConnected && !isSoon && 'bg-blue-50 border-blue-100 text-blue-600', isSoon && 'bg-slate-50 border-slate-100 text-slate-400')}>
                        {statusLabel(m)}
                      </span>
                    </div>
                    <h3 className="text-[30px] leading-none font-black text-slate-900 tracking-tight mb-2" style={{fontSize:'clamp(1.3rem,2vw,1.9rem)'}}>{m.name}</h3>
                    <p className="text-xs text-slate-500 font-medium min-h-[36px]">{m.description || meta.desc}</p>
                    <div className="mt-3 text-[11px] text-slate-400">{m.last_sync_at ? `Última sincronização: ${fmtDate(m.last_sync_at)}` : 'Sem sincronização ainda'}</div>

                    <div className="mt-5 flex items-center gap-2">
                      {isSoon ? (
                        <button disabled className="flex-1 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">Em breve</button>
                      ) : isConnected ? (
                        <>
                          <button onClick={() => openManage(m)} className="flex-1 py-3 rounded-2xl bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#E66000]">Gerenciar</button>
                          <button onClick={() => openManage(m)} className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500"><Settings className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startInstall(m)} className="flex-1 py-3 rounded-2xl bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#E66000]">Instalar</button>
                          <button onClick={() => openManage(m)} className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700">Detalhes</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Atividade recente</h3>
                <Clock3 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {activities.length === 0 && <div className="text-sm text-slate-400">Nenhuma atividade registrada.</div>}
                {activities.slice(0, 6).map((a, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex gap-2">
                      <Dot level={a.level} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 break-words">{a.message || 'Atividade de integração'}</div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-1">{a.provider_name || a.provider || 'Marketplace'} • {fmtDate(a.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-5">Configurações globais</h3>
              <div className="space-y-4">
                {[
                  ['auto_sync_enabled', 'Sincronização Auto', RefreshCw],
                  ['error_alerts_enabled', 'Alertas de Erro', AlertTriangle],
                  ['mobile_notifications', 'Mobile', Bell]
                ].map(([key, label, Icon]: any) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon className="w-4 h-4 text-slate-400" /> {label}</span>
                    <input type="checkbox" checked={!!Number(settings[key] ?? 1)} onChange={e => saveGlobals({ [key]: e.target.checked ? 1 : 0 })} className="h-4 w-4 rounded" />
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {installModalOpen && wizardProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-2xl">
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><Wand2 className="w-5 h-5" /></div>
                <div>
                  <div className="text-2xl font-black text-slate-900">Instalar {wizardProvider.name}</div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Passo {wizardStep} de 3</div>
                </div>
              </div>
              <button onClick={() => setInstallModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-7 space-y-6">
              {wizardStep === 1 && (
                <>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 flex gap-3">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>Para começar, você precisará das credenciais de API do console do desenvolvedor do marketplace.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">App ID / Client ID</label>
                      <input value={wizardData.app_id} onChange={e => setWizardData({ ...wizardData, app_id: e.target.value })} placeholder="Insira o ID do aplicativo" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">App Secret</label>
                      <input value={wizardData.app_secret} onChange={e => setWizardData({ ...wizardData, app_secret: e.target.value })} placeholder="••••••••" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    </div>
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-sm text-slate-700">Sincronizar catálogo</span><input type="checkbox" checked={wizardData.sync_catalog} onChange={e => setWizardData({ ...wizardData, sync_catalog: e.target.checked })} /></label>
                    <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-sm text-slate-700">Importar pedidos</span><input type="checkbox" checked={wizardData.sync_orders} onChange={e => setWizardData({ ...wizardData, sync_orders: e.target.checked })} /></label>
                    <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-sm text-slate-700">Atualizar estoque</span><input type="checkbox" checked={wizardData.sync_stock} onChange={e => setWizardData({ ...wizardData, sync_stock: e.target.checked })} /></label>
                    <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-sm text-slate-700">Sincronizar preços</span><input type="checkbox" checked={wizardData.sync_prices} onChange={e => setWizardData({ ...wizardData, sync_prices: e.target.checked })} /></label>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Ambiente</label>
                    <select value={wizardData.environment} onChange={e => setWizardData({ ...wizardData, environment: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <option value="production">Produção</option>
                      <option value="sandbox">Sandbox</option>
                    </select>
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-700">Tudo pronto para finalizar</div>
                      <div className="text-sm text-emerald-700/80">Revise as configurações abaixo e conclua a integração.</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Marketplace</span><span className="font-semibold text-slate-900">{wizardProvider.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Ambiente</span><span className="font-semibold text-slate-900">{wizardData.environment === 'production' ? 'Produção' : 'Sandbox'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Módulos ativos</span><span className="font-semibold text-slate-900">{['sync_catalog','sync_orders','sync_stock','sync_prices'].filter(k => wizardData[k]).length}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-7 py-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <button onClick={() => wizardStep === 1 ? setInstallModalOpen(false) : setWizardStep(wizardStep - 1)} className="px-5 py-2 rounded-xl text-slate-600 font-bold">{wizardStep === 1 ? 'Cancelar' : 'Voltar'}</button>
              <button disabled={saving} onClick={() => wizardStep < 3 ? setWizardStep(wizardStep + 1) : finishInstall()} className="px-6 py-3 rounded-2xl bg-[#FF6B00] text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 hover:bg-[#E66000] shadow-lg shadow-orange-500/20 disabled:opacity-60">
                {wizardStep < 3 ? <>Próximo <ArrowRight className="w-4 h-4" /></> : (saving ? 'Salvando...' : 'Concluir instalação')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex justify-end">
          <div className="w-full max-w-[420px] md:max-w-[460px] h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><RefreshCw className="w-4 h-4" /></div>
                <div className="text-xl font-black text-slate-900">Gerenciar Sincronização</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden p-2"><img src={(providerMeta[selected.provider] || providerMeta.shopee).logo} alt={selected.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" /></div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{selected.name}</div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Última checagem: {selected.last_sync_at ? fmtDate(selected.last_sync_at) : 'há poucos minutos'}</div>
                </div>
              </div>
            </div>

            <div className="px-4 border-b border-slate-100">
              <div className="grid grid-cols-5 text-center">
                {[
                  ['general', 'Geral', Settings],
                  ['catalog', 'Catálogo', Package],
                  ['orders', 'Pedidos', Store],
                  ['stock', 'Estoque', Boxes],
                  ['prices', 'Preços', Tags],
                ].map(([id, label, Icon]: any) => (
                  <button key={id} onClick={() => setDrawerTab(id)} className={clsx('py-4 px-1 border-b-2 transition-colors', drawerTab === id ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-400 hover:text-slate-700')}>
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {drawerTab === 'general' && (
                <>
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{form.status === 'connected' ? 'Conexão Ativa' : 'Aguardando configuração'}</div>
                      <div className="text-xs text-slate-500">Loja: {form.linked_store_name || 'Minha Loja Oficial'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Última sincronização</div>
                      <div className="text-xs font-semibold text-slate-700">{selected.last_sync_at ? fmtDate(selected.last_sync_at) : 'há 12 minutos'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Sincronizar Agora</button>
                    <button className="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Testar Conexão</button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Frequência de atualização</label>
                    <select value={form.sync_frequency || '15min'} onChange={e => setForm({ ...form, sync_frequency: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <option value="5min">A cada 5 minutos</option>
                      <option value="15min">A cada 15 minutos (Recomendado)</option>
                      <option value="30min">A cada 30 minutos</option>
                      <option value="60min">A cada 1 hora</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">App ID</label>
                      <input value={form.app_id || ''} onChange={e => setForm({ ...form, app_id: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">App Secret</label>
                      <input value={form.app_secret || ''} onChange={e => setForm({ ...form, app_secret: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Loja vinculada</label>
                      <input value={form.linked_store_name || ''} onChange={e => setForm({ ...form, linked_store_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'catalog' && (
                <div className="space-y-4">
                  <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-slate-800">Sincronizar Catálogo</span><input type="checkbox" checked={!!form.sync_catalog} onChange={e => setForm({ ...form, sync_catalog: e.target.checked })} /></label>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">Novos produtos do marketplace podem ser mapeados com as categorias da sua loja após a sincronização inicial.</div>
                </div>
              )}

              {drawerTab === 'orders' && (
                <div className="space-y-4">
                  <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-slate-800">Importar Pedidos</span><input type="checkbox" checked={!!form.sync_orders} onChange={e => setForm({ ...form, sync_orders: e.target.checked })} /></label>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Gatilho de criação</label>
                    <select value={form.order_trigger || 'payment_confirmed'} onChange={e => setForm({ ...form, order_trigger: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <option value="payment_confirmed">Ao confirmar pagamento</option>
                      <option value="created">Ao criar pedido no marketplace</option>
                      <option value="shipped">Ao enviar pedido</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">Pedidos importados podem ser marcados com a tag do marketplace para facilitar sua gestão.</div>
                </div>
              )}

              {drawerTab === 'stock' && (
                <div className="space-y-4">
                  <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-slate-800">Sincronizar Estoque</span><input type="checkbox" checked={!!form.sync_stock} onChange={e => setForm({ ...form, sync_stock: e.target.checked })} /></label>
                  <div className="text-sm text-slate-500 rounded-2xl border border-slate-200 p-4">Recomendado manter ativo para evitar ruptura de estoque em canais integrados.</div>
                </div>
              )}

              {drawerTab === 'prices' && (
                <div className="space-y-4">
                  <label className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between"><span className="font-semibold text-slate-800">Sincronizar Preços</span><input type="checkbox" checked={!!form.sync_prices} onChange={e => setForm({ ...form, sync_prices: e.target.checked })} /></label>
                  <div className="rounded-2xl border border-slate-200 p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Ambiente</label>
                      <select value={form.environment || 'production'} onChange={e => setForm({ ...form, environment: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="production">Produção</option>
                        <option value="sandbox">Sandbox</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Status</label>
                      <select value={form.status || 'installed'} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="installed">Instalado</option>
                        <option value="connected">Conectado</option>
                        <option value="paused">Pausado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-5 flex items-center justify-between gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-slate-600 font-bold">Cancelar</button>
              <button disabled={saving} onClick={saveManage} className="px-6 py-3 rounded-2xl bg-[#FF6B00] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#E66000] disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar configurações'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
