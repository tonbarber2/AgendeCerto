import { Service, Professional, DayOption, BusinessHours } from './types';

export const LOGO_TRANSPARENT_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSI0IiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxsaW5lIHgxPSIxNiIgeTE9IjIiIHgyPSIxNiIgeTI9IjYiPjwvbGluZT48bGluZSB4MT0iOCIgeTE9IjIiIHgyPSI4IiB5Mj0iNiI+PC9saW5lPjxsaW5lIHgxPSIzIiB5MT0iMTAiIHgyPSIyMSIgeTI9IjEwIj48L2xpbmU+PC9zdmc+';

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Corte com máquina e tesoura',
    price: 27.00,
    duration: 30,
    deposit: 5.00,
    image: '',
  },
  {
    id: '2',
    name: 'Corte Degradê/Navalhado/Americano/Moicano',
    price: 25.00,
    duration: 50,
    deposit: 5.00,
    image: '',
  },
  {
    id: '3',
    name: 'Barba',
    price: 15.00,
    duration: 20,
    deposit: 5.00,
    image: '',
  },
  {
    id: '4',
    name: 'Corte + barba',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: '',
  },
  {
    id: '5',
    name: 'Área vip Cortes',
    duration: 90,
    image: '',
  },
  {
    id: '6',
    name: 'Sobrancelha com henna',
    price: 35.00,
    duration: 45,
    deposit: 5.00,
    image: '',
  },
  {
    id: '7',
    name: 'Corte com tesoura',
    price: 30.00,
    duration: 30,
    deposit: 5.00,
    image: '',
  },
  {
    id: '8',
    name: 'Cabelo+Barba+sobrancelha+pigmentação',
    price: 50.00,
    duration: 45,
    deposit: 5.00,
    image: '',
  },
  {
    id: '9',
    name: 'Corte Simples',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: '',
  },
  {
    id: '10',
    name: 'Corte Social',
    price: 22.00,
    duration: 20,
    deposit: 5.00,
    image: '',
  },
  {
    id: '11',
    name: 'Corte+ Pigmentação',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: '',
  },
  {
    id: '12',
    name: 'Design de sobrancelhas',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: '',
  }
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'pro_ton_1',
    name: 'Ton',
    role: 'Barbeiro',
    rating: 5,
    avatar: '',
  }
];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday:    { isOpen: false, intervals: [] },
  tuesday:   { isOpen: true,  intervals: [{ start: '14:00', end: '19:00' }] },
  wednesday: { isOpen: true,  intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  thursday:  { isOpen: true,  intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '17:00' }] },
  friday:    { isOpen: true,  intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '19:30' }] },
  saturday:  { isOpen: true,  intervals: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '19:30' }] },
  sunday:    { isOpen: true,  intervals: [{ start: '11:00', end: '14:30' }] }
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
      displayDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    });
  }
  return options;
};