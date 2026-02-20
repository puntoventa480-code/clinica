
import React, { useState, useMemo } from 'react';
import { Patient, FixedExpense, Appointment, DistributionConfig, User, Currency, DistributionFund } from '../types';
import { Icons } from '../constants';

interface FinancialDistributionProps {
  patients: Patient[];
  fixedExpenses: FixedExpense[];
  otherExpenses: FixedExpense[];
  appointments: Appointment[];
  users: User[];
  config: DistributionConfig;
  onUpdateConfig: (config: DistributionConfig) => void;
  onAddExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onAddOtherExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  onDeleteOtherExpense: (id: string) => void;
}

const FinancialDistribution: React.FC<FinancialDistributionProps> = ({ 
  patients, fixedExpenses, otherExpenses, appointments, users, config, onUpdateConfig, onAddExpense, onDeleteExpense, onAddOtherExpense, onDeleteOtherExpense 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'range'>('range');
  const [dateRange, setDateRange] = useState({ 
    start: (() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; })(), 
    end: new Date().toISOString().split('T')[0] 
  });
  
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseFormTarget, setExpenseFormTarget] = useState<'FIXED' | 'OTHER'>('FIXED');

  const [referenceRate, setReferenceRate] = useState(350);
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>('CUP');
  
  const [newExp, setNewExp] = useState<Omit<FixedExpense, 'id'>>({
    category: '',
    amountCUP: 0,
    amountUSD: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const distribution = useMemo(() => {
    const allRecords = patients.flatMap(p => p.history.map(h => ({ ...h, patientName: p.name })));
    
    const filterFn = (itemDate: string) => {
      if (viewMode === 'day') {
        return itemDate === selectedDate;
      }
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    };

    const filteredRecords = allRecords.filter(r => filterFn(r.date));
    const filteredFixedExpenses = fixedExpenses.filter(e => filterFn(e.date));
    const filteredOtherExpenses = otherExpenses.filter(e => filterFn(e.date));
    const filteredReservations = appointments.filter(a => a.status !== 'cancelled' && filterFn(a.date));

    // 1. Ingresos Brutos
    const incomeFromTreatmentsCUP = filteredRecords.reduce((sum, r) => sum + r.amountPaidCUP, 0);
    const incomeFromReservationsCUP = filteredReservations.reduce((sum, a) => sum + (a.reservationFeeCUP || 0), 0);
    const totalIncomeCUP = incomeFromTreatmentsCUP + incomeFromReservationsCUP;

    // 2. Gastos Directos (Operativos)
    const totalFixedSpentCUP = filteredFixedExpenses.reduce((sum, e) => sum + e.amountCUP, 0);
    const totalOtherSpentCUP = filteredOtherExpenses.reduce((sum, e) => sum + e.amountCUP, 0);

    // 3. Comisiones Médicas
    const totalDoctorCommissionsCUP = filteredRecords.reduce((sum, r) => sum + (r.amountPaidCUP * (config.doctorCommission / 100)), 0);

    // 4. Utilidad Clínica para reparto
    const clinicProfitBeforeInvestorCUP = totalIncomeCUP - totalDoctorCommissionsCUP - totalFixedSpentCUP - totalOtherSpentCUP;

    // 5. Cálculo Dinámico de Fondos e Inversor
    let totalInvestorShareCUP = 0;
    const chartData = config.funds.map(item => {
      const fundValueCUP = Math.max(0, clinicProfitBeforeInvestorCUP * (item.percentage / 100));
      if (item.name.toLowerCase().includes('inversor')) {
        totalInvestorShareCUP += fundValueCUP;
      }
      return { ...item, value: fundValueCUP };
    });

    // 6. GASTOS TOTALES (Fijos + Otros + Honorarios + Inversor)
    const grandTotalExpensesCUP = totalFixedSpentCUP + totalOtherSpentCUP + totalDoctorCommissionsCUP + totalInvestorShareCUP;
    
    // 7. GANANCIA NETA REAL (Ingreso Bruto - Gastos Totales)
    const finalNetProfitCUP = totalIncomeCUP - grandTotalExpensesCUP;

    return {
      totalIncomeCUP,
      totalFixedSpentCUP,
      totalOtherSpentCUP,
      totalDoctorCommissionsCUP,
      totalInvestorShareCUP,
      grandTotalExpensesCUP,
      finalNetProfitCUP,
      chartData,
      filteredFixedExpenses,
      filteredOtherExpenses,
      totalConfigPercent: config.funds.reduce((sum, f) => sum + f.percentage, 0)
    };
  }, [patients, fixedExpenses, otherExpenses, appointments, users, selectedDate, dateRange, viewMode, config]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.category || (newExp.amountCUP <= 0)) return;
    if (expenseFormTarget === 'FIXED') onAddExpense(newExp);
    else onAddOtherExpense(newExp);
    setNewExp({ ...newExp, category: '', amountCUP: 0, amountUSD: 0, notes: '' });
    setShowExpenseForm(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Liquidación & Cierre Maestro</h1>
          <p className="text-slate-500 font-medium">Contabilidad consolidada y distribución de beneficios.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setViewMode('day')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Día</button>
             <button onClick={() => setViewMode('range')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'range' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Rango</button>
          </div>
          {viewMode === 'day' ? (
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black px-4 py-2 outline-none" />
          ) : (
            <div className="flex items-center gap-2">
               <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-50 border-none rounded-xl text-xs font-black px-2 py-2 outline-none w-32" />
               <span className="text-slate-300 font-bold">-</span>
               <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-50 border-none rounded-xl text-xs font-black px-2 py-2 outline-none w-32" />
            </div>
          )}
          <button onClick={() => setIsEditingConfig(!isEditingConfig)} className={`p-2 rounded-xl transition-all ${isEditingConfig ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}><Icons.Dashboard /></button>
        </div>
      </header>

      {/* BALANCE MAESTRO DE CIERRE */}
      <div className="bg-slate-900 rounded-[3.5rem] p-6 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-7 space-y-8">
            <h2 className="text-xs font-black text-sky-400 uppercase tracking-[0.4em] mb-4">Egresos Consolidados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gastos Operativos (Fijos+Otros)</p>
                <p className="text-2xl font-black">$ {(distribution.totalFixedSpentCUP + distribution.totalOtherSpentCUP).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Honorarios Médicos (Dr.)</p>
                <p className="text-2xl font-black text-sky-400">$ {distribution.totalDoctorCommissionsCUP.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Participación Inversor</p>
                <p className="text-2xl font-black text-amber-500">$ {distribution.totalInvestorShareCUP.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Total Gastos Acumulados</p>
                <p className="text-3xl font-black">$ {distribution.grandTotalExpensesCUP.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center items-center text-center space-y-6 lg:border-l lg:border-white/10 lg:pl-12">
            <div className="space-y-2">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.5em]">Ganancia Neta Real</h3>
              <p className="text-5xl lg:text-7xl font-black tracking-tighter text-white">$ {Math.max(0, distribution.finalNetProfitCUP).toLocaleString()}</p>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Saldo de Caja (CUP)</p>
            </div>
            <div className="w-full h-px bg-white/10"></div>
            <div className="grid grid-cols-2 w-full gap-4">
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Ingreso Bruto</p>
                <p className="text-lg font-black">$ {distribution.totalIncomeCUP.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-red-500 uppercase mb-1">Gastos Totales</p>
                <p className="text-lg font-black text-red-400">- $ {distribution.grandTotalExpensesCUP.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditingConfig && (
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl animate-slideUp space-y-8">
           <div className="flex justify-between items-center">
             <h3 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em]">Configuración de Reparto Dinámico</h3>
             <button onClick={() => onUpdateConfig({...config, funds: [...config.funds, { id: Math.random().toString(36).substr(2, 9), name: 'Nuevo Fondo', percentage: 0, color: '#'+Math.floor(Math.random()*16777215).toString(16) }]})} className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all">+ Añadir Fondo</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:border-r lg:border-white/10 pr-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Comisión Dr (%)</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-2xl">
                     <input type="number" value={config.doctorCommission} onChange={e => onUpdateConfig({...config, doctorCommission: Number(e.target.value)})} className="bg-transparent text-white font-black text-lg outline-none w-full" />
                     <span className="text-slate-500">%</span>
                  </div>
              </div>
              {config.funds.map((fund) => (
                <div key={fund.id} className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl relative group">
                  <button onClick={() => onUpdateConfig({...config, funds: config.funds.filter(f => f.id !== fund.id)})} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Icons.Trash /></button>
                  <input type="text" value={fund.name} onChange={e => onUpdateConfig({...config, funds: config.funds.map(f => f.id === fund.id ? {...f, name: e.target.value} : f)})} className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none border-b border-white/10 w-full focus:border-sky-500 pb-1" />
                  <div className="flex items-center gap-3">
                     <div className="flex-1 flex items-center gap-2 bg-black/20 p-2 rounded-xl">
                        <input type="number" value={fund.percentage} onChange={e => onUpdateConfig({...config, funds: config.funds.map(f => f.id === fund.id ? {...f, percentage: Number(e.target.value)} : f)})} className="bg-transparent text-white font-black text-base outline-none w-full text-center" />
                        <span className="text-slate-500 text-xs">%</span>
                     </div>
                     <input type="color" value={fund.color} onChange={e => onUpdateConfig({...config, funds: config.funds.map(f => f.id === fund.id ? {...f, color: e.target.value} : f)})} className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-900 shadow-2xl animate-slideUp space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-lg font-black text-slate-900 italic">Registrar Gasto</h3><button onClick={() => setShowExpenseForm(false)} className="text-slate-400 hover:text-red-500"><Icons.Trash /></button></div>
          <form onSubmit={handleAddExpenseSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Concepto</label><input required list="all-cats" placeholder="Ej: Luz, Insumos..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} /><datalist id="all-cats"><option value="Luz" /><option value="Agua" /><option value="Alquiler" /><option value="Marketing" /></datalist></div>
            <div className="md:col-span-4 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Monto (CUP)</label><input required type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={newExp.amountCUP} onChange={e => setNewExp({...newExp, amountCUP: Number(e.target.value), amountUSD: Number((Number(e.target.value)/referenceRate).toFixed(2))})} /></div>
            <div className="md:col-span-2 flex items-end"><button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl">Guardar</button></div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30"><h3 className="text-sm font-black text-slate-900 italic">Egresos Fijos</h3><button onClick={() => { setExpenseFormTarget('FIXED'); setShowExpenseForm(true); }} className="text-red-600 font-black text-[9px] uppercase">Añadir +</button></div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {distribution.filteredFixedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-red-50/30 group"><td className="px-6 py-4"><p className="text-xs font-bold text-slate-800">{exp.category}</p><p className="text-[9px] text-slate-400">{exp.date}</p></td><td className="px-6 py-4 text-right"><p className="text-xs font-black text-slate-900">$ {exp.amountCUP.toLocaleString()}</p><button onClick={() => onDeleteExpense(exp.id)} className="text-[9px] text-red-500 opacity-0 group-hover:opacity-100 uppercase font-black">Eliminar</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-amber-50/30"><h3 className="text-sm font-black text-slate-900 italic">Otros Egresos</h3><button onClick={() => { setExpenseFormTarget('OTHER'); setShowExpenseForm(true); }} className="text-amber-600 font-black text-[9px] uppercase">Añadir +</button></div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {distribution.filteredOtherExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-amber-50/30 group"><td className="px-6 py-4"><p className="text-xs font-bold text-slate-800">{exp.category}</p><p className="text-[9px] text-slate-400">{exp.date}</p></td><td className="px-6 py-4 text-right"><p className="text-xs font-black text-slate-900">$ {exp.amountCUP.toLocaleString()}</p><button onClick={() => onDeleteOtherExpense(exp.id)} className="text-[9px] text-red-500 opacity-0 group-hover:opacity-100 uppercase font-black">Eliminar</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDistribution;
