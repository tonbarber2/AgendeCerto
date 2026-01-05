
import { AdminUser, Appointment, BusinessProfile, Professional, Service, PlanType, Product, ClientPlan } from "../types";
import { SERVICES as DEFAULT_SERVICES, PROFESSIONALS as DEFAULT_PROFESSIONALS, DEFAULT_BUSINESS_HOURS } from "../constants";

// CONFIGURAÇÃO DO SERVIDOR
// Para produção, altere para a URL da sua API real (ex: 'https://api.seusite.com')
// Se deixado vazio ou como 'mock', usará o armazenamento local do navegador (localStorage)
const API_URL = ''; 

// Default Profile Template (Premium Gold Theme)
const DEFAULT_PROFILE: BusinessProfile = {
  name: 'Minha Barbearia',
  email: 'contato@exemplo.com',
  phone: '(00) 0000-0000',
  logo: null,
  backgroundImage: null,
  pixKey: '00.000.000/0001-00',
  whatsapp: '+55',
  address: '',
  openingHours: DEFAULT_BUSINESS_HOURS,
  notificationSound: true,
  selectedSound: 'Padrão (Digital)',
  fontFamily: 'Inter',
  colors: {
    primary: '#D4AF37',   // Metallic Gold
    secondary: '#F3E5AB', // Champagne
    background: '#f9fafb', // Light mode bg (Dark mode handled by index.html)
    listTitle: '#111827',
    listPrice: '#D4AF37',
    listInfo: '#6b7280',
    textPrimary: '#111827',
    textSecondary: '#6b7280'
  }
};

interface AppData {
  profile: BusinessProfile;
  appointments: Appointment[];
  professionals: Professional[];
  services: Service[];
  products: Product[];
  clientPlans: ClientPlan[];
}

// Armazenamento temporário de códigos de recuperação (em memória)
const recoveryCodes = new Map<string, string>();

