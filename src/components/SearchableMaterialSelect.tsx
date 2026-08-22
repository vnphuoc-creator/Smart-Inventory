import React, { useState, useRef, useEffect } from 'react';
import { Material, CalculatedMaterialStock } from '../types';
import { Search, ChevronDown, Check, Plus, Package } from 'lucide-react';

interface SearchableMaterialSelectProps {
  value: string; // materialCode
  materials: Material[];
  calculatedStocks?: CalculatedMaterialStock[];
  onChange: (materialCode: string, selectedMaterial?: Material) => void;
  onAddNewCustomMaterial?: (name: string, unit: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableMaterialSelect: React.FC<SearchableMaterialSelectProps> = ({
  value,
  materials,
  calculatedStocks,
  onChange,
  onAddNewCustomMaterial,
  placeholder = 'Gõ tên hoặc mã vật tư để tìm kiếm...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected material
  const selectedMaterial = materials.find((m) => m.code === value);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter materials based on search term
  const filteredMaterials = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return materials.slice(0, 50); // Show top 50 initially
    }

    const term = searchTerm.toLowerCase().trim();
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const normTerm = normalize(term);

    return materials
      .filter((m) => {
        const codeMatch = m.code.toLowerCase().includes(term);
        const nameMatch = m.name.toLowerCase().includes(term) || normalize(m.name).includes(normTerm);
        const specMatch = (m.specification || '').toLowerCase().includes(term) || normalize(m.specification || '').includes(normTerm);
        const catMatch = (m.category || '').toLowerCase().includes(term);
        return codeMatch || nameMatch || specMatch || catMatch;
      })
      .slice(0, 50);
  }, [materials, searchTerm]);

  const handleSelect = (mat: Material) => {
    onChange(mat.code, mat);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpenDropdown = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button / Display Bar */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        className={`w-full text-left bg-slate-800 hover:bg-slate-750 border ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700'
        } rounded-lg px-2.5 py-1.5 text-xs text-white flex items-center justify-between transition-colors`}
      >
        {selectedMaterial ? (
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="font-mono font-semibold text-blue-400 shrink-0">
              {selectedMaterial.code}
            </span>
            <span className="text-slate-200 truncate">{selectedMaterial.name}</span>
            <span className="text-slate-400 text-[11px] shrink-0 font-normal">
              ({selectedMaterial.unit})
            </span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="font-mono font-semibold text-blue-400 shrink-0">
              {value}
            </span>
            <span className="text-slate-300 truncate">Vật tư: {value}</span>
          </div>
        ) : (
          <span className="text-slate-400 truncate">{placeholder}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown with Real-time Search */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[320px] max-w-[550px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-800 bg-slate-850 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ tên hoặc mã (ví dụ: MCB, cadivi, van, TOTO, cos...)"
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none py-1"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-800 rounded shrink-0"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((mat) => {
                const stockObj = calculatedStocks?.find((s) => s.code === mat.code);
                const currentStock = stockObj !== undefined ? stockObj.currentStock : mat.initialStock;
                const isSelected = mat.code === value;

                return (
                  <div
                    key={mat.code}
                    onClick={() => handleSelect(mat)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-900/40 text-blue-200 font-medium'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-blue-400 shrink-0">
                          {mat.code}
                        </span>
                        <span className="truncate text-slate-100 font-normal">
                          {mat.name}
                        </span>
                      </div>
                      {mat.specification && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {mat.specification}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <div className="text-[11px]">
                        <span className="text-slate-400 mr-1">Tồn:</span>
                        <span
                          className={`font-mono font-semibold ${
                            currentStock <= 0
                              ? 'text-rose-400'
                              : currentStock <= mat.minStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {currentStock} {mat.unit}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                <Package className="w-6 h-6 mx-auto text-slate-500 mb-1 opacity-60" />
                <p>Không tìm thấy vật tư khớp với "{searchTerm}"</p>
                {onAddNewCustomMaterial && searchTerm.trim().length >= 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewCustomMaterial(searchTerm.trim(), 'Cái');
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mx-auto bg-blue-950/60 border border-blue-800 px-2.5 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm nhanh "{searchTerm}" vào danh mục
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Hiển thị {filteredMaterials.length} / {materials.length} vật tư</span>
            <span>Gõ để thu hẹp kết quả</span>
          </div>
        </div>
      )}
    </div>
  );
};
