import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  ShoppingBag, 
  ArrowRight, 
  Shield, 
  BarChart3, 
  Layout, 
  Smartphone, 
  CreditCard, 
  Truck, 
  PieChart, 
  Users2, 
  Headphones,
  Globe,
  Star,
  Check,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Rocket,
  Crown
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { API_BASE_URL } from "@/src/config/api";

interface PlanFeature { text?: string; feature_text?: string; is_highlight?: number }
interface Plan {
  id: number;
  name?: string;
  slug?: string;
  display_name: string;
  description?: string;
  headline?: string;
  summary?: string;
  badge?: string | null;
  footer_note?: string | null;
  price?: number | string;
  price_monthly?: number | null;
  price_annual_monthly_equivalent?: number | null;
  active?: number;
  is_active?: number;
  features?: (string | PlanFeature)[];
}

export function LandingPage({ 
  onLoginClick, 
  onRegisterClick,
  onSelectPlan 
}: { 
  onLoginClick: () => void, 
  onRegisterClick: () => void,
  onSelectPlan: (planId: number) => void
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/plans.php`)
      .then(res => res.json())
      .then(data => {
        // Compatível com schema antigo e novo
        const activePlans = (Array.isArray(data) ? data : [])
          .filter((p: Plan) => (p.active ?? p.is_active ?? 1) == 1)
          .sort((a: Plan, b: Plan) => Number(a.price_monthly ?? a.price ?? 0) - Number(b.price_monthly ?? b.price ?? 0));
        setPlans(activePlans);
        setIsLoadingPlans(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingPlans(false);
      });
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-brand/30 font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-lg shadow-brand/20">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Minha<span className="text-brand">Bagg</span>
            </span>
          </div>
          

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-semibold text-slate-600 hover:bg-slate-50 px-4" onClick={onLoginClick}>
              Login
            </Button>
            <Button 
              className="bg-brand text-white text-sm font-semibold rounded-full px-6 h-10 shadow-lg shadow-brand/20 hover:scale-105 transition-all active:scale-95"
              onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Cadastro
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://picsum.photos/seed/${i + 100}/24/24`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500">Escolhido por +850 lojas</span>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-slate-900">
                  Venda fácil. <br />
                  Cresça <span className="text-brand">rápido.</span>
                </h1>
                
                <p className="max-w-xl text-lg text-slate-500 leading-relaxed font-medium">
                  A infraestrutura completa para sua loja em poucos cliques. <br className="hidden md:block" />
                  Feito para empreendedores, marcas e criadores.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3 sm:gap-6"
              >
                <Button 
                  className="h-12 sm:h-14 px-4 sm:px-8 bg-brand text-white font-semibold rounded-full shadow-xl shadow-brand/30 hover:scale-105 transition-all text-sm sm:text-lg gap-2 group whitespace-nowrap"
                  onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Criar loja <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <div className="pt-8 flex items-center gap-8 opacity-40">
                <div className="flex items-center gap-2 font-bold text-lg tracking-tight"><Zap className="h-5 w-5" /> Rápido</div>
                <div className="flex items-center gap-2 font-bold text-lg tracking-tight"><Shield className="h-5 w-5" /> Seguro</div>
              </div>
            </div>

            {/* Mockups */}
            <div className="relative mt-12 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="relative z-10"
              >
                <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
                  <img 
                    src="https://i.imgur.com/YGlCXJU.png" 
                    alt="Dashboard" 
                    className="w-full rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, x: -40 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute -bottom-10 -left-10 z-20 w-1/2 hidden md:block"
              >
                <div className="rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 overflow-hidden shadow-2xl">
                  <img 
                    src="https://i.imgur.com/ngKVGrF.jpeg" 
                    alt="Mobile App" 
                    className="w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>

              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand/10 blur-[100px] rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Logo Carousel Section */}
      <section className="border-y border-slate-100 bg-slate-50/30 py-12 overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block text-center lg:text-left"
          >
            Grandes Projetos & Parceiros
          </motion.span>
        </div>
        
        <div className="flex overflow-hidden relative">
          <motion.div 
            className="flex items-center gap-16 md:gap-24 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            {[
              { icon: Globe, name: "ZapGPT" },
              { icon: Zap, name: "wplace" },
              { icon: Shield, name: "plinq" },
              { icon: Smartphone, name: "nbs." },
              { icon: Layout, name: "CloudStore" },
              { icon: Globe, name: "ZapGPT" },
              { icon: Zap, name: "wplace" },
              { icon: Shield, name: "plinq" },
              { icon: Smartphone, name: "nbs." },
              { icon: Layout, name: "CloudStore" },
              { icon: Globe, name: "ZapGPT" },
              { icon: Zap, name: "wplace" },
              { icon: Shield, name: "plinq" },
              { icon: Smartphone, name: "nbs." },
              { icon: Layout, name: "CloudStore" },
              { icon: Globe, name: "ZapGPT" },
              { icon: Zap, name: "wplace" },
              { icon: Shield, name: "plinq" },
              { icon: Smartphone, name: "nbs." },
              { icon: Layout, name: "CloudStore" }
            ].map((logo, i) => (
              <div key={i} className="flex items-center gap-3 font-black text-2xl md:text-3xl tracking-tighter text-slate-300 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                <logo.icon className="h-7 w-7 md:h-9 md:w-9 text-slate-400" /> {logo.name}
              </div>
            ))}
          </motion.div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-32 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full"
            >
              <Zap className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Preços Transparentes</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              O plano certo para o seu <span className="text-brand">crescimento.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-slate-500 font-medium">
              Escolha o plano que melhor se adapta ao seu momento. Sem taxas escondidas, sem surpresas.
            </p>
          </div>

          <div className="relative group">
            {/* Navigation Arrows */}
            <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -left-16 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => scroll('left')}
                className="h-12 w-12 rounded-full bg-white shadow-xl border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-16 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => scroll('right')}
                className="h-12 w-12 rounded-full bg-white shadow-xl border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div 
              ref={carouselRef}
              className="flex lg:grid lg:grid-cols-3 gap-8 overflow-x-auto lg:overflow-x-visible pb-8 lg:pb-0 snap-x snap-mandatory no-scrollbar scroll-smooth"
            >
              {isLoadingPlans ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Carregando planos reais...</p>
                </div>
              ) : (
                plans.map((plan, i) => {
                  const planKey = String(plan.slug || plan.name || plan.display_name || '').toLowerCase();
                  const isPopular = Boolean((plan.badge||'').toLowerCase().includes('popular')) || planKey.includes('growth') || planKey.includes('premium');
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative min-w-[300px] lg:min-w-0 snap-center p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] ${isPopular ? 'border-brand shadow-2xl shadow-brand/10 bg-white' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Mais Popular
                        </div>
                      )}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{plan.display_name}</h3>
                          <p className="text-sm text-slate-500 font-medium mt-1">{plan.headline || plan.summary || plan.description}</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900">R$ {Number(plan.price_monthly ?? plan.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-slate-400 font-bold text-sm">/mês</span>
                        </div>
                        {plan.price_annual_monthly_equivalent ? (
                          <p className="text-xs font-semibold text-brand">Anual: R$ {Number(plan.price_annual_monthly_equivalent).toLocaleString('pt-BR',{minimumFractionDigits:2})}/mês{plan.footer_note ? ` • ${plan.footer_note}` : ''}</p>
                        ) : (plan.footer_note ? <p className="text-xs font-semibold text-brand">{plan.footer_note}</p> : null)}
                        <ul className="space-y-4">
                          {((Array.isArray(plan.features) && plan.features.length ? plan.features : ['Produtos Ilimitados','Suporte 24/7','Checkout Transparente','Customização']) as any[]).slice(0,6).map((feat, j) => (
                            <li key={j} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                              <Check className="h-4 w-4 text-emerald-500" />
                              {typeof feat === 'string' ? feat : (feat.text || feat.feature_text || '')}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          onClick={() => onSelectPlan(plan.id)}
                          className={`w-full h-14 rounded-2xl font-black transition-all ${isPopular ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-slate-900 text-white'}`}
                        >
                          Começar Agora
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats and Features Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid lg:grid-cols-2 gap-20 items-center mb-32"
          >
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-brand" />
                <span className="text-xs font-bold text-brand uppercase tracking-widest">Crescimento Acelerado</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Gerenciando e impulsionando <br />
                <span className="relative inline-block">
                  muitas lojas.
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute -bottom-2 left-0 h-2 bg-brand/20 rounded-full" 
                  />
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-12 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-2"
              >
                <p className="text-5xl md:text-7xl font-black text-brand tracking-tighter">+ 2M</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-60">Faturados</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-2"
              >
                <p className="text-5xl md:text-7xl font-black text-brand tracking-tighter">+ 850</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-60">Lojas ativas</p>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-12 gap-y-20">
            {[
              { 
                icon: Layout, 
                title: "Catálogo Inteligente", 
                desc: "Organize seus produtos com facilidade, categorias dinâmicas e busca ultra rápida." 
              },
              { 
                icon: Zap, 
                title: "Vendas via Pix", 
                desc: "Receba pagamentos instantâneos integrados ao seu estoque em tempo real." 
              },
              { 
                icon: Shield, 
                title: "Gestão Segura", 
                desc: "Controle total de acessos, logs de atividades e proteção de dados dos seus clientes." 
              },
              { 
                icon: BarChart3, 
                title: "Relatórios de Vendas", 
                desc: "Acompanhe o desempenho da sua loja com métricas detalhadas e insights valiosos." 
              },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="space-y-6 group text-center lg:text-left"
              >
                <div className="h-16 w-16 rounded-[2rem] bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-brand group-hover:text-white group-hover:border-brand group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 mx-auto lg:mx-0 shadow-sm">
                  <feature.icon className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Minha<span className="text-brand">Bagg</span></span>
            </div>

            <p className="text-xs font-bold text-slate-300">
              &copy; 2026 MinhaBagg. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
