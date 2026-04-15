import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "@/src/components/Dashboard/Sidebar";
import { Topbar } from "@/src/components/Dashboard/Topbar";
import { StatsGrid } from "@/src/components/Dashboard/StatsGrid";
import { MainChart } from "@/src/components/Dashboard/MainChart";
import { TopProducts } from "@/src/components/Dashboard/TopProducts";
import { RecentOrders } from "@/src/components/Dashboard/RecentOrders";
import OrdersPage from "@/src/components/Dashboard/OrdersPage";
import { CustomersPage } from "@/src/components/Dashboard/CustomersPage";
import { WalletPage } from "@/src/components/Dashboard/WalletPage";
import ProductsPage from "@/src/components/Dashboard/ProductsPage";
import { ReportsPage } from "@/src/components/Dashboard/ReportsPage";
import { SettingsPage } from "@/src/components/Dashboard/SettingsPage";
import { LandingPage } from "@/src/components/Auth/LandingPage";
import { LoginPage } from "@/src/components/Auth/LoginPage";
import { RegisterPage } from "@/src/components/Auth/RegisterPage";
import { Card, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Loader2, AlertCircle, LayoutDashboard, ShoppingBag, Users, Wallet, Package, Settings, LogOut, FileText, Rocket } from "lucide-react";
import { dashboardService, DashboardData } from "@/src/services/dashboardService";
import { authService } from "@/src/services/authService";
import { cn } from "@/src/lib/utils";
import { readStoredAffiliate, trackAffiliateVisit } from "@/src/lib/platformAffiliate";

