import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Search, Download, FileText, ReceiptText } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { dashboardService, Invoice } from '@/src/services/dashboardService';

function fmtDate(v?: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('pt-BR');
}
function fmtMoney(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function NotaFiscalPage(){
  const [q,setQ]=useState('');
  const [rows,setRows]=useState<Invoice[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const invoices = await dashboardService.getInvoices();
        const paid = (invoices || []).filter((inv:any) => ['PAID','RECEIVED','CONFIRMED'].includes(String(inv.status || '').toUpperCase()));
        if (mounted) setRows(paid);
      } catch (e:any) {
        if (mounted) setError(e?.message || 'Erro ao carregar notas fiscais');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r:any) =>
      String(r.id).toLowerCase().includes(s) ||
      String(r.status || '').toLowerCase().includes(s) ||
      String(r.created_at || '').toLowerCase().includes(s)
    );
  }, [rows,q]);

  const openInvoice = (id:number) => {
    const storeId = localStorage.getItem('store_id') || '';
    window.open(`/api-painel/finance.php?action=invoice_details&id=${id}&store_id=${storeId}`, '_blank');
  };

  return <div className="space-y-4 pb-10">
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><input className="w-full h-10 rounded-xl border border-border/40 bg-muted/10 pl-10 pr-4 text-sm" placeholder="Buscar nota fiscal..." value={q} onChange={e=>setQ(e.target.value)} /></div>
    <Card className="rounded-3xl border-border/40 overflow-hidden"><CardContent className="p-0">
      {loading ? <div className="p-6 text-sm text-muted-foreground">Carregando notas fiscais...</div> : error ? <div className="p-6 text-sm text-red-600">{error}</div> : data.length===0 ? <div className="p-10 text-center text-sm text-muted-foreground"><ReceiptText className="h-8 w-8 mx-auto mb-2 opacity-60"/>Nenhuma nota fiscal encontrada para esta loja.</div> : <>
      <div className="overflow-x-auto hidden md:block"><table className="w-full text-sm"><thead><tr className="bg-muted/20 border-b border-border/40"><th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">Pedido</th><th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">Data</th><th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">Valor</th><th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">Status</th><th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Ações</th></tr></thead><tbody className="divide-y divide-border/30">{data.map((r:any)=><tr key={r.id}><td className="px-4 py-3 font-bold">#{r.id}</td><td className="px-4 py-3">{fmtDate(r.created_at || r.date)}</td><td className="px-4 py-3">{fmtMoney(r.total_amount || r.value)}</td><td className="px-4 py-3 text-xs">{String(r.status || '').toUpperCase()}</td><td className="px-4 py-3 text-right"><Button variant="outline" className="h-8 rounded-lg text-xs" onClick={()=>openInvoice(Number(r.id))}><Download className="h-3.5 w-3.5 mr-1"/>Abrir</Button></td></tr>)}</tbody></table></div>
      <div className="md:hidden p-4 grid gap-3">{data.map((r:any)=><div key={r.id} className="rounded-xl border border-border/30 p-3"><div className="flex items-center justify-between"><div><p className="font-bold text-sm">#{r.id}</p><p className="text-xs text-muted-foreground">{fmtDate(r.created_at || r.date)}</p></div><p className="text-sm font-bold">{fmtMoney(r.total_amount || r.value)}</p></div><p className="text-xs mt-1 text-muted-foreground">Status: {String(r.status || '').toUpperCase()}</p><Button variant="outline" className="w-full mt-3 rounded-lg text-xs" onClick={()=>openInvoice(Number(r.id))}><FileText className="h-3.5 w-3.5 mr-1"/>Abrir nota</Button></div>)}</div>
      </>}
    </CardContent></Card>
  </div>
}
