import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Printer, User, MapPin, 
  CreditCard, Truck, Package, History,
  ExternalLink, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Save,
  Zap, RefreshCw, Trash2, MessageSquare, ArrowRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Order, OrderItem } from '../../../aistudioTypes';
import { dashboardService } from '../../../services/dashboardService';
import { useToast } from '../../../context/ToastContext';

interface OrderDetailsDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function OrderDetailsDrawer({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsDrawerProps) {
  const toast = useToast();
  const [activeStatus, setActiveStatus] = useState(order?.statusLogistic || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [labelStep, setLabelStep] = useState(0); // 0: closed, 1: confirm data, 2: select service, 3: success
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (order) {
      setActiveStatus(order.statusLogistic);
    }
  }, [order]);

  if (!order) return null;

  const handleSaveStatus = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onUpdateStatus(order.id, activeStatus);
    setIsSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copiado', 'Informação copiada para a área de transferência.');
  };

  const handleGenerateLabel = () => { setLabelStep(1); };

  const nextLabelStep = () => {
    setLabelStep(prev => prev + 1);
  };

  const finishLabelGeneration = async () => {
    setIsGeneratingLabel(true);
    try {
      const res = await dashboardService.generateOrderLabel(order.id);
      setLabelStep(3);
      onUpdateStatus(order.id, 'label_generated');
      if (res?.label_url) {
        window.open(res.label_url, '_blank', 'noopener,noreferrer');
      }
      toast.success('Etiqueta Gerada', 'A etiqueta real foi gerada com sucesso.');
    } catch (e: any) {
      toast.error('Falha ao gerar etiqueta', e?.message || 'Não foi possível gerar a etiqueta.');
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handlePrint = async () => {
    if (!hasLabel) {
      toast.warning('Ação Necessária', 'Gere a etiqueta antes de imprimir.');
      return;
    }
    try {
      const res = await dashboardService.printOrderLabel(order.id);
      if (res?.label_url) window.open(res.label_url, '_blank', 'noopener,noreferrer');
      toast.success('Impressão pronta', 'A etiqueta foi preparada para impressão.');
    } catch (e: any) {
      toast.error('Falha na impressão', e?.message || 'Não foi possível abrir a etiqueta.');
    }
  };

  const handleSyncLogistics = async () => {
    setIsSyncing(true);
    try {
      await dashboardService.syncOrderLabel(order.id);
      toast.success('Sincronizado', 'Dados logísticos atualizados no Melhor Envio.');
    } catch (e: any) {
      toast.error('Falha ao sincronizar', e?.message || 'Não foi possível sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCancelLogistics = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelLogistics = () => {
    setShowCancelConfirm(false);
    onUpdateStatus(order.id, 'awaiting_separation');
    toast.success('Cancelado', 'A logística deste pedido foi cancelada.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      cancelled: 'Cancelado',
      awaiting_separation: 'Separação',
      ready_for_shipping: 'Pronto',
      label_generated: 'Etiqueta',
      shipped: 'Postado',
      in_transit: 'Trânsito',
      out_for_delivery: 'Entrega',
      delivered: 'Entregue',
      failed: 'Falha',
      returned: 'Devolvido'
    };
    return labels[status] || status;
  };

  const logisticStatuses = [
    { value: 'awaiting_separation', label: 'Aguardando Separação' },
    { value: 'ready_for_shipping', label: 'Pronto para Envio' },
    { value: 'label_generated', label: 'Etiqueta Gerada' },
    { value: 'shipped', label: 'Postado' },
    { value: 'in_transit', label: 'Em Trânsito' },
    { value: 'out_for_delivery', label: 'Saiu para Entrega' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'failed', label: 'Falha' },
    { value: 'returned', label: 'Devolvido' },
  ];

  const hasLabel = order.statusLogistic === 'label_generated' || order.statusLogistic === 'shipped' || order.statusLogistic === 'in_transit' || order.statusLogistic === 'out_for_delivery' || order.statusLogistic === 'delivered';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-slate-50 z-[70] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Package className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{order.id}</h2>
                    <button 
                      onClick={() => copyToClipboard(order.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {/* Status Badges */}
              <div className="flex gap-3">
                <div className={clsx(
                  "flex-1 p-3 rounded-2xl border flex flex-col items-center justify-center gap-1",
                  getStatusColor(order.statusPayment)
                )}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Pagamento</div>
                  <div className="text-xs font-black uppercase tracking-wider">{getStatusLabel(order.statusPayment)}</div>
                </div>
                <div className={clsx(
                  "flex-1 p-3 rounded-2xl border flex flex-col items-center justify-center gap-1",
                  getStatusColor(order.statusLogistic)
                )}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Logística</div>
                  <div className="text-xs font-black uppercase tracking-wider">{getStatusLabel(order.statusLogistic)}</div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                  <CreditCard className="w-4 h-4 text-[#FF6B00]" />
                  Resumo Financeiro
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Frete</span>
                    <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.shippingValue)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>Desconto</span>
                      <span className="font-bold">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.discount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900">Total</span>
                    <span className="text-lg font-black text-[#FF6B00]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Método</div>
                      <div className="text-xs font-bold text-slate-700">{order.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Situação</div>
                    <div className="text-xs font-bold text-emerald-600">Aprovado</div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <User className="w-4 h-4 text-[#FF6B00]" />
                    Cliente
                  </div>
                  <button className="text-[10px] font-bold text-[#FF6B00] hover:underline uppercase tracking-widest">Ver Perfil</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {order.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        {order.customerEmail}
                        <button onClick={() => copyToClipboard(order.customerEmail)} className="p-1 hover:bg-slate-50 rounded-md transition-all"><Copy className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button 
                      onClick={() => copyToClipboard(`${order.customerName}\n${order.customerEmail}\n${order.customerPhone}`)}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar Dados
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <MapPin className="w-4 h-4 text-[#FF6B00]" />
                    Endereço de Entrega
                  </div>
                  <button 
                    onClick={() => copyToClipboard(`${order.address.street}, ${order.address.number} - ${order.address.city}/${order.address.state}`)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-900">{order.address.street}, {order.address.number}</p>
                  {order.address.complement && <p>{order.address.complement}</p>}
                  <p>{order.address.neighborhood}</p>
                  <p>{order.address.city} - {order.address.state}</p>
                  <p className="mt-1 font-mono text-slate-400">{order.address.zipCode}</p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Package className="w-4 h-4 text-[#FF6B00]" />
                    Itens do Pedido
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0">
                        <img src={item.image || 'https://picsum.photos/seed/product/100/100'} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">{item.name}</div>
                        {item.variation && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.variation}</div>}
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-[10px] font-bold text-slate-500">Qtd: {item.quantity}</div>
                          <div className="text-xs font-black text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Truck className="w-4 h-4 text-[#FF6B00]" />
                  Logística e Rastreio
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Método</div>
                    <div className="text-xs font-black text-slate-700">{order.shippingMethod === 'melhor_envio' ? 'Melhor Envio' : 'Frete Fixo'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo</div>
                    <div className="text-xs font-black text-slate-700">{order.shippingDeadline ? `${order.shippingDeadline} dia(s)` : 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código de Rastreio</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-500">
                      {order.trackingCode || 'Não disponível'}
                    </div>
                    {order.trackingCode && (
                      <button 
                        onClick={() => copyToClipboard(order.trackingCode!)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4 pt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3 h-3" />
                    Histórico Logístico
                  </div>
                  <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {order.logisticHistory.map((history, i) => (
                      <div key={i} className="flex gap-4 relative pl-6">
                        <div className={clsx(
                          "absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white z-10",
                          i === 0 ? "bg-[#FF6B00]" : "bg-slate-200"
                        )} />
                        <div>
                          <div className={clsx(
                            "text-xs font-black",
                            i === 0 ? "text-slate-900" : "text-slate-500"
                          )}>
                            {getStatusLabel(history.status)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {new Date(history.timestamp).toLocaleString('pt-BR')}
                          </div>
                          {history.description && (
                            <div className="text-[10px] text-slate-500 mt-1 italic">{history.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-2 font-bold">
                  <Zap className="w-4 h-4 text-[#FF6B00]" />
                  Ações de Logística
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGenerateLabel}
                    disabled={hasLabel}
                    className={clsx(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2",
                      hasLabel ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                  >
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Gerar Etiqueta</span>
                  </button>
                  <button 
                    onClick={handlePrint}
                    disabled={!hasLabel}
                    className={clsx(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2",
                      !hasLabel ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-[#FF6B00] hover:bg-[#E66000] text-white"
                    )}
                  >
                    <Printer className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Imprimir</span>
                  </button>
                  <button 
                    onClick={handleSyncLogistics}
                    className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all gap-2"
                  >
                    <RefreshCw className={clsx("w-5 h-5", isSyncing && "animate-spin")} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizar</span>
                  </button>
                  <button 
                    onClick={handleCancelLogistics}
                    disabled={!hasLabel}
                    className={clsx(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2",
                      !hasLabel ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    )}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cancelar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / Status Edit */}
            <div className="p-6 bg-white border-t border-slate-200 shrink-0 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alterar Status Logístico</label>
                <div className="flex gap-2">
                  <select 
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
                  >
                    {logisticStatuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleSaveStatus}
                    disabled={isSaving || activeStatus === order.statusLogistic}
                    className={clsx(
                      "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                      isSaving || activeStatus === order.statusLogistic
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-[#FF6B00] text-white hover:bg-[#E66000] shadow-lg shadow-orange-100"
                    )}
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Label Generation Flow Modal */}
            <AnimatePresence>
              {labelStep > 0 && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-xl font-black text-slate-900">Gerar Etiqueta</h2>
                      <button onClick={() => setLabelStep(0)} className="p-2 hover:bg-white rounded-xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="p-8">
                      {labelStep === 1 && (
                        <div className="space-y-6">
                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                            <Info className="w-5 h-5 text-[#FF6B00] shrink-0" />
                            <p className="text-xs text-orange-700 font-medium leading-relaxed">
                              Confirme os dados de envio antes de prosseguir com a geração da etiqueta.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destinatário</div>
                              <div className="text-sm font-bold text-slate-900">{order.customerName}</div>
                              <div className="text-xs text-slate-500 mt-1">{order.address.street}, {order.address.number}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviço</div>
                              <div className="text-sm font-bold text-slate-900">{order.shippingService || (order.shippingMethod === 'melhor_envio' ? 'Melhor Envio' : 'Frete Fixo')}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {labelStep === 2 && (
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviço confirmado</div>
                            <div className="text-sm font-bold text-slate-900">{order.shippingService || 'Melhor Envio'}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{order.shippingDeadline ? `Prazo estimado: ${order.shippingDeadline} dia(s)` : 'Prazo conforme cotação escolhida no checkout'}</div>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                            <Truck className="w-5 h-5 text-[#FF6B00] shrink-0" />
                            <p className="text-xs text-orange-700 font-medium leading-relaxed">
                              A etiqueta será gerada usando o serviço real salvo no pedido no momento do checkout.
                            </p>
                          </div>
                          <button 
                            onClick={finishLabelGeneration}
                            disabled={isGeneratingLabel}
                            className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                          >
                            {isGeneratingLabel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            <span className="text-sm font-bold">{isGeneratingLabel ? 'Gerando etiqueta...' : 'Gerar etiqueta agora'}</span>
                          </button>
                        </div>
                      )}

                      {labelStep === 3 && (
                        <div className="text-center space-y-6 py-4">
                          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900">Sucesso!</h3>
                            <p className="text-sm text-slate-500 mt-2">Sua etiqueta foi gerada e está pronta para impressão.</p>
                          </div>
                          <button 
                            onClick={() => setLabelStep(0)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
                          >
                            Concluir
                          </button>
                        </div>
                      )}
                    </div>

                    {labelStep < 3 && (
                      <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setLabelStep(0)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                        {labelStep === 1 && (
                          <button 
                            onClick={nextLabelStep}
                            className="flex-1 py-4 bg-[#FF6B00] text-white rounded-2xl font-bold shadow-xl shadow-orange-100"
                          >
                            Confirmar Dados
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
              {showCancelConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Cancelar Logística?</h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                      Esta ação irá cancelar a etiqueta gerada e retornar o pedido para a fase de separação.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={confirmCancelLogistics}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100"
                      >
                        Sim, Cancelar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
