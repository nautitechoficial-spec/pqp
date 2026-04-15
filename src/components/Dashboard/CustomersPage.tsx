
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Users, UserCheck, UserX, UserPlus, Search, Filter, Mail, MessageSquare, Ban,
  RefreshCw, Loader2, Pencil, X, AlertTriangle, Check, ChevronRight, Phone, BadgePlus, ShieldCheck, CalendarDays, BadgeInfo
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { cn } from "@/src/lib/utils";
import { dashboardService } from "@/src/services/dashboardService";
import { motion, AnimatePresence } from "motion/react";

const initialCustomer = {
  name: '', email: '', phone: '', cpf_cnpj: '', document: '', notes: '',
  whatsapp_opt_in: true, status: 'active'
};

export function CustomersPage({ isBlocked }: { isBlocked?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [confirmBan, setConfirmBan] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>('all');
  const [newCustomer, setNewCustomer] = useState<any>(null);

  const fetchData = async (search: string = "") => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dashboardService.getCustomers(search + (statusFilter !== 'all' ? ` status:${statusFilter}` : ''));
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);


  useEffect(() => {
    const modalOpen = !!editingCustomer || !!newCustomer || !!confirmBan || !!showEmailModal || !!viewingCustomer;
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editingCustomer, newCustomer, confirmBan, showEmailModal, viewingCustomer]);

  const handleToggleStatus = async (customer: any) => {
    try {
      const newStatus = customer.status === 'active' ? 'inactive' : 'active';
      await dashboardService.updateCustomerStatus(customer.id, newStatus);
      setConfirmBan(null);
      fetchData(searchTerm);
    } catch {
      alert("Erro ao atualizar status.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dashboardService.editCustomer(editingCustomer);
      setEditingCustomer(null);
      fetchData(searchTerm);
    } catch {
      alert("Erro ao editar cliente.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dashboardService.createCustomer(newCustomer);
      setNewCustomer(null);
      fetchData(searchTerm);
    } catch (err: any) {
      alert(err?.message || "Erro ao criar cliente.");
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (error) {
    return <div className="flex h-[60vh] flex-col items-center justify-center gap-4"><p className="text-destructive font-bold">{error}</p><Button onClick={() => fetchData(searchTerm)} className="bg-brand text-white">Tentar Novamente</Button></div>;
  }

  const stats = [
    { label: "Total de Clientes", value: data?.stats.total || "0", icon: Users, color: "text-brand" },
    { label: "Clientes Ativos", value: data?.stats.active || "0", icon: UserCheck, color: "text-emerald-500" },
    { label: "Clientes Banidos", value: data?.stats.inactive || "0", icon: UserX, color: "text-destructive" },
    { label: "Novos (30 dias)", value: data?.stats.new30days || "0", icon: UserPlus, color: "text-blue-500" },
  ];





  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 items-center sm:flex-row sm:items-center sm:justify-center">
        <Button size="sm" className="h-11 min-w-[200px] px-5 rounded-2xl bg-brand text-xs font-bold text-white hover:bg-brand/90 gap-2 justify-center" disabled={isBlocked} onClick={() => setNewCustomer({ ...initialCustomer })}>
          <BadgePlus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/40 bg-card/50 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p><h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{stat.value}</h3></div><div className={cn("rounded-lg bg-muted/50 p-2", stat.color)}><stat.icon className="h-5 w-5" /></div></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <input type="text" placeholder="Buscar por nome, email ou telefone..." className="h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 text-sm outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 text-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">{isLoading && <Loader2 className="h-4 w-4 animate-spin text-brand" />}<Button variant="outline" className="h-11 rounded-xl border-border/50 bg-background/50 text-xs font-bold text-foreground gap-2" onClick={() => setShowFilters(v => !v)}><Filter className="h-4 w-4 text-muted-foreground" /> Filtros</Button></div>
      </div>

      {showFilters && <div className="flex gap-2"><Button variant={statusFilter==='all'?'default':'outline'} className="h-9" onClick={() => setStatusFilter('all')}>Todos</Button><Button variant={statusFilter==='active'?'default':'outline'} className="h-9" onClick={() => setStatusFilter('active')}>Ativos</Button><Button variant={statusFilter==='inactive'?'default':'outline'} className="h-9" onClick={() => setStatusFilter('inactive')}>Banidos</Button></div>}

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {data?.customers.map((customer: any) => (
          <Card key={customer.id} className="border-border/40 bg-card overflow-hidden rounded-2xl shadow-sm transition-all">
            <div className="p-4 space-y-4">
              <button type="button" className="w-full flex items-center gap-4 text-left active:scale-[0.98] transition-all" onClick={() => setViewingCustomer(customer)}>
                <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand shrink-0">{customer.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-foreground truncate">{customer.name}</h3><Badge className={cn("rounded-full px-2 py-0 text-[8px] font-bold uppercase tracking-wider border-none", customer.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>{customer.status === 'active' ? "Ativo" : "Banido"}</Badge></div><p className="text-xs text-muted-foreground truncate">{customer.email}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-10 rounded-xl text-[11px] font-bold" onClick={() => setViewingCustomer(customer)}>Ver</Button>
                <Button variant="outline" className="h-10 rounded-xl text-[11px] font-bold" onClick={() => setEditingCustomer({ ...customer, cpf_cnpj: customer.cpf_cnpj || customer.document || customer.cpf || '' })}>Editar</Button>
                <Button variant="outline" className="h-10 rounded-xl text-[11px] font-bold" onClick={() => handleWhatsApp(customer.phone || customer.whatsapp || '')}>WhatsApp</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden lg:block border-border/40 bg-card/50 shadow-sm overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/40 bg-muted/20"><th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Cliente</th><th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Contato</th><th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Pedidos</th><th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Total Gasto</th><th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th><th className="px-6 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Ações</th></tr></thead>
            <tbody className="divide-y divide-border/40">
              {data?.customers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand">{customer.name.charAt(0).toUpperCase()}</div><div><p className="font-bold text-foreground">{customer.name}</p><p className="text-[10px] text-muted-foreground">ID: #{customer.id} • Desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}</p></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="space-y-1"><p className="text-xs font-medium text-foreground">{customer.email}</p><p className="text-[10px] text-muted-foreground">{customer.phone || 'Sem telefone'}</p></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="font-bold text-foreground">{customer.total_orders}</p><p className="text-[10px] text-muted-foreground">Última: {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString('pt-BR') : 'Nunca'}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="font-bold text-brand">R$ {parseFloat(customer.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Badge className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none", customer.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>{customer.status === 'active' ? "Ativo" : "Banido"}</Badge></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" title="WhatsApp" onClick={() => handleWhatsApp(customer.phone)}><MessageSquare className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-500/10" title="Email" onClick={() => setShowEmailModal(true)}><Mail className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-brand hover:bg-brand/10" title="Editar" onClick={() => setEditingCustomer({ ...customer, cpf_cnpj: customer.cpf_cnpj || customer.document || customer.cpf || "" })}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className={cn("h-8 w-8", customer.status === 'active' ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-500/10")} onClick={() => setConfirmBan(customer)} title={customer.status === 'active' ? "Banir" : "Reativar"}>{customer.status === 'active' ? <Ban className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}</Button></div></td>
                </tr>
              ))}
              {data?.customers.length === 0 && !isLoading && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {editingCustomer && <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-4xl max-h-[92dvh] bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-border/40 flex flex-col"><div className="p-6 border-b border-border/40 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center"><Pencil className="h-5 w-5" /></div><div><h3 className="text-xl font-black">Editar Cliente</h3><p className="text-xs text-muted-foreground">Ajuste os dados cadastrais e comerciais.</p></div></div><Button variant="ghost" size="icon" onClick={() => setEditingCustomer(null)}><X className="h-5 w-5" /></Button></div><div className="p-6 overflow-y-auto overscroll-contain"><CustomerFormModal value={editingCustomer} onChange={setEditingCustomer} submitText="Salvar alterações" onCancel={() => setEditingCustomer(null)} onSubmit={handleEditSubmit} /></div></motion.div></div>}
        {newCustomer && <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-4xl max-h-[92dvh] bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-border/40 flex flex-col"><div className="p-6 border-b border-border/40 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center"><UserPlus className="h-5 w-5" /></div><div><h3 className="text-xl font-black">Novo Cliente</h3><p className="text-xs text-muted-foreground">Cadastro completo para loja física ou online.</p></div></div><Button variant="ghost" size="icon" onClick={() => setNewCustomer(null)}><X className="h-5 w-5" /></Button></div><div className="p-6 overflow-y-auto overscroll-contain"><CustomerFormModal value={newCustomer} onChange={setNewCustomer} submitText="Criar cliente" onCancel={() => setNewCustomer(null)} onSubmit={handleCreateSubmit} /></div></motion.div></div>}
        {confirmBan && <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-border/40"><div className={cn("mx-auto h-16 w-16 rounded-full flex items-center justify-center", confirmBan.status === 'active' ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600")}>{confirmBan.status === 'active' ? <AlertTriangle className="h-8 w-8" /> : <Check className="h-8 w-8" />}</div><div className="space-y-2"><h3 className="text-xl font-bold">{confirmBan.status === 'active' ? 'Banir Cliente?' : 'Reativar Cliente?'}</h3><p className="text-sm text-muted-foreground">{confirmBan.status === 'active' ? `Tem certeza que deseja banir ${confirmBan.name}? Ele não poderá mais realizar compras.` : `Deseja reativar o acesso de ${confirmBan.name}?`}</p></div><div className="flex gap-3"><Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setConfirmBan(null)}>Cancelar</Button><Button className={cn("flex-1 h-12 rounded-xl text-white font-bold", confirmBan.status === 'active' ? "bg-destructive hover:bg-destructive/90" : "bg-emerald-600 hover:bg-emerald-700")} onClick={() => handleToggleStatus(confirmBan)}>Confirmar</Button></div></motion.div></div>}
        {showEmailModal && <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-border/40"><div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center"><Mail className="h-8 w-8" /></div><div className="space-y-2"><h3 className="text-xl font-bold">Enviar E-mail</h3><p className="text-sm text-muted-foreground">Esta funcionalidade está em desenvolvimento e estará disponível em breve.</p></div><Button className="w-full h-12 rounded-xl bg-brand text-white font-bold" onClick={() => setShowEmailModal(false)}>Entendido</Button></motion.div></div>}
        {viewingCustomer && <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-4xl max-h-[92dvh] bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-border/40 flex flex-col"><div className="p-6 border-b border-border/40 flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-14 w-14 rounded-[1.25rem] bg-brand/10 text-brand flex items-center justify-center text-xl font-black">{String(viewingCustomer.name || '?').charAt(0).toUpperCase()}</div><div><h3 className="text-xl font-black">{viewingCustomer.name}</h3><p className="text-xs text-muted-foreground">Resumo completo do cliente</p></div></div><Button variant="ghost" size="icon" onClick={() => setViewingCustomer(null)}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"><InfoBox icon={Mail} label="E-mail" value={viewingCustomer.email || 'Não informado'} /><InfoBox icon={Phone} label="Telefone" value={viewingCustomer.phone || 'Não informado'} /><InfoBox icon={Users} label="Pedidos" value={String(viewingCustomer.total_orders || 0)} /><InfoBox icon={ShieldCheck} label="Total gasto" value={`R$ ${parseFloat(viewingCustomer.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} /></div><div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-4"><section className="rounded-3xl border border-border/40 bg-card/40 p-5 space-y-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><BadgeInfo className="h-5 w-5" /></div><div><h4 className="font-black text-foreground">Informações do cliente</h4><p className="text-[11px] text-muted-foreground">Dados cadastrais e observações.</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InfoRow label="Nome completo" value={viewingCustomer.name || 'Não informado'} /><InfoRow label="CPF / CNPJ" value={viewingCustomer.cpf_cnpj || viewingCustomer.document || 'Não informado'} /><InfoRow label="Telefone" value={viewingCustomer.phone || 'Não informado'} /><InfoRow label="E-mail" value={viewingCustomer.email || 'Não informado'} /></div><InfoRow label="Observações" value={viewingCustomer.notes || 'Nenhuma observação cadastrada.'} multiline /></section><section className="rounded-3xl border border-border/40 bg-card/40 p-5 space-y-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center"><CalendarDays className="h-5 w-5" /></div><div><h4 className="font-black text-foreground">Histórico rápido</h4><p className="text-[11px] text-muted-foreground">Resumo comercial e status atual.</p></div></div><InfoRow label="Status" value={viewingCustomer.status === 'active' ? 'Ativo' : 'Banido'} /><InfoRow label="Cliente desde" value={viewingCustomer.created_at ? new Date(viewingCustomer.created_at).toLocaleDateString('pt-BR') : 'Não informado'} /><InfoRow label="Última compra" value={viewingCustomer.last_purchase ? new Date(viewingCustomer.last_purchase).toLocaleDateString('pt-BR') : 'Nenhuma compra'} /><InfoRow label="WhatsApp liberado" value={viewingCustomer.whatsapp_opt_in ? 'Sim' : 'Não'} /></section></div></div></motion.div></div>}
      </AnimatePresence>
    </div>
  );
}


type CustomerFormModalProps = {
  value: any;
  onChange: (v: any) => void;
  submitText: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

function CustomerFormModal({ value, onChange, submitText, onSubmit, onCancel }: CustomerFormModalProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-4">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center"><Users className="h-5 w-5" /></div><div><h4 className="font-black text-foreground">Dados do cliente</h4><p className="text-[11px] text-muted-foreground">Cadastro principal e identificação.</p></div></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome completo</label><input type="text" required className="w-full h-12 rounded-2xl border border-border/40 bg-muted/20 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" value={value.name || ''} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</label><input type="email" className="w-full h-12 rounded-2xl border border-border/40 bg-muted/20 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" value={value.email || ''} onChange={(e) => onChange({ ...value, email: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone / WhatsApp</label><input type="text" className="w-full h-12 rounded-2xl border border-border/40 bg-muted/20 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" value={value.phone || ''} onChange={(e) => onChange({ ...value, phone: e.target.value })} /></div>
        </section>

        <section className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-4">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><ShieldCheck className="h-5 w-5" /></div><div><h4 className="font-black text-foreground">Informações adicionais</h4><p className="text-[11px] text-muted-foreground">Campos úteis para loja física e atendimento.</p></div></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CPF / CNPJ</label><input type="text" className="w-full h-12 rounded-2xl border border-border/40 bg-muted/20 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" value={value.cpf_cnpj || value.document || value.cpf || ''} onChange={(e) => onChange({ ...value, cpf_cnpj: e.target.value, document: e.target.value, cpf: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label><select className="w-full h-12 rounded-2xl border border-border/40 bg-muted/20 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" value={value.status || 'active'} onChange={(e) => onChange({ ...value, status: e.target.value })}><option value="active">Ativo</option><option value="inactive">Banido</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observações</label><textarea rows={4} className="w-full rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/20 resize-none" value={value.notes || ''} onChange={(e) => onChange({ ...value, notes: e.target.value })} /></div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-12 rounded-2xl px-8 bg-brand text-white font-black">{submitText}</Button>
      </div>
    </form>
  );
}

function InfoBox({ icon: Icon, label, value }: any) {
  return <div className="rounded-2xl border border-border/40 bg-card/40 p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center text-brand"><Icon className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="text-sm font-bold text-foreground break-words">{value}</p></div></div></div>;
}

function InfoRow({ label, value, multiline = false }: any) {
  return <div className="rounded-2xl border border-border/40 bg-background/70 p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div><div className={cn("mt-2 text-sm font-bold text-foreground break-words", multiline && "min-h-[72px] whitespace-pre-wrap")}>{value}</div></div>;
}
