
import React, { useState } from 'react';
import { InventoryItem, InventoryHistoryEntry, InventoryExitEntry, InventoryExtraExitEntry } from '../types';
import { Icons } from '../constants';
import InventoryModal from './InventoryModal';

interface InventoryProps {
  items: InventoryItem[];
  history: InventoryHistoryEntry[];
  exitHistory: InventoryExitEntry[];
  extraExitHistory?: InventoryExtraExitEntry[];
  onAddItem: (item: InventoryItem, isRestock: boolean) => void;
  onExtraExit?: (itemId: string, units: number, reason: string, notes: string) => void;
  onDeleteItem: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  items, history, exitHistory, extraExitHistory = [], onAddItem, onExtraExit, onDeleteItem 
}) => {
  type TabId = 'stock' | 'history' | 'exits' | 'extra';
  const [activeTab, setActiveTab] = useState<TabId>('stock');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'NEW' | 'EDIT' | 'RESTOCK' | 'EXTRA_EXIT'>('NEW');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const totalRealValueCUP = items.reduce((sum, i) => sum + (i.totalCUP), 0);
  const totalHistoricInvestmentCUP = items.reduce((sum, i) => sum + (i.cumulativeTotalCUP || i.totalCUP || 0), 0);

  const tabs = [
    { id: 'stock', label: 'Existencias Real', icon: Icons.Box },
    { id: 'history', label: 'Entradas Almacén', icon: Icons.Plus },
    { id: 'exits', label: 'Salidas Clínica', icon: Icons.Users },
    { id: 'extra', label: 'Salidas Especiales', icon: Icons.Trash },
  ];

  const handleOpenModal = (mode: 'NEW' | 'EDIT' | 'RESTOCK' | 'EXTRA_EXIT', item: InventoryItem | null = null) => {
    setModalMode(mode);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmModal = (item: InventoryItem, isRestock: boolean, extraData?: { units: number, reason: string, notes: string }) => {
    if (modalMode === 'EXTRA_EXIT' && extraData && onExtraExit) {
      onExtraExit(item.id, extraData.units, extraData.reason, extraData.notes);
    } else {
      onAddItem(item, isRestock);
    }
  };

  const handleSelectTab = (id: TabId) => {
    setActiveTab(id);
    setIsTabMenuOpen(false);
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label;

  return (
    <div className="space-y-6 animate-fadeIn pb-24 pt-16 lg:pt-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Almacén Central</h1>
          <p className="text-slate-500 font-medium">Control de stock, capital invertido y logística bimonetaria.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleOpenModal('NEW')}
            className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Icons.Plus /> Nuevo Registro
          </button>
        </div>
      </header>

      {/* TABS - MOBILE FOLDABLE / DESKTOP NORMAL */}
      <div className="relative sticky top-16 z-[40] lg:static lg:z-0">
        <div className="lg:hidden">
           <button 
             onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
             className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-indigo-600 shadow-lg"
           >
              <span className="flex items-center gap-3">
                {tabs.find(t => t.id === activeTab)?.icon()} {currentTabLabel}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-500 ${isTabMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
           </button>
           
           {isTabMenuOpen && (
             <div className="absolute left-0 right-0 top-20 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[100] animate-slideUp overflow-hidden">
                {tabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id as TabId)}
                    className={`w-full flex items-center gap-5 p-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 last:border-none transition-all active:bg-indigo-50 ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                  >
                    {tab.icon()} {tab.label}
                  </button>
                ))}
             </div>
           )}
        </div>

        <div className="hidden lg:flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full max-w-2xl shadow-inner border border-slate-200">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stock' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Real Stock (CUP)</p>
              <h3 className="text-2xl font-black text-slate-900">$ {totalRealValueCUP.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Inversión Histórica (CUP)</p>
              <h3 className="text-2xl font-black text-amber-600">$ {totalHistoricInvestmentCUP.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertas de Stock</p>
              <h3 className="text-2xl font-black text-red-500">{items.filter(i => i.stock < i.minStock).length}</h3>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ítems</p>
              <h3 className="text-2xl font-black text-indigo-600">{items.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-6">Insumo</th>
                    <th className="px-8 py-6 text-center">Stock</th>
                    <th className="px-8 py-6 text-center">Valorización</th>
                    <th className="px-8 py-6 text-right">Logística</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => {
                    const isLow = item.stock < item.minStock;
                    const histTotalUnits = item.cumulativePurchased || item.stock || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLow ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-400'}`}>
                              <Icons.Box />
                            </div>
                            <div className="max-w-xs">
                              <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-base font-black ${isLow ? 'text-red-500' : 'text-slate-800'}`}>
                              {item.stock} {item.unit}
                            </span>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-50">
                               <div className={`h-full ${isLow ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (item.stock / (histTotalUnits || 1)) * 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className="text-sm font-black text-slate-900">$ {item.totalCUP.toLocaleString()}</span>
                           <p className="text-[9px] font-black text-emerald-500 uppercase mt-1">1 USD : {item.exchangeRate}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button onClick={() => handleOpenModal('RESTOCK', item)} className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"><Icons.Plus /></button>
                            <button onClick={() => handleOpenModal('EXTRA_EXIT', item)} className="p-3 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm"><Icons.Trash /></button>
                            <button onClick={() => handleOpenModal('EDIT', item)} className="p-3 text-sky-600 bg-sky-50 hover:bg-sky-500 hover:text-white rounded-xl transition-all shadow-sm"><Icons.Edit /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-6">Fecha / Insumo</th>
                    <th className="px-8 py-6">Cantidad</th>
                    <th className="px-8 py-6">Costo Insumos</th>
                    <th className="px-8 py-6 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.sort((a,b) => b.date.localeCompare(a.date)).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter block mb-1">{new Date(entry.date).toLocaleString()}</span>
                        <span className="text-sm font-black text-slate-900">{entry.itemName}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-emerald-600">+ {entry.unitsAdded} Uds.</span>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-sm font-black text-slate-900">$ {entry.totalCUP.toLocaleString()} CUP</span>
                         <p className="text-[9px] font-black text-slate-400">Logística: $ {entry.shippingCostCUP || 0} CUP</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-lg">Entrada</span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (<tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Sin registros de entrada.</td></tr>)}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'exits' && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-red-900 text-white uppercase text-[9px] font-black tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-6">Insumo</th>
                    <th className="px-8 py-6">Paciente</th>
                    <th className="px-8 py-6">Doctor</th>
                    <th className="px-8 py-6 text-center">Uds.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exitHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5"><span className="text-sm font-black text-slate-900">{entry.itemName}</span></td>
                      <td className="px-8 py-5"><span className="text-xs font-bold text-slate-700">{entry.patientName}</span></td>
                      <td className="px-8 py-5"><span className="text-[10px] font-black text-slate-400 uppercase">{entry.doctorName}</span></td>
                      <td className="px-8 py-5 text-center font-black text-red-600">- {entry.unitsRemoved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmModal} initialData={editingItem} mode={modalMode} />
    </div>
  );
};

export default Inventory;
