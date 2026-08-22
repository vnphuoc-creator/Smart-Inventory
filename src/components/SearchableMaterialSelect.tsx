import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Material, CalculatedMaterialStock } from '../types';
import { Search, ChevronDown, Check, Plus, Package, X } from 'lucide-react';

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
  placeholder = 'Nhập tên hoặc mã vật tư (gợi ý tự động)...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightIndex, setHighlightIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected material
  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.code === value);
  }, [materials, value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter materials based on search term
  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) {
      return materials.slice(0, 60); // Show top 60 initially
    }

    const term = searchTerm.toLowerCase().trim();
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');

    const normTerm = normalize(term);
    const words = term.split(/\s+/).filter(Boolean);
    const normWords = normTerm.split(/\s+/).filter(Boolean);

    return materials
      .filter((m) => {
        const rawCode = m.code.toLowerCase();
        const rawName = m.name.toLowerCase();
        const rawSpec = (m.specification || '').toLowerCase();
        const rawCat = (m.category || '').toLowerCase();

        const normName = normalize(m.name);
        const normSpec = normalize(m.specification || '');

        // Direct code match
        if (rawCode.includes(term)) return true;

        // Direct name match
        if (rawName.includes(term) || normName.includes(normTerm)) return true;

        // All words match
        const allWordsMatch = normWords.every(
          (w) => normName.includes(w) || normSpec.includes(w) || rawCode.includes(w)
        );
        if (allWordsMatch) return true;

        return rawSpec.includes(term) || rawCat.includes(term);
      })
      .slice(0, 60);
  }, [materials, searchTerm]);

  // Reset highlight on search change
  useEffect(() => {
    setHighlightIndex(0);
  }, [searchTerm]);

  const handleSelect = (mat: Material) => {
    onChange(mat.code, mat);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredMaterials.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMaterials.length > 0 && filteredMaterials[highlightIndex]) {
        handleSelect(filteredMaterials[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Combobox Trigger */}
      {!isOpen && selectedMaterial ? (
        <div
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="w-full bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/60 rounded-lg p-2 text-xs text-white flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm group"
          title={`${selectedMaterial.code} - ${selectedMaterial.name} (${selectedMaterial.specification || ''})`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded shrink-0">
              {selectedMaterial.code}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-100 truncate text-xs leading-tight">
                {selectedMaterial.name}
              </div>
              {selectedMaterial.specification && (
                <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {selectedMaterial.specification}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {selectedMaterial.unit}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>
      ) : (
        <div
          className={`w-full bg-slate-800 hover:bg-slate-750 border ${
            isOpen ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700'
          } rounded-lg px-2.5 py-2 text-xs text-white flex items-center justify-between transition-colors shadow-sm`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={isOpen ? searchTerm : value ? `Mã: ${value}` : ''}
              placeholder={placeholder}
              onFocus={() => {
                setIsOpen(true);
                setSearchTerm('');
              }}
              onChange={(e) => {
                if (!isOpen) setIsOpen(true);
                setSearchTerm(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none py-0.5"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {isOpen && searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }}
                className="p-0.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) {
                  setTimeout(() => inputRef.current?.focus(), 50);
                }
              }}
              className="p-0.5 text-slate-400 hover:text-white"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180 text-blue-400' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Popover Dropdown with Real-time Search Suggestions */}
      {isOpen && (
        <div className="absolute z-[9999] left-0 top-full mt-1 w-full min-w-[360px] sm:min-w-[460px] max-w-[640px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header prompt */}
          <div className="px-3 py-1.5 bg-slate-850 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-blue-400">Gợi ý danh mục vật tư ({filteredMaterials.length} kết quả):</span>
            <span className="text-[10px] text-slate-400">Dùng phím ↑ ↓ Enter để chọn nhanh</span>
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((mat, idx) => {
                const stockObj = calculatedStocks?.find((s) => s.code === mat.code);
                const currentStock = stockObj !== undefined ? stockObj.currentStock : mat.initialStock;
                const isSelected = mat.code === value;
                const isHighlighted = idx === highlightIndex;

                return (
                  <div
                    key={mat.code}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => handleSelect(mat)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isHighlighted
                        ? 'bg-blue-900/60 text-white font-medium ring-1 ring-blue-500/50'
                        : isSelected
                        ? 'bg-blue-950/40 text-blue-200'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-400 shrink-0">
                          {mat.code}
                        </span>
                        <span className="truncate text-slate-100 font-medium">
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
            <span>Gõ tên tiếng Việt không dấu hoặc mã để tìm</span>
          </div>
        </div>
      )}
    </div>
  );
};
