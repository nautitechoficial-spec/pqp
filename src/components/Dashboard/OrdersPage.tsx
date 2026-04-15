import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Calendar, Filter, RefreshCw, Download, Plus, Package, CheckCircle2, Clock,
  XCircle, DollarSign, TrendingUp, Percent, Store, Globe, WalletCards, FileSpreadsheet, FileText, ShoppingCart, User, MapPin, Sparkles, Loader2
} from "lucide-react";
import { dashboardService, Order as ApiOrder } from "../../services/dashboardService";
import { Order } from "../../aistudioTypes";
import OrderList from "../aistudio/orders/OrderList";
import OrderDetailsDrawer from "../aistudio/orders/OrderDetailsDrawer";

type PeriodKey = "hoje" | "7d" | "30d" | "mes" | "personalizado";
type ProductOption = { id: string; name: string; price: number; stock: number; sku?: string; image?: string };
type CreateItem = { product_id: string; product_name: string; quantity: number; price: string; sku?: string; image_url?: string; stock?: number };
const emptyItem = (): CreateItem => ({ product_id: '', product_name: '', quantity: 1, price: '', sku: '', image_url: '', stock: 0 });
const defaultOrderForm = { customer_name:'', customer_email:'', customer_phone:'', payment_method:'PIX', channel:'physical', total_amount:'', status:'pending', notes:'', street:'', number:'', neighborhood:'', city:'', state:'', cep:'', items:[emptyItem()] };
const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";

