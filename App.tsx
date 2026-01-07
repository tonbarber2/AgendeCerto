
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Theme, BusinessProfile, Appointment, Professional, Service, AdminUser, Product, ClientPlan, ServiceCategory } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { BookingFlow } from './components/BookingFlow';
import { AIReceptionist } from './components/AIReceptionist';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { db } from './services/db';
import { DEFAULT_BUSINESS_HOURS } from './constants';
import { CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [theme, setTheme] = useState<Theme>('light');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Store ID Management for Public Views
  const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

  // Booking State
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [preSelectedProId, setPreSelectedProId] = useState<string | undefined>(undefined);
  const [tempAppointment, setTempAppointment] = useState<Appointment | null>(null); // For real-time slot locking
  
  // --- Data State (Now loaded from DB) ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // --- UI State ---
  const [toastMessage, setToastMessage] = useState('');

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    email: '',
    phone: '',
    logo: '',
    backgroundImage: '',
    pixKey: '',
    whatsapp: '',
    address: '',
    openingHours: DEFAULT_BUSINESS_HOURS,
    notificationSound: true,
    selectedSound: 'Padrão (Digital)',
    desktopNotifications: true,
    fontFamily: 'Inter',
    colors: {
        primary: '#D4AF37',   // Gold
        secondary: '#F3E5AB', // Champagne
        background: '#f9fafb',
        listTitle: '#111827',
        listPrice: '#D4AF37',
        listInfo: '#6b7280',
        textPrimary: '#111827',
        textSecondary: '#6b7280'
    }
  });

  // --- State Persistence Logic ---
  
  // Ref para manter o estado mais recente e permitir salvamentos instantâneos ao sair.
  const latestStateRef = useRef({
    currentUser,
    isDataLoaded,
    businessProfile,
    appointments,
    professionals,
    services,
    products,
    clientPlans,
  });

  // Mantém o ref atualizado a cada renderização.
  useEffect(() => {
    latestStateRef.current = {
      currentUser,
      isDataLoaded,
      businessProfile,
      appointments,
      professionals,
      services,
      products,
      clientPlans,
    };
  });

  // Função para salvar o estado atual de forma síncrona.
  const saveCurrentState = () => {
    const state = latestStateRef.current;
    if (!state.currentUser || !state.isDataLoaded || state.currentUser.subscription?.status !== 'active') {
      return;
    }
    db.saveData(state.currentUser.id, {
      profile: state.businessProfile,
      appointments: state.appointments,
      professionals: state.professionals,
      services: state.services,
      products: state.products,
      clientPlans: state.clientPlans,
    });
  };

  // --- Initialization & Data Loading ---
  
  // Verifica se o admin principal já está logado ao carregar o app
  useEffect(() => {
    try {
      const savedUserJSON = localStorage.getItem('loggedInAdminUser');
      if (savedUserJSON) {
        const savedUser = JSON.parse(savedUserJSON) as AdminUser;
        // Mantém logado apenas o usuário admin específico
        if (savedUser && savedUser.email === 'ton222418@gmail.com') {
          setCurrentUser(savedUser);
        }
      }
    } catch (error) {
      console.error("Falha ao carregar usuário do localStorage:", error);
      localStorage.removeItem('loggedInAdminUser');
    }
  }, []); // Executa apenas uma vez na montagem do componente


  // Load Data on Startup (Public or Private)
  useEffect(() => {
    const initData = async () => {
        try {
            let data;
            
            // 1. Check for Store ID in URL (Client View)
            const params = new URLSearchParams(window.location.search);
            const storeIdFromUrl = params.get('store');
            
            if (storeIdFromUrl) {
                setPublicStoreId(storeIdFromUrl);
            }

            if (currentUser) {
                // Check Subscription Status
                // Usando optional chaining para segurança se o dado estiver incompleto
                if (currentUser.subscription?.status === 'expired') {
                    setView('SUBSCRIPTION');
                    setIsDataLoaded(true);
                    return; // Stop data loading if expired
                }
                data = await db.loadData(currentUser.id);
            } else {
                // Se for um visitante, carrega os dados públicos com base no parâmetro da URL
                // ou assume a loja principal do administrador como padrão.
                const targetStoreId = storeIdFromUrl || 'admin_ton_permanent';
                data = await db.loadPublicData(targetStoreId);
            }

            if (data) {
                // Migration/Fallback logic if openingHours is old format (string) in DB
                // This is a safety check in case we load old data
                let safeProfile = data.profile;
                if (typeof safeProfile.openingHours === 'string') {
                   safeProfile.openingHours = DEFAULT_BUSINESS_HOURS;
                }

                setBusinessProfile(safeProfile);
                setAppointments(data.appointments || []);
                setProfessionals(data.professionals || []);
                setServices(data.services || []);
                setProducts(data.products || []);
                setClientPlans(data.clientPlans || []);
                // In a real app, categories would come from DB. Initializing empty for now or mock if needed.
                setCategories([]); 
            }
        } catch (error) {
            console.error("Falha ao carregar dados:", error);
            // Em caso de erro crítico, não travamos o app, carregamos o estado atual (defaults)
        } finally {
            setIsDataLoaded(true);
        }
    };

    initData();
  }, [currentUser]);

  // Persist Data Changes (Debounced with feedback)
  useEffect(() => {
    const state = latestStateRef.current;
    if (!state.currentUser || !state.isDataLoaded || state.currentUser.subscription?.status !== 'active') {
      return;
    }

    const handler = setTimeout(() => {
      saveCurrentState();
      setToastMessage('Alterações salvas!');
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [businessProfile, appointments, professionals, services, products, clientPlans]);

  // Toast visibility handler
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Check URL params for direct booking link (Professional Deep Link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const professionalId = params.get('professionalId');
    
    if (professionalId) {
      setPreSelectedProId(professionalId);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow);
      setView('BOOKING_FLOW');
    }
  }, []);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply Dynamic Styles
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', businessProfile.colors.primary);
    root.style.setProperty('--color-primary-hover', businessProfile.colors.primary); 
    root.style.setProperty('--color-secondary', businessProfile.colors.secondary);
    root.style.setProperty('--color-text-primary', businessProfile.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', businessProfile.colors.textSecondary);
    root.style.setProperty('--color-list-title', businessProfile.colors.listTitle);
    root.style.setProperty('--color-list-price', businessProfile.colors.listPrice);
    root.style.setProperty('--color-list-info', businessProfile.colors.listInfo);
    document.body.style.fontFamily = `'${businessProfile.fontFamily}', sans-serif`;

    if (theme === 'light') {
      document.body.style.backgroundColor = businessProfile.colors.background;
    } else {
      document.body.style.backgroundColor = ''; 
    }
  }, [businessProfile.colors, businessProfile.fontFamily, theme]);

  // Automatic Reminder Sender
  useEffect(() => {
    const reminderInterval = setInterval(() => {
        const now = new Date();
        
        // Helper function to parse date and time from strings
        const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date | null => {
            try {
                const [hour, minute] = timeStr.split(':').map(Number);
                let appointmentDate = new Date();

                if (dateStr.toLowerCase() === 'hoje') {
                    // Date is already today, no change needed
                } else if (dateStr.includes('/')) {
                    const [day, month] = dateStr.split('/').map(Number);
                    const currentYear = new Date().getFullYear();
                    appointmentDate.setFullYear(currentYear, month - 1, day);
                } else {
                    return null; // Unrecognized format
                }
                
                appointmentDate.setHours(hour, minute, 0, 0);
                return appointmentDate;

            } catch (error) {
                console.error("Error parsing appointment date/time:", error);
                return null;
            }
        };

        const appointmentsToRemind = appointments.filter(apt => {
            if (apt.status !== 'confirmado' || apt.reminderSent) {
                return false;
            }

            const appointmentDateTime = parseAppointmentDateTime(apt.date, apt.time);
            if (!appointmentDateTime) {
                return false;
            }

            const diffInMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
            
            // Send reminder if it's 30 minutes or less away (but not in the past)
            return diffInMinutes > 0 && diffInMinutes <= 30;
        });

        if (appointmentsToRemind.length > 0) {
            appointmentsToRemind.forEach(apt => {
                 const phone = apt.phone ? apt.phone.replace(/\D/g, '') : '';
                 if (phone.length >= 10) {
                     const message = `Olá ${apt.client}! Lembrete: seu agendamento é em 30 minutos. Estamos te esperando! 😉`;
                     const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
                     window.open(url, '_blank');
                 }
            });

            // Mark these appointments as having their reminder sent
            const remindedIds = new Set(appointmentsToRemind.map(a => a.id));
            setAppointments(prev => 
                prev.map(apt => 
                    remindedIds.has(apt.id) ? { ...apt, reminderSent: true } : apt
                )
            );
        }
    }, 60000); // Check every minute

    // Cleanup interval on component unmount
    return () => clearInterval(reminderInterval);

  }, [appointments]);

  // --- Actions ---

  const handleLockSlot = (slotInfo: Omit<Appointment, 'id' | 'client' | 'phone' | 'status'>) => {
    const newTempAppointment: Appointment = {
      id: `temp_${Date.now()}`,
      client: 'Reserva em andamento...',
      phone: '',
      status: 'pendente', // This status will block the slot
      ...slotInfo,
    };
    setTempAppointment(newTempAppointment);
  };

  const handleUnlockSlot = () => {
    setTempAppointment(null);
  };
  
  const handleBackToLanding = () => {
    handleUnlockSlot();
    setView('LANDING');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStartBooking = (date: Date) => {
    setBookingDate(date);
    setView('BOOKING_FLOW');
  };

  const handleNewBooking = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment]);
    handleUnlockSlot(); // Clear the temporary lock
  
    // Se o admin estiver logado, o useEffect de persistência já vai salvar os dados.
    // A lógica abaixo é executada apenas para agendamentos feitos por clientes (público).
    if (!currentUser) {
      // Tenta obter o ID da loja do link compartilhado (ex: ?store=ID_DA_LOJA).
      // Se não houver um ID no link, o sistema assume o agendamento
      // para a loja principal, associada ao e-mail ton222418@gmail.com.
      const targetStoreId = publicStoreId || 'admin_ton_permanent';
  
      if (!targetStoreId) {
        // Este caso agora é improvável, mas serve como uma salvaguarda.
        console.error("Falha no agendamento: ID da loja não pôde ser determinado.");
        alert("Ocorreu um erro ao salvar seu agendamento. O link que você usou parece estar incompleto ou inválido.");
        // Reverte a adição otimista do agendamento que foi feita no início da função.
        setAppointments(prev => prev.filter(apt => apt.id !== newAppointment.id));
        return;
      }
  
      // Carrega os dados da loja-alvo, adiciona o novo agendamento,
      // e depois salva o conjunto de dados atualizado.
      db.loadData(targetStoreId).then(async (storeData) => {
        const updatedAppointments = [...storeData.appointments, newAppointment];
        await db.saveData(targetStoreId, { ...storeData, appointments: updatedAppointments });

      }).catch(err => {
        console.error("Erro ao salvar agendamento para a loja:", targetStoreId, err);
        alert("Não foi possível salvar seu agendamento. Verifique o link e tente novamente.");
        // Reverte a adição otimista do agendamento.
        setAppointments(prev => prev.filter(apt => apt.id !== newAppointment.id));
      });
    }
  };

  const updateProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({ ...prev, ...profile }));
  };

  const handleEnterAdmin = () => {
      if (currentUser) {
          // If already logged in, go straight to Dashboard
          setView('ADMIN');
      } else {
          // Otherwise, go to Auth
          setView('AUTH');
      }
  };

  const handleLoginSuccess = (user: AdminUser) => {
      // Se for o admin principal, salva o login para sessões futuras
      if (user.email === 'ton222418@gmail.com') {
        try {
          localStorage.setItem('loggedInAdminUser', JSON.stringify(user));
        } catch (e) {
          console.error("Não foi possível salvar o usuário no localStorage.", e);
        }
      }
      
      setCurrentUser(user);
      setIsDataLoaded(false); // Trigger data reload for this user
      
      if (user.subscription?.status === 'expired') {
          setView('SUBSCRIPTION');
      } else {
          setView('ADMIN');
      }
  };

  const handleLogout = () => {
      // Garante que o estado mais recente seja salvo antes de sair.
      saveCurrentState();
      
      // Limpa o login salvo do admin ao sair.
      localStorage.removeItem('loggedInAdminUser');

      setCurrentUser(null);
      setView('LANDING');
      setIsDataLoaded(false); // Trigger reload of public data
  };

  const handleSubscriptionUpdate = (updatedUser: AdminUser) => {
      setCurrentUser(updatedUser);
      setView('ADMIN');
      setIsDataLoaded(false); // Trigger reload to ensure data access
  };

  const renderView = () => {
    if (!isDataLoaded && !currentUser && view !== 'AUTH' && view !== 'LANDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayedAppointments = tempAppointment ? [...appointments, tempAppointment] : appointments;

    switch(view) {
      case 'AUTH':
          return (
            <AuthScreen 
              onLoginSuccess={handleLoginSuccess}
              onBack={() => setView('LANDING')}
              toggleTheme={toggleTheme}
              currentTheme={theme}
            />
          );
      case 'SUBSCRIPTION':
          if (!currentUser) { return null; }
          return (
              <SubscriptionScreen 
                  user={currentUser}
                  onSubscriptionUpdate={handleSubscriptionUpdate}
                  onLogout={handleLogout}
              />
          );
      case 'ADMIN':
        // Protect Route
        if (!currentUser) {
            // Should redirect if somehow reached here without user
            setView('AUTH');
            return null;
        }
        if (currentUser.subscription?.status === 'expired') {
            setView('SUBSCRIPTION');
            return null;
        }
        return (
          <AdminDashboard 
            onSwitchToClient={handleLogout} 
            onViewAsClient={() => setView('LANDING')}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            onUpdateProfile={updateProfile}
            appointments={appointments}
            setAppointments={setAppointments}
            professionals={professionals}
            setProfessionals={setProfessionals}
            services={services}
            setServices={setServices}
            products={products}
            setProducts={setProducts}
            clientPlans={clientPlans}
            setClientPlans={setClientPlans}
            categories={categories}
            setCategories={setCategories}
            currentUser={currentUser}
          />
        );
      case 'BOOKING_FLOW':
        return (
          <BookingFlow 
            initialDate={bookingDate}
            onBackToLanding={handleBackToLanding}
            onConfirmBooking={handleNewBooking}
            professionals={professionals}
            services={services}
            preSelectedProId={preSelectedProId}
            pixKey={businessProfile.pixKey}
            adminPhone={businessProfile.whatsapp}
            appointments={displayedAppointments}
            businessProfile={businessProfile}
            onLockSlot={handleLockSlot}
            onUnlockSlot={handleUnlockSlot}
          />
        );
      case 'LANDING':
      default:
        return (
          <LandingPage 
            onStartBooking={handleStartBooking}
            onGoToAdmin={handleEnterAdmin}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            isLoggedIn={!!currentUser}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {view !== 'ADMIN' && view !== 'AUTH' && view !== 'SUBSCRIPTION' && <AIReceptionist />}
      
      {/* Save Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out animate-fade-in-up">
            <div className="bg-gray-800 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                <CheckCircle size={18} className="text-green-400" />
                <span>{toastMessage}</span>
            </div>
        </div>
      )}
    </>
  );
};

export default App;
