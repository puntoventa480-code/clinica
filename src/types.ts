
export type UserRole = 'ADMIN' | 'DENTIST';

export interface User {
  id: string;
  name: string;
  role: string;
  roleType: UserRole;
  avatar: string;
  color: string;
  password?: string;
}

export interface GalleryItem {
  id: string;
  date: string;
  type: 'Photo' | 'X-Ray';
  url: string; // base64 or blob url
  notes?: string;
}

export interface ConsumedItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface PerformedService {
  serviceId: string;
  name: string;
  priceCUP: number;
  priceUSD: number;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  doctor: string;
  observations: string;
  amountPaidCUP: number;
  amountPaidUSD: number;
  extraChargeCUP?: number;
  extraChargeUSD?: number;
  extraChargeReason?: string;
  paidCurrency: Currency;
  paymentMethod: PaymentMethod;
  services: PerformedService[];
  suppliesUsed: ConsumedItem[];
  followUpTreatment?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone?: string;
  treatingDoctor?: string;
  lastVisit: string;
  nextAppointment?: string;
  history: TreatmentRecord[];
  gallery: GalleryItem[];
  age: number;
  odontogramData?: Record<number, Record<string, 'red' | 'blue' | 'green' | 'none'>>;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';
export type Currency = 'CUP' | 'USD';

export interface Service {
  id: string;
  name: string;
  category: string;
  priceCUP: number;
  priceUSD: number;
  exchangeRate: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number; 
  doctorName?: string;
  date: string;
  time: string;
  serviceId: string;
  type: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  priceCUP: number;
  priceUSD: number;
  reservationFeeCUP: number; 
  reservationFeeUSD: number; 
  paymentMethod: PaymentMethod;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: 'Consumibles' | 'Instrumental' | 'Protección' | 'Químicos';
  stock: number; 
  cumulativePurchased: number; 
  minStock: number;
  unit: string;
  pricePerUnitCUP: number;
  pricePerUnitUSD: number;
  exchangeRate: number; 
  totalCUP: number; 
  totalUSD: number; 
  cumulativeTotalCUP: number; 
  cumulativeTotalUSD: number; 
  lastPaidCurrency?: Currency;
}

export interface ClinicAsset {
  id: string;
  name: string;
  category: 'Instrumental' | 'Mobiliario' | 'Equipos' | 'Tecnología' | 'Otros';
  quantity: number;
  priceUnitCUP: number;
  priceUnitUSD: number;
  shippingCostCUP?: number;
  shippingCostUSD?: number;
  totalCUP: number;
  totalUSD: number;
  dateAcquired: string;
  notes?: string;
}

export interface InvestmentEntry {
  id: string;
  date: string;
  concept: string;
  amountCUP: number;
  amountUSD: number;
  notes?: string;
}

export interface InventoryHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  unitsAdded: number;
  totalCUP: number;
  totalUSD: number;
  rateAtMoment: number;
  paidCurrency: Currency;
  shippingCostCUP?: number;
  shippingCostUSD?: number;
}

export interface InventoryExitEntry {
  id: string;
  itemId: string;
  itemName: string;
  patientName: string;
  doctorName: string;
  date: string;
  unitsRemoved: number;
}

export interface InventoryExtraExitEntry {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  unitsRemoved: number;
  reason: string;
  notes?: string;
  responsibleName: string;
}

export interface CommissionEntry {
  id: string;
  appointmentId?: string;
  doctorName: string;
  patientName: string;
  treatmentType: string;
  date: string;
  priceCUP: number;
  priceUSD: number;
  commissionPercentage: number;
  commissionCUP: number;
  commissionUSD: number;
  status: 'pending' | 'paid';
}

export interface FixedExpense {
  id: string;
  category: string;
  amountCUP: number;
  amountUSD: number;
  date: string;
  notes?: string;
}

export interface DistributionFund {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

export interface DistributionConfig {
  doctorCommission: number;
  funds: DistributionFund[];
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  PATIENTS = 'patients',
  CALENDAR = 'calendar',
  AI_CONSULTANT = 'ai-consultant',
  INVENTORY = 'inventory',
  INVESTMENTS = 'investments',
  ASSETS = 'assets',
  COMMISSIONS = 'commissions',
  SERVICES = 'services',
  BILLING = 'billing',
  SETTINGS = 'settings',
  STATISTICS = 'statistics',
  FINANCIAL_DISTRIBUTION = 'financial-distribution'
}
