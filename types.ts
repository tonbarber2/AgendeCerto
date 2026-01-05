
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  deposit?: number; // Sinal de pagamento
  image: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
}

export interface ClientPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  frequency: 'mensal' | 'trimestral' | 'semestral' | 'anual';
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

export interface Appointment {
  id: string;
  time: string;
  client: string;
  service: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  date: string;
  phone?: string; // Telefone do cliente para notificações
  professional?: string; // Nome do profissional vinculado
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DayOption {
  date: Date;
  label: string; // e.g., "Hoje", "Amanhã"
  displayDate: string; // e.g., "12 Out"
}

export interface UserDetails {
  name: string;
  phone: string;
  notes: string;
}

export enum BookingStep {
  SERVICE = 1,
  PROFESSIONAL = 2,
  DATETIME = 3,
  DETAILS = 4,
  PAYMENT = 5,
  CONFIRMATION = 6
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// Novos tipos para horários estruturados
export interface TimeInterval {
  start: string;
  end: string;
}

export interface DaySchedule {
  isOpen: boolean;
  intervals: TimeInterval[];
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BusinessProfile {
  // General
  name?: string; // Nome do negócio
  email?: string; // Email de contato
  phone?: string; // Telefone geral
  
  logo: string | null;
  backgroundImage: string | null;
  pixKey: string;
  whatsapp: string; // WhatsApp para comprovantes
  address?: string; 
  openingHours: BusinessHours;
  
  // Notifications
  notificationSound: boolean;
  selectedSound: string;
  
  // Visual
  fontFamily: string;
  colors: {
    primary: string;
    secondary: string; // Destaque
    background: string; // Cor de fundo da página
    
    // List Items
    listTitle: string;
    listPrice: string;
    listInfo: string;
    
    // Texts
    textPrimary: string; // Títulos
    textSecondary: string; // Textos gerais
  }
}

export type PlanType = 'trial' | 'monthly' | 'semiannual' | 'annual' | 'lifetime';

export interface Subscription {
  plan: PlanType;
  status: 'active' | 'expired';
  startDate: string;
  expiresAt: string | null; // null for lifetime
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  businessName: string;
  subscription: Subscription;
}

export type ViewState = 'LANDING' | 'BOOKING_FLOW' | 'ADMIN' | 'AUTH' | 'SUBSCRIPTION';
export type Theme = 'light' | 'dark';
