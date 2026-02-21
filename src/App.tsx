
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import AIConsultant from './components/AIConsultant';
import Calendar from './components/Calendar';
import Inventory from './components/Inventory';
import ClinicAssets from './components/ClinicAssets';
import Investments from './components/Investments';
import Commissions from './components/Commissions';
import ServicesManager from './components/ServicesManager';
import Billing from './components/Billing';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import FinancialDistribution from './components/FinancialDistribution';
import ScheduleModal from './components/ScheduleModal';
import PatientModal from './components/PatientModal';
import CheckoutModal from './components/CheckoutModal';
import Login from './components/Login';
import { AppRoute, Appointment, Patient, TreatmentRecord, InventoryItem, ClinicAsset, InvestmentEntry, InventoryHistoryEntry, InventoryExitEntry, InventoryExtraExitEntry, CommissionEntry, Service, ConsumedItem, PerformedService, FixedExpense, GalleryItem, UserRole, User, Currency, DistributionConfig } from './types';

const STORAGE_KEY = 'noahs_agency_data_v4';
const SESSION_USER_KEY = 'noahs_agency_active_session_user_v4';
const AUTH_KEY = 'noahs_agency_is_authenticated_v4';

const DEFAULT_USERS: User[] = [
  { id: 'admin-01', name: 'Admin Principal', role: 'Administrador Clínico', roleType: 'ADMIN', avatar: 'https://picsum.photos/seed/admin/100/100', color: 'bg-slate-900', password: '123' },
  { id: 'doc-01', name: 'Dr. Ricardo Silva', role: 'Estomatólogo General', roleType: 'DENTIST', avatar: 'https://picsum.photos/seed/doc1/100/100', color: 'bg-sky-600', password: '456' },
  { id: 'doc-02', name: 'Dra. Elena Martínez', role: 'Ortodoncista', roleType: 'DENTIST', avatar: 'https://picsum.photos/seed/doc2/100/100', color: 'bg-indigo-600', password: '789' },
];

const DEFAULT_DISTRIBUTION: DistributionConfig = {
  doctorCommission: 25,
  funds: [
    { id: 'f1', name: 'Recuperación Inversión', percentage: 40, color: '#0ea5e9' },
    { id: 'f2', name: 'Operación y Gastos', percentage: 20, color: '#64748b' },
    { id: 'f3', name: 'Socio Inversor', percentage: 15, color: '#f59e0b' },
    { id: 'f4', name: 'Fondo de Emergencia', percentage: 25, color: '#ef4444' }
  ]
};

