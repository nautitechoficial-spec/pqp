import React from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  activeChip: string;
  setActiveChip: (val: string) => void;
  categories: any[];
  filters: any;
  setFilters: (val: any) => void;
  onOpenAdvanced: () => void;
}

export default function ProductFilters({ 
  searchTerm, 
  setSearchTerm, 
  activeChip, 
  setActiveChip,
  categories,
  filters,
  setFilters,
  onOpenAdvanced
}: ProductFiltersProps) {
  const chips = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Ativos' },
    { id: 'inactive', label: 'Inativos' },
    { id: 'lowStock', label: 'Estoque baixo' },
    { id: 'noImage', label: 'Sem imagem' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU, categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <option value="all">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Advanced Filters Button */}
        <button
          onClick={onOpenAdvanced}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Filter className="w-4 h-4" />
          Filtros avançados
        </button>
      </div>

      {/* Quick Chips - 2x2 Grid */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
        {chips.filter(c => c.id !== 'noImage').map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveChip(chip.id)}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center",
              activeChip === chip.id
                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {chip.label}
          </button>
        ))}
        
        {/* Clear Filters if any */}
        {(searchTerm || filters.category !== 'all' || activeChip !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({ ...filters, category: 'all' });
              setActiveChip('all');
            }}
            className="col-span-2 sm:col-auto flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
