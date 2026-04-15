import * as React from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Zap,
  Wallet,
  ShoppingBag as BagIcon,
  Truck,
  Layers,
  Library,
  Share2,
  CreditCard,
  LifeBuoy,
  Crown,
  Wand2
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: ShoppingBag, label: "Pedidos", id: "orders" },
  { icon: Package, label: "Produtos", id: "products" },
  { icon: Users, label: "Clientes", id: "customers" },
  { icon: Wallet, label: "Carteira", id: "wallet" },
  { icon: BarChart3, label: "Relatórios", id: "reports" },
  { icon: Truck, label: "Frete", id: "shipping" },
  { icon: Layers, label: "Categorias", id: "categories" },
  { icon: Library, label: "Coleções", id: "collections" },
  { icon: Share2, label: "Afiliados", id: "affiliates" },
  { icon: Zap, label: "Marketplaces", id: "marketplaces" },
  { icon: Crown, label: "Planos", id: "plans" },
  { icon: Wand2, label: "Personalizar loja", id: "personalize-store" },
  { icon: LifeBuoy, label: "Suporte", id: "support" },
  { icon: Settings, label: "Configurações", id: "settings" },
];

export function Sidebar({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose,
  user,
  onLogout
}: { 
  activeTab: string, 
  onTabChange: (id: string) => void,
  isOpen: boolean,
  onClose: () => void,
  user: any,
  onLogout: () => void
}) {
  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const currentPlan = user?.plan_name || 'Starter';

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside id="dashboard-sidebar" className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/30">
            <BagIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Bagg<span className="text-brand">Panel</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => !item.comingSoon && onTabChange(item.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  isActive 
                    ? "bg-brand/10 text-brand" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  item.comingSoon && "cursor-not-allowed opacity-70"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-brand" : "group-hover:text-foreground"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.comingSoon && (
                  <span className="rounded-full bg-brand/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-brand/60 border border-brand/10">
                    Em breve
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 h-6 w-1 rounded-r-full bg-brand"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-6 space-y-4">
          {/* Current Plan Section */}
          <div className="px-3 py-3 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plano Atual</span>
                <button onClick={() => onTabChange('plans')} className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-brand/15">
                  Upgrade
                </button>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate">{currentPlan}</p>
                <p className="text-[10px] text-slate-500">Uso do plano (estimativa)</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Produtos</span><span>42%</span></div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full w-[42%] bg-gradient-to-r from-brand to-orange-400" /></div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Pedidos / mês</span><span>Ilimitado</span></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-brand">
              {firstName.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{firstName}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
