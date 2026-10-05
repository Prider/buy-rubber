import axios from 'axios';

let installed = false;

function readToken(): string | null {
  return window.localStorage.getItem('auth_token');
}

function isSameOrigin(input: RequestInfo | URL): boolean {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (raw.startsWith('/')) {
    return true;
  }

  try {
    return new URL(raw, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Send the signed-in user on axios and fetch so edit/delete history has an actor. */
export function attachAuthToAxios(): void {
  if (installed || typeof window === 'undefined') {
    return;
  }

  installed = true;
  axios.interceptors.request.use((config) => {
    const token = readToken();
    if (!token) {
      return config;
    }

    config.headers = config.headers ?? {};
    const headers = config.headers as {
      get?: (name: string) => unknown;
      set?: (name: string, value: string) => void;
      Authorization?: string;
    };
    const existing = typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization;
    if (!existing) {
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const token = readToken();
    if (!token || !isSameOrigin(input)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return originalFetch(input, { ...init, headers });
  };
}
