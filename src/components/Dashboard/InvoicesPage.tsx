import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CreditCard, Search, Filter, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card, CardContent } from "@/src/components/ui/Card";
import { dashboardService } from "@/src/services/dashboardService";
import { cn } from "@/src/lib/utils";

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" && "border border-border text-foreground",
      className
    )}>
      {children}
    </span>
  );
}

export function InvoicesPage({ onSelectInvoice }: { onSelectInvoice: (id: number) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toString().includes(search);
    const matchesFilter = filter === 'all' || inv.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const openInvoices = invoices.filter(inv => inv.status.toUpperCase() === 'PENDING');
  const totalOpen = openInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >

      {openInvoices.length > 0 && (
        <Card className="bg-amber-50 border-amber-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">Você tem faturas em aberto</h3>
                <p className="text-sm text-amber-700 font-medium">Total pendente: <span className="font-black">R$ {totalOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
              </div>
            </div>
            <Button 
              onClick={() => onSelectInvoice(openInvoices[0].id)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-amber-600/20 gap-2"
            >
              Pagar Agora <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['all', 'paid', 'pending', 'canceled', 'refunded'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border capitalize whitespace-nowrap",
                filter === f 
                  ? "bg-brand text-white border-brand shadow-lg shadow-brand/20" 
                  : "bg-background text-muted-foreground border-border/50 hover:bg-muted"
              )}
            >
              {f === 'all' ? 'Todas' : f === 'paid' ? 'Pagas' : f === 'pending' ? 'Em Aberto' : f === 'canceled' ? 'Canceladas' : 'Reembolsadas'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar fatura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/50 bg-background text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Número</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">Nenhuma fatura encontrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">#{inv.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 font-medium">
                        {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">
                        Assinatura
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {inv.status.toUpperCase() === 'PAID' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">Paga</span>
                        </div>
                      ) : inv.status.toUpperCase() === 'PENDING' ? (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">Pendente</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">Cancelada</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">
                        R$ {parseFloat(inv.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectInvoice(inv.id)}
                        className="h-8 px-3 rounded-lg text-brand hover:bg-brand/10 font-bold text-xs gap-1"
                      >
                        {inv.status.toUpperCase() === 'PENDING' ? 'Pagar' : 'Detalhes'}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
