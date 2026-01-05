
import React, { useState, useEffect } from 'react';
import { ViewState, Theme, BusinessProfile, Appointment, Professional, Service, AdminUser, Product, ClientPlan, ServiceCategory } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { BookingFlow } from './components/BookingFlow';
import { AIReceptionist } from './components/AIReceptionist';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { db } from './services/db';
import { DEFAULT_BUSINESS_HOURS } from './constants';

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
  
  // --- Data State (Now loaded from DB) ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    email: '',
    phone: '',
    logo: null,
    backgroundImage: null,
    pixKey: '',
    whatsapp: '',
    address: '',
    openingHours: DEFAULT_BUSINESS_HOURS,
    notificationSound: true,
    selectedSound: 'Padrão (Digital)',
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

  // --- Initialization & Data Loading ---

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
                // If visitor, load public data based on URL param or default
                data = await db.loadPublicData(storeIdFromUrl);
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

  // Persist Data Changes (Sync with Server)
  useEffect(() => {
    if (currentUser && isDataLoaded && currentUser.subscription?.status === 'active') {
        db.saveData(currentUser.id, {
            profile: businessProfile,
            appointments,
            professionals,
            services,
            products,
            clientPlans
        });
    }
  }, [businessProfile, appointments, professionals, services, products, clientPlans, currentUser, isDataLoaded]);

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

  // --- Actions ---

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStartBooking = (date: Date) => {
    setBookingDate(date);
    setView('BOOKING_FLOW');
  };

  const handleNewBooking = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment]);
    
    // Save to the correct store
    if (!currentUser) {
        const targetStoreId = publicStoreId;
        
        // Reload current data first to ensure we don't overwrite concurrent changes (simplified)
        db.loadPublicData(targetStoreId).then(async (publicData) => {
             // Find who owns this data
             // If storeId is known, we save to it. If not, we fall back to logic in DB (last user)
             // For robustness in this demo, if we have the ID from URL, we use it.
             
             let ownerId = targetStoreId;
             
             // Fallback for "last user" demo scenario if no URL param
             if (!ownerId) {
                 const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
                 if(users.length > 0) {
                     ownerId = users[users.length - 1].id;
                 }
             }

             if (ownerId) {
                 const updatedData = {
                     ...publicData,
                     appointments: [...publicData.appointments, newAppointment]
                 };
                 await db.saveData(ownerId, updatedData);
             }
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
      setCurrentUser(user);
      setIsDataLoaded(false); // Trigger data reload for this user
      
      if (user.subscription?.status === 'expired') {
          setView('SUBSCRIPTION');
      } else {
          setView('ADMIN');
      }
  };

  const handleLogout = () => {
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
    if (!isDataLoaded && view !== 'AUTH' && view !== 'LANDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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
            onBackToLanding={() => setView('LANDING')}
            onConfirmBooking={handleNewBooking}
            professionals={professionals}
            services={services}
            preSelectedProId={preSelectedProId}
            pixKey={businessProfile.pixKey}
            adminPhone={businessProfile.whatsapp}
            appointments={appointments}
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
    </>
  );
};

export default App;
