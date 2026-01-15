import React, { useState } from 'react';
import { Bell, Moon, Sun, Calendar, ChevronLeft, ChevronDown } from 'lucide-react';
import { Theme, BusinessProfile } from '../types';
import { getNextDays } from '../constants';

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
  const dayOptions = getNextDays(30);
  const today = dayOptions[0].date.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleContinue = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12); // Use noon to avoid timezone issues
    onStartBooking(date);
  };

  return (
    <div className="min-h-screen bg-c-background dark:bg-dark font-sans transition-colors relative">
      {/* Background Image Layer */}
      {businessProfile.backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${businessProfile.backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div> {/* Overlay */}
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg text-white shadow-sm">
             <Calendar size={24} />
          </div>
           <div className="flex items-center gap-2">
              <button className="p-2 bg-white dark:bg-dark-card shadow-sm rounded-full text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  <Bell size={20} />
              </button>
              <button 
                  onClick={toggleTheme}
                  className="p-2 bg-white dark:bg-dark-card shadow-sm rounded-full text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-white/10"
              >
                  {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
               <button 
                  onClick={onGoToAdmin}
                  className={`text-xs font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-md ${
                    isLoggedIn 
                      ? 'bg-primary text-black' 
                      : 'border border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
              >
                  {isLoggedIn && <ChevronLeft size={16} />}
                  {isLoggedIn ? 'VOLTAR AO PAINEL' : 'ACESSAR PAINEL'}
              </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center pt-8 pb-20 px-4">
          
          {/* Logo Circle */}
          <div className="w-40 h-40 rounded-full shadow-xl mb-6">
              {businessProfile.logo ? (
                  <img src={businessProfile.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                  <div className="w-full h-full rounded-full bg-white dark:bg-dark-card flex items-center justify-center">
                      <Calendar size={64} className="text-primary" />
                  </div>
              )}
          </div>

          {/* Welcome Text */}
          <div className="text-center mt-0 mb-10 max-w-md">
              <h2 className="text-3xl font-bold mb-3 text-c-text-primary dark:text-white">Seja bem vindo!</h2>
              <p className="text-c-text-secondary dark:text-gray-400 text-base leading-relaxed">
                  Que bom ter você por aqui! Logo abaixo você poderá escolher a melhor data e horário para ser atendido. Te aguardando viu!
              </p>
          </div>

          {/* Booking Card */}
          <div className="w-full max-w-sm bg-[#1C1C1E] dark:bg-dark-card rounded-3xl p-8 shadow-2xl relative text-white border border-gray-700 dark:border-white/10">
              <div className="flex flex-col items-center">
                  <h3 className="text-2xl font-bold mb-1 text-center text-white">
                      Qual dia vc quer
                  </h3>
                  <h3 className="text-2xl font-bold mb-6 text-center text-white">
                      agendar?
                  </h3>

                  <div className="w-full mb-6">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block text-center">
                          AGENDE AQUI
                      </label>
                       <div className="relative">
                          <select 
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full appearance-none bg-white text-gray-900 rounded-lg px-4 py-3 text-center font-bold text-lg outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          >
                            {dayOptions.map(day => {
                                  const dateString = day.date.toISOString().split('T')[0];
                                  const formattedDate = day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                  return (
                                      <option key={dateString} value={dateString}>
                                          {formattedDate}
                                      </option>
                                  );
                              })}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                      </div>
                  </div>

                  <button 
                      onClick={handleContinue}
                      className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-base"
                  >
                      CONTINUAR
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};