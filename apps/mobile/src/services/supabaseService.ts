// ============================================================================
// Supabase Auth + Database Service for Granny Mobile
// Port of web supabase.ts adapted for React Native (AsyncStorage instead of localStorage)
// ============================================================================

import { storage } from './storageService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
}

export interface MedicalReport {
  id: string;
  elder_id: string;
  title: string;
  doctor_name: string;
  report_date: string;
  category: 'Prescription' | 'Lab Test' | 'Doctor Visit' | 'Scan' | 'Vitals' | 'Other';
  file_url?: string;
  summary?: string;
  notes?: string;
  created_at: string;
}

export interface FamilyContact {
  id: string;
  elder_id: string;
  name: string;
  relationship: string;
  phone: string;
  avatar_emoji?: string;
  photo_url?: string;
  is_emergency_contact?: boolean;
  notes?: string;
  created_at?: string;
}

export interface CareNote {
  id: string;
  elder_id: string;
  title: string;
  condition_details: string;
  care_instructions: string;
  ai_guidance?: string;
  updated_at: string;
}

export interface CaretakerNotification {
  id: string;
  elder_id: string;
  elder_name: string;
  type: 'HEALTH_ALERT' | 'MISSED_MEDICATION' | 'MEMORY_SHARED' | 'DISTRESS' | 'GENERAL';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  transcript_excerpt?: string;
  recommendation?: string;
  email_sent: boolean;
  recipient_email?: string;
  is_read: boolean;
  created_at: string;
}

export interface ReminderItem {
  id: string;
  elder_id: string;
  title: string;
  description?: string;
  type: 'MEDICATION' | 'WATER' | 'MEAL' | 'EXERCISE' | 'CALL_FAMILY' | 'CUSTOM';
  time_of_day: string;
  is_active: boolean;
  confirmed?: boolean;
  last_confirmed_at?: string;
}