const App: React.FC = () => {
  const loadInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error("Error al cargar datos:", e);
      }
    }
    return null;
  };

  const savedData = loadInitialData();
  const [users, setUsers] = useState<User[]>(savedData?.users || DEFAULT_USERS);
  
  const loadActiveSession = (currentUsers: User[]): User => {
    const savedId = sessionStorage.getItem(SESSION_USER_KEY);
    if (savedId) {
      const found = currentUsers.find((u: User) => u.id === savedId);
      if (found) return found;
    }
    return currentUsers[0];
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(sessionStorage.getItem(AUTH_KEY) === 'true');
  const [activeUser, setActiveUser] = useState<User>(loadActiveSession(savedData?.users || DEFAULT_USERS));
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [appointments, setAppointments] = useState<Appointment[]>(savedData?.appointments || []);
  const [patients, setPatients] = useState<Patient[]>(savedData?.patients || []);
  const [services, setServices] = useState<Service[]>(savedData?.services || []);
  const [inventory, setInventory] = useState<InventoryItem[]>(savedData?.inventory || []);
  const [assets, setAssets] = useState<ClinicAsset[]>(savedData?.assets || []);
  const [investments, setInvestments] = useState<InvestmentEntry[]>(savedData?.investments || []);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistoryEntry[]>(savedData?.inventoryHistory || []);
  const [inventoryExitHistory, setInventoryExitHistory] = useState<InventoryExitEntry[]>(savedData?.inventoryExitHistory || []);
  const [inventoryExtraExitHistory, setInventoryExtraExitHistory] = useState<InventoryExtraExitEntry[]>(savedData?.inventoryExtraExitHistory || []);
  const [commissions, setCommissions] = useState<CommissionEntry[]>(savedData?.commissions || []);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(savedData?.fixedExpenses || []);
  const [otherExpenses, setFixedExpensesOther] = useState<FixedExpense[]>(savedData?.otherExpenses || []);
  const [distributionConfig, setDistributionConfig] = useState<DistributionConfig>(savedData?.distributionConfig || DEFAULT_DISTRIBUTION);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Appointment | null>(null);
  const [scheduleInitialData, setScheduleInitialData] = useState<{name?: string, time?: string}>({});
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const dataToSave = {
      users, appointments, patients, services, inventory, assets, investments, inventoryHistory, inventoryExitHistory, inventoryExtraExitHistory, commissions, fixedExpenses, otherExpenses, distributionConfig
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [users, appointments, patients, services, inventory, assets, investments, inventoryHistory, inventoryExitHistory, inventoryExtraExitHistory, commissions, fixedExpenses, otherExpenses, distributionConfig]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_USER_KEY, activeUser.id);
    sessionStorage.setItem(AUTH_KEY, isAuthenticated.toString());
  }, [activeUser, isAuthenticated]);

  const handleLogin = (user: User) => {
    setActiveUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  };

  const discountInventorySupplies = (supplies: ConsumedItem[], patientName: string, doctorName: string) => {
    setInventory(prev => prev.map(item => {
      const consumption = supplies.find(s => s.itemId === item.id);
      if (consumption) {
        const newStock = Math.max(0, item.stock - consumption.quantity);
        setInventoryExitHistory(exits => [{
          id: Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemName: item.name,
          patientName,
          doctorName,
          date: new Date().toISOString(),
          unitsRemoved: consumption.quantity
        }, ...exits]);
        return { ...item, stock: newStock };
      }
      return item;
    }));
  };

  const handleExtraExit = (itemId: string, units: number, reason: string, notes: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.stock - units);
        setInventoryExtraExitHistory(exits => [{
          id: Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemName: item.name,
          date: new Date().toISOString(),
          unitsRemoved: units,
          reason,
          notes,
          responsibleName: activeUser.name
        }, ...exits]);
        return { ...item, stock: newStock };
      }
      return item;
    }));
  };

  const handleScheduleAppointment = (apptData: Omit<Appointment, 'id'>) => {
    setAppointments(prev => [...prev, { ...apptData, id: Math.random().toString(36).substr(2, 9), status: 'pending' }]);
  };

  const handleConfirmAppointment = (appt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'confirmed' } : a));
    if (!patients.find(p => p.id === appt.patientId || p.name.toLowerCase() === appt.patientName.toLowerCase())) {
      setPatients(prev => [{
        id: appt.patientId || Math.random().toString(36).substr(2, 9),
        name: appt.patientName,
        age: appt.patientAge || 18,
        treatingDoctor: appt.doctorName || activeUser.name,
        lastVisit: appt.date,
        history: [],
        gallery: []
      }, ...prev]);
    }
  };

  const processCheckout = (data: any) => {
    if (!checkoutTarget) return;
    discountInventorySupplies(data.supplies, checkoutTarget.patientName, checkoutTarget.doctorName || activeUser.name);
    const record: TreatmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      doctor: checkoutTarget.doctorName || activeUser.name,
      observations: data.observations,
      amountPaidCUP: data.totalCUP,
      amountPaidUSD: data.totalUSD,
      paidCurrency: data.paidCurrency,
      paymentMethod: data.paymentMethod,
      services: data.services,
      suppliesUsed: data.supplies
    };
    setPatients(prev => prev.map(p => (p.id === checkoutTarget.patientId || p.name === checkoutTarget.patientName) ? { ...p, history: [record, ...p.history], lastVisit: record.date } : p));
    setAppointments(prev => prev.map(a => a.id === checkoutTarget.id ? { ...a, status: 'completed' } : a));
    setCommissions(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      doctorName: record.doctor,
      patientName: checkoutTarget.patientName,
      treatmentType: data.services.map((s:any) => s.name).join(', ') || 'Consulta',
      date: record.date,
      priceCUP: record.amountPaidCUP,
      priceUSD: record.amountPaidUSD,
      commissionPercentage: distributionConfig.doctorCommission,
      commissionCUP: record.amountPaidCUP * (distributionConfig.doctorCommission / 100),
      commissionUSD: record.amountPaidUSD * (distributionConfig.doctorCommission / 100),
      status: 'pending'
    }, ...prev]);
    setIsCheckoutModalOpen(false);
    setCheckoutTarget(null);
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD: return <Dashboard activeUser={activeUser} onScheduleNew={() => setIsScheduleModalOpen(true)} onNavigate={setCurrentRoute} appointments={appointments} services={services} inventory={inventory} patients={patients} fixedExpenses={fixedExpenses} inventoryHistory={inventoryHistory} distributionConfig={distributionConfig} users={users} assets={assets} investments={investments} onConfirmAppointment={handleConfirmAppointment} />;
      case AppRoute.PATIENTS: return <PatientList patients={patients} services={services} inventory={inventory} activeUser={activeUser} onAddPatient={() => setIsPatientModalOpen(true)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onDeletePatient={(id) => setPatients(patients.filter(p => p.id !== id))} onAddHistory={(pid, rec) => setPatients(prev => prev.map(p => p.id === pid ? { ...p, history: [rec, ...p.history] } : p))} onUpdatePatientObject={p => setPatients(prev => prev.map(old => old.id === p.id ? p : old))} />;
      case AppRoute.CALENDAR: return <Calendar appointments={appointments} onSlotClick={(time) => { setScheduleInitialData({ time }); setIsScheduleModalOpen(true); }} onUpdateAppointment={(id, up) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...up } : a))} onDeleteAppointment={(id) => setAppointments(prev => prev.filter(a => a.id !== id))} onConfirmAppointment={handleConfirmAppointment} onStartCheckout={(appt) => { setCheckoutTarget(appt); setIsCheckoutModalOpen(true); }} />;
      case AppRoute.BILLING: return <Billing patients={patients} appointments={appointments} />;
      case AppRoute.INVENTORY: return <Inventory items={inventory} history={inventoryHistory} exitHistory={inventoryExitHistory} extraExitHistory={inventoryExtraExitHistory} onAddItem={(item, isRestock) => { setInventory(prev => { const exists = prev.findIndex(i => i.id === item.id); if (exists !== -1) { const n = [...prev]; n[exists] = item; return n; } return [...prev, item]; }); if (isRestock) setInventoryHistory(prev => [{ id: Math.random().toString(36).substr(2, 9), itemId: item.id, itemName: item.name, date: new Date().toISOString(), unitsAdded: 0, totalCUP: item.totalCUP, totalUSD: item.totalUSD, rateAtMoment: item.exchangeRate, paidCurrency: item.lastPaidCurrency || 'CUP' }, ...prev]); }} onExtraExit={handleExtraExit} onDeleteItem={(id) => setInventory(inventory.filter(i => i.id !== id))} />;
      case AppRoute.INVESTMENTS: return <Investments investments={investments} onAddInvestment={(i) => setInvestments([i, ...investments])} onDeleteInvestment={(id) => setInvestments(investments.filter(i => i.id !== id))} />;
      case AppRoute.ASSETS: return <ClinicAssets assets={assets} onAddAsset={(a) => setAssets([...assets, a])} onUpdateAsset={a => setAssets(prev => prev.map(old => old.id === a.id ? a : old))} onDeleteAsset={(id) => setAssets(assets.filter(a => a.id !== id))} />;
      case AppRoute.COMMISSIONS: return <Commissions commissions={commissions} inventoryHistory={inventoryHistory} onMarkAsPaid={(id) => setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid' } : c))} />;
      case AppRoute.SERVICES: return <ServicesManager services={services} onAddService={(s) => setServices([...services, s])} onUpdateService={(s) => setServices(services.map(old => old.id === s.id ? s : old))} onDeleteService={(id) => setServices(services.filter(s => s.id !== id))} />;
      case AppRoute.STATISTICS: return <Statistics patients={patients} appointments={appointments} inventoryHistory={inventoryHistory} assets={assets} />;
      case AppRoute.FINANCIAL_DISTRIBUTION: return <FinancialDistribution patients={patients} fixedExpenses={fixedExpenses} otherExpenses={otherExpenses} appointments={appointments} users={users} config={distributionConfig} onUpdateConfig={setDistributionConfig} onAddExpense={(e) => setFixedExpenses([...fixedExpenses, { ...e, id: Math.random().toString() }])} onDeleteExpense={(id) => setFixedExpenses(fixedExpenses.filter(e => e.id !== id))} onAddOtherExpense={(e) => setFixedExpensesOther([...otherExpenses, { ...e, id: Math.random().toString() }])} onDeleteOtherExpense={(id) => setFixedExpensesOther(otherExpenses.filter(e => e.id !== id))} />;
      case AppRoute.AI_CONSULTANT: return <AIConsultant />;
      case AppRoute.SETTINGS: return <Settings activeUser={activeUser} users={users} onAddUser={(u) => setUsers([...users, u])} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} onExport={() => {}} onImport={() => {}} onReset={() => localStorage.removeItem(STORAGE_KEY)} onLogout={handleLogout} />;
      default: return <Dashboard activeUser={activeUser} onNavigate={setCurrentRoute} appointments={appointments} services={services} inventory={inventory} patients={patients} onConfirmAppointment={handleConfirmAppointment} />;
    }
  };

  if (!isAuthenticated) return <Login users={users} onLoginSuccess={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Sidebar 
        currentRoute={currentRoute} 
        onNavigate={setCurrentRoute} 
        isOpen={false} 
        onClose={() => {}} 
        activeUser={activeUser}
        users={users}
        onSwitchUser={setActiveUser}
      />
      <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-32">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
      <ScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} onConfirm={handleScheduleAppointment} services={services} patients={patients} activeUser={activeUser} initialPatientName={scheduleInitialData.name} initialTime={scheduleInitialData.time} />
      <PatientModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onConfirm={p => setPatients([p, ...patients])} initialData={editingPatient} activeUser={activeUser} />
      {checkoutTarget && <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} appointment={checkoutTarget} services={services} inventory={inventory} onConfirm={processCheckout} />}
    </div>
  );
};

export default App;
