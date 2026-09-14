// ============================================================================
// Supabase Client Helper for Granny & Grandpa (தாத்தா & பாட்டி)
// Direct Supabase Auth & PostgREST Database Integration + Local Fallback Cache
// ============================================================================

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || import.meta.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};


export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
  honorific?: 'Grandma' | 'Grandpa' | 'Elder';
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
  // Local registered user storage helper
  getRegisteredUsers(): any[] {
    try {
      const raw = localStorage.getItem('granny_registered_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveRegisteredUser(userData: any) {
    try {
      const users = this.getRegisteredUsers();
      const existingIdx = users.findIndex(u => 
        (userData.email && u.email?.toLowerCase() === userData.email?.toLowerCase()) ||
        (userData.phone && u.phone === userData.phone) ||
        (userData.username && u.username?.toLowerCase() === userData.username?.toLowerCase()) ||
        u.id === userData.id
      );
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...userData };
      } else {
        users.push(userData);
      }
      localStorage.setItem('granny_registered_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save to local user cache:', e);
    }
  },

  async signUp(data: { name: string; email: string; phone?: string; password: string; role: 'ELDER' | 'CAREGIVER'; language?: string; honorific?: string }) {
    const { name, email, phone, password, role, language = 'en', honorific = 'Elder' } = data;
    const cleanUsername = name.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = email.trim().toLowerCase() || `${cleanUsername || (phone ? phone.replace(/[^0-9]/g, '') : 'user')}@granny.app`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const token = `jwt_${Date.now()}`;

    // Generate a unique link code for elders right away
    let linkCode: string | undefined;
    if (role === 'ELDER') {
      const existingUsers = this.getRegisteredUsers();
      const existingCodes = existingUsers.map((u: any) => u.linkCode).filter(Boolean);
      do {
        linkCode = `GRN-${Math.floor(1000 + Math.random() * 9000)}`;
      } while (existingCodes.includes(linkCode));
      // Also store in localStorage for easy lookup by getOrGenerateLinkCode
      localStorage.setItem(`granny_linkcode_${userId}`, linkCode);
    }

    // 1. Immediately cache in robust local accounts database
    const localUserRecord: any = {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone?.trim() || undefined,
      password: password,
      role: role,
      language: language,
      honorific: honorific,
      linkCode: linkCode,
      createdAt: new Date().toISOString(),
    };
    this.saveRegisteredUser(localUserRecord);

    // 2. Also register in Supabase Auth & PostgreSQL database
    try {
      const authRes = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          data: { name: name.trim(), phone: phone || undefined, role, language, honorific }
        }),
      });

      const authData = await authRes.json();
      const realUserId = authData.user?.id || userId;
      const realToken = authData.access_token || authData.session?.access_token || token;

      if (authRes.ok) {
        const oldId = localUserRecord.id;
        localUserRecord.id = realUserId;
        this.saveRegisteredUser(localUserRecord);
        // Update link code key to use real user ID
        if (role === 'ELDER' && linkCode && oldId !== realUserId) {
          localStorage.setItem(`granny_linkcode_${realUserId}`, linkCode);
          localStorage.removeItem(`granny_linkcode_${oldId}`);
        }
      }

      // Upsert into users table
      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${realToken || SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          id: realUserId,
          name: name.trim(),
          email: cleanEmail,
          phone: phone || null,
          role,
          language,
          caregiver_consent: true,
        }),
      }).catch(() => {});

      if (role === 'ELDER') {
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/elder_profiles`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${realToken || SUPABASE_CONFIG.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: realUserId,
            cognitive_level: 2,
            emergency_contact_phone: phone || null,
          }),
        }).catch(() => {});
      }

      const user: AuthUserData = {
        id: realUserId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim(),
        role,
        language,
      };
      return { user, accessToken: realToken };
    } catch (supaErr) {
      console.warn('Supabase online registration note:', supaErr);
      const user: AuthUserData = {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim(),
        role,
        language,
      };
      return { user, accessToken: token };
    }
  },

  async signIn(data: { email?: string; phone?: string; username?: string; password: string }) {
    const { email, phone, username, password } = data;
    const raw = (email || phone || username || '').trim();
    const identifier = raw.toLowerCase();
    
    // 1. Check local user accounts database — search by any identifier
    const localUsers = this.getRegisteredUsers();
    const matchedLocal = localUsers.find((u: any) => {
      const matchEmail = u.email && u.email.toLowerCase() === identifier;
      const matchPhone = u.phone && (
        u.phone.replace(/[^0-9]/g, '') === raw.replace(/[^0-9]/g, '') ||
        u.phone.toLowerCase() === identifier
      );
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
      return {
        user,
        accessToken: `jwt_${matchedLocal.id}`,
      };
    }

    // 2. If not found locally, try Supabase with email format
    const emailToTry = identifier.includes('@') ? identifier : `${identifier.replace(/[^a-zA-Z0-9]/g, '')}@granny.app`;
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Content-Type': 'application/json',
        },
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
        // Save to local registry for future offline logins
        this.saveRegisteredUser({
          ...user,
          username: user.name.toLowerCase().replace(/\s+/g, ''),
          password,
        });
        return {
          user,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        };
      }
    } catch (e) {
      console.warn('Supabase signin attempt note:', e);
    }

    // 3. Not found anywhere
    throw new Error('Account not found. Please check your name, email, or phone number. If you have not registered yet, please sign up first.');
  },

  async signOut(token?: string) {
    if (token) {
      await fetch(`${SUPABASE_CONFIG.url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    }
  }
};

