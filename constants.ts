
import { Service, Professional, TimeSlot, DayOption, BusinessHours } from './types';

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Corte com máquina e tesoura',
    description: 'Estilo versátil combinando precisão da máquina e acabamento da tesoura.',
    price: 22.00,
    duration: 30,
    deposit: 5.00,
    image: ''
  },
  {
    id: '2',
    name: 'Corte Degradê/Navalhado/Americano/Moicano',
    description: 'Cortes modernos com graduações perfeitas e acabamento na navalha.',
    price: 50.00,
    duration: 50,
    deposit: 10.00,
    image: ''
  },
  {
    id: '3',
    name: 'Barba',
    description: 'Modelagem completa da barba com toalha quente, navalha e hidratação.',
    price: 15.00,
    duration: 20,
    deposit: 5.00,
    image: ''
  },
  {
    id: '4',
    name: 'Corte + barba',
    description: 'O combo perfeito para um visual impecável com desconto especial.',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: ''
  },
  {
    id: '5',
    name: 'Área vip Cortes',
    description: 'Experiência completa com os melhores serviços, bebidas e tratamento exclusivo.',
    price: 120.00,
    duration: 90,
    deposit: 30.00,
    image: ''
  },
  {
    id: '6',
    name: 'Sobrancelha com henna',
    description: 'Design de sobrancelhas com aplicação de henna para preenchimento e definição.',
    price: 35.00,
    duration: 45,
    deposit: 5.00,
    image: ''
  },
  {
    id: '7',
    name: 'Corte com tesoura',
    description: 'Corte clássico e detalhado, feito inteiramente na tesoura.',
    price: 30.00,
    duration: 30,
    deposit: 5.00,
    image: ''
  },
  {
    id: '8',
    name: 'Cabelo+Barba+sobrancelha+pigmentação',
    description: 'Transformação completa: cabelo, barba, sobrancelha e pigmentação capilar.',
    price: 50.00,
    duration: 45,
    deposit: 5.00,
    image: ''
  },
  {
    id: '9',
    name: 'Corte Simples',
    description: 'Corte prático e rápido, ideal para manutenção do visual.',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: ''
  },
  {
    id: '10',
    name: 'Corte Social',
    description: 'Corte clássico e elegante, perfeito para o ambiente de trabalho e eventos formais.',
    price: 22.00,
    duration: 20,
    deposit: 5.00,
    image: ''
  },
  {
    id: '11',
    name: 'Corte+ Pigmentação',
    description: 'Corte moderno com aplicação de pigmento para disfarçar falhas ou dar estilo.',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: ''
  },
  {
    id: '12',
    name: 'Design de sobrancelhas',
    description: 'Alinhamento e limpeza das sobrancelhas, feito na pinça ou navalha.',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: ''
  }
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'pro_ton_1',
    name: 'Ton',
    role: 'Barbeiro',
    avatar: 'https://avatar.iran.liara.run/public/boy?username=Ton',
    rating: 5,
  }
];

export const TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
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
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`
    });
  }
  return options;
};
