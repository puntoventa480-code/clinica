
import React, { useState } from 'react';
import { InvestmentEntry, Currency } from '../types';
import { Icons } from '../constants';

interface InvestmentsProps {
  investments: InvestmentEntry[];
  onAddInvestment: (investment: InvestmentEntry) => void;
  onDeleteInvestment: (id: string) => void;
}

const Investments: React.FC<InvestmentsProps> = ({ investments, onAddInvestment, onDeleteInvestment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    concept: '',
    date: new Date().toISOString().split('T')[0],
    amountCUP: 0,
    amountUSD: 0,
    notes: '',
    currency: 'CUP' as Currency,
    rate: 350
  });

  const totalCUP = investments.reduce((sum, i) => sum + i.amountCUP, 0);
  const totalUSD = investments.reduce((sum, i) => sum + i.amountUSD, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: InvestmentEntry = {
      id: Math.random().toString(36).substr(2, 9),
      concept: formData.concept,
      date: formData.date,
      amountCUP: formData.currency === 'CUP' ? formData.amountCUP : Number((formData.amountUSD * formData.rate).toFixed(2)),
      amountUSD: formData.currency === 'USD' ? formData.amountUSD : Number((formData.amountCUP / formData.rate).toFixed(2)),
      notes: formData.notes
    };
    onAddInvestment(entry);
    setIsModalOpen(false);
    setFormData({ concept: '', date: new Date().toISOString().split('T')[0], amountCUP: 0, amountUSD: 0, notes: '', currency: 'CUP', rate: 350 });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Registro de Inversiones</h1>
          <p className="text-slate-500 font-medium">Control manual de capital inyectado para infraestructura y puesta en marcha.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3"
        >
          <Icons.Plus /> Nueva Inversión
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Capital (CUP)</p>
          <h3 className="text-3xl font-black text-slate-900">$ {totalCUP.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Inversión Capital (USD)</p>
          <h3 className="text-3xl font-black text-emerald-600">$ {totalUSD.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Fecha / Concepto</th>
              <th className="px-8 py-6 text-center">Monto CUP</th>
              <th className="px-8 py-6 text-center">Monto USD</th>
              <th className="px-8 py-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {investments.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors group">
                <td className="px-8 py-5">
                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{inv.date}</p>
                  <p className="text-sm font-black text-slate-900 leading-tight">{inv.concept}</p>
                  {inv.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{inv.notes}</p>}
                </td>
                <td className="px-8 py-5 text-center font-bold text-slate-700">
                  $ {inv.amountCUP.toLocaleString()}
                </td>
                <td className="px-8 py-5 text-center font-bold text-emerald-600">
                  $ {inv.amountUSD.toLocaleString()}
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => onDeleteInvestment(inv.id)}
                    className="p-3 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Icons.Trash />
                  </button>
                </td>
              </tr>
            ))}
            {investments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">
                  Sin registros de inversión manual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Registrar Inversión</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl"><Icons.Trash /></button>
            </header>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Concepto / Motivo</label>
                <input required type="text" value={formData.concept} onChange={e => setFormData({...formData, concept: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="Ej: Remodelación Clínica" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fecha</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tasa de Cambio</label>
                  <input type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-black text-indigo-600" />
                </div>
              </div>
              <div className="p-6 bg-slate-900 rounded-[2.5rem] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Moneda de Registro</span>
                  <div className="flex bg-white/10 p-1 rounded-xl">
                    {['CUP', 'USD'].map(c => (
                      <button key={c} type="button" onClick={() => setFormData({...formData, currency: c as Currency})} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.currency === c ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Monto Invertido</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.currency === 'CUP' ? formData.amountCUP : formData.amountUSD} 
                    onChange={e => setFormData({...formData, amountCUP: formData.currency === 'CUP' ? Number(e.target.value) : formData.amountCUP, amountUSD: formData.currency === 'USD' ? Number(e.target.value) : formData.amountUSD})} 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-black text-2xl" 
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-indigo-500 transition-all">Guardar Registro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
