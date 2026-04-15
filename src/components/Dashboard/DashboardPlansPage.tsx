import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Rocket, Zap, Crown, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { API_BASE_URL } from "@/src/config/api";

interface PlanFeature { text?: string; feature_text?: string; is_highlight?: number }
interface Plan {
  id: number;
  name?: string;
  slug?: string;
  display_name?: string;
  description?: string;
  summary?: string;
  headline?: string;
  badge?: string | null;
  footer_note?: string | null;
  price?: number | string;
  price_monthly?: number | null;
  price_annual_monthly_equivalent?: number | null;
  features?: (string | PlanFeature)[];
}

export function DashboardPlansPage({ user, onUpgrade }: { user: any, onUpgrade?: (orderId?: number) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentPlanId = user?.plan_id || 1;

  useEffect(() => {
    fetch(`${API_BASE_URL}/plans.php`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao carregar planos');
        if (!Array.isArray(data)) throw new Error('Resposta inválida de planos');
        setPlans(data);
      })
      .catch(err => {
        console.error(err);
        setError(err?.message || 'Erro ao carregar planos');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('pro') || n.includes('enterprise')) return Crown;
    if (n.includes('growth') || n.includes('premium')) return Zap;
    return Rocket;
  };

  const getMonthlyPrice = (plan: Plan) => {
    if (typeof plan.price_monthly === 'number') return plan.price_monthly;
    const p = typeof plan.price === 'string' ? parseFloat(plan.price) : (plan.price ?? 0);
    return Number.isFinite(Number(p)) ? Number(p) : 0;
  };

  const getFeatures = (plan: Plan): { text: string; is_highlight?: number }[] => {
    if (!Array.isArray(plan.features)) return [];
    return plan.features.map((f: any) => typeof f === 'string' ? ({ text: f }) : ({ text: f.text || f.feature_text || '', is_highlight: f.is_highlight })).filter(f => f.text);
  };

  const handlePlanAction = async (plan: Plan) => {
    if (plan.id === currentPlanId) return;
    try {
      setIsProcessing(plan.id);
      const response = await fetch(`${API_BASE_URL}/upgrade_plan.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: user.store_id, plan_id: plan.id })
      });
      const data = await response.json();
      if (data.success) {
        if (data.message) alert(data.message);
        onUpgrade?.(data.order_id);
      } else alert(data.error || "Erro ao processar alteração de plano");
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-[60vh] flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-brand" /><p className="text-sm font-medium text-muted-foreground">Carregando planos...</p></div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3"><AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /><div><p className="font-bold">Não foi possível carregar todos os dados dos planos.</p><p>{error}</p></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const planName = plan.display_name || plan.slug || plan.name || `Plano ${plan.id}`;
          const Icon = getIcon(planName);
          const isCurrent = plan.id === currentPlanId;
          const currentPlan = plans.find(p => p.id === currentPlanId);
          const currentPrice = currentPlan ? getMonthlyPrice(currentPlan) : 0;
          const price = getMonthlyPrice(plan);
          const isHigher = price > currentPrice;
          const features = getFeatures(plan).slice(0, 6);

          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className={`relative bg-card rounded-[2rem] p-6 shadow-lg border transition-all hover:translate-y-[-2px] ${isCurrent ? 'border-brand ring-4 ring-brand/10' : 'border-border/40'}`}>
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{plan.badge}</div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Plano Atual</div>
              )}

              <div className="space-y-5">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isCurrent ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-foreground">{planName}</h3>
                  {(plan.headline || plan.summary || plan.description) && (
                    <p className="text-muted-foreground text-sm font-medium mt-1 leading-relaxed">{plan.headline || plan.summary || plan.description}</p>
                  )}
                </div>

                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-3xl font-black text-foreground">R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-muted-foreground font-bold text-xs mb-1">/mês</span>
                  {typeof plan.price_annual_monthly_equivalent === 'number' && (
                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand">Anual: R$ {plan.price_annual_monthly_equivalent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">O que está incluso</p>
                  <ul className="space-y-2 min-h-[148px]">
                    {(features.length ? features : ['Recursos do plano disponíveis no painel']).map((feat: any, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm ${feat.is_highlight ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                        <span>{typeof feat === 'string' ? feat : feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.footer_note && <p className="text-[10px] font-bold uppercase tracking-widest text-brand">{plan.footer_note}</p>}

                <Button onClick={() => handlePlanAction(plan)} disabled={isCurrent || isProcessing !== null}
                  className={`w-full h-12 rounded-2xl font-black text-sm shadow-xl transition-all ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : isHigher ? 'bg-brand text-white shadow-brand/20' : 'bg-slate-900 text-white'}`}>
                  {isProcessing === plan.id ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : isCurrent ? 'Plano Ativo' : isHigher ? 'Fazer Upgrade' : 'Fazer Downgrade'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
