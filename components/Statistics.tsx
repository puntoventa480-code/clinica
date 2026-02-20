
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Patient, Appointment, InventoryHistoryEntry, ClinicAsset } from '../types';
import { Icons } from '../constants';

interface StatisticsProps {
  patients: Patient[];
  appointments: Appointment[];
  inventoryHistory: InventoryHistoryEntry[];
  assets: ClinicAsset[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const Statistics: React.FC<StatisticsProps> = ({ patients, appointments, inventoryHistory, assets }) => {
  const stats = useMemo(() => {
    const allRecords = patients.flatMap(p => p.history);
    
    // 1. Basic Financial Stats
    const incomeByMethod = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
    let totalCUP = 0;
    let totalUSD = 0;

    allRecords.forEach(record => {
      totalCUP += record.amountPaidCUP;
      totalUSD += record.amountPaidUSD;
      if (record.paymentMethod in incomeByMethod) {
        incomeByMethod[record.paymentMethod as keyof typeof incomeByMethod] += record.amountPaidCUP;
      }
    });

    const totalInventoryCUP = inventoryHistory.reduce((sum, h) => sum + h.totalCUP, 0);
    const totalAssetsCUP = assets.reduce((sum, a) => sum + a.totalCUP, 0);
    const totalGlobalInvestmentCUP = totalInventoryCUP + totalAssetsCUP;

    // 2. Service Demand Analysis
    const globalServices: Record<string, number> = {};
    const doctorServices: Record<string, Record<string, number>> = {};

    allRecords.forEach(record => {
      record.services?.forEach(svc => {
        globalServices[svc.name] = (globalServices[svc.name] || 0) + 1;
        if (!doctorServices[record.doctor]) doctorServices[record.doctor] = {};
        doctorServices[record.doctor][svc.name] = (doctorServices[record.doctor][svc.name] || 0) + 1;
      });
    });

    const attendedPatients = patients.filter(p => p.history.length > 0).length;

    const formattedGlobalServices = Object.entries(globalServices)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalServiceCount = Object.values(globalServices).reduce((a, b) => a + b, 0);

    const formattedDoctorServices = Object.entries(doctorServices).map(([docName, svcs]) => ({
      doctor: docName,
      services: Object.entries(svcs)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    }));

    const methodData = [
      { name: 'Efectivo', value: incomeByMethod.Efectivo },
      { name: 'Tarjeta', value: incomeByMethod.Tarjeta },
      { name: 'Transferencia', value: incomeByMethod.Transferencia },
    ].filter(d => d.value > 0);

    return {
      totalCUP,
      totalUSD,
      totalGlobalInvestmentCUP,
      totalAssetsCUP,
      attendedPatients,
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      methodData,
      formattedGlobalServices,
      formattedDoctorServices,
      totalServiceCount
    };
  }, [patients, appointments, inventoryHistory, assets]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Inteligencia de Negocio</h1>
        <p className="text-slate-500 font-medium">Análisis detallado de rentabilidad y demanda de servicios.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Recaudación Bruta', val: `$ ${stats.totalCUP.toLocaleString()}`, sub: `Eq: $${stats.totalUSD.toLocaleString()} USD`, color: 'text-sky-600', bg: 'bg-white' },
          { label: 'Patrimonio (Activos)', val: `$ ${stats.totalAssetsCUP.toLocaleString()}`, sub: 'Capital inmovilizado', color: 'text-indigo-600', bg: 'bg-white' },
          { label: 'Utilidad vs Inversión', val: `$ ${(stats.totalCUP - stats.totalGlobalInvestmentCUP).toLocaleString()}`, sub: 'Balance patrimonial', color: 'text-emerald-600', bg: 'bg-slate-900', isDark: true },
          { label: 'Flujo Pacientes', val: stats.attendedPatients, sub: 'Pacientes con tratamiento', color: 'text-indigo-600', bg: 'bg-white' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${kpi.isDark ? 'text-slate-500' : 'text-slate-400'}`}>{kpi.label}</p>
            <h3 className={`text-2xl font-black tracking-tighter ${kpi.isDark ? 'text-white' : kpi.color}`}>{kpi.val}</h3>
            <p className={`text-[10px] font-bold mt-1 ${kpi.isDark ? 'text-sky-400' : 'text-slate-400'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RANKING GLOBAL DE SERVICIOS */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-black text-slate-900 italic">Top Global Servicios</h3>
             <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><Icons.Stethoscope /></div>
          </div>
          <div className="space-y-6 flex-1">
            {stats.formattedGlobalServices.length === 0 ? (
              <p className="text-center text-slate-300 py-10 italic font-bold">Sin datos de servicios</p>
            ) : stats.formattedGlobalServices.map((svc, i) => {
              const perc = (svc.value / stats.totalServiceCount) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-800">{svc.name}</span>
                    <span className="text-[10px] font-black text-sky-600">{svc.value} usos</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Procedimientos Realizados: {stats.totalServiceCount}</p>
          </div>
        </div>

        {/* DEMANDA INDIVIDUAL POR DOCTOR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-4">
             <h3 className="text-lg font-black text-slate-900 italic">Especialidad por Estomatólogo</h3>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Demanda Individual</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.formattedDoctorServices.length === 0 ? (
              <div className="col-span-2 p-10 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Sin registros médicos detectados</div>
            ) : stats.formattedDoctorServices.map((doc, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 shadow-sm">
                    {doc.doctor.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{doc.doctor}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Top Servicios Solicitados</p>
                  </div>
                </div>
                <div className="space-y-4">
                   {doc.services.map((s, idx) => (
                     <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50/50 transition-colors">
                        <span className="text-[11px] font-bold text-slate-700">{s.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-indigo-600">{s.count}</span>
                           <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRÁFICOS FINANCIEROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-6 italic text-center">Vías de Ingreso</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.methodData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-xl font-black italic">Rendimiento Operativo</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Comparativa de Gestión</p>
               </div>
               <div className="text-right">
                  <p className="text-3xl font-black text-emerald-400">
                    {stats.totalAppointments > 0 ? (stats.completedAppointments / stats.totalAppointments * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[9px] font-black text-slate-500 uppercase">Efectividad de Citas</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Total Agendado</p>
                  <p className="text-3xl font-black">{stats.totalAppointments}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-emerald-500 uppercase">Finalizados</p>
                  <p className="text-3xl font-black text-emerald-400">{stats.completedAppointments}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-500 uppercase">Retención</p>
                  <p className="text-3xl font-black text-indigo-400">{stats.attendedPatients}</p>
               </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Icons.Briefcase />
                     </div>
                     <span className="text-xs font-bold text-slate-300">Resumen patrimonial bimonetario activo</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-3 py-1 rounded-full">Inversión Protegida</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
