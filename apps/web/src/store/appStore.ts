// ============================================================================
// App Store — Simple state management using React context pattern
// ============================================================================
import React from 'react';

/** Auth state */
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    role: 'ELDER' | 'CAREGIVER';
    language: string;
  } | null;
  token: string | null;
}

/** App-wide state */
export interface AppState {
  auth: AuthState;
  currentPage: string;
  isListening: boolean;
  fontSize: number;  // multiplier: 1 = normal, 1.2 = large, 1.4 = extra large
  highContrast: boolean;
  language: string;
}

/** Initial state */
export const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  currentPage: 'home',
  isListening: false,
  fontSize: 1,
  highContrast: false,
  language: 'en',
};

/** Load persisted state */
export function loadPersistedState(): Partial<AppState> {
  try {
    const token = localStorage.getItem('granny_token');
    const user = localStorage.getItem('granny_user');
    const fontSize = localStorage.getItem('granny_fontsize');
    const contrast = localStorage.getItem('granny_contrast');
    const language = localStorage.getItem('granny_language');

    return {
      auth: token && user ? {
        isAuthenticated: true,
        user: JSON.parse(user),
        token,
      } : initialState.auth,
      fontSize: fontSize ? parseFloat(fontSize) : 1,
      highContrast: contrast === 'true',
      language: language || 'en',
    };
  } catch {
    return {};
  }
}

/** Save auth to localStorage */
export function persistAuth(user: any, token: string) {
  localStorage.setItem('granny_token', token);
  localStorage.setItem('granny_user', JSON.stringify(user));
}

/** Clear auth from localStorage */
export function clearAuth() {
  localStorage.removeItem('granny_token');
  localStorage.removeItem('granny_user');
}

/** Save preferences to localStorage */
export function persistPreferences(
  fontSizeOrOptions: number | { fontSize?: number; highContrast?: boolean; language?: string },
  highContrast?: boolean,
  language?: string
) {
  if (typeof fontSizeOrOptions === 'object') {
    if (fontSizeOrOptions.fontSize !== undefined) {
      localStorage.setItem('granny_fontsize', fontSizeOrOptions.fontSize.toString());
    }
    if (fontSizeOrOptions.highContrast !== undefined) {
      localStorage.setItem('granny_contrast', fontSizeOrOptions.highContrast.toString());
    }
    if (fontSizeOrOptions.language !== undefined) {
      localStorage.setItem('granny_language', fontSizeOrOptions.language);
    }
  } else {
    localStorage.setItem('granny_fontsize', fontSizeOrOptions.toString());
    if (highContrast !== undefined) {
      localStorage.setItem('granny_contrast', highContrast.toString());
    }
    if (language !== undefined) {
      localStorage.setItem('granny_language', language);
    }
  }
}

