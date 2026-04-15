import * as React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function DashboardWarning({ onAction }: { onAction: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-amber-900">Seu pagamento ainda não foi confirmado.</p>
          <p className="text-xs text-amber-700 font-medium">Algumas funcionalidades estão bloqueadas até a confirmação do PIX.</p>
        </div>
      </div>
      <button 
        onClick={onAction}
        className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95"
      >
        Realizar Pagamento <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
