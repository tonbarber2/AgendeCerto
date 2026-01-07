
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Star,
  Copy,
  Upload,
  CreditCard,
  Banknote,
  AlertCircle,
  User
} from 'lucide-react';
import { 
  getNextDays 
} from '../constants';
import { 
  Service, 
  Professional, 
  BookingStep, 
  DayOption, 
  UserDetails,
  Appointment,
  BusinessProfile,
  BusinessHours,
  DaySchedule
} from '../types';

interface BookingFlowProps {
  initialDate?: Date;
  onBackToLanding: () => void;
  onConfirmBooking: (appointment: Appointment) => void;
  professionals: Professional[];
  services: Service[];
  preSelectedProId?: string;
  pixKey?: string;
  adminPhone?: string;
  appointments: Appointment[];
  businessProfile: BusinessProfile;
  onLockSlot: (slotInfo: Omit<Appointment, 'id' | 'client' | 'phone' | 'status'>) => void;
  onUnlockSlot: () => void;
}

// Gera uma lista de horários (strings 'HH:MM') com base nos intervalos de funcionamento de um dia.
const generateTimeSlots = (daySchedule: DaySchedule, slotDuration: number): string[] => {
    if (!daySchedule || !daySchedule.isOpen) return [];

    const slots: string[] = [];
    daySchedule.intervals.forEach(interval => {
        const [startHour, startMinute] = interval.start.split(':').map(Number);
        const [endHour, endMinute] = interval.end.split(':').map(Number);

        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);

        let currentTime = startDate.getTime();
        const endTime = endDate.getTime();

        while (currentTime < endTime) {
            const date = new Date(currentTime);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            slots.push(`${hours}:${minutes}`);
            currentTime += slotDuration * 60000;
        }
    });

    return slots;
};


