
import React, { useState } from 'react';
import { Briefcase, User, Mail, Lock, ArrowRight, Loader2, Sparkles, Moon, Sun, Smartphone, Key, ArrowLeft } from 'lucide-react';
import { db } from '../services/db';
import { AdminUser, Theme } from '../types';
import { Logo } from './Logo';

interface AuthScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBack: () => void;
  toggleTheme: () => void;
  currentTheme: Theme;
}

type AuthView = 'login' | 'register' | 'forgot_email' | 'forgot_code';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onBack, toggleTheme, currentTheme }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: ''
  });

  // Recovery Data
  const [recoveryData, setRecoveryData] = useState({
    email: '',
    phoneMask: '',
    code: '',
    newPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (view === 'register') {
        if (!formData.name || !formData.email || !formData.password || !formData.businessName) {
            throw new Error("Por favor, preencha todos os campos.");
        }
        const user = await db.register(formData.name, formData.email, formData.password, formData.businessName);
        onLoginSuccess(user);
      } 
      else if (view === 'login') {
         if (!formData.email || !formData.password) {
            throw new Error("Por favor, preencha e-mail e senha.");
        }
        const user = await db.login(formData.email, formData.password);
        onLoginSuccess(user);
      }
      else if (view === 'forgot_email') {
          if (!recoveryData.email) throw new Error("Informe seu e-mail.");
          const mask = await db.requestPasswordReset(recoveryData.email);
          setRecoveryData(prev => ({ ...prev, phoneMask: mask }));
          setSuccessMsg(`Código enviado para ${mask}`);
          setView('forgot_code');
      }
      else if (view === 'forgot_code') {
          if (!recoveryData.code || !recoveryData.newPassword) throw new Error("Preencha o código e a nova senha.");
          await db.confirmPasswordReset(recoveryData.email, recoveryData.code, recoveryData.newPassword);
          setSuccessMsg("Senha alterada com sucesso! Faça login.");
          setView('login');
          // Reset form data for login
          setFormData(prev => ({ ...prev, email: recoveryData.email, password: '' }));
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
      switch(view) {
          case 'register': return 'Criar Conta';
          case 'forgot_email': return 'Recuperar Senha';
          case 'forgot_code': return 'Nova Senha';
          default: return 'Área Admin';
      }
  };

  const getSubtitle = () => {
      switch(view) {
          case 'register': return 'Eleve o nível do seu negócio.';
          case 'forgot_email': return 'Enviaremos um código SMS.';
          case 'forgot_code': return 'Digite o código recebido.';
          default: return 'Gerencie seu império.';
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-900 shadow-md text-gray-600 dark:text-gray-300 z-50 hover:scale-110 transition-transform"
      >
        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5 relative z-10 animate-fade-in-up backdrop-blur-sm transition-colors duration-300">
        
        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center relative">
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Logo Container */}
            <div className="mb-6 relative group">
               <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
               <div className="relative transform transition-transform duration-500 group-hover:scale-105">
                 <Logo size={70} className="shadow-2xl" />
               </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {getTitle()}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2 justify-center">
              {getSubtitle()}
              {view !== 'forgot_email' && view !== 'forgot_code' && <Sparkles size={14} className="text-primary" />}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-medium animate-fade-in-up">
                    {error}
                </div>
            )}
            
            {successMsg && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs rounded-lg text-center font-medium animate-fade-in-up">
                    {successMsg}
                </div>
            )}

            {/* REGISTER FIELDS */}
            {view === 'register' && (
              <>
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Seu Nome" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                    />
                 </div>
                 <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Nome do Negócio" 
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                    />
                 </div>
              </>
            )}

            {/* LOGIN & REGISTER SHARED FIELDS */}
            {(view === 'login' || view === 'register') && (
              <>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                    />
                </div>
              </>
            )}

            {/* FORGOT PASSWORD - STEP 1 */}
            {view === 'forgot_email' && (
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="email" 
                        placeholder="Digite seu e-mail cadastrado" 
                        value={recoveryData.email}
                        onChange={e => setRecoveryData({...recoveryData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                    />
                </div>
            )}

            {/* FORGOT PASSWORD - STEP 2 */}
            {view === 'forgot_code' && (
                <>
                    <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Código SMS (4 dígitos)" 
                            value={recoveryData.code}
                            maxLength={4}
                            onChange={e => setRecoveryData({...recoveryData, code: e.target.value})}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner tracking-widest font-mono"
                        />
                    </div>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input 
                            type="password" 
                            placeholder="Nova Senha" 
                            value={recoveryData.newPassword}
                            onChange={e => setRecoveryData({...recoveryData, newPassword: e.target.value})}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
                        />
                    </div>
                </>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:bg-primary-hover transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
              ) : (
                  <>
                    {view === 'register' ? 'CRIAR CONTA PREMIUM' : 
                     view === 'forgot_email' ? 'ENVIAR CÓDIGO' : 
                     view === 'forgot_code' ? 'ALTERAR SENHA' : 
                     'ACESSAR PAINEL'} 
                    <ArrowRight size={20} />
                  </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center space-y-4">
             {/* Navigation Links */}
             {view === 'login' && (
                 <>
                    <button 
                        onClick={() => { setView('register'); setError(''); }}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors font-medium tracking-wide"
                    >
                        Não tem conta? Crie agora
                    </button>
                    <button 
                        onClick={() => { setView('forgot_email'); setError(''); }}
                        className="block w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mt-2"
                    >
                        Esqueci minha senha
                    </button>
                 </>
             )}

             {view === 'register' && (
                 <button 
                    onClick={() => { setView('login'); setError(''); }}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors font-medium tracking-wide"
                >
                    Já é membro? Faça Login
                </button>
             )}

             {(view === 'forgot_email' || view === 'forgot_code') && (
                 <button 
                    onClick={() => { setView('login'); setError(''); }}
                    className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft size={16} /> Voltar para Login
                </button>
             )}

             <div className="border-t border-gray-200 dark:border-white/5 pt-4">
                 <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                     Voltar para a Página Inicial
                 </button>
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="absolute bottom-6 text-center w-full text-[10px] text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] pointer-events-none">
        Agende Certo AI &copy; System
      </div>
    </div>
  );
};
