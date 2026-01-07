
import React, { useState } from 'react';
import { Briefcase, User, Mail, Lock, ArrowRight, Loader2, Sparkles, Moon, Sun, Smartphone, Key, ArrowLeft } from 'lucide-react';
import { db } from '../services/db';
import { AdminUser, Theme } from '../types';

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
    code: '',
    newPassword: '',
    maskedPhone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecoveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecoveryData(prev => ({ ...prev, [name]: value }));
  };

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const switchView = (newView: AuthView) => {
    clearMessages();
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    try {
        const user = await db.login(formData.email, formData.password);
        onLoginSuccess(user);
    } catch (err) {
        setError((err as Error).message || "Erro desconhecido.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }
    setIsLoading(true);
    clearMessages();
    try {
        const newUser = await db.register(formData.name, formData.email, formData.password, formData.businessName);
        setSuccessMsg('Cadastro realizado! Redirecionando para o painel...');
        setTimeout(() => {
            onLoginSuccess(newUser);
        }, 1500);
    } catch (err) {
        setError((err as Error).message || "Erro ao registrar.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRequestReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      clearMessages();
      try {
          const maskedPhone = await db.requestPasswordReset(recoveryData.email);
          setRecoveryData(prev => ({ ...prev, maskedPhone }));
          setSuccessMsg(`Um código foi enviado para seu telefone: ${maskedPhone}`);
          switchView('forgot_code');
      } catch (err) {
          setError((err as Error).message || 'Erro ao solicitar redefinição.');
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleConfirmReset = async (e: React.FormEvent) => {
      e.preventDefault();
       if (recoveryData.newPassword.length < 6) {
            setError("A nova senha deve ter no mínimo 6 caracteres.");
            return;
        }
      setIsLoading(true);
      clearMessages();
      try {
          await db.confirmPasswordReset(recoveryData.email, recoveryData.code, recoveryData.newPassword);
          setSuccessMsg('Senha alterada! Faça login com sua nova senha.');
          setFormData(prev => ({ ...prev, email: recoveryData.email, password: '' }));
          switchView('login');
      } catch (err) {
          setError((err as Error).message || 'Erro ao redefinir senha.');
      } finally {
          setIsLoading(false);
      }
  };

  const renderLogin = () => (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesse seu Painel</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Entre com suas credenciais para gerenciar seu negócio.</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">E-mail</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-500">Senha</label>
            <button type="button" onClick={() => switchView('forgot_email')} className="text-xs font-medium text-primary hover:underline">Esqueceu a senha?</button>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-md">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18} /></>}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem uma conta? <button onClick={() => switchView('register')} className="font-bold text-primary hover:underline">Cadastre-se</button>
      </p>
    </div>
  );

  const renderRegister = () => (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Crie sua Conta</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Comece a usar o Agende Certo e modernize seu negócio hoje.</p>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Nome do seu negócio</label>
          <div className="relative mt-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Seu Nome</label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Seu Melhor E-mail</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Crie uma Senha</label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-md">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Criar Conta Grátis <Sparkles size={18} /></>}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem uma conta? <button onClick={() => switchView('login')} className="font-bold text-primary hover:underline">Faça login</button>
      </p>
    </div>
  );

  const renderForgotEmail = () => (
    <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recuperar Senha</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Insira seu e-mail para receber o código de recuperação.</p>
        <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">E-mail de Cadastro</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" name="email" value={recoveryData.email} onChange={handleRecoveryChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-md">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Enviar Código <Smartphone size={18} /></>}
            </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
            Lembrou a senha? <button onClick={() => switchView('login')} className="font-bold text-primary hover:underline">Voltar ao Login</button>
        </p>
    </div>
  );
  
  const renderForgotCode = () => (
    <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifique seu Telefone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{successMsg}</p>
        <form onSubmit={handleConfirmReset} className="space-y-4">
             <div>
              <label className="text-xs font-medium text-gray-500">Código de 4 dígitos</label>
              <div className="relative mt-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" name="code" value={recoveryData.code} onChange={handleRecoveryChange} required maxLength={4} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
             <div>
              <label className="text-xs font-medium text-gray-500">Nova Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" name="newPassword" value={recoveryData.newPassword} onChange={handleRecoveryChange} required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-md">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Redefinir Senha <ArrowRight size={18} /></>}
            </button>
        </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 font-sans relative transition-colors">
        <div className="absolute top-4 left-4">
            <button onClick={onBack} className="p-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm transition-colors">
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
        </div>
        <div className="absolute top-4 right-4">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm transition-colors">
                 {currentTheme === 'light' ? <Moon size={20} className="text-gray-700" /> : <Sun size={20} className="text-yellow-400" />}
            </button>
        </div>

      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>}
            {successMsg && !error && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm mb-4">{successMsg}</div>}
            
            {view === 'login' && renderLogin()}
            {view === 'register' && renderRegister()}
            {view === 'forgot_email' && renderForgotEmail()}
            {view === 'forgot_code' && renderForgotCode()}
        </div>
      </div>
    </div>
  );
};
