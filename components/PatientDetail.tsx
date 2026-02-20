
import React, { useState, useMemo } from 'react';
import { Patient, TreatmentRecord, Service, PerformedService, ConsumedItem, InventoryItem, GalleryItem, User, Currency } from '../types';
import { Icons } from '../constants';
import Odontogram from './Odontogram';
import ClinicalHistoryView from './ClinicalHistoryView';
import ClinicalGallery from './ClinicalGallery';
import { getSmartSummary } from '../services/geminiService';

interface PatientDetailProps {
  patient: Patient;
  services: Service[];
  inventory: InventoryItem[];
  activeUser: User;
  onBack: () => void;
  onSchedule?: () => void;
  onEdit?: (patient: Patient) => void;
  onAddHistory?: (patientId: string, record: TreatmentRecord) => void;
  onUpdateGallery?: (patientId: string, item: GalleryItem) => void;
  onUpdatePatientData?: (patient: Patient) => void;
}

type Tab = 'history' | 'billing' | 'record' | 'odontogram' | 'gallery';

const PatientDetail: React.FC<PatientDetailProps> = ({ 
  patient, 
  services, 
  inventory, 
  activeUser,
  onBack, 
  onSchedule, 
  onEdit, 
  onAddHistory,
  onUpdateGallery,
  onUpdatePatientData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [billServices, setBillServices] = useState<PerformedService[]>([]);
  const [billSupplies, setBillSupplies] = useState<ConsumedItem[]>([]);
  const [extraCharge, setExtraCharge] = useState({ amount: 0, reason: '' });
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [paidCurrency, setPaidCurrency] = useState<Currency>('CUP');
  const [supplySearch, setSupplySearch] = useState('');

  const tabs = [
    { id: 'history', label: 'Evolución', icon: Icons.Calendar }, 
    { id: 'billing', label: 'Nueva Sesión', icon: Icons.Coins },
    { id: 'record', label: 'Ficha Clínica', icon: Icons.Stethoscope },
    { id: 'odontogram', label: 'Odontograma', icon: Icons.Dashboard },
    { id: 'gallery', label: 'Galería', icon: Icons.Plus }
  ];

  const financialStats = useMemo(() => {
    return (patient.history || []).reduce((acc, record) => {
      acc.totalCUP += record.amountPaidCUP || 0;
      acc.totalUSD += record.amountPaidUSD || 0;
      return acc;
    }, { totalCUP: 0, totalUSD: 0 });
  }, [patient.history]);

  const currentBillTotals = useMemo(() => {
    const servicesTotal = billServices.reduce((acc, s) => {
      acc.cup += s.priceCUP;
      acc.usd += s.priceUSD;
      return acc;
    }, { cup: 0, usd: 0 });
    const extraCUP = paidCurrency === 'CUP' ? extraCharge.amount : 0;
    const extraUSD = paidCurrency === 'USD' ? extraCharge.amount : 0;
    return { cup: servicesTotal.cup + extraCUP, usd: servicesTotal.usd + extraUSD };
  }, [billServices, extraCharge, paidCurrency]);

  const handleGenerateAISummary = async () => {
    setIsSummarizing(true);
    const summary = await getSmartSummary(patient);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const handleSelectTab = (tabId: Tab) => {
    setActiveTab(tabId);
    setIsTabMenuOpen(false);
    // Scroll smoothly to the top of the tab content area if needed
    document.getElementById('tab-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Servicios Realizados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map(s => (
                    <button key={s.id} onClick={() => {
                      if (billServices.find(item => item.serviceId === s.id)) return;
                      setBillServices([...billServices, { serviceId: s.id, name: s.name, priceCUP: s.priceCUP, priceUSD: s.priceUSD }]);
                    }} className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-sky-500 hover:shadow-lg transition-all active:scale-[0.98]">
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs text-sky-600 font-black mt-1">$ {s.priceCUP.toLocaleString()} CUP</p>
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Insumos Utilizados</h3>
                  <input type="text" placeholder="Filtrar almacén..." className="pl-8 pr-4 py-1.5 bg-slate-100 border-none rounded-xl text-[10px] outline-none w-48" value={supplySearch} onChange={e => setSupplySearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventory.filter(i => i.name.toLowerCase().includes(supplySearch.toLowerCase()) && i.stock > 0).slice(0, 4).map(item => (
                    <button key={item.id} onClick={() => {
                      if (billSupplies.find(s => s.itemId === item.id)) return;
                      setBillSupplies([...billSupplies, { itemId: item.id, name: item.name, quantity: 1, unit: item.unit }]);
                    }} className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-500 hover:shadow-lg transition-all active:scale-[0.98]">
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-indigo-500 font-black mt-1">Stock: {item.stock} {item.unit}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-4 bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Icons.Plus /> Cargo Extra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="number" value={extraCharge.amount} onChange={e => setExtraCharge({...extraCharge, amount: Number(e.target.value)})} className="p-3 bg-white border border-amber-200 rounded-xl outline-none font-bold" placeholder="Monto" />
                  <input type="text" placeholder="Motivo" value={extraCharge.reason} onChange={e => setExtraCharge({...extraCharge, reason: e.target.value})} className="sm:col-span-2 p-3 bg-white border border-amber-200 rounded-xl outline-none" />
                </div>
              </section>
              <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas clínicas..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 outline-none text-sm font-medium" />
            </div>
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col h-full shadow-2xl">
              <div className="flex-1 space-y-6">
                <div className="text-center"><p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] mb-2">Resumen de Pago</p></div>
                <div className="space-y-3">
                  {billServices.map(s => (
                    <div key={s.serviceId} className="flex justify-between items-center py-1">
                      <span className="text-sm font-bold">{s.name}</span>
                      <span className="text-sky-400 font-black">$ {s.priceCUP.toLocaleString()}</span>
                    </div>
                  ))}
                  {extraCharge.amount > 0 && <div className="flex justify-between items-center py-1 text-amber-400"><span className="text-sm font-bold">Extra</span><span>$ {extraCharge.amount.toLocaleString()}</span></div>}
                </div>
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setPaymentMethod('Efectivo')} className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Efectivo' ? 'bg-emerald-600 border-emerald-500' : 'bg-white/5 border-white/10'}`}>Efectivo</button>
                    <button onClick={() => setPaymentMethod('Transferencia')} className={`p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Transferencia' ? 'bg-sky-600 border-sky-500' : 'bg-white/5 border-white/10'}`}>Transferencia</button>
                  </div>
                </div>
              </div>
              <div className="pt-8 space-y-4">
                <div className="flex bg-white/5 p-1 rounded-2xl">
                  {(['CUP', 'USD'] as Currency[]).map(c => (
                    <button key={c} onClick={() => setPaidCurrency(c)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${paidCurrency === c ? 'bg-white text-slate-900' : 'text-slate-500'}`}>{c}</button>
                  ))}
                </div>
                <button onClick={() => {
                  if (billServices.length === 0 && extraCharge.amount <= 0) return;
                  onAddHistory?.(patient.id, {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split('T')[0],
                    doctor: activeUser.name,
                    observations: observations || 'Registro manual',
                    amountPaidCUP: currentBillTotals.cup,
                    amountPaidUSD: currentBillTotals.usd,
                    extraChargeCUP: paidCurrency === 'CUP' ? extraCharge.amount : 0,
                    extraChargeUSD: paidCurrency === 'USD' ? extraCharge.amount : 0,
                    extraChargeReason: extraCharge.reason,
                    paidCurrency,
                    paymentMethod,
                    services: billServices,
                    suppliesUsed: billSupplies
                  });
                  setBillServices([]); setBillSupplies([]); setObservations(''); setActiveTab('history');
                }} className="w-full py-6 bg-sky-600 text-white font-black uppercase text-xs rounded-[2rem] hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/20">Liquidar Sesión</button>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-slate-800 tracking-tight">Cronología de Evolución</h4>
              <button onClick={handleGenerateAISummary} disabled={isSummarizing} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-200 disabled:opacity-50">
                {isSummarizing ? 'Analizando...' : <><Icons.Brain /> Resumen IA</>}
              </button>
            </div>
            {aiSummary && <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl animate-slideUp"><p className="text-sm italic opacity-90">"{aiSummary}"</p></div>}
            {(patient.history || []).length > 0 ? (
              <div className="relative border-l-2 border-slate-100 ml-6 space-y-10 pl-10">
                {patient.history.map((record) => (
                  <div key={record.id} className="relative group">
                    <div className="absolute -left-[51px] top-2 w-6 h-6 bg-white border-4 border-sky-500 rounded-full shadow-lg"></div>
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex flex-col"><span className="text-sm font-black text-slate-900">{record.date}</span><span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Dr. {record.doctor}</span></div>
                        <span className={`px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-xs font-black border`}>$ {record.amountPaidCUP.toLocaleString()} CUP</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">"{record.observations}"</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Sin registros clínicos previos.</div>}
          </div>
        );
      case 'record':
        return <div className="animate-fadeIn py-4"><ClinicalHistoryView selectedPatient={patient} activeUser={activeUser} onUpdateOdontogram={(data) => onUpdatePatientData?.({ ...patient, odontogramData: data })} /></div>;
      case 'odontogram':
        return <div className="max-w-6xl mx-auto animate-fadeIn bg-white rounded-[3rem] border border-slate-100 shadow-xl mt-4 p-8 overflow-hidden"><Odontogram initialData={patient.odontogramData} onSave={(data) => onUpdatePatientData?.({ ...patient, odontogramData: data })} activeDoctorName={activeUser.name} /></div>;
      case 'gallery':
        return <div className="animate-fadeIn py-4"><ClinicalGallery patient={patient} onAddItem={(item) => onUpdateGallery?.(patient.id, item)} /></div>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20 pt-16 lg:pt-0">
      <div className="flex justify-between items-center px-2">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-all gap-3 font-black uppercase text-[10px] tracking-widest group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </div>
          Volver
        </button>
        <div className="flex gap-2">
          <button onClick={onSchedule} className="px-4 lg:px-6 py-3 bg-sky-600 text-white text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-100">Agendar Cita</button>
          <button onClick={() => onEdit?.(patient)} className="px-4 lg:px-6 py-3 bg-white text-slate-700 text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-200">Editar</button>
        </div>
      </div>

      {/* HEADER PACIENTE */}
      <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl border border-slate-100 p-6 lg:p-10 flex flex-col md:flex-row items-center gap-6 lg:gap-10">
        <div className="relative">
          <img src={`https://picsum.photos/seed/pat-${patient.id}/300/300`} className="w-24 h-24 lg:w-40 lg:h-40 rounded-[2.5rem] border-4 border-slate-50 shadow-2xl object-cover" alt="" />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white"></div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 pt-6 border-t border-slate-50 mt-4">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</p><p className="text-sm lg:text-lg font-black">{patient.age} años</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especialista</p><p className="text-sm lg:text-lg font-black text-indigo-600">{patient.treatingDoctor || activeUser.name}</p></div>
            <div><p className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Consumo Total</p><p className="text-sm lg:text-lg font-black text-sky-600 tracking-tighter">$ {financialStats.totalCUP.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {/* TABS - MOBILE COLLAPSIBLE & STICKY / DESKTOP NORMAL */}
      <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[500px] relative">
        <div id="tab-top" className="lg:hidden sticky top-16 z-50 p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md">
           <button 
             onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
             className="w-full flex items-center justify-between p-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
           >
              <span className="flex items-center gap-3">
                <span className="text-sky-400">{tabs.find(t => t.id === activeTab)?.icon()}</span>
                {currentTabLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] opacity-50 font-bold uppercase mr-2">Cambiar Sección</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-500 ${isTabMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
           </button>
           
           {isTabMenuOpen && (
             <div className="absolute left-4 right-4 top-24 bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[100] animate-slideUp overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Navegación de Ficha</p></div>
                {tabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-5 p-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 last:border-none transition-all active:bg-sky-100 ${activeTab === tab.id ? 'bg-sky-50 text-sky-700' : 'text-slate-500'}`}
                  >
                    <span className={`${activeTab === tab.id ? 'text-sky-600' : 'text-slate-400'}`}>{tab.icon()}</span> 
                    {tab.label}
                    {activeTab === tab.id && <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>}
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* DESKTOP TABS */}
        <div className="hidden lg:flex border-b border-slate-100 bg-slate-50/30 px-8 overflow-x-auto custom-scrollbar sticky top-0 z-50 backdrop-blur-md">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as Tab)} 
              className={`px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 whitespace-nowrap flex items-center gap-3 ${
                activeTab === tab.id 
                ? 'text-sky-600 border-sky-600 bg-white' 
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {tab.icon()} {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 lg:p-12 flex-1 bg-gradient-to-b from-white to-slate-50/20">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