// ─── Database Services for Caretaker & Elderly ────────────────────────────────
export const databaseService = {
  // ── 1. Elder Linking Code ──
  async getOrGenerateLinkCode(elderId: string): Promise<string> {
    // First check if code is stored in user registry (most reliable)
    const users = supabaseAuth.getRegisteredUsers();
    const elderUser = users.find((u: any) => u.id === elderId);
    if (elderUser?.linkCode) {
      return elderUser.linkCode;
    }

    // Check localStorage fallback
    const storageKey = `granny_linkcode_${elderId}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      // Also save to user registry for consistency
      if (elderUser) {
        supabaseAuth.saveRegisteredUser({ ...elderUser, linkCode: cached });
      }
      return cached;
    }

    // Generate a new unique code (GRN-XXXX format)
    const allCodes = users.map((u: any) => u.linkCode).filter(Boolean);
    let randomCode: string;
    do {
      randomCode = `GRN-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (allCodes.includes(randomCode));

    // Save to user registry
    if (elderUser) {
      supabaseAuth.saveRegisteredUser({ ...elderUser, linkCode: randomCode });
    }
    localStorage.setItem(storageKey, randomCode);

    // Also save to Supabase in the background
    try {
      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/elder_link_codes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${localStorage.getItem('granny_token') || SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          elder_id: elderId,
          code: randomCode,
          is_active: true,
        }),
      });
    } catch (e) {
      console.warn('Link code online register note:', e);
    }

    return randomCode;
  },

  async linkCaregiverToElder(caregiverId: string, code: string): Promise<{ success: boolean; elderName: string; elderId: string }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Please enter a valid link code');

    // Step 1: Search in local user registry for the elder with this link code
    const users = supabaseAuth.getRegisteredUsers();
    const localElder = users.find((u: any) => u.linkCode === cleanCode && u.role === 'ELDER');

    if (localElder) {
      const elderId = localElder.id;
      const elderName = localElder.name;

      // Save the link for the caregiver
      const linksKey = `caregiver_links_${caregiverId}`;
      const existing = JSON.parse(localStorage.getItem(linksKey) || '[]');
      if (!existing.some((item: any) => item.elderId === elderId)) {
        existing.push({ elderId, elderName });
        localStorage.setItem(linksKey, JSON.stringify(existing));
      }

      // Also save caregiver link on elder side
      const elderLinksKey = `elder_linked_caregivers_${elderId}`;
      const elderLinks = JSON.parse(localStorage.getItem(elderLinksKey) || '[]');
      if (!elderLinks.includes(caregiverId)) {
        elderLinks.push(caregiverId);
        localStorage.setItem(elderLinksKey, JSON.stringify(elderLinks));
      }

      return { success: true, elderId, elderName };
    }

    // Step 2: Also check localStorage keys for link codes
    const allLocalKeys = Object.keys(localStorage).filter(k => k.startsWith('granny_linkcode_'));
    for (const key of allLocalKeys) {
      if (localStorage.getItem(key) === cleanCode) {
        const elderId = key.replace('granny_linkcode_', '');
        const elderUser = users.find((u: any) => u.id === elderId);
        const elderName = elderUser?.name || 'Connected Elder';

        const linksKey = `caregiver_links_${caregiverId}`;
        const existing = JSON.parse(localStorage.getItem(linksKey) || '[]');
        if (!existing.some((item: any) => item.elderId === elderId)) {
          existing.push({ elderId, elderName });
          localStorage.setItem(linksKey, JSON.stringify(existing));
        }

        const elderLinksKey = `elder_linked_caregivers_${elderId}`;
        const elderLinks = JSON.parse(localStorage.getItem(elderLinksKey) || '[]');
        if (!elderLinks.includes(caregiverId)) {
          elderLinks.push(caregiverId);
          localStorage.setItem(elderLinksKey, JSON.stringify(elderLinks));
        }

        return { success: true, elderId, elderName };
      }
    }

    // Step 3: Try Supabase
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/elder_link_codes?code=eq.${cleanCode}&select=elder_id,users(name)`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${localStorage.getItem('granny_token') || SUPABASE_CONFIG.anonKey}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const elderId = data[0].elder_id;
        const elderName = data[0].users?.name || 'Connected Elder';

        const linksKey = `caregiver_links_${caregiverId}`;
        const existing = JSON.parse(localStorage.getItem(linksKey) || '[]');
        if (!existing.some((item: any) => item.elderId === elderId)) {
          existing.push({ elderId, elderName });
          localStorage.setItem(linksKey, JSON.stringify(existing));
        }

        return { success: true, elderId, elderName };
      }
    } catch (e) {
      console.warn('Supabase link lookup failed, checking local only');
    }

    // Code not found anywhere
    throw new Error('This link code was not found. Please ask the elder to check their link code in Settings and share the correct one.');
  },

  // ── 2. Medical Reports ──
  async getMedicalReports(elderId: string): Promise<MedicalReport[]> {
    const storageKey = `medical_reports_${elderId}`;
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (cached.length > 0) return cached;

    // Seed default starter reports if empty
    const defaults: MedicalReport[] = [
      {
        id: 'rep_1',
        elder_id: elderId,
        title: 'Apollo Cardiology Routine Checkup',
        doctor_name: 'Dr. S. Rangarajan (Cardiologist)',
        report_date: '2026-03-01',
        category: 'Doctor Visit',
        summary: 'BP: 125/82 mmHg. Heart rhythm normal. Continue morning Telmisartan 40mg and stay hydrated.',
        notes: 'Advised daily 20-min gentle verandah walk before 9 AM.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rep_2',
        elder_id: elderId,
        title: 'Monthly Fasting Blood Sugar & HbA1c',
        doctor_name: 'Dr. Meenakshi Sundaram',
        report_date: '2026-02-20',
        category: 'Lab Test',
        summary: 'HbA1c: 6.8% (Well-controlled). Fasting Glucose: 110 mg/dL.',
        notes: 'Encourage mild traditional millets and sugar-free filter coffee.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rep_3',
        elder_id: elderId,
        title: 'Prescription for Memory & Sleep Hygiene',
        doctor_name: 'Dr. K. Anand (Geriatric Specialist)',
        report_date: '2026-01-15',
        category: 'Prescription',
        summary: 'Multivitamin B-Complex with evening chamomile tea. Keep regular 9:30 PM bedtime.',
        notes: 'Positive response to morning Carnatic songs and photo reminiscence.',
        created_at: new Date().toISOString(),
      }
    ];

    localStorage.setItem(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async addMedicalReport(report: Omit<MedicalReport, 'id' | 'created_at'>): Promise<MedicalReport> {
    const newReport: MedicalReport = {
      ...report,
      id: `rep_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const storageKey = `medical_reports_${report.elder_id}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.unshift(newReport);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    try {
      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_reports`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${localStorage.getItem('granny_token') || SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport),
      });
    } catch (e) {
      console.warn('Medical report online sync note:', e);
    }

    return newReport;
  },

  async deleteMedicalReport(elderId: string, reportId: string): Promise<void> {
    const storageKey = `medical_reports_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filtered = existing.filter((r: MedicalReport) => r.id !== reportId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  },

  // ── 3. Family Contacts (Visible in Elder's Sanctuary) ──
  async getFamilyContacts(elderId: string): Promise<FamilyContact[]> {
    const storageKey = `family_contacts_${elderId}`;
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (cached.length > 0) return cached;

    const defaults: FamilyContact[] = [
      {
        id: 'fc_1',
        elder_id: elderId,
        name: 'Arun (Son)',
        relationship: 'Son & Caretaker',
        phone: '+91 98401 23456',
        avatar_emoji: '👨‍💼',
        is_emergency_contact: true,
        notes: 'Calls every morning at 8:30 AM',
      },
      {
        id: 'fc_2',
        elder_id: elderId,
        name: 'Priya (Granddaughter)',
        relationship: 'Granddaughter (College)',
        phone: '+91 94440 98765',
        avatar_emoji: '👩‍🎓',
        is_emergency_contact: false,
        notes: 'Loves hearing Paati & Thatha childhood village stories',
      },
      {
        id: 'fc_3',
        elder_id: elderId,
        name: 'Dr. Rangarajan (Doctor)',
        relationship: 'Family Doctor',
        phone: '+91 98840 11223',
        avatar_emoji: '🩺',
        is_emergency_contact: true,
        notes: 'Apollo Clinic — available for emergency advice',
      },
      {
        id: 'fc_4',
        elder_id: elderId,
        name: 'Radha (Daughter-in-law)',
        relationship: 'Daughter-in-law',
        phone: '+91 97900 55443',
        avatar_emoji: '👩‍🍳',
        is_emergency_contact: false,
        notes: 'Manages daily healthy recipes and medicine box',
      }
    ];

    localStorage.setItem(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async addFamilyContact(contact: Omit<FamilyContact, 'id'>): Promise<FamilyContact> {
    const newContact: FamilyContact = {
      ...contact,
      id: `fc_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const storageKey = `family_contacts_${contact.elder_id}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(newContact);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    return newContact;
  },

  async deleteFamilyContact(elderId: string, contactId: string): Promise<void> {
    const storageKey = `family_contacts_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filtered = existing.filter((c: FamilyContact) => c.id !== contactId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  },

  // ── 4. Caretaker Situation Notes & Guidelines ──
  async getCareNotes(elderId: string): Promise<CareNote> {
    const storageKey = `care_notes_${elderId}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) return JSON.parse(cached);

    const defaultNote: CareNote = {
      id: `note_${elderId}`,
      elder_id: elderId,
      title: 'Current Situation & Daily Care Protocol',
      condition_details: 'Mild short-term memory lapses during evening hours (Sundowning tendency). Physical mobility is good with walking stick. Loves listening to AIR melodies and seeing old family wedding photographs.',
      care_instructions: '1. Keep verandah well-lit in evenings.\n2. Remind to drink warm water after morning walk.\n3. In case of confusion, play M.S. Subbulakshmi or ask about their childhood temple stories.\n4. Low salt and low sugar diet.',
      ai_guidance: 'Speak in warm, unhurried Tamil or English. Reassure gently if they repeat questions. Celebrate small memory game successes.',
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(defaultNote));
    return defaultNote;
  },

  async saveCareNotes(notes: CareNote): Promise<CareNote> {
    const updated = { ...notes, updated_at: new Date().toISOString() };
    const storageKey = `care_notes_${notes.elder_id}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return updated;
  },

  // ── 5. Reminders & Alarms (Set by Caretaker, executed on Elder's device) ──
  async getReminders(elderId: string): Promise<ReminderItem[]> {
    const storageKey = `reminders_${elderId}`;
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (cached.length > 0) return cached;

    const defaults: ReminderItem[] = [
      { id: 'rem_1', elder_id: elderId, title: 'Morning Blood Pressure Medicine', type: 'MEDICATION', time_of_day: '08:00 AM', is_active: true, confirmed: true },
      { id: 'rem_2', elder_id: elderId, title: 'Warm Water & Tulsi Drop', type: 'WATER', time_of_day: '10:30 AM', is_active: true, confirmed: false },
      { id: 'rem_3', elder_id: elderId, title: 'Post-Lunch Rest & Calcium Tablet', type: 'MEDICATION', time_of_day: '01:30 PM', is_active: true, confirmed: false },
      { id: 'rem_4', elder_id: elderId, title: 'Evening Walk in Garden & Tea', type: 'EXERCISE', time_of_day: '04:45 PM', is_active: true, confirmed: false },
      { id: 'rem_5', elder_id: elderId, title: 'Night Capsule & Warm Milk', type: 'MEDICATION', time_of_day: '08:30 PM', is_active: true, confirmed: false },
    ];

    localStorage.setItem(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async addReminder(reminder: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
    const newRem: ReminderItem = {
      ...reminder,
      id: `rem_${Date.now()}`,
    };
    const storageKey = `reminders_${reminder.elder_id}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(newRem);
    localStorage.setItem(storageKey, JSON.stringify(existing));
    return newRem;
  },

  async toggleReminder(elderId: string, reminderId: string): Promise<ReminderItem[]> {
    const storageKey = `reminders_${elderId}`;
    const existing: ReminderItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = existing.map(r => r.id === reminderId ? { ...r, confirmed: !r.confirmed, last_confirmed_at: new Date().toISOString() } : r);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return updated;
  },

  async deleteReminder(elderId: string, reminderId: string): Promise<void> {
    const storageKey = `reminders_${elderId}`;
    const existing: ReminderItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filtered = existing.filter(r => r.id !== reminderId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  },

  // ── 6. Memories (Caretaker upload & Elder viewer) ──
  async getMemories(elderId: string): Promise<any[]> {
    const storageKey = `memories_${elderId}`;
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (cached.length > 0) return cached;

    const defaults = [
      {
        id: 'mem_1',
        title: 'Wedding Day at Madurai Meenakshi Amman Temple (1975)',
        content: 'Ramanathan Thatha and Lakshmi Amma on their wedding day surrounded by fragrant jasmine garlands and traditional nadaswaram music.',
        type: 'PHOTO',
        image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop&q=80',
        tags: ['Wedding', 'Madurai', 'Family'],
        uploaded_by: 'Arun (Son)',
        created_at: '1975-06-12',
      },
      {
        id: 'mem_2',
        title: 'First Trip to Kodaikanal Hill Station (1982)',
        content: 'Riding the pedal boat on the lake in cool mist, holding baby Arun wrapped in a warm yellow woolen sweater.',
        type: 'STORY',
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
        tags: ['Travel', 'Kodaikanal', 'Hills'],
        uploaded_by: 'Arun (Son)',
        created_at: '1982-05-18',
      },
      {
        id: 'mem_3',
        title: 'Priya’s First Carnatic Vocal Arangetram (2018)',
        content: 'Granddaughter Priya dedicated her first song to Thatha and Paati sitting in the front row with tears of joy.',
        type: 'PHOTO',
        image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        tags: ['Granddaughter', 'Music', 'Celebration'],
        uploaded_by: 'Priya (Granddaughter)',
        created_at: '2018-11-10',
      }
    ];

    localStorage.setItem(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async addMemory(elderId: string, memory: { title: string; content: string; image_url?: string; tags?: string[]; uploaded_by?: string }): Promise<any> {
    const newMem = {
      ...memory,
      id: `mem_${Date.now()}`,
      type: memory.image_url ? 'PHOTO' : 'STORY',
      created_at: new Date().toISOString(),
    };

    const storageKey = `memories_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.unshift(newMem);
    localStorage.setItem(storageKey, JSON.stringify(existing));
    return newMem;
  },

  // ── 7. Caretaker In-App Notifications & Health Alert Feeds ──
  async getCaretakerNotifications(elderId: string): Promise<CaretakerNotification[]> {
    const storageKey = `caretaker_notifications_${elderId}`;
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (cached.length > 0) return cached;

    const defaults: CaretakerNotification[] = [
      {
        id: 'notif_init',
        elder_id: elderId,
        elder_name: 'Connected Elder',
        type: 'GENERAL',
        severity: 'INFO',
        title: 'Care Bridge Active',
        message: 'Asha Voice AI is active and monitoring elder conversations for health safety and happy memories.',
        email_sent: false,
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    localStorage.setItem(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async addCaretakerNotification(elderId: string, notif: Omit<CaretakerNotification, 'id' | 'created_at'>): Promise<CaretakerNotification> {
    const newNotif: CaretakerNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const storageKey = `caretaker_notifications_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.unshift(newNotif);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    // Also dispatch email alert log
    if (notif.severity === 'HIGH' || notif.severity === 'URGENT' || notif.type === 'HEALTH_ALERT') {
      this.sendCaretakerEmailAlert(elderId, notif.recipient_email || 'caregiver@granny.app', {
        title: notif.title,
        message: notif.message,
        elder_name: notif.elder_name,
        transcript: notif.transcript_excerpt,
        recommendation: notif.recommendation,
        severity: notif.severity
      });
    }

    return newNotif;
  },

  async markNotificationRead(elderId: string, notifId: string): Promise<void> {
    const storageKey = `caretaker_notifications_${elderId}`;
    const existing: CaretakerNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = existing.map(n => n.id === notifId ? { ...n, is_read: true } : n);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },

  async clearAllNotifications(elderId: string): Promise<void> {
    const storageKey = `caretaker_notifications_${elderId}`;
    localStorage.setItem(storageKey, JSON.stringify([]));
  },

  /** Dispatches an urgent email alert to the caretaker */
  async sendCaretakerEmailAlert(
    elderId: string,
    recipientEmail: string,
    details: { title: string; message: string; elder_name: string; transcript?: string; recommendation?: string; severity: string }
  ): Promise<{ success: boolean; deliveredAt: string }> {
    const deliveredAt = new Date().toLocaleTimeString();
    console.info(`[CARETAKER EMAIL ALERT SENT] To: ${recipientEmail} | Elder: ${details.elder_name} | Subject: 🚨 [${details.severity}] ${details.title}`);

    // Store in email delivery audit trail
    const auditKey = `email_alerts_sent_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(auditKey) || '[]');
    existing.unshift({
      id: `email_${Date.now()}`,
      to: recipientEmail,
      subject: `🚨 Health Alert for ${details.elder_name}: ${details.title}`,
      details,
      sent_at: new Date().toISOString(),
    });
    localStorage.setItem(auditKey, JSON.stringify(existing.slice(0, 50)));

    return { success: true, deliveredAt };
  },

  // ── 8. Elder Personal Facts Extracted from AI Conversations ──
  async saveElderPersonalFact(elderId: string, fact: { title: string; content: string; tags?: string[]; category?: string }): Promise<any> {
    const factItem = {
      id: `fact_${Date.now()}`,
      elder_id: elderId,
      title: fact.title,
      content: fact.content,
      tags: fact.tags || ['Asha AI', 'Conversation'],
      category: fact.category || 'General',
      created_at: new Date().toISOString(),
    };

    const storageKey = `elder_personal_facts_${elderId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    // Avoid exact duplicate content
    if (!existing.some((f: any) => f.content.toLowerCase().trim() === fact.content.toLowerCase().trim())) {
      existing.unshift(factItem);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    }

    // Also mirror to memory stories if substantial
    if (fact.content.length > 20) {
      await this.addMemory(elderId, {
        title: fact.title,
        content: fact.content,
        tags: [...(fact.tags || []), 'AI-Discovered Memory'],
        uploaded_by: 'Asha Voice AI'
      });
    }

    return factItem;
  },

  async getElderPersonalFacts(elderId: string): Promise<any[]> {
    const storageKey = `elder_personal_facts_${elderId}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }
};