// ─── Supabase Auth ────────────────────────────────────────────────────────────
export const supabaseAuth = {
  async getRegisteredUsers(): Promise<any[]> {
    return storage.getJSON<any[]>('granny_registered_users', []);
  },

  async saveRegisteredUser(userData: any): Promise<void> {
    const users = await this.getRegisteredUsers();
    const existingIdx = users.findIndex((u: any) =>
      (userData.email && u.email?.toLowerCase() === userData.email?.toLowerCase()) ||
      (userData.phone && u.phone === userData.phone) ||
      u.id === userData.id
    );
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userData };
    } else {
      users.push(userData);
    }
    await storage.setJSON('granny_registered_users', users);
  },

  async getAuthToken(): Promise<string | null> {
    return storage.getItem('granny_token');
  },

  async setAuthToken(token: string): Promise<void> {
    await storage.setItem('granny_token', token);
  },

  async clearAuthToken(): Promise<void> {
    await storage.removeItem('granny_token');
  },

  async signUp(data: { name: string; email: string; phone?: string; password: string; role: 'ELDER' | 'CAREGIVER'; language?: string }): Promise<{ user: AuthUserData; accessToken: string }> {
    const { name, email, phone, password, role, language = 'en' } = data;
    const cleanUsername = name.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = email.trim().toLowerCase() || `${cleanUsername || 'user'}@granny.app`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const token = `jwt_${Date.now()}`;

    let linkCode: string | undefined;
    if (role === 'ELDER') {
      const existingUsers = await this.getRegisteredUsers();
      const existingCodes = existingUsers.map((u: any) => u.linkCode).filter(Boolean);
      do {
        linkCode = `GRN-${Math.floor(1000 + Math.random() * 9000)}`;
      } while (existingCodes.includes(linkCode));
      await storage.setItem(`granny_linkcode_${userId}`, linkCode);
    }

    const localUserRecord: any = {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone?.trim(),
      password,
      role,
      language,
      linkCode,
      createdAt: new Date().toISOString(),
    };
    await this.saveRegisteredUser(localUserRecord);

    // Try Supabase online registration
    try {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password, data: { name: name.trim(), phone, role, language } }),
        });
        const authData = await authRes.json();
        const realUserId = authData.user?.id || userId;
        const realToken = authData.access_token || token;
        if (authRes.ok) {
          localUserRecord.id = realUserId;
          await this.saveRegisteredUser(localUserRecord);
          if (role === 'ELDER' && linkCode) {
            await storage.setItem(`granny_linkcode_${realUserId}`, linkCode);
          }
        }
        return { user: { id: realUserId, name: name.trim(), email: cleanEmail, phone, role, language }, accessToken: realToken };
      }
    } catch (e) {
      console.warn('Supabase signup note:', e);
    }

    return { user: { id: userId, name: name.trim(), email: cleanEmail, phone, role, language }, accessToken: token };
  },

  async signIn(data: { email?: string; phone?: string; password: string }): Promise<{ user: AuthUserData; accessToken: string }> {
    const { email, phone, password } = data;
    const identifier = (email || phone || '').trim().toLowerCase();

    const localUsers = await this.getRegisteredUsers();
    const matchedLocal = localUsers.find((u: any) => {
      const matchEmail = u.email && u.email.toLowerCase() === identifier;
      const matchPhone = u.phone && u.phone.replace(/[^0-9]/g, '') === identifier.replace(/[^0-9]/g, '');
      const matchUsername = u.username && u.username.toLowerCase() === identifier.replace(/\s+/g, '');
      const matchName = u.name && u.name.toLowerCase().replace(/\s+/g, '') === identifier.replace(/\s+/g, '');
      return matchEmail || matchPhone || matchUsername || matchName;
    });

    if (matchedLocal) {
      if (matchedLocal.password && matchedLocal.password !== password) {
        throw new Error('Wrong password. Please check and try again.');
      }
      const user: AuthUserData = {
        id: matchedLocal.id,
        name: matchedLocal.name,
        email: matchedLocal.email,
        phone: matchedLocal.phone,
        role: matchedLocal.role || 'ELDER',
        language: matchedLocal.language || 'en',
      };
      return { user, accessToken: `jwt_${matchedLocal.id}` };
    }

    // Try Supabase
    const emailToTry = identifier.includes('@') ? identifier : `${identifier.replace(/[^a-zA-Z0-9]/g, '')}@granny.app`;
    try {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToTry, password }),
        });
        const result = await res.json();
        if (res.ok && result.user) {
          const userMeta = result.user?.user_metadata || {};
          const user: AuthUserData = {
            id: result.user?.id,
            name: userMeta.name || result.user?.email?.split('@')[0] || identifier,
            email: result.user?.email || emailToTry,
            phone: result.user?.phone || userMeta.phone,
            role: (userMeta.role as any) || 'ELDER',
            language: userMeta.language || 'en',
          };
          await this.saveRegisteredUser({ ...user, username: user.name.toLowerCase().replace(/\s+/g, ''), password });
          return { user, accessToken: result.access_token };
        }
      }
    } catch (e) {
      console.warn('Supabase signin note:', e);
    }

    throw new Error('Account not found. Please check your details or register first.');
  },

  async signOut(token?: string): Promise<void> {
    await this.clearAuthToken();
    if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
  },

  async persistAuth(user: AuthUserData, token: string): Promise<void> {
    await storage.setJSON('granny_auth_user', user);
    await storage.setItem('granny_token', token);
  },

  async loadPersistedAuth(): Promise<{ user: AuthUserData; token: string } | null> {
    const user = await storage.getJSON<AuthUserData | null>('granny_auth_user', null);
    const token = await storage.getItem('granny_token');
    if (user && token) return { user, token };
    return null;
  },

  async clearPersistedAuth(): Promise<void> {
    await storage.removeItem('granny_auth_user');
    await storage.removeItem('granny_token');
  },
};