export const BookingFlow: React.FC<BookingFlowProps> = ({ 
  initialDate, 
  onBackToLanding, 
  onConfirmBooking,
  professionals,
  services,
  preSelectedProId,
  pixKey = "000.000.000-00", // Default fallback
  adminPhone,
  appointments,
  businessProfile,
  onLockSlot,
  onUnlockSlot,
}) => {
  // Helpers
  const dayOptions = getNextDays(14);
  
  // State
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Initialize professional: URL param takes priority, otherwise default to Ton.
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(() => {
    if (preSelectedProId) {
      return professionals.find(p => p.id === preSelectedProId) || null;
    }
    // Default to 'Ton' if no professional is specified in the URL
    return professionals.find(p => p.id === 'pro_ton_1') || null;
  });
  
  // Find the DayOption that matches initialDate or default to first available
  const initialDayOption = initialDate 
    ? dayOptions.find(d => d.date.toDateString() === initialDate.toDateString()) || dayOptions[0]
    : dayOptions[0];

  const [selectedDate, setSelectedDate] = useState<DayOption>(initialDayOption);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', phone: '', notes: '' });

  // Payment State
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
  
  // --- Dynamic Slot Generation ---
  const dayOfWeekIndex = selectedDate.date.getDay();
  const dayOfWeekName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeekIndex] as keyof BusinessHours;
  const daySchedule = businessProfile.openingHours[dayOfWeekName];

  // Gera os horários com base no dia selecionado, usando um intervalo fixo de 30 minutos para manter a consistência da interface.
  const timeSlotsForDay = generateTimeSlots(daySchedule, 30);


  const isStepValid = () => {
    switch(step) {
      case BookingStep.SERVICE: return !!selectedService;
      case BookingStep.PROFESSIONAL: return !!selectedProfessional;
      case BookingStep.DATETIME: return !!selectedDate && !!selectedTime;
      case BookingStep.DETAILS: return !!userDetails.name && userDetails.phone.length >= 10;
      case BookingStep.PAYMENT: return true; // Pagamento é opcional
      default: return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      // If moving from service selection and a professional is already pre-selected,
      // skip directly to the date & time selection.
      if (step === BookingStep.SERVICE && selectedProfessional) {
        setStep(BookingStep.DATETIME);
        window.scrollTo(0, 0);
        return;
      }
      
      // Se o serviço não tiver um preço definido, pule a etapa de pagamento.
      if (step === BookingStep.DETAILS && typeof selectedService?.price !== 'number') {
        const newAppointment: Appointment = {
          id: Date.now().toString(),
          client: userDetails.name,
          service: selectedService!.name,
          time: selectedTime!,
          date: selectedDate.displayDate,
          status: 'pendente', // Status pendente para o admin confirmar
          phone: userDetails.phone,
          professional: selectedProfessional!.name,
        };
        onConfirmBooking(newAppointment);
        setStep(BookingStep.CONFIRMATION); // Vai direto para a confirmação
        window.scrollTo(0, 0);
        return; // Encerra a função aqui
      }

      if (step === BookingStep.PAYMENT) {
         // Finalize booking logic
         const newAppointment: Appointment = {
            id: Date.now().toString(),
            client: userDetails.name,
            service: selectedService!.name,
            time: selectedTime!,
            date: selectedDate.displayDate,
            status: 'pendente', // Always pending until pro confirms
            phone: userDetails.phone,
            professional: selectedProfessional!.name // Save the professional name
         };

         // Generate WhatsApp Message for Admin
         const adminPhoneClean = adminPhone?.replace(/\D/g, '') || '';
         const amountPaid = paymentType === 'deposit' ? selectedService?.deposit : selectedService?.price;
         
         const message = `Olá! Gostaria de confirmar meu agendamento:
📅 *Data:* ${selectedDate.displayDate}
⏰ *Horário:* ${selectedTime}
✂️ *Serviço:* ${selectedService!.name}
👤 *Profissional:* ${selectedProfessional!.name}
💰 *Valor Pago:* ${amountPaid?.toFixed(2)}
Nome: ${userDetails.name}

*Segue meu comprovante de pagamento em anexo!* 👇`;

         // Open WhatsApp
         if (adminPhoneClean) {
            const whatsappUrl = `https://wa.me/55${adminPhoneClean}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
         }

         onConfirmBooking(newAppointment);
      }
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    // Se voltar da etapa de Data/Hora, libera o horário selecionado.
    if (step === BookingStep.DATETIME) {
        onUnlockSlot();
        setSelectedTime(null);
    }
    if (step > 1) {
        setStep(prev => prev - 1);
    } else {
        onBackToLanding();
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey).then(() => {
        alert("Chave PIX copiada com sucesso!");
    }).catch(() => {
        alert("Erro ao copiar. Tente selecionar manualmente.");
    });
  };

  // Logic to calculate available time slots
  const getAvailableSlots = () => {
    return timeSlotsForDay.filter(time => {
      const isTaken = appointments.some(apt => {
        // Must match date
        if (apt.date !== selectedDate.displayDate) return false;
        
        // Must match time
        if (apt.time !== time) return false;

        // If it's cancelled, the slot is free
        if (apt.status === 'cancelado') return false;

        // Logic:
        // If the appointment has a professional assigned, it only blocks THAT professional.
        // If I (current user) selected "Professional A", I only care if "Professional A" is busy.
        if (apt.professional && selectedProfessional) {
            return apt.professional === selectedProfessional.name;
        }

        return false;
      });

      return !isTaken;
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedService && selectedProfessional) {
        onLockSlot({
            time,
            date: selectedDate.displayDate,
            service: selectedService.name,
            professional: selectedProfessional.name,
        });
    }
  };

  const handleDateSelect = (day: DayOption) => {
      onUnlockSlot(); // Libera qualquer horário que estivesse selecionado na data anterior
      setSelectedTime(null); // Limpa a seleção de tempo
      setSelectedDate(day);
  };


  const availableSlots = getAvailableSlots();

  // Renderers for each step
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Serviço' },
      { num: 2, label: 'Profissional' },
      { num: 3, label: 'Horário' },
      { num: 4, label: 'Dados' },
    ];
    // Adiciona a etapa de pagamento apenas se o serviço tiver um preço
    if (typeof selectedService?.price === 'number') {
      steps.push({ num: 5, label: 'Pagamento' });
    }

    return (
      <div className="w-full bg-white dark:bg-[#0a0a0a] pt-6 pb-4 px-4 shadow-sm mb-6 sticky top-0 z-10 transition-colors border-b border-transparent dark:border-white/5">
        <div className="flex justify-between items-center max-w-lg mx-auto relative">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-white/10 -z-10 rounded-full"></div>
          {/* Active Progress */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((step - 1) / (steps.length)) * 100}%` }}
          ></div>

          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 border-2 ${
                  step >= s.num 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white dark:bg-[#0a0a0a] border-gray-300 dark:border-white/20 text-gray-400'
                }`}
              >
                {step > s.num ? <CheckCircle size={14} /> : s.num}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfileHeader = () => (
    <div className="px-4 mb-6 -mt-2">
      <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-4 max-w-2xl mx-auto">
        {businessProfile.logo && (
          <img src={businessProfile.logo} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
        )}
        <div>
          <p className="text-xs text-c-text-secondary dark:text-gray-400">Você está agendando em</p>
          <h2 className="text-lg font-bold text-c-text-primary dark:text-white">{businessProfile.name}</h2>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white col-span-full mb-2">Escolha o serviço</h2>
      
      {/* Show pre-selected professional hint if exists */}
      {selectedProfessional && (
        <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-3 rounded-lg flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User size={20} className="text-gray-500"/></div>
            <div>
                <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">Profissional Selecionado</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Agendando com {selectedProfessional.name}</p>
            </div>
        </div>
      )}

      {services.map(service => (
        <div 
          key={service.id}
          onClick={() => setSelectedService(service)}
          className={`bg-gray-100 dark:bg-[#111] p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
            selectedService?.id === service.id 
              ? 'border-primary ring-1 ring-primary bg-orange-50 dark:bg-white/5' 
              : 'border-transparent shadow-sm dark:border-white/5'
          }`}
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="font-semibold text-c-list-title dark:text-white">{service.name}</h3>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-c-list-info dark:text-gray-400 flex items-center gap-1">
                <Clock size={14} /> {service.duration} min
              </span>
              {typeof service.price === 'number' ? (
                <span className="font-bold text-c-list-price">R$ {service.price.toFixed(2)}</span>
              ) : (
                <span className="font-bold text-c-list-price text-sm">A consultar</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfessionals = () => (
    <div className="px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Quem vai te atender?</h2>
      {professionals.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-[#0a0a0a] rounded-xl border dark:border-white/5">
              <p className="text-gray-500">Nenhum profissional disponível no momento.</p>
          </div>
      ) : (
      <div className="space-y-3">
        {professionals.map(pro => (
          <div 
            key={pro.id}
            onClick={() => setSelectedProfessional(pro)}
            className={`bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              selectedProfessional?.id === pro.id 
                ? 'border-primary bg-orange-50 dark:bg-white/5' 
                : 'border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:border-white/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-white/10 shadow-sm"><User size={28} className="text-gray-500"/></div>
              <div>
                <h3 className="font-semibold text-c-list-title dark:text-white">{pro.name}</h3>
                <p className="text-sm text-c-list-info dark:text-gray-400">{pro.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
              <Star size={14} className="text-yellow-500 fill-current" />
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{pro.rating}</span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );

  const renderDateTime = () => (
    <div className="px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Qual o melhor dia?</h2>
      
      {/* Date Scroller */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-6">
        {dayOptions.map((day, idx) => (
          <button
            key={idx}
            onClick={() => handleDateSelect(day)}
            className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
              selectedDate.date.toDateString() === day.date.toDateString()
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white dark:bg-[#0a0a0a] text-c-text-secondary dark:text-gray-300 border-gray-200 dark:border-white/10'
            }`}
          >
            <span className="text-xs font-medium opacity-80">{day.label}</span>
            <span className="text-lg font-bold">{day.displayDate}</span>
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Horários disponíveis</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {availableSlots.map(time => {
          return (
            <button
              key={time}
              onClick={() => handleTimeSelect(time)}
              className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${
                selectedTime === time
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white dark:bg-[#0a0a0a] text-c-text-secondary dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-primary'
              }`}
            >
              {time}
            </button>
          );
        })}
         {timeSlotsForDay.length > 0 && availableSlots.length === 0 && (
             <p className="col-span-full text-center text-gray-500 text-sm mt-4">Nenhum horário disponível para {selectedProfessional?.name} neste dia.</p>
         )}
      </div>
      {timeSlotsForDay.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">Nenhum horário disponível para esta data.</p>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Seus dados</h2>
      <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl shadow-sm space-y-4 border border-gray-100 dark:border-white/5">
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Nome Completo</label>
          <input 
            type="text" 
            value={userDetails.name}
            onChange={(e) => setUserDetails({...userDetails, name: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: João Silva"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Telefone (WhatsApp)</label>
          <input 
            type="tel" 
            value={userDetails.phone}
            onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Observações (Opcional)</label>
          <textarea 
            value={userDetails.notes}
            onChange={(e) => setUserDetails({...userDetails, notes: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
            placeholder="Alguma preferência especial?"
          />
        </div>
      </div>
      
      {/* Summary Mini Card */}
      <div className="mt-6 bg-orange-50 dark:bg-[#111] p-4 rounded-xl border border-orange-100 dark:border-white/5">
        <h3 className="font-semibold text-orange-900 dark:text-primary mb-2">Resumo do Agendamento</h3>
        <ul className="space-y-2 text-sm text-orange-800 dark:text-gray-300">
          <li className="flex justify-between"><span>Serviço:</span> <b>{selectedService?.name}</b></li>
          <li className="flex justify-between"><span>Profissional:</span> <b>{selectedProfessional?.name}</b></li>
          <li className="flex justify-between"><span>Data:</span> <b>{selectedDate?.displayDate} às {selectedTime}</b></li>
          <li className="flex justify-between border-t border-orange-200 dark:border-white/10 pt-2 mt-2 text-lg font-bold">
            <span>Total:</span>
            <span>
                {typeof selectedService?.price === 'number' 
                    ? `R$ ${selectedService.price.toFixed(2)}` 
                    : 'A consultar'}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderPayment = () => {
    const depositAmount = selectedService?.deposit || 0;
    const fullAmount = selectedService?.price || 0;
    const amountToPay = paymentType === 'deposit' ? depositAmount : fullAmount;

    return (
      <div className="px-4 pb-24 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Pagamento Obrigatório</h2>
        
        {/* Payment Options */}
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm mb-4 space-y-3 border border-gray-100 dark:border-white/5">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Escolha como pagar:</h3>
            
            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentType === 'deposit' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
                <input 
                    type="radio" 
                    name="paymentType" 
                    checked={paymentType === 'deposit'} 
                    onChange={() => setPaymentType('deposit')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                    <span className="block font-bold text-gray-800 dark:text-white">Pagar apenas o Sinal</span>
                    <span className="text-xs text-gray-500">Para garantir o horário</span>
                </div>
                <span className="font-bold text-lg text-primary">R$ {depositAmount.toFixed(2)}</span>
            </label>

            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentType === 'full' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
                <input 
                    type="radio" 
                    name="paymentType" 
                    checked={paymentType === 'full'} 
                    onChange={() => setPaymentType('full')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                    <span className="block font-bold text-gray-800 dark:text-white">Pagar Valor Total</span>
                    <span className="text-xs text-gray-500">Serviço completo</span>
                </div>
                <span className="font-bold text-lg text-gray-800 dark:text-white">R$ {fullAmount.toFixed(2)}</span>
            </label>
        </div>

        {/* PIX Info */}
        <div className="bg-gray-900 dark:bg-[#050505] text-white p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Banknote size={100} />
            </div>
            <p className="text-sm text-gray-400 mb-1">Chave PIX para pagamento</p>
            <button
                type="button"
                onClick={handleCopyPix}
                className="w-full text-left flex items-center justify-between bg-gray-800 dark:bg-[#111] p-3 rounded-lg border border-gray-700 dark:border-white/10 mb-3 cursor-pointer hover:bg-gray-700 transition-colors active:scale-95"
            >
                <code className="font-mono text-lg truncate flex-1">{pixKey}</code>
                <div className="ml-2 text-primary flex items-center gap-1 text-sm font-bold">
                    <Copy size={16} /> COPIAR
                </div>
            </button>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Valor a transferir:</span>
                <span className="text-2xl font-bold text-primary">R$ {amountToPay.toFixed(2)}</span>
            </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 mt-6 text-left flex gap-3">
             <AlertCircle className="text-blue-500 flex-shrink-0 mt-1" size={20} />
             <div className="text-sm text-blue-800 dark:text-blue-300">
                 <p className="font-bold mb-1">Próximo Passo: Enviar Comprovante</p>
                 <p>Ao clicar em finalizar, você será redirecionado para o WhatsApp para enviar o comprovante de pagamento ao administrador.</p>
             </div>
        </div>

      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6 relative">
        <Clock size={48} />
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
             <CheckCircle size={16} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-c-text-primary dark:text-white mb-2">Solicitação Enviada!</h2>
      <p className="text-c-text-secondary dark:text-gray-400 max-w-xs mx-auto mb-6">
        Seu agendamento foi pré-reservado.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-8 max-w-sm w-full text-left flex gap-3">
         <AlertCircle className="text-blue-500 flex-shrink-0" size={24} />
         <div className="text-sm text-blue-800 dark:text-blue-300">
             <p className="font-bold mb-1">Verifique seu WhatsApp</p>
             <p>A conversa com o estabelecimento deve ter sido aberta para o envio do comprovante. O profissional confirmará assim que receber.</p>
         </div>
      </div>
      
      <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-white/5 pb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User size={24} className="text-gray-500"/></div>
          <div className="text-left">
            <p className="font-bold text-c-list-title dark:text-white">{selectedService?.name}</p>
            <p className="text-sm text-c-list-info dark:text-gray-400">com {selectedProfessional?.name}</p>
          </div>
        </div>
        <div className="flex justify-between items-center text-gray-800 dark:text-gray-300 font-medium">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            {selectedDate.displayDate}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            {selectedTime}
          </div>
        </div>
      </div>

      <button 
        onClick={() => {
          setStep(BookingStep.SERVICE);
          setSelectedService(null);
          setSelectedProfessional(null);
          setSelectedTime(null);
          setUserDetails({name: '', phone: '', notes: ''});
          setPaymentType('deposit');
          window.scrollTo(0, 0);
        }}
        className="mt-8 text-primary font-semibold hover:text-primary-hover"
      >
        Fazer novo agendamento
      </button>
      
      <button 
        onClick={onBackToLanding}
        className="mt-4 text-c-text-secondary dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        Voltar para o início
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans pb-10 transition-colors">
      <div className="sticky top-0 z-20 bg-white dark:bg-[#0a0a0a] shadow-sm p-4 flex items-center gap-3 border-b border-transparent dark:border-white/5">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300"/>
        </button>
        <span className="font-semibold text-lg text-c-text-primary dark:text-white">Agendar Horário</span>
      </div>

      {step !== BookingStep.CONFIRMATION && renderStepIndicator()}

      {step < BookingStep.CONFIRMATION && businessProfile.name && renderProfileHeader()}

      <div className="max-w-3xl mx-auto pt-4">
        {step === BookingStep.SERVICE && renderServices()}
        {step === BookingStep.PROFESSIONAL && renderProfessionals()}
        {step === BookingStep.DATETIME && renderDateTime()}
        {step === BookingStep.DETAILS && renderDetails()}
        {step === BookingStep.PAYMENT && renderPayment()}
        {step === BookingStep.CONFIRMATION && renderConfirmation()}
      </div>

      {/* Footer Actions (Sticky) */}
      {step !== BookingStep.CONFIRMATION && (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/5 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button 
              onClick={handleBack}
              className="px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                isStepValid() 
                  ? 'bg-primary hover:bg-primary-hover shadow-orange-200 dark:shadow-none' 
                  : 'bg-gray-300 dark:bg-white/5 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === BookingStep.PAYMENT ? 'Finalizar e Abrir WhatsApp' : 'Continuar'}
              {step !== BookingStep.PAYMENT && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
