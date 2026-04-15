import { Search, Bell, Moon, Sun, ChevronDown, Menu, AlertCircle, ShoppingBag, X, Loader2, ReceiptText, LifeBuoy, FileText, CreditCard, WalletCards, Zap, MoreVertical } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import * as React from "react";
import { useState, useEffect } from "react";
import { dashboardService } from "@/src/services/dashboardService";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const tabMeta: Record<string, { title: string; parent?: string }> = {
  dashboard: { title: 'Dashboard' }, orders: { title: 'Pedidos' }, products: { title: 'Produtos' }, customers: { title: 'Clientes' }, wallet: { title: 'Carteira' }, reports: { title: 'Relatórios' }, shipping: { title: 'Frete' }, categories: { title: 'Categorias' }, collections: { title: 'Coleções' }, affiliates: { title: 'Afiliados' }, marketplaces: { title: 'Marketplaces' }, plans: { title: 'Planos' }, settings: { title: 'Configurações' }, invoices: { title: 'Faturas e Cobranças', parent: 'Financeiro' }, 'invoice-detail': { title: 'Detalhe da Fatura', parent: 'Financeiro' }, 'nota-fiscal': { title: 'Notas Fiscais', parent: 'Financeiro' }, 'meus-cartoes': { title: 'Cartões', parent: 'Financeiro' }, support: { title: 'Suporte' }
};

