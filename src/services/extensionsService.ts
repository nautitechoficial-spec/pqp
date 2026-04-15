import * as apiCfg from '@/src/config/api';
import { authService } from './authService';
const API_BASE = (apiCfg as any).API_BASE_URL || '/api-painel';
const headers = { 'Content-Type': 'application/json' };
function storeId(){ const u:any = authService.getUser?.() || {}; return Number(u?.store_id || u?.storeId || 0); }
async function req(path:string, init?:RequestInit){ const r=await fetch(`${API_BASE}/${path}`, { credentials:'same-origin', ...init }); const d=await r.json().catch(()=>({})); if(!r.ok || d?.success===false) throw new Error(d?.error || 'Erro'); return d; }
export const extensionsService = {
  getMarketplaces: () => req(`marketplaces.php?store_id=${storeId()}`),
  getMarketplaceDetail: (provider:string) => req(`marketplaces.php?store_id=${storeId()}&action=detail&provider=${encodeURIComponent(provider)}`),
  saveMarketplace: (payload:any, action='save_connection') => req('marketplaces.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action, payload }) }),
  saveMarketplaceGlobals: (payload:any) => req('marketplaces.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action:'save_global_settings', payload }) }),
  getAffiliatesSummary: (q='') => req(`affiliates.php?store_id=${storeId()}&action=summary&q=${encodeURIComponent(q)}`),
  searchAffiliateCustomers: (q='') => req(`affiliates.php?store_id=${storeId()}&action=customers_search&q=${encodeURIComponent(q)}`),
  createAffiliate: (payload:any) => req('affiliates.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action:'create', payload }) }),
  updateAffiliate: (payload:any) => req('affiliates.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action:'update', payload }) }),
  deleteAffiliate: (id:number|string) => req('affiliates.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action:'delete', payload:{ id } }) }),
  saveAffiliateSettings: (payload:any) => req('affiliates.php', { method:'POST', headers, body: JSON.stringify({ store_id: storeId(), action:'save_settings', payload }) }),
};