function formatMoney(value: number | string | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mapOrder(o: ApiOrder): Order {
  const id = String((o as any).order_id ?? (o as any).id ?? "");
  let selectedPayload: any = null;
  try {
    const rawPayload = (o as any).shipping_selected_payload;
    selectedPayload = typeof rawPayload === 'string' && rawPayload ? JSON.parse(rawPayload) : (rawPayload || null);
  } catch {
    selectedPayload = null;
  }
  const rawStatus = String((o as any).status || '').toLowerCase();
  const statusPayment: Order["statusPayment"] = rawStatus === 'paid' ? 'paid' : rawStatus === 'cancelled' || rawStatus === 'canceled' ? 'cancelled' : 'pending';
  const shippingRaw = String((o as any).shipping_status || (o as any).logistics_status || '').toLowerCase();
  let statusLogistic: Order["statusLogistic"] = 'awaiting_separation';
  if (shippingRaw.includes('label')) statusLogistic = 'label_generated';
  else if (shippingRaw.includes('post')) statusLogistic = 'shipped';
  else if (shippingRaw.includes('transit') || shippingRaw.includes('trâns')) statusLogistic = 'in_transit';
  else if (shippingRaw.includes('delivery') || shippingRaw.includes('entrega')) statusLogistic = 'out_for_delivery';
  else if (shippingRaw.includes('entreg')) statusLogistic = 'delivered';
  else if (shippingRaw.includes('fail')) statusLogistic = 'failed';
  else if (shippingRaw.includes('return')) statusLogistic = 'returned';

  const items = ((o as any).items || []).map((it: any, idx: number) => ({
    id: String(it.id ?? idx + 1),
    productId: String(it.product_id ?? ''),
    name: it.product_name || it.name || 'Item',
    image: it.image || it.product_image || '',
    variation: it.variation || '',
    quantity: Number(it.quantity ?? 1),
    price: Number(it.price ?? it.unit_price ?? 0),
  }));

  const subtotal = items.reduce((acc: number, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0);
  const total = Number((o as any).total_amount ?? 0);
  const shippingValue = Number((o as any).shipping_amount ?? (o as any).shipping_cost ?? 0);
  const discount = Number((o as any).discount_amount ?? (o as any).discount_total_amount ?? 0);
  const rawChannel = String((o as any).channel || (o as any).sales_channel || 'store');
  const channel = rawChannel.includes('fis') ? 'physical' : rawChannel.includes('virtual') || rawChannel.includes('online') ? 'online' : rawChannel;

  return {
    id,
    storeId: String((o as any).store_id ?? ''),
    customerId: String((o as any).customer_id ?? ''),
    customerName: (o as any).customer_name || 'Cliente',
    customerEmail: (o as any).customer_email || '',
    customerPhone: (o as any).customer_phone || '',
    statusPayment,
    statusLogistic,
    shippingMethod: (((selectedPayload?.mode || (o as any).shipping_mode_selected || '').toLowerCase().includes('melhor')
      ? 'melhor_envio'
      : ((selectedPayload?.mode || (o as any).shipping_mode_selected || '').toLowerCase().includes('local') ? 'km' : 'fixo')) as any),
    shippingValue,
    shippingDeadline: String(selectedPayload?.days ?? (o as any).shipping_days_estimate ?? (o as any).shipping_eta ?? ''),
    trackingCode: (o as any).tracking_code || '',
    address: { street: (o as any).street || '', number: String((o as any).number || ''), complement: (o as any).complement || '', neighborhood: (o as any).neighborhood || '', city: (o as any).city || '', state: (o as any).state || '', zipCode: (o as any).cep || '' },
    items,
    subtotal: subtotal || total,
    discount,
    total,
    createdAt: (o as any).created_at || new Date().toISOString(),
    paymentMethod: String((o as any).payment_method || 'PIX').toUpperCase(),
    channel,
    originName: channel === 'physical' ? 'Loja física' : 'Loja virtual',
    logisticHistory: Array.isArray((o as any).history) ? (o as any).history : [],
    meShipmentId: (o as any).me_shipment_id || undefined,
    meLabelId: (o as any).me_label_id || undefined,
    meLabelUrl: (o as any).me_label_url || undefined,
    shippingService: selectedPayload?.label || selectedPayload?.service || (o as any).shipping_service || undefined,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage({ initialOrderId, onOrderHandled }: { isBlocked?: boolean; initialOrderId?: string | number | null; onOrderHandled?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportType, setExportType] = useState<'csv'|'xls'>('csv');
  const [exportScope, setExportScope] = useState<'filtered'|'all'>('filtered');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<any>(defaultOrderForm);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"todos" | "pagos" | "pendentes" | "separacao" | "postados" | "entregues" | "cancelados">("todos");
  const [period, setPeriod] = useState<PeriodKey>("30d");

  async function load() {
    setLoading(true);
    try {
      const res = await dashboardService.getOrders();
      setOrders((res.orders || []).map(mapOrder));
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    if (productOptions.length > 0 || productsLoading) return;
    setProductsLoading(true);
    try {
      const res = await dashboardService.getProducts('', 1000, 0);
      const list = Array.isArray(res?.products) ? res.products : [];
      setProductOptions(list.map((p: any) => ({
        id: String(p.id),
        name: String(p.name || 'Produto'),
        price: Number(p.promotional_price || p.basePrice || 0),
        stock: Number(p.total_stock || 0),
        sku: String(p.sku || ''),
        image: String(p.main_image || ''),
      })));
    } catch (error) {
      console.error('Erro ao carregar produtos do pedido manual', error);
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (showCreate) loadProducts();
  }, [showCreate]);
  useEffect(() => {
    if (!initialOrderId || orders.length === 0) return;
    const found = orders.find(o => String(o.id) === String(initialOrderId));
    if (found) {
      setSelectedOrder(found);
      onOrderHandled?.();
    }
  }, [initialOrderId, orders, onOrderHandled]);
  useEffect(() => {
    if (!showCreate) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showCreate]);

  const itemsTotal = useMemo(() => (createForm.items || []).reduce((acc:number, item:CreateItem) => {
    return acc + (Number(item.quantity || 0) * Number(String(item.price || 0).replace(',', '.')));
  }, 0), [createForm.items]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pagos = orders.filter(o => o.statusPayment === "paid").length;
    const pendentes = orders.filter(o => o.statusPayment !== "paid" && o.statusPayment !== "cancelled").length;
    const cancelados = orders.filter(o => o.statusPayment === "cancelled").length;
    const faturamento = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const ticket = total ? faturamento / total : 0;
    const conversao = total ? (pagos / total) * 100 : 0;
    return { total, pagos, pendentes, cancelados, faturamento, ticket, conversao };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      const matchesText = !q || String(o.id).toLowerCase().includes(q) || (o.customerName || "").toLowerCase().includes(q) || (o.customerEmail || "").toLowerCase().includes(q);
      if (!matchesText) return false;
      if (tab === "todos") return true;
      if (tab === "pagos") return o.statusPayment === "paid";
      if (tab === "pendentes") return o.statusPayment !== "paid" && o.statusPayment !== "cancelled";
      if (tab === "cancelados") return o.statusPayment === "cancelled";
      if (tab === "separacao") return o.statusLogistic === "awaiting_separation";
      if (tab === "postados") return o.statusLogistic === "shipped";
      if (tab === "entregues") return o.statusLogistic === "delivered";
      return true;
    });
  }, [orders, query, tab]);

  const handleExport = () => {
    const rows = (exportScope === 'all' ? orders : filtered).map((o: any) => ({
      pedido: o.id, cliente: o.customerName, email: o.customerEmail, telefone: o.customerPhone,
      status_pagamento: o.statusPayment, status_logistica: o.statusLogistic, total: o.total, criado_em: o.createdAt
    }));
    const fileBase = `pedidos-${new Date().toISOString().slice(0,10)}`;
    if (exportType === 'xls') {
      const table = `<table><thead><tr><th>Pedido</th><th>Cliente</th><th>Email</th><th>Telefone</th><th>Status pagamento</th><th>Status logística</th><th>Total</th><th>Criado em</th></tr></thead><tbody>${rows.map((r:any)=>`<tr><td>${r.pedido}</td><td>${r.cliente || ''}</td><td>${r.email || ''}</td><td>${r.telefone || ''}</td><td>${r.status_pagamento}</td><td>${r.status_logistica}</td><td>${r.total}</td><td>${r.criado_em}</td></tr>`).join('')}</tbody></table>`;
      downloadBlob(new Blob([`﻿${table}`], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${fileBase}.xls`);
    } else {
      const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r:any)=>Object.values(r).map(v=>`"${String(v ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileBase}.csv`);
    }
    setShowExport(false);
  };

  const updateItem = (idx:number, patch: Partial<CreateItem>) => {
    setCreateForm((prev:any) => {
      const items = [...(prev.items || [])];
      items[idx] = { ...items[idx], ...patch };
      let nextTotal = prev.total_amount;
      if (!String(prev.total_amount || '').trim() || Number(String(prev.total_amount).replace(',', '.')) === 0) {
        const calc = items.reduce((acc:number, item:CreateItem) => acc + (Number(item.quantity || 0) * Number(String(item.price || 0).replace(',', '.'))), 0);
        nextTotal = calc ? calc.toFixed(2).replace('.', ',') : '';
      }
      return { ...prev, items, total_amount: nextTotal };
    });
  };

  const selectProduct = (idx:number, productId:string) => {
    const product = productOptions.find(p => p.id === productId);
    if (!product) return;
    updateItem(idx, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price.toFixed(2).replace('.', ','),
      sku: product.sku || '',
      image_url: product.image || '',
      stock: product.stock || 0,
    });
  };

  const lookupCep = async () => {
    const cep = String(createForm.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      setCepLoading(true);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data || data.erro) return;
      setCreateForm((prev:any) => ({
        ...prev,
        street: prev.street || data.logradouro || '',
        neighborhood: prev.neighborhood || data.bairro || '',
        city: prev.city || data.localidade || '',
        state: prev.state || data.uf || '',
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP', error);
    } finally {
      setCepLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const normalizedItems = (createForm.items || []).map((it:any) => ({
        product_id: Number(it.product_id || 0) || 0,
        product_name: it.product_name || 'Produto',
        quantity: Number(it.quantity || 1),
        price: Number(String(it.price || 0).replace(',', '.')) || 0,
        sku: it.sku || '',
        image_url: it.image_url || '',
      })).filter((it:any) => it.product_id > 0 || it.product_name);
      const payload = {
        customer_name: createForm.customer_name,
        customer_email: createForm.customer_email,
        customer_phone: createForm.customer_phone,
        payment_method: createForm.payment_method,
        status: createForm.status,
        total_amount: Number(String(createForm.total_amount || itemsTotal).replace(',', '.')) || itemsTotal || 0,
        channel: createForm.channel,
        notes: createForm.notes,
        street: createForm.street, number: createForm.number, neighborhood: createForm.neighborhood,
        city: createForm.city, state: createForm.state, cep: createForm.cep,
        items: normalizedItems,
      };
      await dashboardService.createOrder(payload);
      setShowCreate(false);
      setCreateForm(defaultOrderForm);
      await load();
    } finally {
      setCreateSubmitting(false);
    }
  };

  const kpis = [
    { icon: <Package className="h-4 w-4" />, label: "Total de pedidos", value: stats.total },
    { icon: <CheckCircle2 className="h-4 w-4" />, label: "Pedidos pagos", value: stats.pagos },
    { icon: <Clock className="h-4 w-4" />, label: "Pendentes", value: stats.pendentes },
    { icon: <XCircle className="h-4 w-4" />, label: "Cancelados", value: stats.cancelados },
    { icon: <DollarSign className="h-4 w-4" />, label: "Faturamento total", value: formatMoney(stats.faturamento) },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Ticket médio", value: formatMoney(stats.ticket) },
    { icon: <Percent className="h-4 w-4" />, label: "Conversão", value: `${stats.conversao.toFixed(1)}%` },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-center sm:justify-end gap-4">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:w-auto sm:justify-end">
          <div className="flex items-center gap-2 justify-start">
            <button onClick={load} className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => setShowExport(true)} className="h-10 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-sm"><Download className="h-4 w-4" /> <span className="hidden sm:inline">Exportar</span></button>
          </div>
          <button onClick={() => setShowCreate(true)} className="h-10 px-4 sm:px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap justify-self-center"><Plus className="h-4 w-4" /> <span>Criar pedido</span></button>
          <div className="hidden sm:block" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {kpis.map((item, idx) => <Kpi key={idx} icon={item.icon} label={item.label} value={item.value} className={idx === kpis.length - 1 && kpis.length % 2 !== 0 ? 'col-span-2 lg:col-span-1' : ''} />)}
      </div>

      <div className="rounded-2xl bg-slate-900 text-white p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-orange-400" /></div><div><p className="text-xs text-white/60 uppercase tracking-wide">Resumo do período</p><p className="text-sm">Você teve <span className="font-semibold">{stats.total}</span> pedidos, <span className="font-semibold">{stats.pagos}</span> pagos e faturou <span className="font-semibold text-orange-300">{formatMoney(stats.faturamento)}</span>.</p></div></div>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1"><span className="text-emerald-300 text-sm font-semibold">↑ 12%</span><span className="text-xs text-white/60">vs. período anterior</span></div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative"><Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por ID, nome, e-mail, CPF ou telefone..." className="w-full h-11 rounded-xl border border-slate-200 pl-11 pr-4 outline-none focus:ring-2 focus:ring-orange-200" /></div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap"><div className="h-11 rounded-xl border border-slate-200 px-3 flex items-center gap-2 text-slate-600 min-w-0"><Calendar className="h-4 w-4 shrink-0" /><select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="bg-transparent outline-none text-sm"><option value="hoje">Hoje</option><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="mes">Este mês</option><option value="personalizado">Personalizado</option></select></div><button onClick={() => setShowAdvancedFilters(v => !v)} className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-sm"><Filter className="h-4 w-4" /> Filtros</button></div>
        </div>
        {showAdvancedFilters && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2"><FilterChip icon={WalletCards} label="PIX, cartão, dinheiro" /><FilterChip icon={Store} label="Loja física ou virtual" /><FilterChip icon={Package} label="Separação e entrega" /></div>}
        <div className="flex flex-wrap gap-2"><Pill active={tab==="todos"} onClick={() => setTab("todos")}>Todos</Pill><Pill active={tab==="pagos"} onClick={() => setTab("pagos")}>Pagos</Pill><Pill active={tab==="pendentes"} onClick={() => setTab("pendentes")}>Pendentes</Pill><Pill active={tab==="separacao"} onClick={() => setTab("separacao")}>Separação</Pill><Pill active={tab==="postados"} onClick={() => setTab("postados")}>Postados</Pill><Pill active={tab==="entregues"} onClick={() => setTab("entregues")}>Entregues</Pill><Pill active={tab==="cancelados"} onClick={() => setTab("cancelados")}>Cancelados</Pill></div>
      </div>

      <div className="relative"><OrderList loading={loading} orders={filtered} onSelectOrder={(id) => { const found = filtered.find(o => String(o.id) === String(id)) || orders.find(o => String(o.id) === String(id)); if (found) setSelectedOrder(found); }} selectedOrderId={selectedOrder?.id ?? null} /></div>

      <AnimatePresence>{selectedOrder && <OrderDetailsDrawer order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={(id, status) => setOrders(prev => prev.map(o => String(o.id) === String(id) ? { ...o, statusLogistic: status as any } : o))} />}</AnimatePresence>

      <AnimatePresence>{showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowExport(false)} className="absolute inset-0 bg-black/40" />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-900">Exportar pedidos</h3><p className="text-xs text-slate-500">Escolha o formato e o escopo dos dados.</p></div><button onClick={() => setShowExport(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">×</button></div>
            <div className="space-y-4">
              <div><div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Formato</div><div className="grid grid-cols-2 gap-3"><ChoiceCard active={exportType==='csv'} onClick={() => setExportType('csv')} icon={FileSpreadsheet} title="CSV" subtitle="Compatível com Excel e planilhas" /><ChoiceCard active={exportType==='xls'} onClick={() => setExportType('xls')} icon={FileText} title="XLS" subtitle="Arquivo pronto para abrir no Excel" /></div></div>
              <div><div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Escopo</div><div className="grid grid-cols-2 gap-3"><ChoiceCard active={exportScope==='filtered'} onClick={() => setExportScope('filtered')} icon={Filter} title="Filtrados" subtitle="Somente os pedidos visíveis agora" /><ChoiceCard active={exportScope==='all'} onClick={() => setExportScope('all')} icon={Package} title="Todos" subtitle="Exportar toda a base da loja" /></div></div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => setShowExport(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={handleExport} className="px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-black">Exportar agora</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowCreate(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-[28px]">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3"><div className="mt-0.5 h-11 w-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><ShoppingCart className="h-5 w-5" /></div><div><h3 className="text-lg sm:text-xl font-black text-slate-900">Criar pedido manual</h3><p className="text-xs text-slate-500 pr-4">Pedido completo para loja física ou virtual, sem depender da compra no site.</p></div></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 shrink-0">×</button></div>
            <form id="create-order-form" onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                  <Header icon={User} title="Cliente e origem" subtitle="Dados principais do comprador" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nome do cliente"><input required className={inputClass} value={createForm.customer_name} onChange={e=>setCreateForm({...createForm, customer_name:e.target.value})} /></Field>
                    <Field label="Telefone / WhatsApp"><input className={inputClass} value={createForm.customer_phone} onChange={e=>setCreateForm({...createForm, customer_phone:e.target.value})} /></Field>
                    <Field label="E-mail"><input type="email" className={inputClass} value={createForm.customer_email} onChange={e=>setCreateForm({...createForm, customer_email:e.target.value})} /></Field>
                    <Field label="Canal do pedido"><div className="grid grid-cols-2 gap-2"><ToggleCard active={createForm.channel==='physical'} onClick={()=>setCreateForm({...createForm, channel:'physical'})} icon={Store} label="Loja física" /><ToggleCard active={createForm.channel==='online'} onClick={()=>setCreateForm({...createForm, channel:'online'})} icon={Globe} label="Loja virtual" /></div></Field>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                  <Header icon={WalletCards} title="Pagamento e status" subtitle="Controle financeiro do pedido" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Método de pagamento"><select className={inputClass} value={createForm.payment_method} onChange={e=>setCreateForm({...createForm, payment_method:e.target.value})}><option value="PIX">PIX</option><option value="CARTAO">Cartão</option><option value="DINHEIRO">Dinheiro</option><option value="BOLETO">Boleto</option><option value="TRANSFERENCIA">Transferência</option></select></Field>
                    <Field label="Status do pagamento"><select className={inputClass} value={createForm.status} onChange={e=>setCreateForm({...createForm, status:e.target.value})}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="canceled">Cancelado</option><option value="refunded">Reembolsado</option></select></Field>
                    <Field label="Valor total"><input required className={inputClass} value={createForm.total_amount} onChange={e=>setCreateForm({...createForm, total_amount:e.target.value})} placeholder="0,00" /></Field>
                    <Field label="Observações"><input className={inputClass} value={createForm.notes} onChange={e=>setCreateForm({...createForm, notes:e.target.value})} placeholder="Informações adicionais do pedido" /></Field>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900 flex items-center justify-between gap-3"><span>Total calculado pelos itens</span><strong>{formatMoney(itemsTotal)}</strong></div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4 xl:col-span-2">
                  <Header icon={Package} title="Itens do pedido" subtitle="Selecione produtos reais do banco e ajuste somente a quantidade" />
                  {productsLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando produtos...</div>}
                  {(createForm.items || []).map((item:CreateItem, idx:number) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Field label={`Produto ${idx+1}`}>
                          <select className={inputClass} value={item.product_id || ''} onChange={e=>selectProduct(idx, e.target.value)}>
                            <option value="">Selecione um produto</option>
                            {productOptions.map(product => <option key={product.id} value={product.id}>{product.name} • Estoque: {product.stock}</option>)}
                          </select>
                        </Field>
                        <Field label="Quantidade"><input type="number" min="1" max={item.stock || undefined} className={inputClass} value={item.quantity} onChange={e=>updateItem(idx, { quantity: Number(e.target.value || 1) })} /></Field>
                        <Field label="Preço unitário"><input className={`${inputClass} bg-slate-50`} readOnly value={item.price} placeholder="0,00" /></Field>
                        <div className="flex items-end">{createForm.items.length > 1 && <button type="button" className="h-12 px-4 rounded-2xl border border-red-200 text-red-600 bg-white w-full md:w-auto" onClick={()=>setCreateForm({...createForm, items:createForm.items.filter((_:any,i:number)=>i!==idx)})}>Remover</button>}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <MiniInfo label="Produto" value={item.product_name || '—'} />
                        <MiniInfo label="SKU" value={item.sku || '—'} />
                        <MiniInfo label="Estoque" value={item.product_id ? String(item.stock ?? 0) : 'Selecione um produto'} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={()=>setCreateForm({...createForm, items:[...createForm.items, emptyItem()]})} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"><Sparkles className="h-4 w-4" /> Adicionar item</button>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4 xl:col-span-2">
                  <Header icon={MapPin} title="Endereço do pedido" subtitle="Pode ficar em branco para venda de balcão; ao informar o CEP, tentamos preencher os dados." />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="CEP"><div className="relative"><input className={inputClass} value={createForm.cep} onChange={e=>setCreateForm({...createForm, cep:e.target.value})} onBlur={lookupCep} />{cepLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}</div></Field>
                    <Field label="Rua"><input className={inputClass} value={createForm.street} onChange={e=>setCreateForm({...createForm, street:e.target.value})} /></Field>
                    <Field label="Número"><input className={inputClass} value={createForm.number} onChange={e=>setCreateForm({...createForm, number:e.target.value})} /></Field>
                    <Field label="Bairro"><input className={inputClass} value={createForm.neighborhood} onChange={e=>setCreateForm({...createForm, neighborhood:e.target.value})} /></Field>
                    <Field label="Cidade"><input className={inputClass} value={createForm.city} onChange={e=>setCreateForm({...createForm, city:e.target.value})} /></Field>
                    <Field label="Estado"><input className={inputClass} value={createForm.state} onChange={e=>setCreateForm({...createForm, state:e.target.value})} /></Field>
                  </div>
                </section>
              </div>
            </form>
            <div className="border-t border-slate-100 bg-white px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500">Cancelar</button><button type="submit" form="create-order-form" disabled={createSubmitting} className="px-8 py-3 rounded-2xl bg-orange-500 text-white text-sm font-black disabled:opacity-60">{createSubmitting ? 'Criando...' : 'Confirmar pedido'}</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
}

function Kpi({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white border border-slate-100 shadow-sm p-4 ${className}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p><p className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 break-words">{value}</p></div><div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">{icon}</div></div></div>;
}
function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={["h-9 px-4 rounded-full text-xs font-semibold border transition", active ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"].join(" ")}>{children}</button>;
}
function ChoiceCard({ active, onClick, icon: Icon, title, subtitle }: any) {
  return <button onClick={onClick} className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><Icon className={`mb-3 h-5 w-5 ${active ? 'text-orange-600' : 'text-slate-500'}`} /><div className="text-sm font-black text-slate-900">{title}</div><div className="text-[11px] text-slate-500">{subtitle}</div></button>;
}
function FilterChip({ icon: Icon, label }: any) { return <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon className="h-4 w-4 text-orange-500" /> {label}</div>; }
function Header({ icon: Icon, title, subtitle }: any) { return <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 text-orange-600 flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div><div><h4 className="font-black text-slate-900">{title}</h4><p className="text-[11px] text-slate-500">{subtitle}</p></div></div>; }
function Field({ label, children }: any) { return <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>{children}</div>; }
function ToggleCard({ active, onClick, icon: Icon, label }: any) { return <button type="button" onClick={onClick} className={`h-12 rounded-2xl border flex items-center justify-center gap-2 text-sm font-black ${active ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}><Icon className="h-4 w-4" /> {label}</button>; }
function MiniInfo({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</div><div className="mt-1 text-sm font-semibold text-slate-800 truncate">{value}</div></div>; }