export const db = {
  
  // --- Helper: Verifica se deve usar API Remota ---
  useRemote: () => API_URL && API_URL !== 'mock',

  // --- Auth Methods ---

  async register(name: string, email: string, password: string, businessName: string): Promise<AdminUser> {
    
    // 1. Tentar registrar no Servidor Remoto
    if (this.useRemote()) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, businessName })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao registrar no servidor.");
            }
            
            return await response.json();
        } catch (error) {
            console.error("Falha ao conectar com servidor:", error);
            // Se falhar a conexão, lança erro para o usuário saber
            throw error; 
        }
    }

    // 2. Fallback: Simulação Local (LocalStorage)
    await this.delay(800); 
    
    const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
    const existing = users.find((u: any) => u.email === email);
    
    if (existing) throw new Error("E-mail já cadastrado.");

    // Lógica de Assinatura:
    // Usuário específico ganha vitalício (lifetime)
    // Outros ganham 'trial' de 7 dias
    const isLifetimeUser = email.toLowerCase() === 'ton222418@gmail.com';
    const now = new Date();
    const trialExpiration = new Date(now);
    trialExpiration.setDate(now.getDate() + 7); // Adiciona 7 dias

    const newUser: AdminUser = {
      id: Date.now().toString(),
      name,
      email,
      businessName,
      subscription: {
        plan: isLifetimeUser ? 'lifetime' : 'trial',
        status: 'active',
        startDate: now.toISOString(),
        expiresAt: isLifetimeUser ? null : trialExpiration.toISOString()
      }
    };

    users.push({ ...newUser, password }); 
    localStorage.setItem('ac_users', JSON.stringify(users));

    // Inicializa dados
    await this.saveData(newUser.id, {
      profile: { ...DEFAULT_PROFILE, name: businessName, email: email },
      appointments: [],
      professionals: [...DEFAULT_PROFESSIONALS],
      services: [...DEFAULT_SERVICES],
      products: [],
      clientPlans: []
    });

    return newUser;
  },

  async login(email: string, password: string): Promise<AdminUser> {
    
    // 1. Tentar Login no Servidor Remoto
    if (this.useRemote()) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                 throw new Error("Credenciais inválidas ou erro no servidor.");
            }

            const user = await response.json();
            return user;
        } catch (error) {
            console.error("Erro no login remoto:", error);
            throw error;
        }
    }

    // 2. Fallback: Login Local
    await this.delay(800);
    
    const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email && u.password === password);

    if (userIndex === -1) throw new Error("Credenciais inválidas.");

    let user = users[userIndex];

    // --- CORREÇÃO DE DADOS LEGADOS (Subscription Missing) ---
    // Se o usuário foi criado antes da funcionalidade de assinatura, adicionamos uma default.
    if (!user.subscription) {
        const now = new Date();
        const trialExpiration = new Date(now);
        trialExpiration.setDate(now.getDate() + 7);

        user.subscription = {
            plan: 'trial',
            status: 'active',
            startDate: now.toISOString(),
            expiresAt: trialExpiration.toISOString()
        };
        
        // Atualiza no storage para corrigir permanentemente
        users[userIndex] = user;
        localStorage.setItem('ac_users', JSON.stringify(users));
    }

    // --- CORREÇÃO VITALÍCIA ---
    // Se for o email do administrador mestre, força o plano lifetime e status active
    if (user.email.toLowerCase() === 'ton222418@gmail.com') {
        if (user.subscription.plan !== 'lifetime' || user.subscription.status !== 'active') {
            user.subscription = {
                plan: 'lifetime',
                status: 'active',
                startDate: new Date().toISOString(),
                expiresAt: null
            };
            users[userIndex] = user;
            localStorage.setItem('ac_users', JSON.stringify(users));
        }
    }

    // --- VERIFICAÇÃO DE EXPIRAÇÃO ---
    // Se não for vitalício, verifica se o prazo (7 dias ou plano anual/semestral) venceu
    if (user.subscription.plan !== 'lifetime' && user.subscription.expiresAt) {
        const expiryDate = new Date(user.subscription.expiresAt);
        if (new Date() > expiryDate) {
            user.subscription.status = 'expired';
            users[userIndex] = user;
            localStorage.setItem('ac_users', JSON.stringify(users));
        }
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async requestPasswordReset(email: string): Promise<string> {
    await this.delay(1000);
    
    const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
    const user = users.find((u: any) => u.email === email);
    
    if (!user) throw new Error("Usuário não encontrado.");

    const storageKey = `ac_data_${user.id}`;
    const userDataStr = localStorage.getItem(storageKey);
    let phone = "";
    
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            phone = userData.profile?.whatsapp || userData.profile?.phone || "";
        } catch (e) {
            console.error("Dados corrompidos ao recuperar senha");
        }
    }

    if (!phone || phone.length < 8) {
        throw new Error("Nenhum telefone válido cadastrado para este usuário. Entre em contato com o suporte.");
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    recoveryCodes.set(email, code);

    const maskedPhone = phone.replace(/.(?=.{4})/g, '*');

    alert(`[SIMULAÇÃO SMS] Seu código de recuperação é: ${code}`);
    console.log(`Código para ${email}: ${code}`);

    return maskedPhone;
  },

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
      await this.delay(1000);
      
      const storedCode = recoveryCodes.get(email);
      if (!storedCode || storedCode !== code) {
          throw new Error("Código inválido ou expirado.");
      }

      const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === email);

      if (userIndex === -1) throw new Error("Usuário não encontrado.");

      users[userIndex].password = newPassword;
      localStorage.setItem('ac_users', JSON.stringify(users));
      
      recoveryCodes.delete(email);
  },

  async renewSubscription(userId: string, plan: PlanType): Promise<AdminUser> {
      // Server Logic
      if (this.useRemote()) {
          const response = await fetch(`${API_URL}/users/${userId}/subscription`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan })
          });
          if (!response.ok) throw new Error("Erro ao renovar assinatura.");
          return await response.json();
      }

      // Local Logic
      await this.delay(1000);
      const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) throw new Error("Usuário não encontrado.");

      const now = new Date();
      const newExpiration = new Date();

      // Configuração dos Prazos dos Planos
      if (plan === 'monthly') newExpiration.setDate(now.getDate() + 30);
      else if (plan === 'semiannual') newExpiration.setDate(now.getDate() + 180); // 6 meses
      else if (plan === 'annual') newExpiration.setDate(now.getDate() + 365); // 1 ano
      
      const user = users[userIndex];
      user.subscription = {
          plan: plan,
          status: 'active',
          startDate: now.toISOString(),
          expiresAt: newExpiration.toISOString()
      };

      users[userIndex] = user;
      localStorage.setItem('ac_users', JSON.stringify(users));

      const { password: _, ...safeUser } = user;
      return safeUser;
  },

  // --- Data Methods (Sync) ---

  async loadData(userId: string): Promise<AppData> {
    if (this.useRemote()) {
        try {
            const response = await fetch(`${API_URL}/data/${userId}`);
            if (response.ok) {
                const data = await response.json();
                return this.normalizeData(data);
            }
        } catch (e) {
            console.warn("Erro ao carregar do servidor, tentando local...");
        }
    }

    await this.delay(500);
    const storageKey = `ac_data_${userId}`;
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      return {
        profile: DEFAULT_PROFILE,
        appointments: [],
        professionals: DEFAULT_PROFESSIONALS,
        services: DEFAULT_SERVICES,
        products: [],
        clientPlans: []
      };
    }

    try {
        return this.normalizeData(JSON.parse(data));
    } catch (e) {
        console.error("Erro ao analisar dados do localStorage:", e);
        // Em caso de corrupção, retorna defaults
        return {
            profile: DEFAULT_PROFILE,
            appointments: [],
            professionals: DEFAULT_PROFESSIONALS,
            services: DEFAULT_SERVICES,
            products: [],
            clientPlans: []
        };
    }
  },

  async saveData(userId: string, data: AppData): Promise<void> {
    if (this.useRemote()) {
        try {
             await fetch(`${API_URL}/data/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("Erro ao salvar no servidor:", e);
        }
    }

    const storageKey = `ac_data_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  },

  normalizeData(data: any): AppData {
      return {
        ...data,
        profile: data.profile || DEFAULT_PROFILE,
        appointments: data.appointments || [],
        professionals: data.professionals || DEFAULT_PROFESSIONALS,
        services: data.services || DEFAULT_SERVICES,
        products: data.products || [],
        clientPlans: data.clientPlans || []
      };
  },

  async loadPublicData(storeId?: string | null): Promise<AppData> {
    if (this.useRemote()) {
        try {
            const endpoint = storeId ? `${API_URL}/public/store/${storeId}` : `${API_URL}/public/store`;
            const response = await fetch(endpoint);
            if (response.ok) return this.normalizeData(await response.json());
        } catch (e) { console.warn("Erro carregando dados públicos remotos"); }
    }

    const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
    let targetUser = null;

    if (storeId) {
        targetUser = users.find((u: any) => u.id === storeId);
    } else if (users.length > 0) {
        targetUser = users[users.length - 1];
    }

    if (targetUser) {
      return this.loadData(targetUser.id);
    }
    
    return {
      profile: DEFAULT_PROFILE,
      appointments: [],
      professionals: DEFAULT_PROFESSIONALS,
      services: DEFAULT_SERVICES,
      products: [],
      clientPlans: []
    };
  },

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
