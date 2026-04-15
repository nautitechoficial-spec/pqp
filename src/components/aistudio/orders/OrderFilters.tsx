import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, X, 
  ChevronDown, CreditCard, Truck, 
  Globe, User, ArrowDownUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface OrderFiltersProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: any) => void;
  onPeriodChange: (period: string) => void;
  activePeriod: string;
  onClearFilters: () => void;
}

export default function OrderFilters({ onSearch, onFilterChange, onPeriodChange, activePeriod, onClearFilters }: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'paid', label: 'Pagos' },
    { id: 'pending', label: 'Pendentes' },
    { id: 'awaiting_separation', label: 'Separação' },
    { id: 'shipped', label: 'Postados' },
    { id: 'delivered', label: 'Entregues' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  const periods = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'month', label: 'Este mês' },
    { id: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por ID, nome, e-mail, CPF ou telefone..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all shadow-sm"
          />
        </div>

        {/* Período */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={clsx(
                "px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all",
                activePeriod === p.id ? "bg-white text-[#FF6B00] shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all",
              showAdvanced ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </button>
          <button 
            onClick={onClearFilters}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl border border-slate-200 transition-all"
            title="Limpar Filtros"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs / Chips de Status */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              onFilterChange({ status: tab.id });
            }}
            className={clsx(
              "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
              activeTab === tab.id 
                ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-100" 
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros Avançados Drawer-style or Dropdown */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-3 h-3" />
                  Pagamento
                </label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                  <option value="">Todos</option>
                  <option value="pix">PIX</option>
                  <option value="card">Cartão de Crédito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  Canal
                </label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                  <option value="">Todos</option>
                  <option value="store">Loja Virtual</option>
                  <option value="affiliate">Afiliado</option>
                  <option value="marketplace">Marketplace</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-3 h-3" />
                  Frete
                </label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                  <option value="">Todos</option>
                  <option value="melhor_envio">Melhor Envio</option>
                  <option value="fixo">Frete Fixo</option>
                  <option value="km">Entrega por KM</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowDownUp className="w-3 h-3" />
                  Valor
                </label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
                  <input type="number" placeholder="Max" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
