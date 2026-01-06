
import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Camera, 
  X, 
  Clock, 
  Plus, 
  Save, 
  Edit2, 
  User, 
  Link as LinkIcon, 
  Briefcase, 
  Trash2, 
  Settings, 
  ChevronRight, 
  ArrowLeft, 
  Eye, 
  Ban, 
  Package, 
  CalendarDays, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Palette, 
  Type, 
  FolderPlus, 
  Bell, 
  Phone, 
  History, 
  ImageIcon, 
  MapPin, 
  Smartphone, 
  Home, 
  QrCode, 
  Sun, 
  Moon, 
  Check, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Theme, BusinessProfile, Service, Professional, Appointment, AdminUser, Product, ClientPlan, BusinessHours, ServiceCategory } from '../types';

interface AdminDashboardProps {
  onSwitchToClient: () => void;
  onViewAsClient: () => void;
  toggleTheme: () => void;
  currentTheme: Theme;
  businessProfile: BusinessProfile;
  onUpdateProfile: (profile: Partial<BusinessProfile>) => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  professionals: Professional[];
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clientPlans: ClientPlan[];
  setClientPlans: React.Dispatch<React.SetStateAction<ClientPlan[]>>;
  categories: ServiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
  currentUser: AdminUser;
}

interface Transaction { id: string; title: string; type: 'income' | 'expense'; amount: number; date: string; }

// Interface auxiliar para edição de cliente
interface EditableClient {
    originalName: string;
    name: string;
    phone: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onSwitchToClient, 
  onViewAsClient,
  toggleTheme,
  currentTheme,
  businessProfile,
  onUpdateProfile,
  appointments,
  setAppointments,
  professionals,
  setProfessionals,
  services,
  setServices,
  products,
  setProducts,
  clientPlans,
  setClientPlans,
  categories,
  setCategories,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('inicio');
  
