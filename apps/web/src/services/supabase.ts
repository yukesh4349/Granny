// ============================================================================
// Supabase Client Helper for Granny Web Frontend
// ============================================================================

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://bultaewlicekhxdmkjxd.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lhdXuHOWXRkuj1BuItKi4A_zA1Q_-Az',
};

export const supabaseClient = {
  getUrl: () => SUPABASE_CONFIG.url,
  getAnonKey: () => SUPABASE_CONFIG.anonKey,

  // REST API proxy for Supabase tables
  async from(table: string) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}`;
    const headers = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
    };

    return {
      async select(columns = '*') {
        const res = await fetch(`${url}?select=${columns}`, { headers });
        return res.json();
      },
      async insert(data: any) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(data),
        });
        return res.json();
      }
    };
  }
};
