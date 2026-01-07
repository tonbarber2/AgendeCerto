import { AdminUser, Appointment, BusinessProfile, Professional, Service, PlanType, Product, ClientPlan, Subscription } from "../types";
// FIX: Changed import from LOGO_ROUND_BASE64 to LOGO_TRANSPARENT_BASE64 to use the new logo.
import { SERVICES as DEFAULT_SERVICES, PROFESSIONALS as DEFAULT_PROFESSIONALS, DEFAULT_BUSINESS_HOURS, LOGO_TRANSPARENT_BASE64 } from "../constants";

// CONFIGURAÇÃO DO SERVIDOR
// Para produção, altere para a URL da sua API real (ex: 'https://api.seusite.com')
// Se deixado vazio ou como 'mock', usará o armazenamento local do navegador (localStorage)
const API_URL = '';

// This interface is for the data structure we'll store per user
interface UserData {
    profile: BusinessProfile;
    appointments: Appointment[];
    professionals: Professional[];
    services: Service[];
    products: Product[];
    clientPlans: ClientPlan[];
}


class MockDB {
    private users: Map<string, AdminUser> = new Map();
    private data: Map<string, UserData> = new Map();
    private passwords: Map<string, string> = new Map(); // userId -> password
    private resetCodes: Map<string, string> = new Map(); // email -> code

    constructor() {
        this.loadFromLocalStorage();
        this.seedAdminUser();
    }

    private seedAdminUser() {
        const adminEmail = 'ton222418@gmail.com';
        if (this.findUserByEmail(adminEmail)) {
            return; // Admin already exists, do nothing
        }

        const adminId = 'admin_ton_permanent'; // Static ID
        const adminUser: AdminUser = {
            id: adminId,
            name: 'Ton Barber',
            email: adminEmail,
            businessName: 'Barbearia Ton barber',
            subscription: {
                plan: 'lifetime',
                status: 'active',
                startDate: new Date().toISOString(),
                expiresAt: null, // Lifetime plan
            }
        };

        this.users.set(adminId, adminUser);
        this.passwords.set(adminId, '123456'); // Default password

        const defaultData: UserData = {
            profile: {
                name: 'Barbearia Ton barber',
                email: adminEmail,
                phone: '',
                // FIX: Use the new transparent logo constant.
                logo: LOGO_TRANSPARENT_BASE64,
                backgroundImage: '',
                pixKey: '71986073552',
                whatsapp: '71986073552',
                address: '',
                openingHours: DEFAULT_BUSINESS_HOURS,
                notificationSound: true,
                selectedSound: 'Padrão (Digital)',
                desktopNotifications: true,
                fontFamily: 'Inter',
                colors: {
                    primary: '#D4AF37',
                    secondary: '#F3E5AB',
                    background: '#f9fafb',
                    listTitle: '#111827',
                    listPrice: '#D4AF37',
                    listInfo: '#6b7280',
                    textPrimary: '#111827',
                    textSecondary: '#6b7280'
                }
            },
            appointments: [],
            professionals: DEFAULT_PROFESSIONALS,
            services: DEFAULT_SERVICES,
            products: [],
            clientPlans: [],
        };
        this.data.set(adminId, defaultData);
        this.saveToLocalStorage();
    }

    private loadFromLocalStorage() {
        try {
            const usersData = localStorage.getItem('db_users');
            const appData = localStorage.getItem('db_data');
            const passwordsData = localStorage.getItem('db_passwords');

            if (usersData) {
                this.users = new Map(JSON.parse(usersData));
            }
            if (appData) {
                this.data = new Map(JSON.parse(appData));
            }
            if (passwordsData) {
                this.passwords = new Map(JSON.parse(passwordsData));
            }

        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            this.users = new Map();
            this.data = new Map();
            this.passwords = new Map();
        }
    }

