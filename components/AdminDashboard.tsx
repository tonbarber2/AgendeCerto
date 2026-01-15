import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingBag, 
  Users, 
  DollarSign, 
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
  MapPin, 
  Smartphone, 
  Home, 
  QrCode, 
  Sun, 
  Moon, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  Menu,
  Image
} from 'lucide-react';
import { Theme, BusinessProfile, Service, Professional, Appointment, AdminUser, BusinessHours, ServiceCategory } from '../types';

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
  categories: ServiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
  currentUser: AdminUser;
}

interface Transaction { 
  id: string; 
  appointmentId?: string; // Link to the appointment
  title: string; 
  type: 'income' | 'expense'; 
  amount: number; 
  date: string; 
}

// Interface auxiliar para edição de cliente
interface EditableClient {
    originalName: string;
    name: string;
    phone: string;
}

// Hook para obter o valor anterior de uma prop ou estado
const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

// Helper function to handle image uploads and conversion to base64
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, onImageReady: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("A imagem é muito grande. O limite é de 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            onImageReady(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
};

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
  categories,
  setCategories,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Profile Navigation State
  const [profileView, setProfileView] = useState<'menu' | 'meus_dados' | 'horarios' | 'servicos' | 'profissionais' | 'cancelados' | 'aparencia'>('menu');
  
  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);

  // --- States for Inline Editing (Buffer Objects) ---
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Novo estado para editar cliente
  const [editingClient, setEditingClient] = useState<EditableClient | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const prevAppointments = usePrevious(appointments);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Efeito para exibir notificações de novos agendamentos pendentes
  useEffect(() => {
    if (!businessProfile.desktopNotifications || Notification.permission !== 'granted' || !prevAppointments) {
        return;
    }

    const currentPendingIds = new Set(appointments.filter(a => a.status === 'pendente' && !a.id.startsWith('temp_')).map(a => a.id));
    const prevPendingIds = new Set(prevAppointments.filter(a => a.status === 'pendente' && !a.id.startsWith('temp_')).map(a => a.id));

    const newAppointmentIds = [...currentPendingIds].filter(id => !prevPendingIds.has(id));

    if (newAppointmentIds.length > 0) {
        newAppointmentIds.forEach(id => {
            const apt = appointments.find(a => a.id === id);
            if (apt) {
                 const notificationTitle = 'Novo Agendamento! 🔔';
                 const notificationBody = `${apt.client} agendou ${apt.service} para ${apt.date} às ${apt.time}.`;

                 new Notification(notificationTitle, {
                     body: notificationBody,
                     tag: apt.id, // Evita notificações duplicadas
                 });
            }
        });
    }
  }, [appointments, prevAppointments, businessProfile.desktopNotifications]);


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
          // Add transaction on confirmation
          if (newStatus === 'confirmado') {
              const service = services.find(s => s.name === appointment.service);
              const alreadyExists = transactions.some(t => t.appointmentId === appointment.id);

              if (service && typeof service.price === 'number' && !alreadyExists) {
                  const newTransaction: Transaction = {
                      id: `apt-${appointment.id}`,
                      appointmentId: appointment.id,
                      title: `${service.name} - ${appointment.client}`,
                      type: 'income',
                      amount: service.price,
                      date: appointment.date,
                  };
                  setTransactions(prev => [newTransaction, ...prev]);
              }
          }
          // Remove transaction on cancellation
          else if (newStatus === 'cancelado') {
              setTransactions(prev => prev.filter(t => t.appointmentId !== appointment.id));
          }

          // Send WhatsApp notification
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
  const handleCopyLink = () => {
    const url = `${window.location.origin}?store=${currentUser.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Link exclusivo copiado!'));
  };
  
    const handleNotificationToggle = async () => {
        const currentSetting = businessProfile.desktopNotifications;
        if (!currentSetting) { // Ativando
            if (Notification.permission === 'granted') {
                onUpdateProfile({ desktopNotifications: true });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    onUpdateProfile({ desktopNotifications: true });
                    new Notification('Agende Certo', {
                        body: 'Notificações ativadas com sucesso!',
                    });
                }
            } else {
                alert('As notificações estão bloqueadas nas configurações do seu navegador. Por favor, habilite-as para usar este recurso.');
            }
        } else { // Desativando
            onUpdateProfile({ desktopNotifications: false });
        }
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
      const todaysAppointments = appointments.filter(a => (a.date.includes(today) || a.date === 'Hoje') && !a.id.startsWith('temp_'));
      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      
      const pendingAppointments = appointments.filter(a => a.status === 'pendente' && !a.id.startsWith('temp_'));

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <h3 className="font-bold text-lg mb-1">Seu Link de Agendamento</h3>
                      <p className="text-sm text-gray-300 mb-4">Este é o link exclusivo da sua página. Envie para seus clientes para que eles possam agendar um horário online.</p>
                      <button onClick={handleCopyLink} className="w-full bg-primary text-black px-3 py-3 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-md">
                          <LinkIcon size={18} /> Copiar Link Público
                      </button>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                      <QrCode size={140} />
                  </div>
              </div>

              {/* Recent Shortcuts */}
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">Acesso Rápido</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
    const pendingAppointments = appointments.filter(a => a.status === 'pendente' && !a.id.startsWith('temp_'));

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
                    <button 
                        onClick={toggleTheme}
                        className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                    >
                        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
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
                const isTemp = apt.id.startsWith('temp_');
                
                return (
                    <div key={apt.id} className={`bg-white dark:bg-[#0a0a0a] rounded-xl border-l-4 shadow-sm overflow-hidden transition-all dark:border-r dark:border-y dark:border-r-white/5 dark:border-y-white/5 ${isEditing ? 'ring-2 ring-primary' : ''} ${isTemp ? 'opacity-60 border-l-yellow-400' : 'border-l-primary'}`}>
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
                                    <div className="flex items-center gap-3 flex-1" onClick={() => !isTemp && setEditingAppointment(apt)}>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <User size={20} className="text-gray-400"/>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{apt.time}</span>
                                                <span className="text-xs text-gray-400 ml-1">({apt.date})</span>
                                            </div>
                                            <h3 className={`font-semibold text-gray-800 dark:text-white truncate ${isTemp ? 'italic text-yellow-600 dark:text-yellow-400' : ''}`}>{apt.client}</h3>
                                            <p className="text-xs text-gray-500 truncate">{apt.service} {apt.professional ? `• ${apt.professional}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 pl-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{apt.status}</div>
                                        {!isTemp && <button onClick={() => setEditingAppointment(apt)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary"><Edit2 size={16} /></button>}
                                    </div>
                                </div>
                                {!isTemp && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-2">
                                        {apt.status !== 'confirmado' && <button onClick={() => handleStatusChange(apt.id, 'confirmado')} className="text-green-600 text-xs font-bold px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">CONFIRMAR</button>}
                                        <button onClick={() => handleStatusChange(apt.id, 'cancelado')} className="text-red-600 text-xs font-bold px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100">CANCELAR</button>
                                    </div>
                                )}
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

    appointments.filter(a => !a.id.startsWith('temp_')).forEach(apt => {
        if (!clientMap.has(apt.client)) {
            clientMap.set(apt.client, { 
                name: apt.client, 
                phone: apt.phone || '', 
                visits: 0, 
                lastVisit: '00/00',
            });
        }
        const client = clientMap.get(apt.client)!;
        client.visits += 1;
        client.lastVisit = apt.date; // Simple overwrite, last one wins
        client.phone = apt.phone || client.phone;
    });

    const clients = Array.from(clientMap.values());

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 px-4 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Meus Clientes</h2>
              <button 
                  onClick={toggleTheme}
                  className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
              >
                  {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
            
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
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
                  <button 
                      onClick={toggleTheme}
                      className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                  >
                      {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {transactions.length === 0 && (
                          <div className="text-center py-10 text-gray-500">
                              Nenhuma transação registrada.
                          </div>
                      )}
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
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <button onClick={() => setProfileView('menu')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            </div>
            <button 
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
            >
                {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
    );

    // Menu
    if (profileView === 'menu') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h2>
                    <button 
                        onClick={toggleTheme}
                        className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                    >
                        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
                
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
    
    if (profileView === 'meus_dados') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Dados')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-6 space-y-6 border border-gray-100 dark:border-white/5">
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome do Negócio</label>
                            <input 
                                type="text" 
                                value={businessProfile.name || ''} 
                                onChange={(e) => onUpdateProfile({ name: e.target.value })}
                                className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp (com DDD)</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.whatsapp || ''} 
                                 onChange={(e) => onUpdateProfile({ whatsapp: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                 placeholder="+55 (00) 00000-0000"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Chave PIX</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.pixKey || ''} 
                                 onChange={(e) => onUpdateProfile({ pixKey: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Endereço (Opcional)</label>
                             <input 
                                 type="text" 
                                 value={businessProfile.address || ''} 
                                 onChange={(e) => onUpdateProfile({ address: e.target.value })}
                                 className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg mt-1 bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                             />
                        </div>
                    </div>
                </div>
                 <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-4 mt-6 border border-gray-100 dark:border-white/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <label className="font-bold text-gray-800 dark:text-white">Notificações no Dispositivo</label>
                            <p className="text-xs text-gray-500">Receba um alerta quando chegar um novo agendamento.</p>
                        </div>
                        <button onClick={handleNotificationToggle}>
                            {businessProfile.desktopNotifications ? <ToggleRight size={32} className="text-primary"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                        </button>
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
                    
                    {/* Colors */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Cores da Marca</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* Logo and Background */}
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Logo e Imagem de Fundo</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo da Empresa</span>
                                <div className="w-full h-32 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-white/10 overflow-hidden">
                                    {businessProfile.logo ? (
                                        <img src={businessProfile.logo} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                                    ) : (
                                        <Briefcase size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <input 
                                    type="file"
                                    ref={logoInputRef}
                                    hidden
                                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                    onChange={(e) => handleImageUpload(e, (base64) => onUpdateProfile({ logo: base64 }))}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => logoInputRef.current?.click()} className="flex-1 text-xs font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Alterar</button>
                                    {businessProfile.logo && (
                                        <button onClick={() => onUpdateProfile({ logo: '' })} className="flex-1 text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Remover</button>
                                    )}
                                </div>
                            </div>

                            {/* Background Image Upload */}
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem de Fundo</span>
                                <div className="w-full h-32 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-white/10 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${businessProfile.backgroundImage})` }}>
                                    {!businessProfile.backgroundImage && (
                                        <Image size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <input 
                                    type="file"
                                    ref={bgInputRef}
                                    hidden
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => handleImageUpload(e, (base64) => onUpdateProfile({ backgroundImage: base64 }))}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => bgInputRef.current?.click()} className="flex-1 text-xs font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Alterar</button>
                                    {businessProfile.backgroundImage && (
                                        <button onClick={() => onUpdateProfile({ backgroundImage: '' })} className="flex-1 text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Remover</button>
                                    )}
                                </div>
                            </div>
                        </div>
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
                    onClick={() => setEditingService({ id: Date.now().toString(), name: '', duration: 30 })}
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
                            <input type="text" placeholder="Nome do Serviço" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            <div className="flex gap-2">
                                <input type="number" placeholder="Preço (R$)" value={editingService.price ?? ''} onChange={e => setEditingService({...editingService, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                <input type="number" placeholder="Duração (min)" value={editingService.duration} onChange={e => setEditingService({...editingService, duration: parseInt(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Sinal / Depósito (R$)</label>
                                <input type="number" placeholder="Valor do Sinal" value={editingService.deposit ?? ''} onChange={e => setEditingService({...editingService, deposit: e.target.value === '' ? undefined : parseFloat(e.target.value)})} onBlur={() => handleSaveService(false)} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
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
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {service.duration} min 
                                {typeof service.price === 'number' ? ` • R$ ${service.price.toFixed(2)}` : ' • Preço a consultar'}
                            </p>
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
                    onClick={() => setEditingProfessional({ id: Date.now().toString(), name: '', role: '', rating: 5 })}
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
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User size={24} className="text-gray-500" /></div>
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
                    {days.map(day => (
                        <div key={day} className="p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 dark:text-white">{dayLabels[day]}</span>
                                <button onClick={() => toggleDay(day)}>
                                    {businessProfile.openingHours[day].isOpen ? <ToggleRight size={32} className="text-primary"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                                </button>
                            </div>
                            {businessProfile.openingHours[day].isOpen && (
                                <div className="mt-4 space-y-3">
                                    {businessProfile.openingHours[day].intervals.map((interval, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input type="time" value={interval.start} onChange={e => updateTime(day, index, 'start', e.target.value)} className="w-24 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" />
                                            <span className="text-gray-400">-</span>
                                            <input type="time" value={interval.end} onChange={e => updateTime(day, index, 'end', e.target.value)} className="w-24 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" />
                                            <button onClick={() => removeInterval(day, index)} className="text-red-500 p-2 ml-auto"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addInterval(day)} className="text-xs font-bold text-primary flex items-center gap-1"><Plus size={14}/> Adicionar intervalo</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    // Fallback/Default
    return <p>Selecione uma opção</p>;
  };
  
  // --- Main Component Render ---
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out bg-white dark:bg-[#0a0a0a] w-64 z-30 shadow-lg md:shadow-none border-r border-gray-200 dark:border-white/5`}>
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
                {businessProfile.logo && <img src={businessProfile.logo} alt="Logo" className="h-10 w-auto" />}
                {!businessProfile.logo && <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Briefcase className="text-primary"/></div>}
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{businessProfile.name || 'Meu Negócio'}</p>
                  <p className="text-xs text-gray-500">Painel Admin</p>
                </div>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1">
                 <button onClick={() => { setActiveTab('inicio'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'inicio' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <Home size={20} /> Início
                </button>
                 <button onClick={() => { setActiveTab('agenda'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'agenda' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <Calendar size={20} /> Agenda
                </button>
                 <button onClick={() => { setActiveTab('clientes'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'clientes' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <Users size={20} /> Clientes
                </button>
                 <button onClick={() => { setActiveTab('financeiro'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'financeiro' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <DollarSign size={20} /> Financeiro
                </button>
                 <button onClick={() => { setActiveTab('perfil'); setIsSidebarOpen(false); setProfileView('menu'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'perfil' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <Settings size={20} /> Configurações
                </button>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-3">
                {isTrial && (
                     <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center text-xs text-yellow-700 dark:text-yellow-400">
                        Você tem <b>{daysRemaining} dias</b> restantes no seu teste gratuito.
                    </div>
                )}
                 <button onClick={onViewAsClient} className="w-full flex items-center gap-2 justify-center text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    <Eye size={14} /> Ver como Cliente
                </button>
                <button onClick={onSwitchToClient} className="w-full flex items-center gap-2 justify-center text-xs font-bold text-red-500 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut size={14} /> Sair
                </button>
            </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-white dark:bg-[#0a0a0a] shadow-sm p-4 flex items-center justify-between z-10 border-b border-gray-200 dark:border-white/5">
            <button onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} className="text-gray-700 dark:text-gray-200" />
            </button>
            <span className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">{activeTab}</span>
            <div className="w-6"></div> {/* Spacer */}
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-[#050505] relative">
            {activeTab === 'inicio' && renderHomeView()}
            {activeTab === 'agenda' && renderAgendaView()}
            {activeTab === 'clientes' && renderClientsView()}
            {activeTab === 'financeiro' && renderFinancesView()}
            {activeTab === 'perfil' && renderProfileView()}

            {isTrial && (
                <div className="sticky bottom-0 left-0 right-0 p-4 z-10">
                     <div className="bg-yellow-500 text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-sm">
                        <p><b>{daysRemaining} dias restantes.</b> Para não perder seus dados, faça um upgrade.</p>
                        <button className="bg-white text-yellow-600 font-bold px-3 py-1 rounded-lg text-xs hover:bg-yellow-50">ASSINAR</button>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};