export function Topbar({ isDark, toggleTheme, onMenuClick, user, activeTab, onTabChange, onTutorialClick, tutorialActive, mobileQuickActionsOpen, setMobileQuickActionsOpen }: { isDark: boolean; toggleTheme: () => void; onMenuClick: () => void; user: any; activeTab?: string; onTabChange?: (tab: string) => void; onTutorialClick?: () => void; tutorialActive?: boolean; mobileQuickActionsOpen?: boolean; setMobileQuickActionsOpen?: (value: boolean) => void; }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpenInvoices, setHasOpenInvoices] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const storeName = user?.subdomain || user?.store_name || 'minha-loja';
  const storeStatus = parseInt(user?.store_active ?? 0);

  const resolveStoreUrl = () => {
    const explicitUrl = String(user?.store_url || '').trim();
    if (/^https?:\/\//i.test(explicitUrl)) return explicitUrl;

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'minhabagg.com.br';
    const cleanHost = currentHost.replace(/^www\./i, '');
    const hostWithoutPanel = cleanHost.replace(/^painel\./i, '');

    const parts = hostWithoutPanel.split('.').filter(Boolean);
    let baseDomain = hostWithoutPanel;
    if (parts.length >= 3 && parts.slice(-2).join('.') === 'com.br') {
      baseDomain = parts.slice(-3).join('.');
    } else if (parts.length >= 2) {
      baseDomain = parts.slice(-2).join('.');
    }

    return `https://${storeName}.${baseDomain}`;
  };

  const storeUrl = resolveStoreUrl();
  const meta = tabMeta[activeTab || 'dashboard'] || { title: 'Painel' };

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const reports = await dashboardService.getReports();
      const ordersResp = await dashboardService.getOrders();
      const openInvoices = (await dashboardService.getInvoices().catch(()=>[])).filter((o:any)=> String(o.status||'').toUpperCase()==='PENDING');
      setHasOpenInvoices(openInvoices.length > 0);
      const newAlerts:any[] = [];
      if (reports?.lowStock?.length) reports.lowStock.slice(0,3).forEach((item:any)=> newAlerts.push({ id:`stock-${item.name}-${item.variation}`, title:'Estoque baixo', description:`${item.name} (${item.variation}) com ${item.stock} un.`, type:'warning', icon: AlertCircle }));
      const pending = (ordersResp?.orders||[]).filter((o:any)=> o.status?.trim().toLowerCase()==='pending');
      if (pending.length) newAlerts.push({ id:'pending-orders', title:'Pedidos pendentes', description:`${pending.length} aguardando pagamento.`, type:'info', icon: ShoppingBag });
      setAlerts(newAlerts);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };
  useEffect(()=>{ fetchAlerts(); const it=setInterval(fetchAlerts, 300000); return ()=>clearInterval(it); },[]);
  useEffect(()=>{ const onEsc=(e:KeyboardEvent)=>{ if(e.key==='Escape'){ setShowFinanceMenu(false); setShowNotifications(false); setShowProfile(false);} }; window.addEventListener('keydown', onEsc); return ()=>window.removeEventListener('keydown', onEsc);},[]);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Button id="btn-mobile-menu" variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden"><Menu className="h-5 w-5" /></Button>
          <div id="header-main" className="min-w-0">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Painel</span>{meta.parent && <><span>/</span><span>{meta.parent}</span></>}
            </div>
            <h1 className="truncate text-sm sm:text-base md:text-lg font-black tracking-tight">{meta.title}</h1>
          </div>
          <div className="hidden md:flex w-56 lg:w-80 items-center gap-2 rounded-xl bg-muted/50 px-3 py-1.5 ml-2 focus-within:ring-2 focus-within:ring-brand/20">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar no painel..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden xl:flex items-center gap-3 border-r pr-3">
            <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
              {storeStatus === 1 ? <Badge variant="success" className="h-6 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{storeName}</Badge> : <Badge variant="warning" className="h-6 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{storeName}</Badge>}
            </a>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button id="btn-tutorial-trigger-desktop" onClick={()=>onTutorialClick?.()} className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors", tutorialActive ? "border-brand/40 bg-brand/5 text-brand shadow-sm" : "border-border/40 bg-card/60 hover:border-brand/30 hover:text-brand")}><Zap className="h-4 w-4 text-brand" /> <span className="hidden md:inline">Tutorial</span></button>
            <button onClick={()=>onTabChange?.('support')} className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-card/60 px-3 py-2 text-xs font-bold hover:border-brand/30 hover:text-brand transition-colors"><LifeBuoy className="h-4 w-4 text-brand" /> <span className="hidden md:inline">Suporte</span></button>
            <div className="relative">
              <button onClick={()=>setShowFinanceMenu(v=>!v)} className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors", showFinanceMenu ? "border-brand/30 bg-brand/5 text-brand" : "border-border/40 bg-card/60 hover:border-brand/20") }>
                <ReceiptText className="h-4 w-4 text-brand" /> <span className="hidden md:inline">Financeiro</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFinanceMenu && "rotate-180")} />
                {hasOpenInvoices && <span className="h-2 w-2 rounded-full bg-red-500" />}
              </button>
              <AnimatePresence>{showFinanceMenu && <><div className="fixed inset-0 z-40" onClick={()=>setShowFinanceMenu(false)} /><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} className="absolute right-0 mt-2 w-72 z-50 rounded-2xl border border-border/40 bg-card shadow-2xl p-2">
                {[{id:'invoices', label:'Faturas e Cobranças', desc:'Pague e acompanhe cobranças', icon:ReceiptText},{id:'nota-fiscal', label:'Notas Fiscais', desc:'Baixar e consultar notas', icon:FileText},{id:'meus-cartoes', label:'Cartões', desc:'Gerenciar cartões salvos', icon:WalletCards}].map(item=> (
                  <button key={item.id} onClick={()=>{onTabChange?.(item.id); setShowFinanceMenu(false);}} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-all flex items-start gap-3">
                    <item.icon className="h-4 w-4 mt-0.5 text-brand" />
                    <div className="min-w-0"><div className="text-xs font-bold text-foreground">{item.label}</div><div className="text-[10px] text-muted-foreground">{item.desc}</div></div>
                  </button>
                ))}
              </motion.div></>}</AnimatePresence>
            </div>
          </div>

          <button id="btn-tutorial-trigger-mobile" onClick={()=>onTutorialClick?.()} className={cn("inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-full border transition-colors", tutorialActive ? "border-brand/40 bg-brand/5 text-brand" : "border-border/40 bg-card/60 hover:border-brand/30 hover:text-brand")}><Zap className="h-4 w-4 text-brand" /></button>

          <Button id="btn-theme-toggle" variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full">{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>

          <div className="relative">
            <Button id="btn-notifications" variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", showNotifications && "bg-muted")} onClick={()=>setShowNotifications(v=>!v)}><Bell className="h-4 w-4" /></Button>
            {alerts.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />}
            <AnimatePresence>{showNotifications && <><div className="fixed inset-0 z-40" onClick={()=>setShowNotifications(false)} /><motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.98}} className="absolute right-0 mt-2 w-80 z-50 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden"><div className="p-4 border-b border-border/40 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest">Notificações</h3><Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>setShowNotifications(false)}><X className="h-3 w-3" /></Button></div><div className="max-h-[360px] overflow-y-auto divide-y divide-border/20">{isLoading && <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-brand mx-auto"/></div>}{!isLoading && alerts.length===0 && <div className="p-8 text-center text-xs text-muted-foreground">Tudo limpo por aqui!</div>}{alerts.map(a=><div key={a.id} className="p-4 flex gap-3"><div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", a.type==='warning' ? 'bg-amber-500/10 text-amber-600':'bg-blue-500/10 text-blue-600')}><a.icon className="h-4 w-4"/></div><div><p className="text-xs font-bold">{a.title}</p><p className="text-[10px] text-muted-foreground">{a.description}</p></div></div>)}</div></motion.div></>}</AnimatePresence>
          </div>

          <div className="relative lg:hidden">
            <Button id="btn-more-actions" variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", mobileQuickActionsOpen && "bg-muted")} onClick={()=>setMobileQuickActionsOpen?.(!mobileQuickActionsOpen)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            <AnimatePresence>{mobileQuickActionsOpen && <><div className="fixed inset-0 z-40" onClick={()=>setMobileQuickActionsOpen?.(false)} /><motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.98}} id="mobile-quick-actions-panel" className="absolute right-0 mt-2 w-56 z-50 rounded-2xl border border-border/40 bg-card shadow-2xl p-2">
              <button onClick={()=>{onTutorialClick?.(); setMobileQuickActionsOpen?.(false);}} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-all flex items-center gap-3 text-xs font-bold"><Zap className="h-4 w-4 text-brand" />Tutorial</button>
              <button onClick={()=>{onTabChange?.('support'); setMobileQuickActionsOpen?.(false);}} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-all flex items-center gap-3 text-xs font-bold"><LifeBuoy className="h-4 w-4 text-brand" />Suporte</button>
              <button onClick={()=>{onTabChange?.('invoices'); setMobileQuickActionsOpen?.(false);}} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-all flex items-center gap-3 text-xs font-bold"><ReceiptText className="h-4 w-4 text-brand" />Financeiro</button>
              <button onClick={()=>{onTabChange?.('settings'); setMobileQuickActionsOpen?.(false);}} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-all flex items-center gap-3 text-xs font-bold"><CreditCard className="h-4 w-4 text-brand" />Configurações</button>
            </motion.div></>}</AnimatePresence>
          </div>

          <div className="relative hidden sm:block">
            <button onClick={()=>setShowProfile(v=>!v)} className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/60 px-2 py-1.5 hover:border-brand/20">
              <div className="h-7 w-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">{firstName.charAt(0)}</div>
              <span className="hidden md:block text-xs font-bold">{firstName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>{showProfile && <><div className="fixed inset-0 z-40" onClick={()=>setShowProfile(false)} /><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} className="absolute right-0 mt-2 w-48 z-50 rounded-xl border border-border/40 bg-card shadow-xl p-1"><button onClick={()=>{onTabChange?.('settings'); setShowProfile(false);}} className="w-full text-left rounded-lg px-3 py-2 text-xs font-bold hover:bg-muted/30">Configurações</button><button onClick={()=>setShowProfile(false)} className="w-full text-left rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted/30">Fechar</button></motion.div></>}</AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
