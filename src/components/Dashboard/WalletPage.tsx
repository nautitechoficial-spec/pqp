import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, ArrowDownLeft, Clock, CheckCircle2, TrendingUp, Download, Loader2, ArrowRight, CreditCard, History, X, Landmark, ShieldCheck, Receipt, Banknote, CircleSlash, UserCircle2, KeyRound, Building2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { cn } from "@/src/lib/utils";
import { dashboardService } from "@/src/services/dashboardService";
import ConfirmationModal from "@/src/components/aistudio/ConfirmationModal";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function PanelModal({ title, subtitle, children, onClose, size = 'md' }: any) {
  useLockBodyScroll(true);
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={`relative z-10 w-full ${size === 'xl' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[92dvh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
      </motion.div>

    </div>
  );
}

export function WalletPage({ isBlocked }: { isBlocked?: boolean }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bank, setBank] = useState<any>({ bank_name:'', agency:'', account_number:'', account_type:'corrente', pix_key_type:'cpf', pix_key:'', holder_name:'', holder_document:'' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [savingWithdraw, setSavingWithdraw] = useState(false);
  const [cancelingWithdrawalId, setCancelingWithdrawalId] = useState<number | null>(null);
  const [withdrawalToCancel, setWithdrawalToCancel] = useState<any>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await dashboardService.getWalletData();
      setData(result);
      setBank(result?.bankAccount || { bank_name:'', agency:'', account_number:'', account_type:'corrente', pix_key_type:'cpf', pix_key:'', holder_name:'', holder_document:'' });
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados da carteira.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (isLoading) {
    return <div className="flex h-[60vh] flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-brand" /><p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando sua carteira...</p></div>;
  }
  if (error) {
    return <div className="flex h-[60vh] flex-col items-center justify-center gap-4"><p className="text-destructive font-bold">{error}</p><Button onClick={fetchData} className="bg-brand text-white">Tentar novamente</Button></div>;
  }

  const pendingWithdrawals = Array.isArray(data?.withdrawals) ? data.withdrawals.filter((w:any) => w.status === 'pending') : [];

  const exportStatement = () => {
    const rows = (data?.transactions || []).map((tx: any) => ({ data: tx.date, descricao: tx.description, status: tx.status, valor: tx.amount }));
    const csv = [Object.keys(rows[0] || {data:'',descricao:'',status:'',valor:''}).join(','), ...rows.map((r:any)=>Object.values(r).map(v=>`"${String(v ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type:'text/csv;charset=utf-8' }), `extrato-carteira-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const requestWithdrawal = async () => {
    const amount = Number(String(withdrawAmount).replace(',', '.'));
    if (!amount || amount <= 0) return;
    try {
      setSavingWithdraw(true);
      await dashboardService.requestWithdrawal({ amount });
      setShowWithdraw(false);
      setWithdrawAmount('');
      await fetchData();
    } finally {
      setSavingWithdraw(false);
    }
  };

  const saveBank = async () => {
    try {
      setSavingBank(true);
      await dashboardService.saveBankAccount(bank);
      setShowBank(false);
      await fetchData();
    } finally {
      setSavingBank(false);
    }
  };

  const cancelWithdrawal = async (withdrawalId: number) => {
    try {
      setCancelingWithdrawalId(withdrawalId);
      await dashboardService.cancelWithdrawal(withdrawalId);
      setWithdrawalToCancel(null);
      await fetchData();
    } finally {
      setCancelingWithdrawalId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-end">
        <Button variant="outline" size="sm" className="h-10 gap-2 border-border/40 bg-card/50 text-xs font-bold text-foreground hover:bg-muted" disabled={isBlocked} onClick={exportStatement}>
          <Download className="h-4 w-4" /> Exportar extrato
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <Card className="relative overflow-hidden border-none bg-card shadow-2xl shadow-black/5">
            <CardContent className="p-6 sm:p-10">
              <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"><Wallet className="h-3 w-3 text-brand" /> Saldo disponível</div>
                  <div className="space-y-1">
                    <h3 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl"><span className="mr-1 text-2xl font-bold">R$</span>{parseFloat(data?.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-500"><TrendingUp className="h-3.5 w-3.5" /><span>Faturamento real confirmado</span></div>
                  </div>
                </div>
                <div className="min-w-[200px] space-y-3">
                  <div className="space-y-1 rounded-2xl border border-border/10 bg-muted/30 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Saldo pendente</p><p className="text-lg font-bold text-amber-600">R$ {parseFloat(data?.pendingBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                  <div className="space-y-1 rounded-2xl border border-border/10 bg-muted/30 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total recebido</p><p className="text-lg font-bold text-foreground">R$ {parseFloat(data?.totalReceived || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                </div>
              </div>
              <div className="mt-10 border-t border-border/40 pt-10">
                <Button disabled={isBlocked} className="h-14 w-full gap-3 rounded-2xl bg-brand px-10 text-sm font-bold text-white shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] hover:bg-brand/90 active:scale-95 sm:w-auto" onClick={() => setShowWithdraw(true)}>
                  Sacar para minha conta <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2"><History className="h-5 w-5 text-brand" /><h2 className="text-lg font-bold tracking-tight text-foreground">Extrato financeiro</h2></div>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-brand hover:bg-brand/5" onClick={() => setShowHistory(true)}>Ver histórico completo</Button>
            </div>
            <div className="space-y-4">
              {(data?.transactions || []).slice(0, 8).map((tx: any, i: number) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={tx.id} className="group relative flex items-center justify-between rounded-3xl border border-border/30 bg-card/40 p-5 transition-all hover:bg-card hover:shadow-xl hover:shadow-black/5">
                  <div className="flex items-center gap-5">
                    <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110", String(tx.description).toLowerCase().includes('saque') ? "bg-rose-500/10 text-rose-600" : tx.status.toLowerCase() === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>{String(tx.description).toLowerCase().includes('saque') ? <ArrowDownLeft className="h-7 w-7" /> : tx.status.toLowerCase() === 'paid' ? <ArrowDownLeft className="h-7 w-7" /> : <Clock className="h-7 w-7" />}</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{tx.description}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <Badge className={cn("rounded-full border-none px-2 py-0 text-[8px] font-black uppercase tracking-widest shadow-none", tx.status.toLowerCase() === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>{tx.status.toLowerCase() === 'paid' ? 'Confirmado' : 'Pendente'}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-black tracking-tight", String(tx.description).toLowerCase().includes('saque') ? 'text-rose-600' : tx.status.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-amber-600')}>{String(tx.description).toLowerCase().includes('saque') ? '-' : tx.status.toLowerCase() === 'paid' ? '+' : ''}<span className="mr-0.5 text-xs font-bold">R$</span>{parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    {tx.withdrawal_id && String(tx.status).toLowerCase() === 'pending' ? <button onClick={() => setWithdrawalToCancel(tx)} className="mt-2 inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-600"><CircleSlash className="h-3.5 w-3.5" /> Cancelar</button> : null}
                  </div>
                </motion.div>
              ))}
              {(data?.transactions || []).length === 0 && <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border/40 bg-muted/10 py-20 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30"><History className="h-6 w-6 text-muted-foreground/50" /></div><p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação recente encontrada.</p></div>}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="overflow-hidden border-border/40 bg-card/50">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10"><CreditCard className="h-5 w-5 text-brand" /></div><h3 className="font-bold text-foreground">Dados bancários</h3></div>
              <div className="space-y-4">
                <div className="space-y-1 rounded-2xl border border-border/10 bg-muted/30 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Banco</p><p className="text-sm font-bold text-foreground">{data?.bankAccount?.bank_name || 'Não configurado'}</p></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1 rounded-2xl border border-border/10 bg-muted/30 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Agência</p><p className="text-sm font-bold text-foreground">{data?.bankAccount?.agency || '--'}</p></div><div className="space-y-1 rounded-2xl border border-border/10 bg-muted/30 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Conta</p><p className="text-sm font-bold text-foreground">{data?.bankAccount?.account_number || '--'}</p></div></div>
              </div>
              <Button variant="outline" className="h-12 w-full rounded-xl border-border/40 text-xs font-bold hover:bg-muted justify-center" onClick={() => setShowBank(true)}>Alterar dados de saque</Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none bg-emerald-500/5"><CardContent className="space-y-4 p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><h3 className="font-bold text-emerald-900 dark:text-emerald-400">Segurança</h3></div><p className="text-xs leading-relaxed text-emerald-800/70 dark:text-emerald-400/70">Seus pagamentos são processados com criptografia de ponta a ponta e auditoria constante.</p></CardContent></Card>
        </div>
      </div>

      <AnimatePresence>
        {showWithdraw && (
          <PanelModal title="Solicitar saque" subtitle="Preencha o valor e confirme o envio para sua conta cadastrada." onClose={() => setShowWithdraw(false)}>
            <div className="space-y-5">
              <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                <div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10"><Banknote className="h-6 w-6 text-brand" /></div><div><div className="text-xs font-black uppercase tracking-widest text-slate-400">Saldo disponível</div><div className="mt-1 text-2xl font-black text-slate-900">R$ {parseFloat(data?.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="mt-1 text-sm text-slate-500">O saque será enviado para os dados bancários cadastrados abaixo.</p></div></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400"><Landmark className="h-3.5 w-3.5" /> Banco</div><div className="text-sm font-bold text-slate-900">{bank.bank_name || 'Não configurado'}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400"><Receipt className="h-3.5 w-3.5" /> Conta</div><div className="text-sm font-bold text-slate-900">{bank.agency || '--'} / {bank.account_number || '--'}</div></div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Valor do saque</label>
                <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Ex.: 120,00" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} />
              </div>
              <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row"><button onClick={() => setShowWithdraw(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button disabled={savingWithdraw} onClick={requestWithdrawal} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70">{savingWithdraw ? 'Enviando...' : 'Confirmar saque'}</button></div>
            </div>
          </PanelModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBank && (
          <PanelModal title="Dados de saque" subtitle="Atualize suas informações bancárias e chave Pix com segurança." onClose={() => setShowBank(false)}>
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10"><ShieldCheck className="h-6 w-6 text-brand" /></div><div><div className="text-sm font-black text-slate-900">Conta de recebimento</div><p className="mt-1 text-sm text-slate-500">Esses dados serão usados nos saques aprovados da sua carteira.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400"><UserCircle2 className="h-3.5 w-3.5" /> Titular atual</div><div className="text-sm font-bold text-slate-900">{bank.holder_name || 'Não informado'}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400"><KeyRound className="h-3.5 w-3.5" /> Pix atual</div><div className="text-sm font-bold text-slate-900 break-all">{bank.pix_key || 'Não informado'}</div></div></div></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FancyField icon={Building2} label="Banco"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Banco" value={bank.bank_name || ''} onChange={e=>setBank({...bank, bank_name:e.target.value})} /></FancyField>
                <FancyField icon={Landmark} label="Agência"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Agência" value={bank.agency || ''} onChange={e=>setBank({...bank, agency:e.target.value})} /></FancyField>
                <FancyField icon={CreditCard} label="Conta"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Conta" value={bank.account_number || ''} onChange={e=>setBank({...bank, account_number:e.target.value})} /></FancyField>
                <FancyField icon={Receipt} label="Tipo de conta"><select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" value={bank.account_type || 'corrente'} onChange={e=>setBank({...bank, account_type:e.target.value})}><option value="corrente">Corrente</option><option value="poupanca">Poupança</option></select></FancyField>
                <FancyField icon={UserCircle2} label="Titular"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Nome do titular" value={bank.holder_name || ''} onChange={e=>setBank({...bank, holder_name:e.target.value})} /></FancyField>
                <FancyField icon={ShieldCheck} label="Documento do titular"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="CPF/CNPJ" value={bank.holder_document || ''} onChange={e=>setBank({...bank, holder_document:e.target.value})} /></FancyField>
                <FancyField icon={KeyRound} label="Tipo de chave Pix"><select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" value={bank.pix_key_type || 'cpf'} onChange={e=>setBank({...bank, pix_key_type:e.target.value})}><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="phone">Telefone</option><option value="random">Aleatória</option></select></FancyField>
                <FancyField icon={KeyRound} label="Chave Pix"><input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:shadow-[0_0_0_4px_rgba(255,107,0,0.08)]" placeholder="Chave Pix" value={bank.pix_key || ''} onChange={e=>setBank({...bank, pix_key:e.target.value})} /></FancyField>
              </div>
              {pendingWithdrawals.length > 0 ? <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Clock className="h-4 w-4" /> Saques pendentes</div><div className="space-y-3">{pendingWithdrawals.map((w:any) => <div key={w.id} className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-black text-slate-900">R$ {parseFloat(w.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div className="text-xs text-slate-500">Solicitado em {new Date(w.requested_at).toLocaleString('pt-BR')}</div></div><button onClick={() => cancelWithdrawal(Number(w.id))} disabled={cancelingWithdrawalId === Number(w.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 disabled:opacity-60"><CircleSlash className="h-3.5 w-3.5" /> {cancelingWithdrawalId === Number(w.id) ? 'Cancelando...' : 'Cancelar saque'}</button></div>)}</div></div> : null}
              <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row"><button onClick={() => setShowBank(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button disabled={savingBank} onClick={saveBank} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70">{savingBank ? 'Salvando...' : 'Salvar dados'}</button></div>
            </div>
          </PanelModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <PanelModal title="Histórico financeiro completo" subtitle="Consulte todas as entradas e saídas da carteira." onClose={() => setShowHistory(false)} size="xl">
            <div className="space-y-3 max-h-[70dvh] overflow-y-auto overscroll-contain pr-1">
              {(data?.transactions || []).map((tx:any) => <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"><div><div className="font-bold text-slate-900">{tx.description}</div><div className="text-xs text-slate-500">{new Date(tx.date).toLocaleString('pt-BR')}</div></div><div className="font-black text-slate-900">R$ {parseFloat(tx.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>)}
            </div>
          </PanelModal>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={!!withdrawalToCancel}
        title="Cancelar saque"
        message={withdrawalToCancel ? `Deseja cancelar o saque de R$ ${parseFloat(withdrawalToCancel.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?` : ''}
        confirmLabel="Cancelar saque"
        cancelLabel="Fechar"
        isLoading={cancelingWithdrawalId === Number(withdrawalToCancel?.withdrawal_id || withdrawalToCancel?.id || 0)}
        onConfirm={() => withdrawalToCancel ? cancelWithdrawal(Number(withdrawalToCancel.withdrawal_id || withdrawalToCancel.id)) : undefined}
        onClose={() => {
          if (cancelingWithdrawalId) return;
          setWithdrawalToCancel(null);
        }}
      />

    </div>
  );
}

function Field({ label, children }: any) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>{children}</label>;
}

function FancyField({ icon: Icon, label, children }: any) {
  return <label className="block rounded-3xl border border-slate-200 bg-slate-50/70 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-brand shadow-sm"><Icon className="h-4 w-4" /></span>{label}</div>{children}</label>;
}
