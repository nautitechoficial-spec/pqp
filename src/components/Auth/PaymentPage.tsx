import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CreditCard, Copy, Check, Loader2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { API_BASE_URL } from "@/src/config/api";

interface PendingOrder {
  id: number;
  pix_qr_code: string;
  pix_copy_paste: string;
  total: number;
  plan_name?: string;
}

export function PaymentPage({ order, user, onPaid }: { order: PendingOrder, user: any, onPaid: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (order?.pix_copy_paste) {
      navigator.clipboard.writeText(order.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Poll for payment status
  useEffect(() => {
    if (!order?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders.php?id=${order.id}`);
        const data = await response.json();
        if (data.status?.trim().toUpperCase() === 'PAID') {
          onPaid();
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto opacity-20" />
          <h2 className="text-xl font-bold text-slate-900">Nenhum pedido pendente encontrado</h2>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">Recarregar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="grid lg:grid-cols-2">
          {/* Left Side: Info */}
          <div className="p-8 sm:p-16 space-y-10 bg-slate-50/50 border-r border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/20">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Minha<span className="text-brand">Bagg</span></span>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Finalize sua ativação</h2>
                <p className="text-slate-500 font-medium text-lg">Sua loja está quase pronta para vender.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loja</p>
                      <p className="text-xl font-bold text-slate-900">{user?.store_name || 'Sua Loja'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plano</p>
                      <p className="text-sm font-black text-brand uppercase tracking-widest">{order.plan_name || user?.plan_name || 'Básico'}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full" />
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-600">Total a pagar</p>
                    <p className="text-3xl font-black text-slate-900">R$ {parseFloat(order.total?.toString() || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">Ativação Automática</p>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      O sistema identifica o pagamento via PIX em até 30 segundos. Não é necessário enviar comprovante.
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Right Side: QR Code */}
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center space-y-8 bg-white">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Escaneie o QR Code</h3>
              <p className="text-sm text-slate-500 font-medium">Abra o app do seu banco e escolha "Pagar via PIX"</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-brand/5 rounded-[3rem] blur-2xl group-hover:bg-brand/10 transition-all" />
              <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100">
                {order.pix_qr_code ? (
                  <img 
                    src={`data:image/png;base64,${order.pix_qr_code}`} 
                    alt="QR Code PIX" 
                    className="w-56 h-56 sm:w-72 sm:h-72"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-brand/20" />
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-sm space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ou copie o código</p>
                <div className="relative group">
                  <input 
                    readOnly
                    value={order.pix_copy_paste || ''}
                    className="w-full h-14 pl-6 pr-16 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:border-brand transition-all"
                  />
                  <button 
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105 transition-all active:scale-95"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">Aguardando pagamento...</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