    private saveToLocalStorage() {
        try {
            // Salva todos os dados (perfis, agendamentos, etc.) de forma permanente
            // no armazenamento local do navegador (localStorage).
            // Isso garante que agendamentos feitos por clientes em diferentes dispositivos
            // (através do link compartilhado) sejam mantidos.
            localStorage.setItem('db_users', JSON.stringify(Array.from(this.users.entries())));
            localStorage.setItem('db_data', JSON.stringify(Array.from(this.data.entries())));
            localStorage.setItem('db_passwords', JSON.stringify(Array.from(this.passwords.entries())));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }

    private findUserByEmail(email: string): AdminUser | undefined {
        for (const user of this.users.values()) {
            if (user.email.toLowerCase() === email.toLowerCase()) {
                return user;
            }
        }
        return undefined;
    }

    async register(name: string, email: string, password: string, businessName: string): Promise<AdminUser> {
        if (this.findUserByEmail(email)) {
            throw new Error("Este e-mail já está em uso.");
        }
        
        const id = Date.now().toString();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

        const newUser: AdminUser = {
            id,
            name,
            email,
            businessName,
            subscription: {
                plan: 'trial',
                status: 'active',
                startDate: new Date().toISOString(),
                expiresAt: trialEndDate.toISOString(),
            }
        };

        this.users.set(id, newUser);
        this.passwords.set(id, password);

        const defaultData: UserData = {
            profile: {
                name: businessName,
                email: email,
                phone: '',
                // FIX: Use the new transparent logo constant for new registrations.
                logo: LOGO_TRANSPARENT_BASE64,
                backgroundImage: '',
                pixKey: '71986073552',
                whatsapp: '71986073552',
                address: '',
                openingHours: DEFAULT_BUSINESS_HOURS,
                notificationSound: true,
                selectedSound: 'Padrão (Digital)',
                desktopNotifications: true,
                fontFamily: 'Inter',
                colors: {
                    primary: '#D4AF37',
                    secondary: '#F3E5AB',
                    background: '#f9fafb',
                    listTitle: '#111827',
                    listPrice: '#D4AF37',
                    listInfo: '#6b7280',
                    textPrimary: '#111827',
                    textSecondary: '#6b7280'
                }
            },
            appointments: [],
            professionals: DEFAULT_PROFESSIONALS,
            services: DEFAULT_SERVICES,
            products: [],
            clientPlans: [],
        };
        this.data.set(id, defaultData);
        this.saveToLocalStorage();
        return { ...newUser };
    }

    async login(email: string, password: string): Promise<AdminUser> {
        const user = this.findUserByEmail(email);
        
        if (!user || this.passwords.get(user.id) !== password) {
            throw new Error("E-mail ou senha inválidos.");
        }
        
        if (user.subscription.expiresAt && new Date(user.subscription.expiresAt) < new Date()) {
            user.subscription.status = 'expired';
            this.users.set(user.id, user);
            this.saveToLocalStorage();
        }

        return { ...user };
    }
    
    // FIX: Completed the function to ensure it returns a value and handles the user not found case.
    async requestPasswordReset(email: string): Promise<string> {
        const user = this.findUserByEmail(email);
        if (!user) {
            // Don't reveal if email exists for security, but for this mock, we'll just throw an error.
            throw new Error("E-mail não encontrado.");
        }
        // In a real app, you would send an email or SMS with this code.
        const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
        this.resetCodes.set(email.toLowerCase(), code);
        console.log(`[MOCK] Reset code for ${email}: ${code}`); // Log for debugging mock
        
        // Mock a masked phone number
        const maskedPhone = '****-**23';
        return maskedPhone;
    }

    async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
        const storedCode = this.resetCodes.get(email.toLowerCase());
        if (!storedCode || storedCode !== code) {
            throw new Error("Código de redefinição inválido ou expirado.");
        }
        const user = this.findUserByEmail(email);
        if (!user) {
            // Should not happen if requestPasswordReset succeeded
            throw new Error("Usuário não encontrado.");
        }
        this.passwords.set(user.id, newPassword);
        this.resetCodes.delete(email.toLowerCase()); // Code used, so delete it.
        this.saveToLocalStorage();
    }

    async renewSubscription(userId: string, plan: PlanType): Promise<AdminUser> {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("Usuário não encontrado.");
        }

        const newSubscription: Subscription = {
            plan,
            status: 'active',
            startDate: new Date().toISOString(),
            expiresAt: null,
        };

        const now = new Date();
        switch (plan) {
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                newSubscription.expiresAt = now.toISOString();
                break;
            case 'semiannual':
                now.setMonth(now.getMonth() + 6);
                newSubscription.expiresAt = now.toISOString();
                break;
            case 'annual':
                now.setFullYear(now.getFullYear() + 1);
                newSubscription.expiresAt = now.toISOString();
                break;
            case 'lifetime':
                newSubscription.expiresAt = null;
                break;
            case 'trial':
                 now.setDate(now.getDate() + 7);
                 newSubscription.expiresAt = now.toISOString();
                 break;
        }

        user.subscription = newSubscription;
        this.users.set(userId, user);
        this.saveToLocalStorage();
        return { ...user };
    }
    
    async loadData(userId: string): Promise<UserData> {
        const userData = this.data.get(userId);
        if (!userData) {
            throw new Error("Dados do usuário não encontrados.");
        }
        return JSON.parse(JSON.stringify(userData)); // Return a deep copy
    }
    
    async loadPublicData(storeId: string): Promise<UserData> {
        const userData = this.data.get(storeId);
        if (!userData) {
            throw new Error("Dados da loja não encontrados.");
        }
        return JSON.parse(JSON.stringify(userData)); // Return a deep copy
    }

    async saveData(userId: string, userData: UserData): Promise<void> {
        this.data.set(userId, userData);
        this.saveToLocalStorage();
    }
}

export const db = new MockDB();
