import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Rocket, Zap, Crown, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { API_BASE_URL } from "@/src/config/api";

interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: string;
  interval_type: string;
}

export function PlansPage({ onSelect, onBack }: { onSelect: (planId: number) => void, onBack: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/plans.php`)
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes('pro')) return Crown;
    if (name.toLowerCase().includes('basic')) return Zap;
    return Rocket;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Escolha seu Plano</h1>
            <p className="text-slate-500 font-medium">Selecione o melhor plano para o seu negócio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = getIcon(plan.name);
            const isPopular = plan.name.toLowerCase().includes('pro');

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all hover:scale-[1.02] ${isPopular ? 'border-brand ring-4 ring-brand/5' : 'border-slate-100'}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isPopular ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{plan.display_name}</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ {parseFloat(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-slate-400 font-bold text-sm">/mês</span>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">O que está incluso:</p>
                    <ul className="space-y-3">
                      {['Produtos Ilimitados', 'Suporte 24/7', 'Customização Completa', 'Checkout Transparente'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => onSelect(plan.id)}
                    className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all ${isPopular ? 'bg-brand text-white shadow-brand/20' : 'bg-slate-900 text-white shadow-slate-900/10'}`}
                  >
                    Escolher Plano
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
