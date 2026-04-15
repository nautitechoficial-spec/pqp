import * as apiCfg from '@/src/config/api';

const API_BASE = (apiCfg as any).API_BASE || (apiCfg as any).API_BASE_URL || '/api-painel';
const jsonHeaders = { 'Content-Type': 'application/json' };

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem('bagg_user') || localStorage.getItem('user') || localStorage.getItem('currentUser') || sessionStorage.getItem('bagg_user') || sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function storeId() {
  const u:any = getUserFromStorage();
  return Number(u?.store_id || u?.storeId || u?.store?.id || u?.user?.store_id || u?.data?.user?.store_id || 0);
}
async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/${path}`, { ...init, credentials: 'same-origin' });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || data?.success === false) throw new Error(data?.error || 'Erro na requisição');
  return data;
}

function normalizeCollection(c:any){
  const products = Array.isArray(c?.products) ? c.products : [];
  return {
    ...c,
    id: String(c?.id ?? ''),
    name: c?.name ?? c?.title ?? '',
    label: c?.label ?? c?.label_small ?? c?.small_label ?? '',
    subtitle: c?.subtitle ?? '',
    banner: c?.banner ?? c?.banner_image_path ?? '',
    status: (c?.status === 'inactive' ? 'inactive' : 'active'),
    featuredProductId: c?.featuredProductId ?? c?.featured_product_id ? String(c?.featuredProductId ?? c?.featured_product_id) : undefined,
    featuredSlogan: c?.featuredSlogan ?? c?.featured_slogan ?? '',
    featuredDescription: c?.featuredDescription ?? c?.featured_description ?? '',
    benefit1: c?.benefit1 ?? c?.benefit_1 ?? '',
    benefit2: c?.benefit2 ?? c?.benefit_2 ?? '',
    productIds: Array.isArray(c?.productIds) ? c.productIds : products.map((p:any)=> String(p.id)),
    products,
  };
}

function formReq(path:string, form:FormData){ return fetch(`${API_BASE}/${path}`, { method:'POST', body: form, credentials:'same-origin' }).then(async res=>{ const d=await res.json().catch(()=>({})); if(!res.ok||d?.success===false) throw new Error(d?.error||'Erro na requisição'); return d;}); }

export const panelConfigService = {
  getShipping: async () => { const r:any = await req(`shipping.php?store_id=${storeId()}`); const d = r?.data || {}; const svcObj = d?.services || {}; const services = Array.isArray(d?.services) ? d.services : Object.entries(svcObj).map(([k,v])=>({ service_code: String(k).toLowerCase().replace(/ /g,'_'), service_name:k, is_enabled: v ? 1 : 0 })); return { ...r, settings: { shipping_mode: d.shipping_mode==='local_km' ? 'km' : d.shipping_mode, dim_enabled: d.dim_enabled, dim_height_cm: d.dim_height_cm, dim_width_cm: d.dim_width_cm, dim_length_cm: d.dim_length_cm, dim_weight_kg: d.dim_weight_kg, fixed_price: d.fixed_price, fixed_days: d.fixed_days, fixed_free_over_enabled: d.fixed_free_over_enabled, fixed_free_over_amount: d.fixed_free_over_amount, km_origin_cep: d.km_origin_cep, km_price_per_km: d.km_price_per_km, km_max_radius_km: d.km_max_radius_km, km_base_days: d.km_base_days, km_min_fee: d.km_min_fee, km_max_fee: d.km_max_fee, km_extra_days_per_10km: d.km_extra_days_per_10km, origin_cep: d.origin_cep, origin_street: d.origin_street, origin_number: d.origin_number, origin_complement: d.origin_complement, origin_neighborhood: d.origin_neighborhood, origin_city: d.origin_city, origin_state: d.origin_state, origin_contact_name: d.origin_contact_name, origin_email: d.origin_email, origin_phone: d.origin_phone, origin_document: d.origin_document, origin_company_name: d.origin_company_name, me_token: d.melhor_envio_token || d.me_token || '', me_environment: d.melhor_envio_env || d.me_environment || 'sandbox', me_is_default: d.melhor_envio_default ? 1 : 0 }, services, rules: Array.isArray(d?.rules) ? d.rules : [] }; },
  saveShipping: (payload: any, action='save_all') => req(`shipping.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action, payload }) }),
  testShipping: (payload: any) => req(`shipping.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'test_melhor_envio', payload }) }),
  simulateKm: (destCep: string) => req(`shipping.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'simulate_km', payload: { dest_cep: destCep } }) }),
  validateCep: (cep: string) => req(`shipping.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'validate_cep', payload: { cep } }) }),
  addShippingRule: (payload:any) => req(`shipping.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'add_rule', payload }) }),

  getCategories: () => req(`categories_manager.php?store_id=${storeId()}`),
  saveCategoryOrder: (items:any[]) => req(`categories_manager.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'save_order', items }) }),
  deleteCategory: (id:string|number) => req(`categories_manager.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'delete', id }) }),
  previewDeleteCategory: (id:string|number) => req(`categories_manager.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'preview_delete', id }) }),
  reassignAndDeleteCategory: (payload:any) => req(`categories_manager.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'reassign_and_delete', payload }) }),
  saveCategory: (payload:any, imageFile?:File | null) => {
    if (imageFile) {
      const fd = new FormData();
      fd.append('store_id', String(storeId()));
      fd.append('action', payload?.id ? 'update' : 'create');
      fd.append('payload', JSON.stringify(payload || {}));
      fd.append('image', imageFile);
      return formReq('categories_manager.php', fd);
    }
    return req(`categories_manager.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action: payload?.id ? 'update' : 'create', payload }) });
  },

  getCollections: async () => { const r = await req(`collections.php?store_id=${storeId()}`); return { ...r, collections: Array.isArray(r?.collections) ? r.collections.map(normalizeCollection) : [] }; },
  getCollectionProducts: (search='', category='') => req(`collections.php?action=products&store_id=${storeId()}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  getCollectionProductCategories: () => req(`collections.php?action=categories&store_id=${storeId()}`),
  deleteCollection: (id:string|number) => req(`collections.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'delete', id }) }),

  saveCollection: (payload:any) => {
    const fd = new FormData();
    fd.append('store_id', String(storeId()));
    fd.append('action', 'save');
    const clean = { ...payload };
    const bannerFile = clean.bannerFile;
    delete clean.bannerFile;
    fd.append('payload', JSON.stringify(clean));
    if (bannerFile instanceof File) fd.append('bannerFile', bannerFile);
    return formReq('collections.php', fd);
  },

  getSettings: () => req(`settings_store.php?store_id=${storeId()}`),
  saveStoreInfo: (payload:any) => req(`settings_store.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'save_store', ...payload }) }),
  saveContact: (payload:any) => req(`settings_store.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'save_contact', ...payload }) }),
  updatePassword: (payload:any) => req(`settings_store.php`, { method:'POST', headers: jsonHeaders, body: JSON.stringify({ store_id: storeId(), action:'update_password', ...payload }) }),
};
