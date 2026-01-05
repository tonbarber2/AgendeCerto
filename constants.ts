
import { Service, Professional, TimeSlot, DayOption, BusinessHours } from './types';

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Corte Masculino',
    description: 'Corte moderno com tesoura ou máquina, lavagem e finalização.',
    price: 45.00,
    duration: 30,
    deposit: 10.00,
    image: 'https://picsum.photos/400/300?random=1'
  },
  {
    id: '2',
    name: 'Barba Modelada',
    description: 'Barba feita com toalha quente, navalha e hidratação.',
    price: 35.00,
    duration: 30,
    deposit: 10.00,
    image: 'https://picsum.photos/400/300?random=2'
  },
  {
    id: '3',
    name: 'Combo (Corte + Barba)',
    description: 'Serviço completo de corte e barba com desconto especial.',
    price: 70.00,
    duration: 60,
    deposit: 20.00,
    image: 'https://picsum.photos/400/300?random=3'
  },
  {
    id: '4',
    name: 'Acabamento / Pezinho',
    description: 'Apenas os contornos do cabelo e barba.',
    price: 20.00,
    duration: 15,
    deposit: 5.00,
    image: 'https://picsum.photos/400/300?random=4'
  },
  {
    id: '5',
    name: 'Sobrancelha',
    description: 'Design de sobrancelha na navalha ou pinça.',
    price: 15.00,
    duration: 15,
    deposit: 5.00,
    image: 'https://picsum.photos/400/300?random=5'
  }
];

export const PROFESSIONALS: Professional[] = [];

export const TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { isOpen: true, intervals: [{ start: '09:00', end: '18:00' }] },
  tuesday: { isOpen: true, intervals: [{ start: '09:00', end: '18:00' }] },
  wednesday: { isOpen: true, intervals: [{ start: '09:00', end: '18:00' }] },
  thursday: { isOpen: true, intervals: [{ start: '09:00', end: '18:00' }] },
  friday: { isOpen: true, intervals: [{ start: '09:00', end: '18:00' }] },
  saturday: { isOpen: true, intervals: [{ start: '09:00', end: '14:00' }] },
  sunday: { isOpen: false, intervals: [] }
};

export const getNextDays = (days: number): DayOption[] => {
  const options: DayOption[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    let label = '';
    if (i === 0) label = 'Hoje';
    else if (i === 1) label = 'Amanhã';
    else {
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      label = weekDays[d.getDay()];
    }

    options.push({
      date: d,
      label,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`
    });
  }
  return options;
};
