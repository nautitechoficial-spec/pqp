import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, CreditCard, Copy, Check, Loader2, AlertCircle, ShoppingBag, ArrowRight, FileText, Calendar, User, MapPin, HelpCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card, CardContent } from "@/src/components/ui/Card";
import { dashboardService } from "@/src/services/dashboardService";
import { cn } from "@/src/lib/utils";

export function InvoiceDetailPage({ orderId, onBack }: { orderId: number, onBack: () => void }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getInvoiceDetails(orderId);
      setInvoice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchDetails();
  }, [orderId]);

  const handleCopy = () => {
    if (invoice?.pix_copy_paste) {
      navigator.clipboard.writeText(invoice.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando detalhes da fatura...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive opacity-20" />
        <h2 className="text-xl font-bold">Fatura não encontrada</h2>
        <Button onClick={onBack} variant="outline" className="rounded-xl">Voltar para faturas</Button>
      </div>
    );
  }

  const isPaid = invoice.status.toUpperCase() === 'PAID';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {isPaid && (
          <Badge variant="success" className="ml-auto h-8 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 rounded-full">
            <Check className="h-3 w-3" /> Paga
          </Badge>
        )}
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/40 bg-muted/10">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-brand" /> Faturado para
                </h3>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente / Loja</p>
                  <p className="text-sm font-bold text-slate-900">{invoice.customer_name || invoice.store_name}</p>
                  <p className="text-sm text-slate-500">{invoice.customer_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documento</p>
                  <p className="text-sm font-bold text-slate-900">{invoice.cpf_cnpj || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/40 bg-muted/10">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-brand" /> Itens da Fatura
                </h3>
              </div>
              <div className="p-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                      <th className="pb-4">Descrição</th>
                      <th className="pb-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-900">Assinatura Mensal - Plano {invoice.plan_name || 'Profissional'}</p>
                        <p className="text-xs text-slate-500">Referente ao período de {new Date(invoice.created_at).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">R$ {parseFloat(invoice.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-100">
                      <td className="pt-6 text-sm font-bold text-slate-500">Subtotal</td>
                      <td className="pt-6 text-right text-sm font-bold text-slate-900">R$ {parseFloat(invoice.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="pt-2 text-lg font-black text-slate-900">Total</td>
                      <td className="pt-2 text-right text-lg font-black text-brand">R$ {parseFloat(invoice.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Checkout */}
        <div className="space-y-6">
          {!isPaid ? (
            <Card className="border-brand/20 shadow-2xl shadow-brand/5 overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Pagamento via PIX</h3>
                  <p className="text-xs text-slate-500 font-medium">Aprovação instantânea e ativação automática.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    {invoice.pix_qr_code ? (
                      <img 
                        src={`data:image/png;base64,${invoice.pix_qr_code}`} 
                        alt="QR Code PIX" 
                        className="w-40 h-40"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-slate-300">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Código Copia e Cola</p>
                    <div className="relative">
                      <input 
                        readOnly
                        value={invoice.pix_copy_paste || ''}
                        className="w-full h-12 pl-4 pr-12 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 outline-none"
                      />
                      <button 
                        onClick={handleCopy}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105 transition-all"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Vencimento</span>
                    <span className="text-slate-900">{new Date(new Date(invoice.created_at).getTime() + 24*60*60*1000).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                      Não é necessário enviar comprovante. O sistema identifica o pagamento automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50 overflow-hidden">
              <CardContent className="p-8 text-center space-y-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                  <Check className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-emerald-900">Pagamento Confirmado</h3>
                  <p className="text-sm text-emerald-700 font-medium">Esta fatura já foi quitada com sucesso.</p>
                </div>
                <div className="pt-4 border-t border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span>Data do Pagamento</span>
                    <span>{new Date(invoice.updated_at || invoice.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40">
            <CardContent className="p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Precisa de ajuda?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Se você tiver qualquer dúvida sobre esta fatura, entre em contato com nosso suporte.
              </p>
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold gap-2">
                <HelpCircle className="h-4 w-4" /> Abrir Chamado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "success" && "border-transparent bg-emerald-100 text-emerald-800",
      className
    )}>
      {children}
    </span>
  );
}