// ─── Database Service ─────────────────────────────────────────────────────────
export const databaseService = {
  async getOrGenerateLinkCode(elderId: string): Promise<string> {
    const users = await supabaseAuth.getRegisteredUsers();
    const elderUser = users.find((u: any) => u.id === elderId);
    if (elderUser?.linkCode) return elderUser.linkCode;

    const cached = await storage.getItem(`granny_linkcode_${elderId}`);
    if (cached) return cached;

    const allCodes = users.map((u: any) => u.linkCode).filter(Boolean);
    let randomCode: string;
    do {
      randomCode = `GRN-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (allCodes.includes(randomCode));

    if (elderUser) await supabaseAuth.saveRegisteredUser({ ...elderUser, linkCode: randomCode });
    await storage.setItem(`granny_linkcode_${elderId}`, randomCode);
    return randomCode;
  },

  async linkCaregiverToElder(caregiverId: string, code: string): Promise<{ success: boolean; elderName: string; elderId: string }> {
    const cleanCode = code.trim().toUpperCase();
    const users = await supabaseAuth.getRegisteredUsers();
    const localElder = users.find((u: any) => u.linkCode === cleanCode && u.role === 'ELDER');

    if (localElder) {
      const elderId = localElder.id;
      const elderName = localElder.name;
      const linksKey = `caregiver_links_${caregiverId}`;
      const existing = await storage.getJSON<any[]>(linksKey, []);
      if (!existing.some((item: any) => item.elderId === elderId)) {
        existing.push({ elderId, elderName });
        await storage.setJSON(linksKey, existing);
      }
      return { success: true, elderId, elderName };
    }

    // Check storage keys
    const allKeys = await storage.getAllKeys();
    const linkCodeKeys = allKeys.filter(k => k.startsWith('granny_linkcode_'));
    for (const key of linkCodeKeys) {
      const val = await storage.getItem(key);
      if (val === cleanCode) {
        const elderId = key.replace('granny_linkcode_', '');
        const elderUser = users.find((u: any) => u.id === elderId);
        const elderName = elderUser?.name || 'Connected Elder';
        const linksKey = `caregiver_links_${caregiverId}`;
        const existing = await storage.getJSON<any[]>(linksKey, []);
        if (!existing.some((item: any) => item.elderId === elderId)) {
          existing.push({ elderId, elderName });
          await storage.setJSON(linksKey, existing);
        }
        return { success: true, elderId, elderName };
      }
    }

    throw new Error('Link code not found. Please ask the elder to check their code in Settings.');
  },

  async getLinkedElders(caregiverId: string): Promise<{ elderId: string; elderName: string }[]> {
    return storage.getJSON<any[]>(`caregiver_links_${caregiverId}`, []);
  },

  async getMedicalReports(elderId: string): Promise<MedicalReport[]> {
    const cached = await storage.getJSON<MedicalReport[]>(`medical_reports_${elderId}`, []);
    if (cached.length > 0) return cached;
    const defaults: MedicalReport[] = [
      { id: 'rep_1', elder_id: elderId, title: 'Apollo Cardiology Routine Checkup', doctor_name: 'Dr. S. Rangarajan', report_date: '2026-03-01', category: 'Doctor Visit', summary: 'BP: 125/82. Continue Telmisartan 40mg.', notes: 'Daily 20-min walk.', created_at: new Date().toISOString() },
      { id: 'rep_2', elder_id: elderId, title: 'Monthly Blood Sugar & HbA1c', doctor_name: 'Dr. Meenakshi Sundaram', report_date: '2026-02-20', category: 'Lab Test', summary: 'HbA1c: 6.8%. Fasting: 110 mg/dL.', notes: 'Mild millets diet.', created_at: new Date().toISOString() },
    ];
    await storage.setJSON(`medical_reports_${elderId}`, defaults);
    return defaults;
  },

  async addMedicalReport(report: Omit<MedicalReport, 'id' | 'created_at'>): Promise<MedicalReport> {
    const newReport: MedicalReport = { ...report, id: `rep_${Date.now()}`, created_at: new Date().toISOString() };
    const existing = await storage.getJSON<MedicalReport[]>(`medical_reports_${report.elder_id}`, []);
    existing.unshift(newReport);
    await storage.setJSON(`medical_reports_${report.elder_id}`, existing);
    return newReport;
  },

  async getFamilyContacts(elderId: string): Promise<FamilyContact[]> {
    const cached = await storage.getJSON<FamilyContact[]>(`family_contacts_${elderId}`, []);
    if (cached.length > 0) return cached;
    const defaults: FamilyContact[] = [
      { id: 'fc_1', elder_id: elderId, name: 'Arun (Son)', relationship: 'Son & Caretaker', phone: '+91 98401 23456', avatar_emoji: '👨‍💼', is_emergency_contact: true, notes: 'Calls every morning at 8:30 AM' },
      { id: 'fc_2', elder_id: elderId, name: 'Priya (Granddaughter)', relationship: 'Granddaughter', phone: '+91 94440 98765', avatar_emoji: '👩‍🎓', is_emergency_contact: false, notes: 'Loves family stories' },
      { id: 'fc_3', elder_id: elderId, name: 'Dr. Rangarajan', relationship: 'Family Doctor', phone: '+91 98840 11223', avatar_emoji: '🩺', is_emergency_contact: true, notes: 'Apollo Clinic' },
    ];
    await storage.setJSON(`family_contacts_${elderId}`, defaults);
    return defaults;
  },

  async addFamilyContact(contact: Omit<FamilyContact, 'id'>): Promise<FamilyContact> {
    const newContact: FamilyContact = { ...contact, id: `fc_${Date.now()}`, created_at: new Date().toISOString() };
    const existing = await storage.getJSON<FamilyContact[]>(`family_contacts_${contact.elder_id}`, []);
    existing.push(newContact);
    await storage.setJSON(`family_contacts_${contact.elder_id}`, existing);
    return newContact;
  },

  async deleteFamilyContact(elderId: string, contactId: string): Promise<void> {
    const existing = await storage.getJSON<FamilyContact[]>(`family_contacts_${elderId}`, []);
    await storage.setJSON(`family_contacts_${elderId}`, existing.filter(c => c.id !== contactId));
  },

  async getReminders(elderId: string): Promise<ReminderItem[]> {
    const cached = await storage.getJSON<ReminderItem[]>(`reminders_${elderId}`, []);
    if (cached.length > 0) return cached;
    const defaults: ReminderItem[] = [
      { id: 'rem_1', elder_id: elderId, title: 'Morning Blood Pressure Medicine', type: 'MEDICATION', time_of_day: '08:00 AM', is_active: true, confirmed: true },
      { id: 'rem_2', elder_id: elderId, title: 'Warm Water & Tulsi Drop', type: 'WATER', time_of_day: '10:30 AM', is_active: true, confirmed: false },
      { id: 'rem_3', elder_id: elderId, title: 'Post-Lunch Calcium Tablet', type: 'MEDICATION', time_of_day: '01:30 PM', is_active: true, confirmed: false },
      { id: 'rem_4', elder_id: elderId, title: 'Evening Walk & Tea', type: 'EXERCISE', time_of_day: '04:45 PM', is_active: true, confirmed: false },
      { id: 'rem_5', elder_id: elderId, title: 'Night Capsule & Warm Milk', type: 'MEDICATION', time_of_day: '08:30 PM', is_active: true, confirmed: false },
    ];
    await storage.setJSON(`reminders_${elderId}`, defaults);
    return defaults;
  },

  async addReminder(reminder: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
    const newRem: ReminderItem = { ...reminder, id: `rem_${Date.now()}` };
    const existing = await storage.getJSON<ReminderItem[]>(`reminders_${reminder.elder_id}`, []);
    existing.push(newRem);
    await storage.setJSON(`reminders_${reminder.elder_id}`, existing);
    return newRem;
  },

  async toggleReminder(elderId: string, reminderId: string): Promise<ReminderItem[]> {
    const existing = await storage.getJSON<ReminderItem[]>(`reminders_${elderId}`, []);
    const updated = existing.map(r => r.id === reminderId ? { ...r, confirmed: !r.confirmed, last_confirmed_at: new Date().toISOString() } : r);
    await storage.setJSON(`reminders_${elderId}`, updated);
    return updated;
  },

  async deleteReminder(elderId: string, reminderId: string): Promise<void> {
    const existing = await storage.getJSON<ReminderItem[]>(`reminders_${elderId}`, []);
    await storage.setJSON(`reminders_${elderId}`, existing.filter(r => r.id !== reminderId));
  },

  async getMemories(elderId: string): Promise<any[]> {
    const cached = await storage.getJSON<any[]>(`memories_${elderId}`, []);
    if (cached.length > 0) return cached;
    const defaults = [
      { id: 'mem_1', title: 'Wedding Day at Madurai Meenakshi Amman Temple (1975)', content: 'Beautiful wedding surrounded by jasmine garlands and nadaswaram music.', type: 'PHOTO', image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop&q=80', tags: ['Wedding', 'Madurai', 'Family'], uploaded_by: 'Arun (Son)', created_at: '1975-06-12' },
      { id: 'mem_2', title: 'First Trip to Kodaikanal Hill Station (1982)', content: 'Pedal boat on the lake in cool mist with baby Arun.', type: 'STORY', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', tags: ['Travel', 'Kodaikanal'], uploaded_by: 'Arun (Son)', created_at: '1982-05-18' },
      { id: 'mem_3', title: "Priya's First Carnatic Arangetram (2018)", content: 'Granddaughter Priya dedicated her first song to Thatha and Paati.', type: 'PHOTO', image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80', tags: ['Granddaughter', 'Music'], uploaded_by: 'Priya (Granddaughter)', created_at: '2018-11-10' },
    ];
    await storage.setJSON(`memories_${elderId}`, defaults);
    return defaults;
  },

  async addMemory(elderId: string, memory: { title: string; content: string; image_url?: string; tags?: string[]; uploaded_by?: string }): Promise<any> {
    const newMem = { ...memory, id: `mem_${Date.now()}`, type: memory.image_url ? 'PHOTO' : 'STORY', created_at: new Date().toISOString() };
    const existing = await storage.getJSON<any[]>(`memories_${elderId}`, []);
    existing.unshift(newMem);
    await storage.setJSON(`memories_${elderId}`, existing);
    return newMem;
  },

  async getCaretakerNotifications(elderId: string): Promise<CaretakerNotification[]> {
    const cached = await storage.getJSON<CaretakerNotification[]>(`caretaker_notifications_${elderId}`, []);
    if (cached.length > 0) return cached;
    const defaults: CaretakerNotification[] = [
      { id: 'notif_init', elder_id: elderId, elder_name: 'Connected Elder', type: 'GENERAL', severity: 'INFO', title: 'Care Bridge Active', message: 'Asha Voice AI is monitoring elder conversations.', email_sent: false, is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
    ];
    await storage.setJSON(`caretaker_notifications_${elderId}`, defaults);
    return defaults;
  },

  async addCaretakerNotification(elderId: string, notif: Omit<CaretakerNotification, 'id' | 'created_at'>): Promise<CaretakerNotification> {
    const newNotif: CaretakerNotification = { ...notif, id: `notif_${Date.now()}`, created_at: new Date().toISOString() };
    const existing = await storage.getJSON<CaretakerNotification[]>(`caretaker_notifications_${elderId}`, []);
    existing.unshift(newNotif);
    await storage.setJSON(`caretaker_notifications_${elderId}`, existing);
    return newNotif;
  },

  async getCareNotes(elderId: string): Promise<CareNote> {
    const cached = await storage.getJSON<CareNote | null>(`care_notes_${elderId}`, null);
    if (cached) return cached;
    const defaultNote: CareNote = {
      id: `note_${elderId}`, elder_id: elderId, title: 'Current Situation & Daily Care Protocol',
      condition_details: 'Mild short-term memory lapses during evening hours. Physical mobility is good.',
      care_instructions: '1. Keep verandah well-lit in evenings.\n2. Remind to drink warm water after morning walk.\n3. Low salt and low sugar diet.',
      ai_guidance: 'Speak warmly and unhurried. Reassure gently. Celebrate small successes.',
      updated_at: new Date().toISOString(),
    };
    await storage.setJSON(`care_notes_${elderId}`, defaultNote);
    return defaultNote;
  },

  async saveCareNotes(notes: CareNote): Promise<CareNote> {
    const updated = { ...notes, updated_at: new Date().toISOString() };
    await storage.setJSON(`care_notes_${notes.elder_id}`, updated);
    return updated;
  },

  async getElderProfile(elderId: string): Promise<any> {
    return storage.getJSON<any>(`elder_profile_${elderId}`, {
      name: '', hobbies: '', hometown: 'Tamil Nadu', favoriteArtists: 'M.S. Subbulakshmi, Ilaiyaraaja',
    });
  },

  async saveElderProfile(elderId: string, profile: any): Promise<void> {
    await storage.setJSON(`elder_profile_${elderId}`, profile);
  },

  async getGameDailyLimit(caregiverId: string, elderId: string): Promise<number> {
    return storage.getJSON<number>(`game_limit_${caregiverId}_${elderId}`, 0);
  },

  async setGameDailyLimit(caregiverId: string, elderId: string, minutes: number): Promise<void> {
    await storage.setJSON(`game_limit_${caregiverId}_${elderId}`, minutes);
  },

  async createActivityLog(userId: string, type: string, description: string): Promise<void> {
    const today = new Date().toDateString();
    const key = `activity_log_${userId}_${today}`;
    const existing = await storage.getJSON<any[]>(key, []);
    existing.push({ type, description, timestamp: new Date().toISOString() });
    await storage.setJSON(key, existing);
  },

  async logActivity(userId: string, activity: { page: string; durationMs: number }): Promise<void> {
    const today = new Date().toDateString();
    const key = `activity_log_${userId}_${today}`;
    const existing = await storage.getJSON<any[]>(key, []);
    existing.push({ ...activity, timestamp: new Date().toISOString() });
    await storage.setJSON(key, existing);
  },

  async getActivityLog(userId: string): Promise<any[]> {
    const today = new Date().toDateString();
    return storage.getJSON<any[]>(`activity_log_${userId}_${today}`, []);
  },
};
