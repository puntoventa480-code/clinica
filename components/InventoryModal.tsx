
import React, { useState, useEffect } from 'react';
import { InventoryItem, Currency } from '../types';
import { Icons } from '../constants';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InventoryItem, isRestock: boolean, extraData?: any) => void;
  initialData?: InventoryItem | null;
  mode?: 'EDIT' | 'RESTOCK' | 'NEW' | 'EXTRA_EXIT';
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onConfirm, initialData, mode = 'NEW' }) => {
  const isEditing = mode === 'EDIT';
  const isRestocking = mode === 'RESTOCK';
  const isNew = mode === 'NEW';
  const isExtraExit = mode === 'EXTRA_EXIT';
  
  const [inputCurrency, setInputCurrency] = useState<Currency>('CUP');
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    description: '',
    category: 'Consumibles',
    stock: 0,
    cumulativePurchased: 0,
    minStock: 5,
    unit: 'unidades',
    exchangeRate: 350,
    totalCUP: 0,
    totalUSD: 0,
    cumulativeTotalCUP: 0,
    cumulativeTotalUSD: 0
  });

  const [entryData, setEntryData] = useState({
    units: 0,
    costUnit: 0,
    rateAtMoment: 350,
    shippingCostCUP: 0,
    shippingCostUSD: 0
  });

  const [exitData, setExitData] = useState({
    units: 0,
    reason: 'Vencimiento',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      const currentRate = initialData.exchangeRate || 350;
      if (isRestocking) {
        setEntryData({
          units: 0,
          costUnit: 0,
          rateAtMoment: currentRate,
          shippingCostCUP: 0,
          shippingCostUSD: 0
        });
      }
      if (isExtraExit) {
        setExitData({
          units: 0,
          reason: 'Vencimiento',
          notes: ''
        });
      }
    } else {
      setFormData({
        name: '', description: '', category: 'Consumibles', stock: 0, cumulativePurchased: 0, minStock: 5, 
        unit: 'unidades', exchangeRate: 350, totalCUP: 0, totalUSD: 0,
        cumulativeTotalCUP: 0, cumulativeTotalUSD: 0
      });
      setEntryData({
        units: 0,
        costUnit: 0,
        rateAtMoment: 350,
        shippingCostCUP: 0,
        shippingCostUSD: 0
      });
    }
  }, [initialData, isOpen, mode]);

  const handleShippingChange = (currency: Currency, value: number) => {
    const rate = entryData.rateAtMoment || 350;
    if (currency === 'CUP') {
      setEntryData({
        ...entryData,
        shippingCostCUP: value,
        shippingCostUSD: Number((value / rate).toFixed(2))
      });
    } else {
      setEntryData({
        ...entryData,
        shippingCostUSD: value,
        shippingCostCUP: Number((value * rate).toFixed(2))
      });
    }
  };

  const calculateTotalOp = () => {
    let baseCost = entryData.units * entryData.costUnit;
    let shipping = inputCurrency === 'CUP' ? entryData.shippingCostCUP : entryData.shippingCostUSD;
    return baseCost + shipping;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalItem: InventoryItem;

    if (isExtraExit && initialData) {
      onConfirm(initialData, false, { 
        units: Number(exitData.units), 
        reason: exitData.reason, 
        notes: exitData.notes 
      });
      onClose();
      return;
    }

    if ((isRestocking || isNew) && !isEditing) {
      const incomingUnits = Number(entryData.units);
      const rate = Number(entryData.rateAtMoment);
      
      let addedCUP = 0;
      let addedUSD = 0;

      if (inputCurrency === 'CUP') {
        addedCUP = (incomingUnits * entryData.costUnit) + entryData.shippingCostCUP;
        addedUSD = addedCUP / rate;
      } else {
        addedUSD = (incomingUnits * entryData.costUnit) + entryData.shippingCostUSD;
        addedCUP = addedUSD * rate;
      }

      const prevStock = isNew ? 0 : (initialData?.stock || 0);
      const prevCumulative = isNew ? 0 : (initialData?.cumulativePurchased || 0);
      const prevTotalCUP = isNew ? 0 : (initialData?.totalCUP || 0);
      const prevTotalUSD = isNew ? 0 : (initialData?.totalUSD || 0);
      const prevCumTotalCUP = isNew ? 0 : (initialData?.cumulativeTotalCUP || 0);
      const prevCumTotalUSD = isNew ? 0 : (initialData?.cumulativeTotalUSD || 0);

      const updatedStock = prevStock + incomingUnits;
      const updatedCumulative = prevCumulative + incomingUnits;
      
      const updatedTotalCUP = prevTotalCUP + addedCUP;
      const updatedTotalUSD = prevTotalUSD + addedUSD;

      const updatedCumulativeTotalCUP = prevCumTotalCUP + addedCUP;
      const updatedCumulativeTotalUSD = prevCumTotalUSD + addedUSD;

      finalItem = {
        ...(isNew ? formData : initialData) as InventoryItem,
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        stock: updatedStock,
        cumulativePurchased: updatedCumulative,
        totalCUP: Number(updatedTotalCUP.toFixed(2)),
        totalUSD: Number(updatedTotalUSD.toFixed(2)),
        cumulativeTotalCUP: Number(updatedCumulativeTotalCUP.toFixed(2)),
        cumulativeTotalUSD: Number(updatedCumulativeTotalUSD.toFixed(2)),
        exchangeRate: rate,
        lastPaidCurrency: inputCurrency,
        pricePerUnitCUP: inputCurrency === 'CUP' ? entryData.costUnit : entryData.costUnit * rate,
        pricePerUnitUSD: inputCurrency === 'USD' ? entryData.costUnit : entryData.costUnit / rate,
        // Al registrar una entrada, pasamos los datos extra para el historial
        ...({ 
          shippingCostCUP: entryData.shippingCostCUP,
          shippingCostUSD: entryData.shippingCostUSD 
        } as any)
      };
    } else {
      finalItem = {
        ...(formData as InventoryItem),
        id: initialData?.id || Math.random().toString(36).substr(2, 9)
      };
    }

    onConfirm(finalItem, isRestocking || isNew);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border border-slate-200">
        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${isRestocking || isNew ? 'bg-emerald-600' : isExtraExit ? 'bg-amber-600' : 'bg-sky-600'} text-white rounded-[1.5rem] shadow-xl`}>
              {isRestocking || isNew ? <Icons.Plus /> : isExtraExit ? <Icons.Trash /> : <Icons.Edit />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 italic">
                {isRestocking ? `Entrada: ${initialData?.name}` : isExtraExit ? `Salida Especial: ${initialData?.name}` : isNew ? 'Registrar Nuevo Insumo' : `Editar Maestros: ${initialData?.name}`}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isRestocking || isNew ? 'Especifique cantidad, precio unitario y gastos de logística.' : 'Defina los parámetros básicos del producto.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[85vh] custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LADO IZQUIERDO: MAESTROS */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Información Maestra</h3>
            <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre del Insumo</label>
                <input 
                  disabled={isRestocking || isExtraExit}
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold disabled:opacity-50 focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: Resina A2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descripción</label>
                <textarea 
                  disabled={isRestocking || isExtraExit}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-medium text-xs h-24 resize-none disabled:opacity-50 focus:ring-2 focus:ring-sky-500"
                  placeholder="Marca, lote o especificaciones..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Stock Alerta</label>
                  <input 
                    disabled={isExtraExit}
                    type="number" 
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold disabled:opacity-50 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-indigo-600 uppercase ml-1 tracking-widest">Tasa de Cambio</label>
                  <input 
                    disabled={isExtraExit}
                    type="number" 
                    value={isRestocking || isNew ? entryData.rateAtMoment : formData.exchangeRate}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (isRestocking || isNew) setEntryData({...entryData, rateAtMoment: val});
                      else setFormData({...formData, exchangeRate: val});
                    }}
                    className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none font-black text-indigo-600 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: OPERACIONES */}
          <div className="lg:col-span-7">
            {isRestocking || isNew ? (
              <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Contabilidad de Entrada</h3>
                  <div className="flex bg-white/10 p-1 rounded-xl">
                    {(['CUP', 'USD'] as Currency[]).map(c => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setInputCurrency(c)}
                        className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${inputCurrency === c ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        Pagar en {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad de Insumos</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        value={entryData.units} 
                        onChange={e => setEntryData({...entryData, units: Number(e.target.value)})} 
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none focus:border-emerald-500" 
                        placeholder="0"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">Unidades</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio por Insumo ({inputCurrency})</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        value={entryData.costUnit} 
                        onChange={e => setEntryData({...entryData, costUnit: Number(e.target.value)})} 
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-emerald-400 outline-none focus:border-emerald-500" 
                        placeholder="0.00"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">{inputCurrency} / Ud</span>
                    </div>
                  </div>
                </div>

                {/* Gastos de Envío Bimonetarios */}
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    Gastos de Envío / Logística
                    <Icons.Briefcase />
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Comisión en CUP</label>
                      <input 
                        type="number" 
                        value={entryData.shippingCostCUP} 
                        onChange={e => handleShippingChange('CUP', Number(e.target.value))} 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-black text-lg text-white outline-none focus:border-amber-500" 
                        placeholder="0.00 CUP"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Comisión en USD</label>
                      <input 
                        type="number" 
                        value={entryData.shippingCostUSD} 
                        onChange={e => handleShippingChange('USD', Number(e.target.value))} 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-black text-lg text-emerald-400 outline-none focus:border-amber-500" 
                        placeholder="0.00 USD"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 italic">Los montos están vinculados por la tasa de cambio actual (1:{entryData.rateAtMoment}).</p>
                </div>

                <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total de la Operación</p>
                    <p className="text-4xl font-black text-white">
                      $ {calculateTotalOp().toLocaleString()} <span className="text-xs text-slate-500">{inputCurrency}</span>
                    </p>
                  </div>
                  <button type="submit" className="px-10 py-5 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-500 shadow-xl transition-all active:scale-95">
                    {isNew ? 'Registrar Insumo' : 'Confirmar Entrada'}
                  </button>
                </div>
              </div>
            ) : isExtraExit ? (
              <div className="bg-amber-900 rounded-[3rem] p-8 text-white shadow-2xl space-y-8">
                 <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">Detalle de Salida Especial</h3>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad a Retirar</label>
                      <input 
                        required
                        type="number" 
                        max={initialData?.stock}
                        value={exitData.units} 
                        onChange={e => setExitData({...exitData, units: Number(e.target.value)})} 
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none focus:border-amber-500" 
                        placeholder="0"
                      />
                      <p className="text-[10px] text-amber-400 font-bold ml-1">Disponibles: {initialData?.stock} {initialData?.unit}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de la Salida</label>
                      <select 
                        value={exitData.reason}
                        onChange={e => setExitData({...exitData, reason: e.target.value})}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-amber-500"
                      >
                         <option value="Vencimiento" className="bg-amber-900">Vencimiento / Caducidad</option>
                         <option value="Deterioro" className="bg-amber-900">Deterioro / Rotura</option>
                         <option value="Donación" className="bg-amber-900">Donación / Ayuda</option>
                         <option value="Uso Personal" className="bg-amber-900">Uso Personal / Externo</option>
                         <option value="Otro" className="bg-amber-900">Otro Motivo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Adicionales</label>
                      <textarea 
                        value={exitData.notes}
                        onChange={e => setExitData({...exitData, notes: e.target.value})}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-medium text-xs text-white h-24 resize-none outline-none focus:border-amber-500"
                        placeholder="Escriba detalles adicionales aquí..."
                      />
                    </div>
                 </div>

                 <div className="pt-8 border-t border-white/10 flex justify-end">
                    <button type="submit" disabled={exitData.units <= 0} className="px-10 py-5 bg-amber-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-amber-500 shadow-xl transition-all disabled:opacity-30">Confirmar Salida</button>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Visualización de Stock</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Stock Actual</p>
                         <p className="text-3xl font-black text-slate-900">{formData.stock} {formData.unit}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200">
                         <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Total Comprado</p>
                         <p className="text-2xl font-black text-indigo-600">{formData.cumulativePurchased} {formData.unit}</p>
                      </div>
                   </div>
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Capital Invertido</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor en Stock (CUP)</p>
                         <p className="text-xl font-black text-slate-900">$ {formData.totalCUP?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200">
                         <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Gasto Histórico (CUP)</p>
                         <p className="text-xl font-black text-amber-600">$ {formData.cumulativeTotalCUP?.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
                <button type="submit" className="w-full py-5 bg-sky-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-sky-700 shadow-xl transition-all">Guardar Cambios Maestros</button>
              </div>
            )}
            <button type="button" onClick={onClose} className="w-full mt-4 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600">Cancelar Operación</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
