
import React, { useState } from 'react';
import { Check, Shield, Star, Clock, Lock, QrCode, Copy, X, ArrowRight } from 'lucide-react';
import { PlanType, AdminUser } from '../types';
import { db } from '../services/db';

interface SubscriptionScreenProps {
  user: AdminUser;
  onSubscriptionUpdate: (updatedUser: AdminUser) => void;
  onLogout: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ user, onSubscriptionUpdate, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const PIX_KEY = "ton222418@gmail.com";

  const getPlanDetails = (plan: PlanType) => {
      switch(plan) {
          case 'monthly': return { name: 'Plano Mensal', price: 15.00, label: 'Mensal' };
          case 'semiannual': return { name: 'Plano Semestral', price: 80.00, label: 'Semestral' };
          case 'annual': return { name: 'Plano Anual', price: 150.00, label: 'Anual' };
          default: return { name: '', price: 0, label: '' };
      }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
        // Simulate Payment Verification
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const updatedUser = await db.renewSubscription(user.id, selectedPlan);
        onSubscriptionUpdate(updatedUser);
        alert(`Pagamento confirmado com sucesso! Bem-vindo ao ${getPlanDetails(selectedPlan).name}.`);
    } catch (error) {
        alert("Erro ao processar assinatura. Tente novamente.");
    } finally {
        setLoading(false);
        setSelectedPlan(null);
    }
  };

  const isExpired = user.subscription.status === 'expired';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 font-sans animate-fade-in-up relative transition-colors">
        
        {/* Header */}
        <div className="text-center mb-10 max-w-lg mt-10">
            {isExpired ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center flex-col sm:flex-row">
                    <div className="flex items-center gap-2">
                        <Lock size={20} />
                        <span className="font-bold">Seu teste gratuito acabou.</span>
                    </div>
                    <span className="text-sm">Assine para continuar usando.</span>
                </div>
            ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center">
                    <Clock size={20} />
                    <span className="font-bold">Escolha seu plano Premium</span>
                </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Desbloqueie o Agende Certo</h1>
            <p className="text-gray-500 dark:text-gray-400">
                Continue gerenciando seu negócio com a melhor ferramenta do mercado.
            </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-10">
            
            {/* Monthly */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 p-6 flex flex-col relative hover:scale-105 transition-transform duration-300">
                <div className="mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Mensal</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 15,00</span>
                        <span className="text-gray-400">/mês</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Flexibilidade total</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> Acesso ao Painel</li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> Agendamentos Ilimitados</li>
                </ul>
                <button 
                    onClick={() => setSelectedPlan('monthly')}
                    className="w-full py-3 rounded-xl border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Escolher Mensal
                </button>
            </div>

            {/* Semiannual */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl border border-primary/30 p-6 flex flex-col relative hover:scale-105 transition-transform duration-300 z-10">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    Mais Popular
                </div>
                <div className="mb-4">
                    <span className="text-sm font-bold text-primary uppercase tracking-wider">Semestral</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">R$ 80,00</span>
                        <span className="text-gray-400">/6 meses</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Equivalente a R$ 13,33/mês</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> <b>Tudo do Mensal</b></li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> Economia de 11%</li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> Suporte Prioritário</li>
                </ul>
                <button 
                    onClick={() => setSelectedPlan('semiannual')}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-colors"
                >
                    Escolher Semestral
                </button>
            </div>

            {/* Annual */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 p-6 flex flex-col relative hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                    -16% OFF
                </div>
                <div className="mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Anual</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 150,00</span>
                        <span className="text-gray-400">/ano</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-2">Apenas R$ 12,50/mês</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> <b>Acesso Vitalício</b> (1 ano)</li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Check size={16} className="text-green-500"/> Melhor Custo-Benefício</li>
                </ul>
                <button 
                    onClick={() => setSelectedPlan('annual')}
                    className="w-full py-3 rounded-xl border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Escolher Anual
                </button>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4">
            <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium">
                Sair da Conta
            </button>
        </div>

        {/* Payment Modal Overlay */}
        {selectedPlan && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-white/10 animate-fade-in-up">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar Pagamento</h3>
                        <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="bg-primary/10 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-full text-primary">
                                <Shield size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-primary text-lg">{getPlanDetails(selectedPlan).name}</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Total a pagar: R$ {getPlanDetails(selectedPlan).price.toFixed(2)}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-2">Chave PIX (E-mail):</p>
                            <div onClick={() => {navigator.clipboard.writeText(PIX_KEY); alert("Copiado!");}} className="flex items-center justify-between bg-gray-100 dark:bg-[#111] p-3 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-transparent dark:border-white/5">
                                <code className="text-gray-800 dark:text-white font-mono">{PIX_KEY}</code>
                                <Copy size={16} className="text-primary" />
                            </div>
                        </div>

                        <div className="flex justify-center py-4">
                             <QrCode size={120} className="text-gray-800 dark:text-white opacity-80" />
                        </div>

                        <button 
                            onClick={handleConfirmPayment}
                            disabled={loading}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            {loading ? 'Verificando...' : 'Já fiz o pagamento'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
