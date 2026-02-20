
import React, { useState } from 'react';
import { CommissionEntry, InventoryHistoryEntry } from '../types';
import { Icons } from '../constants';

interface CommissionsProps {
  commissions: CommissionEntry[];
  inventoryHistory: InventoryHistoryEntry[];
  onMarkAsPaid: (id: string) => void;
}

const Commissions: React.FC<CommissionsProps> = ({ commissions, inventoryHistory, onMarkAsPaid }) => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'products'>('doctors');
  const [filterDoctor, setFilterDoctor] = useState('Todos');

  const doctors = ['Todos', ...Array.from(new Set(commissions.map(c => c.doctorName)))];
  
  const filteredCommissions = filterDoctor === 'Todos' 
    ? commissions 
    : commissions.filter(c => c.doctorName === filterDoctor);

  // Doctor stats bimonetario
  const totalCUP = filteredCommissions.reduce((sum, c) => sum + c.commissionCUP, 0);
  const totalUSD = filteredCommissions.reduce((sum, c) => sum + c.commissionUSD, 0);
  
  const pendingCUP = filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionCUP, 0);
  const pendingUSD = filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionUSD, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finanzas & Comisiones</h1>
          <p className="text-slate-500 font-medium">Desglose bimonetario de honorarios y adquisiciones.</p>
        </div>
        
        {activeTab === 'doctors' && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Médico:</span>
            <select 
              value={filterDoctor} 
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
            >
              {doctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
            </select>
          </div>
        )}
      </header>

      {/* Primay Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-md">
        <button 
          onClick={() => setActiveTab('doctors')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'doctors' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
        >
          Honorarios Médicos
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'products' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
        >
          Costos Almacén
        </button>
      </div>

      {activeTab === 'doctors' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Generado (CUP)</p>
              <h3 className="text-2xl font-black text-slate-900">$ {totalCUP.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Generado (USD)</p>
              <h3 className="text-2xl font-black text-emerald-600">$ {totalUSD.toLocaleString()}</h3>
            </div>
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pendiente CUP</p>
              <h3 className="text-2xl font-black text-amber-700">$ {pendingCUP.toLocaleString()}</h3>
            </div>
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pendiente USD</p>
              <h3 className="text-2xl font-black text-amber-700">$ {pendingUSD.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6">Especialista / Cita</th>
                  <th className="px-8 py-6">Monto Servicio</th>
                  <th className="px-8 py-6">Comisión CUP</th>
                  <th className="px-8 py-6">Comisión USD</th>
                  <th className="px-8 py-6">Estado</th>
                  <th className="px-8 py-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{c.doctorName}</span>
                        <span className="text-[10px] text-slate-400">{c.treatmentType} - {c.patientName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-bold text-slate-500">CUP: ${c.priceCUP.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-emerald-600">USD: ${c.priceUSD.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-900">$ {c.commissionCUP.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-emerald-600">$ {c.commissionUSD.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${c.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {c.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {c.status === 'pending' && (
                        <button onClick={() => onMarkAsPaid(c.id)} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-800">
                          Liquidar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white p-20 text-center rounded-[3rem] opacity-40">
           <Icons.Box />
           <p className="mt-4 font-black uppercase tracking-widest">Panel de adquisición en desarrollo</p>
        </div>
      )}
    </div>
  );
};

export default Commissions;