import { PlansPage } from "@/src/components/Auth/PlansPage";
import { PaymentPage } from "@/src/components/Auth/PaymentPage";
import { DashboardWarning } from "@/src/components/Dashboard/DashboardWarning";
import { DashboardPlansPage } from "@/src/components/Dashboard/DashboardPlansPage";
import { InvoicesPage } from "@/src/components/Dashboard/InvoicesPage";
import { InvoiceDetailPage } from "@/src/components/Dashboard/InvoiceDetailPage";
import FretePage from "@/src/components/Dashboard/extensions/FretePage";
import CategoriasPage from "@/src/components/Dashboard/extensions/CategoriasPage";
import ColecoesPage from "@/src/components/Dashboard/extensions/ColecoesPage";
import AfiliadosPage from "@/src/components/Dashboard/extensions/AfiliadosPage";
import MarketplacesPage from "@/src/components/Dashboard/extensions/MarketplacesPage";
import { SupportPage } from "@/src/components/Dashboard/SupportPage";
import { NotaFiscalPage } from "@/src/components/Dashboard/NotaFiscalPage";
import { MeusCartoesPage } from "@/src/components/Dashboard/MeusCartoesPage";
import { DashboardTutorial } from "@/src/components/Dashboard/DashboardTutorial";
import { getDashboardTutorialSteps } from "@/src/components/Dashboard/tutorialSteps";

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'payment'>('landing');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>();
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<'today' | '7d' | '30d' | '90d'>('7d');
  const [showTutorial, setShowTutorial] = useState(false);
  const [affiliateContext, setAffiliateContext] = useState<any>(null);
  const [mobileQuickActionsOpen, setMobileQuickActionsOpen] = useState(false);
  const [isMobileTutorialViewport, setIsMobileTutorialViewport] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const tutorialSteps = React.useMemo(() => getDashboardTutorialSteps(isMobileTutorialViewport), [isMobileTutorialViewport]);

  const getStoreUrl = React.useCallback(() => {
    const sub = String(user?.subdomain || '').trim();
    if (!sub) return '';
    if (typeof window === 'undefined') return `https://${sub}.minhabagg.com.br`;
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return `${window.location.origin.replace(/:\d+$/, '')}/${sub}`;
    return `https://${sub}.minhabagg.com.br`;
  }, [user]);

  // Periodic check for store status if inactive
  useEffect(() => {
    let interval: any;
    if (user && user.store_active === 0) {
      interval = setInterval(async () => {
        try {
          const res = await authService.checkStatus(user.store_id);
          if (res.success && res.active === 1) {
            const updatedUser = { ...user, store_active: 1 };
            authService.saveUser(updatedUser);
            setUser(updatedUser);
            if (view === 'payment') setView('dashboard');
            setShowWelcome(true);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Status check error:", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [user, view]);

  // Check auth on mount
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      setUser(savedUser);
      setView('dashboard');
    }
    setIsLoading(false);
  }, []);


  useEffect(() => {
    trackAffiliateVisit()
      .then((ctx) => setAffiliateContext(ctx || readStoredAffiliate()))
      .catch(() => setAffiliateContext(readStoredAffiliate()));
  }, []);
  const handleLoginSuccess = (userData: any) => {
    authService.saveUser(userData);
    setUser(userData);
    
    if (userData.store_active === 0) {
      setPendingOrder(userData.pending_order);
      if (userData.isFirstLogin) {
        setView('payment');
        return;
      }
    }

    setView('dashboard');
    if (userData.isFirstLogin && userData.store_active === 1) {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView('landing');
  };

  const fetchDashboardData = async (period: 'today' | '7d' | '30d' | '90d' = dashboardPeriod) => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch dashboard summary and full orders list for accurate calculations
      const [summary, ordersResp] = await Promise.all([
        dashboardService.getDashboardData(period),
        dashboardService.getOrders()
      ]);

      const orders = ordersResp.orders;
      const paidOrders = orders.filter(o => o.status?.trim().toLowerCase() === 'paid');
      const pendingOrders = orders.filter(o => o.status?.trim().toLowerCase() === 'pending');
      const revenue = paidOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);

      setDashboardData({
        ...summary,
        totalSales: summary.paidOrders ?? paidOrders.length,
        totalOrders: summary.totalOrders ?? orders.length,
        openOrders: summary.openOrders ?? pendingOrders.length,
        revenue: summary.revenue ?? revenue,
        recentOrders: summary.recentOrders
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com a API. Verifique se o XAMPP está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'dashboard' && activeTab === "dashboard") {
      fetchDashboardData(dashboardPeriod);
    }
  }, [activeTab, view, dashboardPeriod]);


  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab, view]);
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobileTutorialViewport(window.innerWidth < 1024);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  if (view === 'landing') {
    return (
      <LandingPage 
        onLoginClick={() => setView('login')} 
        onRegisterClick={() => setView('register')} 
        onSelectPlan={(planId) => {
          setSelectedPlanId(planId);
          setView('register');
        }}
      />
    );
  }

  if (view === 'login') {
    return <LoginPage onBack={() => setView('landing')} onSuccess={handleLoginSuccess} />;
  }

  if (view === 'payment') {
    return (
      <PaymentPage 
        order={pendingOrder} 
        user={user}
        onPaid={() => {
          const updatedUser = { ...user, store_active: 1 };
          authService.saveUser(updatedUser);
          setUser(updatedUser);
          setView('dashboard');
          setShowWelcome(true);
        }} 
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterPage 
        onBack={() => setView('landing')} 
        onSuccess={handleLoginSuccess}
        initialPlanId={selectedPlanId}
        affiliateContext={affiliateContext}
      />
    );
  }

  const renderContent = () => {
    const isBlocked = user?.store_active === 0;

    const wrapWithWarning = (content: React.ReactNode, tabId: string) => (
      <div className="space-y-8">
        {isBlocked && (
          <DashboardWarning onAction={() => setActiveTab('invoices')} />
        )}
        <div className={cn(
          "transition-all duration-500",
          isBlocked && tabId !== 'invoices' && tabId !== 'invoice-detail' && "opacity-40 pointer-events-none grayscale-[0.5]"
        )}>
          {content}
        </div>
      </div>
    );

    if (activeTab === "orders") {
      return wrapWithWarning(<OrdersPage isBlocked={isBlocked} initialOrderId={selectedOrderId ?? pendingOrder?.id} onOrderHandled={() => { setPendingOrder(null); setSelectedOrderId(null); }} />, "orders");
    }

    if (activeTab === "customers") {
      return wrapWithWarning(<CustomersPage isBlocked={isBlocked} />, "customers");
    }

    if (activeTab === "wallet") {
      return wrapWithWarning(<WalletPage isBlocked={isBlocked} />, "wallet");
    }

    if (activeTab === "products") {
      return wrapWithWarning(<ProductsPage isBlocked={isBlocked} />, "products");
    }

    if (activeTab === "reports") {
      return wrapWithWarning(<ReportsPage isBlocked={isBlocked} />, "reports");
    }

    if (activeTab === "settings") {
      return wrapWithWarning(<SettingsPage user={user} onNavigate={setActiveTab} />, "settings");
    }


    if (activeTab === "shipping") {
      return wrapWithWarning(<FretePage />, "shipping");
    }

    if (activeTab === "categories") {
      return wrapWithWarning(<CategoriasPage />, "categories");
    }

    if (activeTab === "collections") {
      return wrapWithWarning(<ColecoesPage />, "collections");
    }

    if (activeTab === "affiliates") {
      return wrapWithWarning(<AfiliadosPage />, "affiliates");
    }

    if (activeTab === "marketplaces") {
      return wrapWithWarning(<MarketplacesPage />, "marketplaces");
    }
    if (activeTab === "plans") {
      return wrapWithWarning(
        <DashboardPlansPage 
          user={user} 
          onUpgrade={(orderId) => {
            if (orderId) {
              setPendingOrder({ id: orderId });
              setActiveTab('invoice-detail');
            } else {
              setActiveTab('invoices');
            }
          }} 
        />, 
        "plans"
      );
    }

    if (activeTab === "invoices") {
      return wrapWithWarning(
        <InvoicesPage onSelectInvoice={(id) => {
          setPendingOrder({ id });
          setActiveTab('invoice-detail');
        }} />,
        "invoices"
      );
    }

    if (activeTab === "invoice-detail") {
      return wrapWithWarning(<InvoiceDetailPage orderId={pendingOrder?.id} onBack={() => setActiveTab('invoices')} />, "invoice-detail");
    }

    if (activeTab === "nota-fiscal") {
      return wrapWithWarning(<NotaFiscalPage />, "nota-fiscal");
    }

    if (activeTab === "meus-cartoes") {
      return wrapWithWarning(<MeusCartoesPage />, "meus-cartoes");
    }

    if (activeTab === "support") {
      return wrapWithWarning(<SupportPage onNavigate={setActiveTab} />, "support");
    }

    return wrapWithWarning(
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-8"
      >


        <StatsGrid data={dashboardData} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <MainChart data={dashboardData?.chartData} period={dashboardPeriod} onPeriodChange={setDashboardPeriod} />
          <TopProducts data={dashboardData?.topProducts} />
        </div>

        <RecentOrders 
          data={dashboardData?.recentOrders} 
          onViewAll={() => setActiveTab('orders')} 
          onViewOrder={(orderId) => { setSelectedOrderId(orderId); setPendingOrder({ id: orderId }); setActiveTab('orders'); }}
        />
      </motion.div>,
      "dashboard"
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/30">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(id) => {
          if (id === 'personalize-store') {
            const url = getStoreUrl();
            if (url && typeof window !== 'undefined') {
              window.open(`${url}${url.includes('?') ? '&' : '?'}editor=1`, '_blank', 'noopener,noreferrer');
            }
            setIsSidebarOpen(false);
            return;
          }
          setActiveTab(id);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="transition-all duration-300 lg:pl-64">
        <Topbar 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTutorialClick={() => setShowTutorial(true)}
          tutorialActive={showTutorial}
          mobileQuickActionsOpen={mobileQuickActionsOpen}
          setMobileQuickActionsOpen={setMobileQuickActionsOpen}
        />
        
        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-[80vh] flex-col items-center justify-center gap-4"
              >
                <Loader2 className="h-10 w-10 animate-spin text-brand" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Conectando ao banco de dados...
                </p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center"
              >
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold">Ops! Algo deu errado</h2>
                <p className="max-w-md text-muted-foreground">{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="mt-2 rounded-xl bg-brand px-6 py-2 font-bold text-white shadow-lg shadow-brand/20 transition-all active:scale-95"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            ) : (
              renderContent()
            )}
          </AnimatePresence>

      <DashboardTutorial
        open={showTutorial}
        steps={tutorialSteps}
        onClose={() => {
          setShowTutorial(false);
          setIsSidebarOpen(false);
          setMobileQuickActionsOpen(false);
        }}
        onStepRender={(step) => {
          if (step.beforeFocus === 'open-sidebar') {
            setIsSidebarOpen(true);
            setMobileQuickActionsOpen(false);
          }
          if (step.beforeFocus === 'close-sidebar') {
            setIsSidebarOpen(false);
          }
          if (step.beforeFocus === 'open-more-actions') {
            setMobileQuickActionsOpen(true);
            setIsSidebarOpen(false);
          }
          if (step.beforeFocus === 'close-more-actions') {
            setMobileQuickActionsOpen(false);
          }
        }}
      />
        </div>

        <footer className="mt-auto border-t py-6 px-8 text-center text-xs text-muted-foreground">
          &copy; 2026 Nexus Admin. Conectado ao MySQL via PHP PDO.
        </footer>
      </main>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWelcome(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/10 rounded-full -ml-16 -mb-16 blur-2xl" />

              <div className="relative z-10 text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-brand/10 flex items-center justify-center">
                  <Rocket className="h-10 w-10 text-brand" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Parabéns, {user?.name?.split(' ')[0] || 'loja'}
                  </h2>
                  <p className="text-lg font-bold text-brand">Seu painel já está liberado para uso.</p>
                </div>

                <div className="space-y-4 text-slate-500 font-medium leading-relaxed">
                  <p>Seu pagamento foi confirmado e sua loja já está ativa. Agora você pode configurar sua operação e acessar a vitrine da sua loja.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button 
                    onClick={() => { setShowWelcome(false); setShowTutorial(true); }}
                    className="w-full h-14 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all"
                  >
                    Acessar painel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = getStoreUrl();
                      if (url && typeof window !== 'undefined') window.open(url, '_blank');
                    }}
                    className="w-full h-14 rounded-2xl font-black"
                  >
                    Ver minha loja
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