  // Profile Navigation State
  const [profileView, setProfileView] = useState<'menu' | 'meus_dados' | 'horarios' | 'servicos' | 'produtos' | 'profissionais' | 'cancelados' | 'planos' | 'aparencia'>('menu');
  
  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);

  // File Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const professionalAvatarRef = useRef<HTMLInputElement>(null);
  const serviceImageRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  // --- States for Inline Editing (Buffer Objects) ---
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPlan, setEditingPlan] = useState<ClientPlan | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Novo estado para editar cliente
  const [editingClient, setEditingClient] = useState<EditableClient | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([
      { id: '1', title: 'Corte João', type: 'income', amount: 45.00, date: 'Hoje' },
      { id: '2', title: 'Conta Luz', type: 'expense', amount: 150.00, date: 'Ontem' },
  ]);

  // --- Calculations for Dashboard ---
  const getDaysRemaining = () => {
    if (!currentUser || !currentUser.subscription || !currentUser.subscription.expiresAt) return Infinity; 
    
    try {
        const expire = new Date(currentUser.subscription.expiresAt);
        const now = new Date();
        const diff = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    } catch (e) {
        return Infinity; // Fallback seguro
    }
  };

  const daysRemaining = getDaysRemaining();
  const isTrial = currentUser?.subscription?.plan === 'trial';

  // --- Shared Handlers ---
  
  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
      const appointment = appointments.find(a => a.id === id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      
      if (appointment) {
          let message = '';
          const phone = appointment.phone ? appointment.phone.replace(/\D/g, '') : '';
          if (newStatus === 'confirmado') {
              message = `Opa! Tudo bem ${appointment.client}? Passando pra informar que o seu agendamento para o dia ${appointment.date} às ${appointment.time}, foi confirmado! Te aguardando! 😉`;
          } else if (newStatus === 'cancelado') {
              message = `Opa! Tudo bem ${appointment.client}? É uma pena que o seu agendamento para o dia ${appointment.date} às ${appointment.time}, foi cancelado!`;
          }

          if (message && phone.length >= 10) {
              const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
              setTimeout(() => window.open(url, '_blank'), 100);
          }
      }
  };

  // --- Handlers ---
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          onUpdateProfile({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          onUpdateProfile({ backgroundImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfessionalAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProfessional) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedPro = {
              ...editingProfessional,
              avatar: reader.result as string
          };
          setEditingProfessional(updatedPro);
          // Auto save logic for image (immediate)
          if (professionals.find(p => p.id === updatedPro.id)) {
              setProfessionals(prev => prev.map(p => p.id === updatedPro.id ? updatedPro : p));
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingService) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedService = {
              ...editingService,
              image: reader.result as string
          };
          setEditingService(updatedService);
          // Auto save logic for image
          if (services.find(s => s.id === updatedService.id)) {
            setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedProd = {
              ...editingProduct,
              image: reader.result as string
          };
          setEditingProduct(updatedProd);
          // Auto save logic for image
          if (products.find(p => p.id === updatedProd.id)) {
            setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?store=${currentUser.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Link exclusivo copiado!'));
  };

  // --- CRUD Operations (Updated for Auto-Save) ---
  const handleSaveService = (closeForm = true) => {
    if (editingService) {
      if (services.find(s => s.id === editingService.id)) {
        setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
      } else {
        setServices(prev => [...prev, editingService]);
      }
      if (closeForm) setEditingService(null);
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      setServices(prev => prev.filter(s => s.id !== id));
      setEditingService(null);
    }
  };

  const handleSaveProfessional = (closeForm = true) => {
    if (editingProfessional) {
      if (professionals.find(p => p.id === editingProfessional.id)) {
        setProfessionals(prev => prev.map(p => p.id === editingProfessional.id ? editingProfessional : p));
      } else {
        setProfessionals(prev => [...prev, editingProfessional]);
      }
      if (closeForm) setEditingProfessional(null);
    }
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
      setEditingProfessional(null);
    }
  };

  const handleSaveProduct = (closeForm = true) => {
    if (editingProduct) {
      if (products.find(p => p.id === editingProduct.id)) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      } else {
        setProducts(prev => [...prev, editingProduct]);
      }
      if (closeForm) setEditingProduct(null);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Excluir produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setEditingProduct(null);
    }
  };

  const handleSaveClient = (closeForm = true) => {
      if (editingClient) {
          // Update all appointments with new name/phone to maintain consistency
          const updatedAppointments = appointments.map(apt => 
              apt.client === editingClient.originalName 
              ? { ...apt, client: editingClient.name, phone: editingClient.phone } 
              : apt
          );
          setAppointments(updatedAppointments);
          if (closeForm) setEditingClient(null);
      }
  }

  const handleDeleteClient = (clientName: string) => {
      if (confirm(`Tem certeza que deseja excluir o cliente ${clientName}? Esta ação removerá TODO o histórico de agendamentos deste cliente e não pode ser desfeita.`)) {
          setAppointments(prev => prev.filter(a => a.client !== clientName));
          if (editingClient?.originalName === clientName) {
              setEditingClient(null);
          }
      }
  }

  // --- Sub-Views Render Functions ---

  const renderHomeView = () => {
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      // Logic for simple summary
      const todaysAppointments = appointments.filter(a => a.date.includes(today) || a.date === 'Hoje');
      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      
      const pendingAppointments = appointments.filter(a => a.status === 'pendente');

      return (
          <div className="space-y-6 animate-fade-in-up pb-24 px-4 pt-4">
              
              {/* Header with Greeting & Actions */}
              <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Olá, {currentUser.name.split(' ')[0]}! 👋</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gerencie seu negócio</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={toggleTheme}
                          className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                      >
                          {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      </button>
                      
                      <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 bg-white dark:bg-[#0a0a0a] rounded-full text-gray-600 dark:text-gray-300 shadow-sm relative border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                        >
                            <Bell size={20} />
                            {pendingAppointments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {pendingAppointments.length}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in-up z-50">
                                <div className="p-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between items-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Solicitações Pendentes</p>
                                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {pendingAppointments.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                                            <CheckCircle size={32} className="text-gray-300"/>
                                            Tudo em dia! Nenhuma solicitação pendente.
                                        </div>
                                    ) : (
                                        pendingAppointments.map(apt => (
                                            <div key={apt.id} className="p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">{apt.client}</p>
                                                        <p className="text-xs text-gray-500">{apt.service}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">{apt.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                                    <Calendar size={12}/> {apt.date}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleStatusChange(apt.id, 'confirmado')} 
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Check size={14} /> Confirmar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(apt.id, 'cancelado')} 
                                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <X size={14} /> Recusar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
              
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-2xl border border-primary/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setActiveTab('agenda')}>
                      <Calendar size={28} className="text-primary mb-2" />
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">{todaysAppointments.length}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Agendamentos Hoje</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" onClick={() => setActiveTab('financeiro')}>
                      <DollarSign size={28} className="text-green-600 dark:text-green-400 mb-2" />
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">R$ {income.toFixed(0)}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Faturamento Total</span>
                  </div>
              </div>

              {/* Action Banner (Share) - Botão de Copiar Link */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <h3 className="font-bold text-lg mb-1">Divulgue seu Negócio</h3>
                      <p className="text-sm text-gray-300 mb-4 max-w-[220px]">Compartilhe o link de agendamento com seus clientes.</p>
                      <button onClick={handleCopyLink} className="w-full bg-primary text-white px-3 py-3 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-md">
                          <LinkIcon size={18} /> COPIAR LINK
                      </button>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                      <QrCode size={140} />
                  </div>
              </div>

              {/* Recent Shortcuts */}
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">Acesso Rápido</h3>
                  <div className="grid grid-cols-4 gap-2">
                       <button onClick={() => { setProfileView('servicos'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600"><Briefcase size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Serviços</span>
                       </button>
                       <button onClick={() => { setProfileView('profissionais'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600"><Users size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Equipe</span>
                       </button>
                       <button onClick={() => { setProfileView('horarios'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600"><Clock size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Horários</span>
                       </button>
                       <button onClick={() => { setProfileView('aparencia'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center text-pink-600"><Palette size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Tema</span>
                       </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderAgendaView = () => {
    const pendingAppointments = appointments.filter(a => a.status === 'pendente');

    const handleEditChange = (field: keyof Appointment, value: any) => {
        if (editingAppointment) {
            setEditingAppointment({ ...editingAppointment, [field]: value });
        }
    };

    const handleSaveAppointment = (closeForm = true) => {
        if (editingAppointment) {
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? editingAppointment : a));
            if (closeForm) setEditingAppointment(null);
        }
    };

    const handleAddNew = () => {
        const newApt: Appointment = { 
            id: Date.now().toString(), 
            client: '', 
            service: services[0]?.name || '', 
            time: '09:00', 
            status: 'confirmado', 
            date: 'Hoje', 
            phone: '',
            professional: professionals.length > 0 ? professionals[0].name : undefined
        };
        setAppointments([newApt, ...appointments]);
        setEditingAppointment(newApt);
    };

    const activeAppointments = appointments.filter(a => a.status !== 'cancelado');

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 px-4 pt-4">
            <div className="flex justify-between items-center mb-4 relative z-20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agenda</h2>
                <div className="flex items-center gap-3">
                    <button onClick={handleCopyLink} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center gap-2 text-xs font-bold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/40">
                        <LinkIcon size={16} /> LINK
                    </button>
                </div>
            </div>
            
            <button onClick={handleAddNew} className="w-full py-3 bg-white dark:bg-[#0a0a0a] border-2 border-dashed border-gray-300 dark:border-white/10 text-gray-400 rounded-xl font-bold text-sm mb-4 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Plus size={18} /> Novo Agendamento
            </button>

            {activeAppointments.length === 0 && <p className="text-gray-500 text-center py-10">Sua agenda está vazia.</p>}
            
            {activeAppointments.map((apt) => {
                const isEditing = editingAppointment?.id === apt.id;
                const dataToDisplay = isEditing ? editingAppointment! : apt;
                
                return (
                    <div key={apt.id} className={`bg-white dark:bg-[#0a0a0a] rounded-xl border-l-4 border-primary shadow-sm overflow-hidden transition-all dark:border-r dark:border-y dark:border-r-white/5 dark:border-y-white/5 ${isEditing ? 'ring-2 ring-primary' : ''}`}>
                        {isEditing ? (
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-primary text-sm uppercase">Editando Agendamento</h3>
                                    <button onClick={() => setEditingAppointment(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18}/></button>
                                </div>
                                <div className="space-y-3">
                                    <input type="text" value={dataToDisplay.client} onChange={e => handleEditChange('client', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Nome Cliente" />
                                    <input type="text" value={dataToDisplay.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="WhatsApp" />
                                    <select value={dataToDisplay.service} onChange={e => handleEditChange('service', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm">
                                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                    <select value={dataToDisplay.professional} onChange={e => handleEditChange('professional', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm">
                                        <option value="">Selecione Profissional</option>
                                        {professionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input type="text" value={dataToDisplay.date} onChange={e => handleEditChange('date', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Data" />
                                        <input type="text" value={dataToDisplay.time} onChange={e => handleEditChange('time', e.target.value)} onBlur={() => handleSaveAppointment(false)} className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Hora" />
                                    </div>
                                    <button onClick={() => handleSaveAppointment(true)} className="w-full bg-primary text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1" onClick={() => setEditingAppointment(apt)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{apt.time}</span>
                                            <span className="text-xs text-gray-400 ml-1">({apt.date})</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{apt.client}</h3>
                                        <p className="text-xs text-gray-500">{apt.service} {apt.professional ? `• ${apt.professional}` : ''}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{apt.status}</div>
                                        <button onClick={() => setEditingAppointment(apt)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary"><Edit2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-2">
                                    {apt.status !== 'confirmado' && <button onClick={() => handleStatusChange(apt.id, 'confirmado')} className="text-green-600 text-xs font-bold px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">CONFIRMAR</button>}
                                    <button onClick={() => handleStatusChange(apt.id, 'cancelado')} className="text-red-600 text-xs font-bold px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100">CANCELAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  const renderClientsView = () => {
    // Process unique clients from appointments
    const clientMap = new Map<string, { name: string; phone: string; visits: number; lastVisit: string }>();

    appointments.forEach(apt => {
        if (!clientMap.has(apt.client)) {
            clientMap.set(apt.client, { 
                name: apt.client, 
                phone: apt.phone || '', 
                visits: 0, 
                lastVisit: apt.date 
            });
        }
        const client = clientMap.get(apt.client)!;
        client.visits += 1;
        // Simple string comparison for dates is not ideal but works for basic sorting if format is correct
        // In a real app, convert to Date object
        if (apt.date > client.lastVisit) {
            client.lastVisit = apt.date;
        }
    });

    const clients = Array.from(clientMap.values());

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 px-4 pt-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Meus Clientes</h2>
            
            {editingClient && (
                 <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-primary">Editar Cliente</h3>
                        <button onClick={() => setEditingClient(null)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                            <input 
                                type="text" 
                                value={editingClient.name} 
                                onChange={e => setEditingClient({...editingClient, name: e.target.value})} 
                                onBlur={() => handleSaveClient(false)}
                                className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
                            <input 
                                type="text" 
                                value={editingClient.phone} 
                                onChange={e => setEditingClient({...editingClient, phone: e.target.value})} 
                                onBlur={() => handleSaveClient(false)}
                                className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" 
                            />
                        </div>
                        <div className="flex gap-2">
                             <button 
                                 onClick={() => handleDeleteClient(editingClient.originalName)} 
                                 className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                 title="Excluir Cliente"
                             >
                                 <Trash2 size={20} />
                             </button>
                             <button onClick={() => handleSaveClient(true)} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar Alterações</button>
                        </div>
                        <p className="text-xs text-red-400 text-center">Nota: Isso atualizará o nome em todos os agendamentos.</p>
                    </div>
                </div>
            )}

            {clients.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    Nenhum cliente registrado ainda.
                </div>
            )}

            <div className="space-y-3">
                {clients.map((client, index) => (
                    <div key={index} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate">{client.name}</h3>
                                {client.phone && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Phone size={12} /> {client.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                 <div className="flex items-center justify-end gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg mb-1">
                                     <History size={12} /> {client.visits} visitas
                                 </div>
                                 <p className="text-[10px] text-gray-400">Última: {client.lastVisit}</p>
                            </div>
                            <button 
                                onClick={() => setEditingClient({ originalName: client.name, name: client.name, phone: client.phone })}
                                className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteClient(client.name)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderFinancesView = () => {
       // ... existing finance view code ...
      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      const handleEditChange = (field: keyof Transaction, value: any) => {
          if (editingTransaction) {
              setEditingTransaction({ ...editingTransaction, [field]: value });
          }
      };

      const handleSaveTransaction = () => {
          if (editingTransaction) {
              setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? editingTransaction : t));
              setEditingTransaction(null);
          }
      };

      const handleDeleteTransaction = (id: string) => {
          if(confirm('Excluir movimentação?')) {
              setTransactions(prev => prev.filter(t => t.id !== id));
          }
      }

      const handleAddTransaction = () => {
          const newTrans: Transaction = { id: Date.now().toString(), title: '', type: 'income', amount: 0, date: 'Hoje' };
          setTransactions([newTrans, ...transactions]);
          setEditingTransaction(newTrans);
      }

      return (
          <div className="space-y-6 pb-24 px-4 pt-4 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/50">
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase mb-1">Entradas</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">R$ {income.toFixed(2)}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/50">
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase mb-1">Saídas</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">R$ {expense.toFixed(2)}</p>
                  </div>
              </div>
              
              <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-white/5">
                   <div className="relative z-10">
                       <p className="text-gray-400 text-sm font-medium mb-1">Saldo Total</p>
                       <p className="text-4xl font-bold">R$ {(income - expense).toFixed(2)}</p>
                   </div>
                   <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={100} />
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 dark:text-white">Histórico</h3>
                      <button onClick={handleAddTransaction} className="text-primary text-sm font-bold flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                          <Plus size={14} /> Nova
                      </button>
                  </div>
                  
                  <div className="space-y-3">
                      {transactions.map(t => {
                          const isEditing = editingTransaction?.id === t.id;
                          const dataToDisplay = isEditing ? editingTransaction! : t;
                          
                          return (
                            <div key={t.id} className={`bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm overflow-hidden transition-all dark:border dark:border-white/5 ${isEditing ? 'ring-2 ring-primary p-4' : 'p-4 flex items-center justify-between'}`}>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-primary text-xs uppercase">Editar Movimentação</h4>
                                            <button onClick={() => setEditingTransaction(null)} className="text-gray-400"><X size={16}/></button>
                                        </div>
                                        <input type="text" value={dataToDisplay.title} onChange={e => handleEditChange('title', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Descrição" />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditChange('type', 'income')} className={`flex-1 p-2 rounded-lg text-sm font-bold ${dataToDisplay.type === 'income' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 dark:bg-[#111] text-gray-500'}`}>Entrada</button>
                                            <button onClick={() => handleEditChange('type', 'expense')} className={`flex-1 p-2 rounded-lg text-sm font-bold ${dataToDisplay.type === 'expense' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 dark:bg-[#111] text-gray-500'}`}>Saída</button>
                                        </div>
                                        <input type="number" value={dataToDisplay.amount} onChange={e => handleEditChange('amount', parseFloat(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Valor" />
                                        <div className="flex justify-end gap-2 mt-2">
                                             <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                             <button onClick={handleSaveTransaction} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg text-sm"><CheckCircle size={16} className="inline mr-1"/> Salvar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setEditingTransaction(t)}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <DollarSign size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 dark:text-white truncate">{t.title}</p>
                                                <p className="text-xs text-gray-500">{t.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <button onClick={() => setEditingTransaction(t)} className="text-gray-400 hover:text-blue-500"><Edit2 size={16} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const renderProfileView = () => {
    
    // Inline Helper Renderers within ProfileView Context
    const renderHeaderBack = (title: string) => (
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setProfileView('menu')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
    );

    // Menu
    if (profileView === 'menu') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                
                {/* Botão de Loja Retornado para a Aba Perfil (Configuração Anterior) */}
                <div className="mb-6">
                    <button onClick={onViewAsClient} className="w-full bg-gradient-to-r from-primary to-yellow-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-lg">Minha Loja Online</p>
                                <p className="text-xs text-white/80">Toque para visualizar como cliente</p>
                            </div>
                        </div>
                        <ChevronRight className="text-white/80" />
                    </button>
                </div>

                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 px-2">Configurações Gerais</p>

                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5">
                    <button onClick={() => setProfileView('meus_dados')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                            <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><User size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Meus dados
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('aparencia')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><Palette size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Personalizar Aparência
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('horarios')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                            <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><CalendarDays size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Horário de Funcionamento
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('servicos')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><Briefcase size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Serviços
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('produtos')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><ShoppingBag size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Produtos
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('planos')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><Package size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Planos Mensais
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('profissionais')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><Users size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Profissionais
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={() => setProfileView('cancelados')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                             <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full"><Ban size={18} className="text-gray-600 dark:text-gray-300" /></div>
                            Agendamentos Cancelados
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="mt-8">
                    <button onClick={onSwitchToClient} className="w-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        <LogOut size={20} /> SAIR DA CONTA
                    </button>
                </div>
            </div>
        );
    }
    
    // ... rest of the component ...
    
    if (profileView === 'meus_dados') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Dados')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-6 space-y-4 border border-gray-100 dark:border-white/5">
                    
                    {/* Logo Upload */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-primary transition-colors">
                                {businessProfile.logo ? (
                                    <img src={businessProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="text-gray-400" size={32} />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Alterar</span>
                            </div>
                        </div>
                        <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome do Negócio</label>
                            <input 
                                type="text" 
                                value={businessProfile.name || ''} 
                                onChange={(e) => onUpdateProfile({ name: e.target.value })}
                                className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp (com DDD)</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.whatsapp || ''} 
                                 onChange={(e) => onUpdateProfile({ whatsapp: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary"
                                 placeholder="+55 (00) 00000-0000"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Chave PIX</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.pixKey || ''} 
                                 onChange={(e) => onUpdateProfile({ pixKey: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Endereço (Opcional)</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.address || ''} 
                                 onChange={(e) => onUpdateProfile({ address: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary"
                             />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (profileView === 'aparencia') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Personalizar Aparência')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-6 space-y-6 border border-gray-100 dark:border-white/5">
                    
                    {/* Background Image */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Imagem de Fundo (Capa)</label>
                        <div 
                            className="w-full h-32 rounded-xl bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-primary transition-colors"
                            onClick={() => bgInputRef.current?.click()}
                        >
                            {businessProfile.backgroundImage ? (
                                <img src={businessProfile.backgroundImage} className="w-full h-full object-cover opacity-80" alt="Background" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <ImageIcon size={24} />
                                    <span className="text-xs mt-1">Carregar Imagem</span>
                                </div>
                            )}
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                             </div>
                        </div>
                        <input type="file" ref={bgInputRef} onChange={handleBgChange} className="hidden" accept="image/*" />
                    </div>

                    {/* Colors */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Cores da Marca</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-400 mb-1 block">Cor Principal</span>
                                <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-[#111]">
                                    <input 
                                        type="color" 
                                        value={businessProfile.colors.primary}
                                        onChange={(e) => onUpdateProfile({ colors: { ...businessProfile.colors, primary: e.target.value }})}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0"
                                    />
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{businessProfile.colors.primary}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 mb-1 block">Cor Secundária</span>
                                <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-[#111]">
                                    <input 
                                        type="color" 
                                        value={businessProfile.colors.secondary}
                                        onChange={(e) => onUpdateProfile({ colors: { ...businessProfile.colors, secondary: e.target.value }})}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0"
                                    />
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{businessProfile.colors.secondary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Font */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Fonte (Tipografia)</label>
                        <select 
                            value={businessProfile.fontFamily}
                            onChange={(e) => onUpdateProfile({ fontFamily: e.target.value })}
                            className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary"
                        >
                            <option value="Inter">Inter (Moderna)</option>
                            <option value="Lato">Lato (Elegante)</option>
                            <option value="Montserrat">Montserrat (Geométrica)</option>
                            <option value="Open Sans">Open Sans (Legível)</option>
                            <option value="Roboto">Roboto (Padrão)</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    }

    if (profileView === 'servicos') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Serviços')}
                
                <button 
                    onClick={() => setEditingService({ id: Date.now().toString(), name: '', description: '', price: 0, duration: 30, image: '', deposit: 0 })}
                    className="w-full py-3 bg-primary/10 text-primary rounded-xl border-2 border-dashed border-primary/30 font-bold flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors"
                >
                    <Plus size={20} /> Adicionar Serviço
                </button>

                {editingService && (
                    <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-primary">Novo Serviço</h3>
                            <button onClick={() => setEditingService(null)}><X size={20} className="text-gray-400"/></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-center mb-2">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center relative cursor-pointer" onClick={() => serviceImageRef.current?.click()}>
                                    {editingService.image ? <img src={editingService.image} className="w-full h-full object-cover rounded-lg" /> : <ImageIcon size={24} className="text-gray-400"/>}
                                    <input type="file" ref={serviceImageRef} onChange={handleServiceImageChange} className="hidden" accept="image/*" />
                                </div>
                            </div>
                            <input type="text" placeholder="Nome do Serviço" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            <textarea placeholder="Descrição" value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            <div className="flex gap-2">
                                <input type="number" placeholder="Preço (R$)" value={editingService.price} onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                <input type="number" placeholder="Duração (min)" value={editingService.duration} onChange={e => setEditingService({...editingService, duration: parseInt(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Sinal / Depósito (R$)</label>
                                <input type="number" placeholder="Valor do Sinal" value={editingService.deposit || 0} onChange={e => setEditingService({...editingService, deposit: parseFloat(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDeleteService(editingService.id)} 
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Excluir Serviço"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => handleSaveService(true)} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {services.map(service => (
                        <div key={service.id} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white">{service.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.duration} min • R$ {service.price.toFixed(2)}</p>
                            {service.deposit && service.deposit > 0 && 
                                <p className="text-sm text-yellow-500 font-semibold mt-1">Sinal: R$ {service.deposit.toFixed(2)}</p>
                            }
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setEditingService(service)} className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">Editar</button>
                                <button onClick={() => handleDeleteService(service.id)} className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (profileView === 'profissionais') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Profissionais')}
                
                <button 
                    onClick={() => setEditingProfessional({ id: Date.now().toString(), name: '', role: '', avatar: '', rating: 5 })}
                    className="w-full py-3 bg-primary/10 text-primary rounded-xl border-2 border-dashed border-primary/30 font-bold flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors"
                >
                    <Plus size={20} /> Adicionar Profissional
                </button>

                {editingProfessional && (
                    <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-primary">Novo Profissional</h3>
                            <button onClick={() => setEditingProfessional(null)}><X size={20} className="text-gray-400"/></button>
                        </div>
                        <div className="space-y-3">
                             <div className="flex justify-center mb-2">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center relative cursor-pointer overflow-hidden" onClick={() => professionalAvatarRef.current?.click()}>
                                    {editingProfessional.avatar ? <img src={editingProfessional.avatar} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-400"/>}
                                    <input type="file" ref={professionalAvatarRef} onChange={handleProfessionalAvatarChange} className="hidden" accept="image/*" />
                                </div>
                            </div>
                            <input type="text" placeholder="Nome" value={editingProfessional.name} onChange={e => setEditingProfessional({...editingProfessional, name: e.target.value})} onBlur={() => handleSaveProfessional(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input type="text" placeholder="Cargo (Ex: Barbeiro)" value={editingProfessional.role} onChange={e => setEditingProfessional({...editingProfessional, role: e.target.value})} onBlur={() => handleSaveProfessional(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                </div>
                                <div className="w-24">
                                    <input type="number" placeholder="Nota" step="0.1" min="0" max="5" value={editingProfessional.rating} onChange={e => setEditingProfessional({...editingProfessional, rating: parseFloat(e.target.value)})} onBlur={() => handleSaveProfessional(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDeleteProfessional(editingProfessional.id)} 
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Excluir Profissional"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => handleSaveProfessional(true)} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {professionals.map(pro => (
                        <div key={pro.id} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={pro.avatar} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{pro.name}</h3>
                                    <p className="text-xs text-gray-500">{pro.role}</p>
                                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                                        <span className="font-bold">{pro.rating?.toFixed(1) || '5.0'}</span> ★
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingProfessional(pro)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Edit2 size={16}/></button>
                                <button onClick={() => handleDeleteProfessional(pro.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (profileView === 'produtos') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Produtos')}
                 <button 
                    onClick={() => setEditingProduct({ id: Date.now().toString(), name: '', price: 0, image: '', stock: 10 })}
                    className="w-full py-3 bg-primary/10 text-primary rounded-xl border-2 border-dashed border-primary/30 font-bold flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors"
                >
                    <Plus size={20} /> Adicionar Produto
                </button>

                {editingProduct && (
                    <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-primary">Novo Produto</h3>
                            <button onClick={() => setEditingProduct(null)}><X size={20} className="text-gray-400"/></button>
                        </div>
                        <div className="space-y-3">
                             <div className="flex justify-center mb-2">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center relative cursor-pointer overflow-hidden" onClick={() => productImageRef.current?.click()}>
                                    {editingProduct.image ? <img src={editingProduct.image} className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-400"/>}
                                    <input type="file" ref={productImageRef} onChange={handleProductImageChange} className="hidden" accept="image/*" />
                                </div>
                            </div>
                            <input type="text" placeholder="Nome do Produto" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} onBlur={() => handleSaveProduct(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                                    <input type="number" placeholder="0.00" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} onBlur={() => handleSaveProduct(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">Estoque</label>
                                    <input type="number" placeholder="Qtd" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} onBlur={() => handleSaveProduct(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDeleteProduct(editingProduct.id)} 
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Excluir Produto"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => handleSaveProduct(true)} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}

                 <div className="space-y-3">
                    {products.map(prod => (
                        <div key={prod.id} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex gap-4">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {prod.image ? <img src={prod.image} className="w-full h-full object-cover rounded-lg" /> : <Package size={20} className="text-gray-400"/>}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{prod.name}</h3>
                                    {prod.stock !== undefined && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${prod.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {prod.stock > 0 ? `${prod.stock} un` : 'Esgotado'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-green-600">R$ {prod.price.toFixed(2)}</p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setEditingProduct(prod)} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded">Editar</button>
                                    <button onClick={() => handleDeleteProduct(prod.id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-1 rounded">Excluir</button>
                                </div>
                             </div>
                        </div>
                    ))}
                 </div>
            </div>
        );
    }

    if (profileView === 'horarios') {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        const dayLabels: {[key: string]: string} = { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' };
        
        const toggleDay = (day: keyof BusinessHours) => {
            const current = businessProfile.openingHours[day];
            const updatedHours = {
                ...businessProfile.openingHours,
                [day]: { ...current, isOpen: !current.isOpen }
            };
            onUpdateProfile({ openingHours: updatedHours });
        };

        const updateTime = (day: keyof BusinessHours, index: number, field: 'start' | 'end', value: string) => {
            const currentDay = businessProfile.openingHours[day];
            const newIntervals = [...currentDay.intervals];
             if (newIntervals[index]) {
                 newIntervals[index] = { ...newIntervals[index], [field]: value };
             }
             
            const updatedHours = {
                ...businessProfile.openingHours,
                [day]: { ...currentDay, intervals: newIntervals }
            };
            onUpdateProfile({ openingHours: updatedHours });
        };

        const addInterval = (day: keyof BusinessHours) => {
            const currentDay = businessProfile.openingHours[day];
            const newInterval = { start: '12:00', end: '13:00' };
            const newIntervals = [...currentDay.intervals, newInterval];
            
            const updatedHours = {
                ...businessProfile.openingHours,
                [day]: { ...currentDay, intervals: newIntervals }
            };
            onUpdateProfile({ openingHours: updatedHours });
        };

        const removeInterval = (day: keyof BusinessHours, index: number) => {
            const currentDay = businessProfile.openingHours[day];
            const newIntervals = currentDay.intervals.filter((_, i) => i !== index);
            
            const updatedHours = {
                ...businessProfile.openingHours,
                [day]: { ...currentDay, intervals: newIntervals }
            };
            onUpdateProfile({ openingHours: updatedHours });
        };

        return (
             <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Horário de Funcionamento')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                    {days.map(day => {
                        const schedule = businessProfile.openingHours[day];

                        return (
                            <div key={day} className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleDay(day)}>
                                            {schedule.isOpen ? <ToggleRight size={24} className="text-primary"/> : <ToggleLeft size={24} className="text-gray-300"/>}
                                        </button>
                                        <span className={`font-bold ${schedule.isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{dayLabels[day]}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{schedule.isOpen ? 'Aberto' : 'Fechado'}</span>
                                </div>
                                
                                {schedule.isOpen && (
                                    <div className="pl-9 space-y-2">
                                        {schedule.intervals.map((interval, idx) => (
                                            <div key={idx} className="flex items-center gap-2 animate-fade-in-up">
                                                <input 
                                                    type="time" 
                                                    value={interval.start}
                                                    onChange={(e) => updateTime(day, idx, 'start', e.target.value)}
                                                    className="bg-gray-50 text-gray-900 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm dark:text-white"
                                                />
                                                <span className="text-gray-400 text-xs">até</span>
                                                <input 
                                                    type="time" 
                                                    value={interval.end}
                                                    onChange={(e) => updateTime(day, idx, 'end', e.target.value)}
                                                    className="bg-gray-50 text-gray-900 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm dark:text-white"
                                                />
                                                <button 
                                                    onClick={() => removeInterval(day, idx)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Remover horário"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <button 
                                            onClick={() => addInterval(day)}
                                            className="text-xs font-bold text-primary flex items-center gap-1 mt-1 hover:text-primary-hover transition-colors"
                                        >
                                            <Plus size={12} /> Adicionar Período
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    // Placeholder for unimplemented sections if any remain
    return (
        <div className="pb-24 pt-6 px-4 animate-fade-in-up">
            {renderHeaderBack('Configuração')}
             <div className="p-8 text-center text-gray-400">
                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                <p>Esta seção ({profileView}) está sendo implementada.</p>
                <button onClick={() => setProfileView('menu')} className="mt-4 text-primary font-bold">Voltar</button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans pb-20 transition-colors">
      {/* Tab Content */}
      <main>
          {activeTab === 'inicio' && renderHomeView()}
          {activeTab === 'agenda' && renderAgendaView()}
          {activeTab === 'clientes' && renderClientsView()}
          {activeTab === 'financeiro' && renderFinancesView()}
          {activeTab === 'perfil' && renderProfileView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/5 pb-safe px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => { setActiveTab('inicio'); setProfileView('menu'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'inicio' ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <Home size={24} strokeWidth={activeTab === 'inicio' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Início</span>
        </button>
        <button 
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'agenda' ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <Calendar size={24} strokeWidth={activeTab === 'agenda' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Agenda</span>
        </button>
        
        {/* FAB Button for New Action */}
        <div className="relative -top-6">
            <button 
                onClick={() => setActiveTab('agenda')}
                className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white transform transition-transform active:scale-95 border-4 border-gray-50 dark:border-[#050505]"
            >
                <Plus size={28} />
            </button>
        </div>
        
        {/* Added Clients Tab */}
        <button 
            onClick={() => setActiveTab('clientes')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'clientes' ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <Users size={24} strokeWidth={activeTab === 'clientes' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Clientes</span>
        </button>

        <button 
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'perfil' ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <User size={24} strokeWidth={activeTab === 'perfil' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
};