import { API_BASE_URL } from '../config/api';

export type PlatformAffiliateContext = {
  id?: number;
  slug: string;
  name?: string;
  manager_id?: number;
  team_id?: number;
  session_id?: string;
  click_id?: number;
  tracked_at?: string;
};

const STORAGE_KEY = 'mbg_platform_affiliate';
const SESSION_KEY = 'mbg_platform_affiliate_session';
const RESERVED = new Set(['', 'login', 'register', 'painel', 'equipe', 'loja', 'api-painel', 'assets', 'favicon.ico', 'robots.txt', 'site.webmanifest']);

export function getAffiliateSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function readStoredAffiliate(): PlatformAffiliateContext | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.slug ? parsed : null;
  } catch {
    return null;
  }
}

export function storeAffiliate(ctx: PlatformAffiliateContext | null) {
  if (!ctx?.slug) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

export function resolveAffiliateSlugFromLocation(locationLike: Location = window.location): string | null {
  const params = new URLSearchParams(locationLike.search || '');
  const paramSlug = params.get('ref') || params.get('affiliate') || params.get('affiliate_slug') || params.get('slug');
  if (paramSlug && paramSlug.trim()) return paramSlug.trim().toLowerCase();

  const path = (locationLike.pathname || '/').replace(/^\/+|\/+$/g, '');
  if (!path || path.includes('/')) return null;
  if (RESERVED.has(path.toLowerCase())) return null;
  return path.toLowerCase();
}

export async function trackAffiliateVisit(): Promise<PlatformAffiliateContext | null> {
  if (typeof window === 'undefined') return null;
  const slug = resolveAffiliateSlugFromLocation();
  const sessionId = getAffiliateSessionId();

  if (!slug) {
    return readStoredAffiliate();
  }

  const response = await fetch(`${API_BASE_URL}/platform_affiliate_track.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      session_id: sessionId,
      landing_path: window.location.pathname || '/',
      referrer_url: document.referrer || '',
      page_url: window.location.href,
      device_language: navigator.language || '',
      device_platform: navigator.platform || '',
      user_agent: navigator.userAgent || ''
    })
  });

  const data = await response.json();
  if (!data?.success || !data?.affiliate?.slug) {
    return readStoredAffiliate();
  }

  const context: PlatformAffiliateContext = {
    ...data.affiliate,
    session_id: sessionId,
    click_id: data.click_id,
    tracked_at: new Date().toISOString(),
  };
  storeAffiliate(context);
  return context;
}
