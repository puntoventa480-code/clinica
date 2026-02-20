
import React, { useState, useEffect } from 'react';
import { ClinicAsset, Currency } from '../types';
import { Icons } from '../constants';

interface ClinicAssetsProps {
  assets: ClinicAsset[];
  onAddAsset: (asset: ClinicAsset) => void;
  onUpdateAsset: (asset: ClinicAsset) => void;
  onDeleteAsset: (id: string) => void;
}

const ClinicAssets: React.FC<ClinicAssetsProps> = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<ClinicAsset>>({
    name: '',
    category: 'Instrumental',
    quantity: 1,
    priceUnitCUP: 0,
    priceUnitUSD: 0,
    shippingCostCUP: 0,
    shippingCostUSD: 0,
    dateAcquired: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const totalInvestmentCUP = assets.reduce((sum, a) => sum + a.totalCUP, 0);
  const totalInvestmentUSD = assets.reduce((sum, a) => sum + a.totalUSD, 0);

  // Determinar la tasa de cambio implícita del formulario
  const getExchangeRate = () => {
    if (formData.priceUnitUSD && formData.priceUnitUSD > 0 && formData.priceUnitCUP && formData.priceUnitCUP > 0) {
      return formData.priceUnitCUP / formData.priceUnitUSD;
    }
    return 350; // Tasa por defecto si no hay precios definidos
  };

  const handleShippingChange = (currency: Currency, value: number) => {
    const rate = getExchangeRate();
    if (currency === 'CUP') {
      setFormData({
        ...formData,
        shippingCostCUP: value,
        shippingCostUSD: Number((value / rate).toFixed(2))
      });
    } else {
      setFormData({
        ...formData,
        shippingCostUSD: value,
        shippingCostCUP: Number((value * rate).toFixed(2))
      });
    }
  };

  const handleOpenEdit = (asset: ClinicAsset) => {
    setFormData({ ...asset });
    setEditingAssetId(asset.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setFormData({ 
      name: '', 
      category: 'Instrumental', 
      quantity: 1, 
      priceUnitCUP: 0, 
      priceUnitUSD: 0, 
      shippingCostCUP: 0,
      shippingCostUSD: 0,
      dateAcquired: new Date().toISOString().split('T')[0], 
      notes: '' 
    });
    setIsEditing(false);
    setEditingAssetId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.quantity) || 1;
    const pCUP = Number(formData.priceUnitCUP) || 0;
    const pUSD = Number(formData.priceUnitUSD) || 0;
    const sCUP = Number(formData.shippingCostCUP) || 0;
    const sUSD = Number(formData.shippingCostUSD) || 0;

    const assetData: ClinicAsset = {
      ...(formData as ClinicAsset),
      id: isEditing ? (editingAssetId || '') : Math.random().toString(36).substr(2, 9),
      totalCUP: (qty * pCUP) + sCUP,
      totalUSD: (qty * pUSD) + sUSD,
    };

    if (isEditing) {
      onUpdateAsset(assetData);
    } else {
      onAddAsset(assetData);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Activos & Equipamiento</h1>
          <p className="text-slate-500 font-medium">Gestión de instrumental quirúrgico, mobiliario y tecnología clínica.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-8 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Icons.Plus /> Registrar Recurso
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión en Equipos (CUP)</p>
          <h3 className="text-3xl font-black text-slate-900">$ {totalInvestmentCUP.toLocaleString()}</h3>
          <div className="absolute top-4 right-4 text-slate-50 opacity-10 group-hover:opacity-100 transition-opacity">
             <Icons.Stethoscope />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Inversión en Equipos (USD)</p>
          <h3 className="text-3xl font-black text-emerald-600">$ {totalInvestmentUSD.toLocaleString()}</h3>
        </div>
        <div className="bg-sky-50 p-8 rounded-[3rem] border border-sky-100 shadow-sm">
          <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Total de Unidades</p>
          <h3 className="text-3xl font-black text-sky-700">{assets.reduce((sum, a) => sum + a.quantity, 0)}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Recurso / Categoría</th>
                <th className="px-8 py-6 text-center">Cantidad</th>
                <th className="px-8 py-6 text-center">Logística</th>
                <th className="px-8 py-6 text-center">Inversión Total</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                         {asset.category === 'Instrumental' ? <Icons.Stethoscope /> : <Icons.Briefcase />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{asset.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-600">
                    {asset.quantity} ud.
                  </td>
                  <td className="px-8 py-5 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Envío:</p>
                    <p className="text-xs font-bold text-amber-600">$ {(asset.shippingCostCUP || 0).toLocaleString()} CUP</p>
                    <p className="text-[9px] font-bold text-amber-500">$ {(asset.shippingCostUSD || 0).toLocaleString()} USD</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <p className="text-sm font-black text-slate-900">$ {asset.totalCUP.toLocaleString()} CUP</p>
                    <p className="text-[10px] font-black text-emerald-500">$ {asset.totalUSD.toLocaleString()} USD</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(asset)}
                        className="p-3 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Editar Recurso"
                      >
                        <Icons.Edit />
                      </button>
                      <button 
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-3 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar Recurso"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest text-xs">
                    Sin activos registrados en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border border-slate-200">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-4 ${isEditing ? 'bg-sky-600' : 'bg-indigo-600'} text-white rounded-[1.5rem] shadow-xl`}>
                  {isEditing ? <Icons.Edit /> : <Icons.Box />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">
                    {isEditing ? 'Editar Recurso' : 'Registrar Nuevo Activo'}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Patrimonio Noah's Agency</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Recurso</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="Ej: Sillón Odontológico Mod. X" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                    <option value="Instrumental">Instrumental Quirúrgico</option>
                    <option value="Mobiliario">Mobiliario Clínica/Oficina</option>
                    <option value="Equipos">Equipos Médicos Pesados</option>
                    <option value="Tecnología">Hardware y Tecnología</option>
                    <option value="Otros">Otros Recursos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad</label>
                    <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Unit. (CUP)</label>
                    <input required type="number" value={formData.priceUnitCUP} onChange={e => setFormData({...formData, priceUnitCUP: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-indigo-600" placeholder="0.00" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Precio Unit. (USD)</label>
                    <input required type="number" value={formData.priceUnitUSD} onChange={e => setFormData({...formData, priceUnitUSD: Number(e.target.value)})} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl outline-none font-black text-emerald-600" placeholder="0.00" />
                 </div>
              </div>

              {/* Logística de Envío Bimonetaria */}
              <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-4">
                 <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Icons.Briefcase /> Gastos de Envío / Comisión Logística
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Comisión en CUP</label>
                       <input 
                        type="number" 
                        value={formData.shippingCostCUP}
                        onChange={e => handleShippingChange('CUP', Number(e.target.value))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-black text-lg focus:border-amber-500"
                        placeholder="0.00"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Comisión en USD</label>
                       <input 
                        type="number" 
                        value={formData.shippingCostUSD}
                        onChange={e => handleShippingChange('USD', Number(e.target.value))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl outline-none text-emerald-400 font-black text-lg focus:border-amber-500"
                        placeholder="0.00"
                       />
                    </div>
                 </div>
                 <p className="text-[9px] text-slate-500 italic px-2">La relación se calcula según la tasa de cambio implícita de los precios unitarios (1 : {getExchangeRate().toFixed(2)}).</p>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas / Especificaciones</label>
                 <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-medium h-20 resize-none" placeholder="Marca, garantía, número de serie..."></textarea>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                 <button type="submit" className={`flex-[2] py-4 ${isEditing ? 'bg-sky-600 hover:bg-sky-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl shadow-xl transition-all`}>
                   {isEditing ? 'Actualizar Patrimonio' : 'Guardar en Patrimonio'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicAssets;
