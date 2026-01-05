
import React, { useState } from 'react';
import { Bell, Moon, Sun, Calendar, ChevronLeft } from 'lucide-react';
import { Theme, BusinessProfile } from '../types';
import { Logo } from './Logo';

interface LandingPageProps {
  onStartBooking: (date: Date) => void;
  onGoToAdmin: () => void;
  toggleTheme: () => void;
  currentTheme: Theme;
  businessProfile: BusinessProfile;
  isLoggedIn?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStartBooking, 
  onGoToAdmin,
  toggleTheme,
  currentTheme,
  businessProfile,
  isLoggedIn = false
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );

  const handleContinue = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    // Create date object interpreting as local time (00:00:00) to avoid timezone shifts
    const date = new Date(year, month - 1, day); 
    onStartBooking(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans transition-colors relative">
      {/* Background Image (If set) */}
      {businessProfile.backgroundImage && (
        <div 
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{ 
                backgroundImage: `url(${businessProfile.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'grayscale(100%)'
            }}
        />
      )}

      {/* Header */}
      <header className="p-4 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-3">
            <Logo size={36} />
            <h1 className="font-bold text-xl text-c-text-primary dark:text-white hidden sm:block">Agende<span className="text-primary">Certo</span></h1>
         </div>
         <div className="flex items-center gap-3">
            <button className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-transparent dark:border-white/5">
                <Bell size={20} />
            </button>
            <button 
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-transparent dark:border-white/5"
            >
                {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
                onClick={onGoToAdmin}
                className={`border text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                  isLoggedIn 
                    ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-lg' 
                    : 'border-primary text-primary hover:bg-primary hover:text-white'
                }`}
            >
                {isLoggedIn && <ChevronLeft size={14} />}
                {isLoggedIn ? 'VOLTAR AO PAINEL' : 'ACESSAR PAINEL ADM'}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center pt-10 pb-20 px-4 relative z-10">
        
        {/* Logo Badge (Dynamic) */}
        <div className="mb-8 relative">
            <div className="w-40 h-40 rounded-full bg-gray-900 border-4 border-secondary shadow-xl flex items-center justify-center overflow-hidden relative z-10 bg-white dark:bg-[#0a0a0a]">
                {businessProfile.logo ? (
                    <img 
                        src={businessProfile.logo} 
                        alt="Logo da Barbearia" 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // Default Brand Logo
                     <div className="flex flex-col items-center justify-center">
                        <Logo size={80} />
                     </div>
                )}
            </div>
            {/* Glow effect behind logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-secondary/20 blur-xl rounded-full -z-0"></div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-10 max-w-md">
            <h2 className="text-2xl font-bold mb-3 text-c-text-primary dark:text-white">Seja bem vindo!</h2>
            <p className="text-c-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                Que bom ter você por aqui! Logo abaixo você poderá escolher a melhor data e horário para ser atendido. Te aguardando viu!
            </p>
        </div>

        {/* Booking Card */}
        <div className="w-full max-w-sm bg-dark-card dark:bg-[#0a0a0a] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white border border-transparent dark:border-white/5">
            {/* Card Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 border-2 border-primary flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
                    <Calendar className="text-primary" size={28} />
                </div>
                
                <h3 className="text-lg font-bold mb-6 text-center text-white">
                    Qual dia vc quer<br/>agendar?
                </h3>

                <div className="w-full mb-6">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 block text-center">
                        AGENDE AQUI
                    </label>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 text-center font-bold outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    />
                </div>

                <button 
                    onClick={handleContinue}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                    CONTINUAR
                </button>
            </div>

            {/* Background decoration for card */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-900/50 -z-0"></div>
        </div>

      </div>
    </div>
  );
};
