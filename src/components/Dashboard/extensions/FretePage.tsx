import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { panelConfigService } from '@/src/services/panelConfigService';

const onlyDigits = (v:string) => (v || '').replace(/\D+/g, '');
const maskCep = (v:string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
};

export default function FretePage() {
  const [shippingMode, setShippingMode] = useState<'melhor_envio'|'fixo'|'km'>('melhor_envio');
  const [testStatus, setTestStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [notice,setNotice]=useState<{type:'success'|'error',text:string}|null>(null);
  const [cfg,setCfg]=useState<any>({ services:[], rules:[] });
  const [kmDestCep, setKmDestCep] = useState('');
  const [kmPreview, setKmPreview] = useState<any>(null);
  const [kmLoading, setKmLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const load=async()=>{
    try{
      const r=await panelConfigService.getShipping();
      const s=r.settings||{};
      setCfg({ ...s, services:r.services||[], rules:r.rules||[] });
      if(s.shipping_mode) setShippingMode(s.shipping_mode);
    }catch(e:any){ setNotice({type:'error',text:e.message||'Erro ao carregar frete'}); }
  };

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(!notice) return; const t=setTimeout(()=>setNotice(null),4000); return ()=>clearTimeout(t); },[notice]);

  const save=async(action:string,payload:any)=>{
    try{ await panelConfigService.saveShipping(payload, action); setNotice({type:'success',text:'Salvo com sucesso.'}); await load(); }
    catch(e:any){ setNotice({type:'error',text:e.message||'Erro ao salvar'}); }
  };

  const toggleService = (serviceName:string, checked:boolean) => {
    const code = serviceName.toLowerCase().replace(/ /g,'_');
    const current = Array.isArray(cfg.services) ? [...cfg.services] : [];
    const idx = current.findIndex((x:any)=>String(x.service_code||'')===code || String(x.service_name||'')===serviceName);
    const nextItem = { service_code: code, service_name: serviceName, is_enabled: checked ? 1 : 0 };
    if (idx >= 0) current[idx] = { ...current[idx], ...nextItem };
    else current.push(nextItem);
    setCfg({ ...cfg, services: current });
  };

  const serviceEnabled = (serviceName:string) => {
    const code = serviceName.toLowerCase().replace(/ /g,'_');
    const found = (cfg.services||[]).find((x:any)=>String(x.service_code||'')===code || String(x.service_name||'')===serviceName);
    return !!Number(found?.is_enabled || 0);
  };

  const applyCep = async (cepValue: string) => {
    const cep = maskCep(cepValue);
    if (onlyDigits(cep).length !== 8) {
      setNotice({ type:'error', text:'CEP precisa ter 8 dígitos.' });
      return;
    }
    setCepLoading(true);
    try {
      const r:any = await panelConfigService.validateCep(cep);
      const d = r?.data || {};
      setCfg((prev:any) => ({
        ...prev,
        origin_cep: d.cep || cep,
        km_origin_cep: d.cep || cep,
        origin_street: prev.origin_street || d.street || '',
        origin_complement: prev.origin_complement || d.complement || '',
        origin_neighborhood: prev.origin_neighborhood || d.neighborhood || '',
        origin_city: prev.origin_city || d.city || '',
        origin_state: prev.origin_state || d.state || '',
      }));
      setNotice({ type:'success', text:'CEP validado com sucesso.' });
    } catch (e:any) {
      setNotice({ type:'error', text:e.message || 'CEP inválido.' });
    } finally {
      setCepLoading(false);
    }
  };

  const simulateKm = async () => {
    if (onlyDigits(kmDestCep).length !== 8) {
      setNotice({ type:'error', text:'Digite um CEP de destino válido para simular.' });
      return;
    }
    setKmLoading(true);
    setKmPreview(null);
    try {
      const r:any = await panelConfigService.simulateKm(kmDestCep);
      setKmPreview(r);
    } catch (e:any) {
      setNotice({ type:'error', text:e.message || 'Erro ao simular entrega local.' });
    } finally {
      setKmLoading(false);
    }
  };

  const originPayload = useMemo(() => ({
    origin_cep: cfg.origin_cep || cfg.km_origin_cep || '',
    origin_street: cfg.origin_street || '',
    origin_number: cfg.origin_number || '',
    origin_complement: cfg.origin_complement || '',
    origin_neighborhood: cfg.origin_neighborhood || '',
    origin_city: cfg.origin_city || '',
    origin_state: cfg.origin_state || '',
    origin_contact_name: cfg.origin_contact_name || '',
    origin_email: cfg.origin_email || '',
    origin_phone: cfg.origin_phone || '',
    origin_document: cfg.origin_document || '',
    origin_company_name: cfg.origin_company_name || '',
  }), [cfg]);

  const inputCls = 'w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm';

  return (
    <div className="space-y-8 pb-20">
      {notice && <div className={clsx('rounded-xl border px-4 py-3 text-sm',notice.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700')}>{notice.text}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Modo de Frete</h2></div>
            <div className="p-6 space-y-4">
              {[{id:'melhor_envio',label:'Melhor Envio (Integração)',desc:'Cotação em tempo real e geração real de etiquetas.'},{id:'fixo',label:'Frete Fixo',desc:'Valor único para toda compra.'},{id:'km',label:'Entrega por Nós (KM)',desc:'Entrega local baseada na distância real por CEP.'}].map(m=>(
                <label key={m.id} className={clsx('flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',shippingMode===m.id?'border-[#FF6B00] bg-orange-50/30':'border-slate-100 hover:border-slate-200')}>
                  <input type="radio" checked={shippingMode===m.id} onChange={()=>{setShippingMode(m.id as any); save('save_mode',{shipping_mode:m.id});}} className="mt-1 accent-[#FF6B00]" />
                  <div><div className="font-bold text-slate-900">{m.label}</div><div className="text-sm text-slate-500">{m.desc}</div></div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Origem da Loja</h2>
                <p className="text-sm text-slate-500">Essa origem é usada no Melhor Envio, na etiqueta e também como base para entrega por KM.</p>
              </div>
              <button onClick={() => applyCep(cfg.origin_cep || cfg.km_origin_cep || '')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2" type="button">
                {cepLoading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                Validar CEP
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-bold">CEP de origem</label><input value={cfg.origin_cep || ''} onChange={e=>setCfg({...cfg, origin_cep: maskCep(e.target.value), km_origin_cep: maskCep(e.target.value)})} onBlur={e=>{ if(onlyDigits(e.target.value).length===8) applyCep(e.target.value); }} placeholder="00000-000" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Número</label><input value={cfg.origin_number || ''} onChange={e=>setCfg({...cfg, origin_number: e.target.value})} placeholder="123" className={inputCls} /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold">Rua</label><input value={cfg.origin_street || ''} onChange={e=>setCfg({...cfg, origin_street: e.target.value})} placeholder="Rua da loja" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Bairro</label><input value={cfg.origin_neighborhood || ''} onChange={e=>setCfg({...cfg, origin_neighborhood: e.target.value})} placeholder="Bairro" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Complemento</label><input value={cfg.origin_complement || ''} onChange={e=>setCfg({...cfg, origin_complement: e.target.value})} placeholder="Complemento" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Cidade</label><input value={cfg.origin_city || ''} onChange={e=>setCfg({...cfg, origin_city: e.target.value})} placeholder="Cidade" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">UF</label><input value={cfg.origin_state || ''} maxLength={2} onChange={e=>setCfg({...cfg, origin_state: e.target.value.toUpperCase()})} placeholder="ES" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Nome da loja/remetente</label><input value={cfg.origin_company_name || ''} onChange={e=>setCfg({...cfg, origin_company_name: e.target.value})} placeholder="Minha loja" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Responsável</label><input value={cfg.origin_contact_name || ''} onChange={e=>setCfg({...cfg, origin_contact_name: e.target.value})} placeholder="Nome do responsável" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">Telefone</label><input value={cfg.origin_phone || ''} onChange={e=>setCfg({...cfg, origin_phone: e.target.value})} placeholder="27999999999" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">E-mail</label><input value={cfg.origin_email || ''} onChange={e=>setCfg({...cfg, origin_email: e.target.value})} placeholder="contato@loja.com" className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-bold">CPF/CNPJ</label><input value={cfg.origin_document || ''} onChange={e=>setCfg({...cfg, origin_document: e.target.value})} placeholder="Documento do remetente" className={inputCls} /></div>
              </div>
            </div>
          </div>

          {shippingMode==='melhor_envio' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Configurações do Melhor Envio</h2></div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Access Token (Bearer)</label>
                    <input type="password" value={cfg.me_token||''} onChange={e=>setCfg({...cfg,me_token:e.target.value})} placeholder="Cole o access token do Melhor Envio" className={inputCls} />
                    <p className="text-xs text-slate-500">Esse campo usa o token de acesso. Client ID e Secret não funcionam sozinhos aqui.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Ambiente</label>
                    <div className="flex items-center gap-4 h-10">
                      <span className="text-sm text-slate-500">Sandbox</span>
                      <button onClick={()=>setCfg({...cfg,me_environment:(cfg.me_environment==='production'?'sandbox':'production')})} className={clsx('w-12 h-6 rounded-full relative transition-colors', (cfg.me_environment||'sandbox')==='production'?'bg-[#FF6B00]':'bg-slate-300')}>
                        <div className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm', (cfg.me_environment||'sandbox')==='production'?'right-1':'left-1')} />
                      </button>
                      <span className="text-sm font-bold text-slate-900">Produção</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Serviços habilitados no checkout</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['PAC','SEDEX','Jadlog','Azul Cargo'].map(n=>(
                      <label key={n} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer">
                        <input type="checkbox" checked={serviceEnabled(n)} onChange={e=>toggleService(n,e.target.checked)} className="accent-[#FF6B00]" />
                        <span className="text-sm font-medium text-slate-700">{n}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                  Para funcionar direito, você precisa de: access token válido, origem completa da loja e serviços habilitados. O checkout da loja usa isso para cotar em tempo real e o painel usa isso para gerar etiqueta real.
                </div>

                <div className="flex gap-4 pt-2 flex-wrap">
                  <button onClick={async()=>{ setTestStatus('loading'); try{ await panelConfigService.testShipping({ me_token:cfg.me_token, me_environment:cfg.me_environment, ...originPayload }); setTestStatus('success'); setNotice({type:'success',text:'Conexão real validada com sucesso.'}); }catch(e:any){ setTestStatus('error'); setNotice({type:'error',text:e.message||'Erro no teste'});} }} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-2">
                    {testStatus==='loading'?<div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>:testStatus==='success'?<CheckCircle2 className="w-4 h-4 text-emerald-500"/>:testStatus==='error'?<AlertCircle className="w-4 h-4 text-red-500"/>:null}
                    Testar conexão
                  </button>
                  <button onClick={()=>save('save_melhor_envio',{ me_token:cfg.me_token||'', me_environment:cfg.me_environment||'sandbox', me_is_default:true, services:cfg.services||[], ...originPayload })} className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm">Salvar configurações</button>
                </div>
              </div>
            </div>
          )}

          {shippingMode==='fixo' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Configurações de Frete Fixo</h2></div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-bold">Valor do Frete (R$)</label><input type="number" value={cfg.fixed_price ?? ''} onChange={e=>setCfg({...cfg,fixed_price:e.target.value})} placeholder="0,00" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Prazo Estimado (dias)</label><input type="number" value={cfg.fixed_days ?? ''} onChange={e=>setCfg({...cfg,fixed_days:e.target.value})} placeholder="Ex: 5" className={inputCls} /></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                  <div className="flex-1"><div className="text-sm font-bold">Frete grátis acima de X</div><div className="text-xs text-slate-500">Se o subtotal atingir o valor mínimo, o checkout zera o frete fixo.</div></div>
                  <div className="flex items-center gap-4">
                    <input type="number" value={cfg.fixed_free_over_amount ?? ''} onChange={e=>setCfg({...cfg,fixed_free_over_amount:e.target.value})} placeholder="R$ 0,00" className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm" />
                    <button onClick={()=>setCfg({...cfg,fixed_free_over_enabled:!cfg.fixed_free_over_enabled})} className={clsx('w-10 h-5 rounded-full relative', cfg.fixed_free_over_enabled?'bg-[#FF6B00]':'bg-slate-200')}><div className={clsx('absolute top-1 w-3 h-3 bg-white rounded-full', cfg.fixed_free_over_enabled?'right-1':'left-1')} /></button>
                  </div>
                </div>
                <button onClick={()=>save('save_fixed',{ fixed_price:cfg.fixed_price||'', fixed_days:cfg.fixed_days||'', fixed_free_over_enabled:!!cfg.fixed_free_over_enabled, fixed_free_over_amount:cfg.fixed_free_over_amount||'' })} className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm">Salvar frete fixo</button>
              </div>
            </div>
          )}

          {shippingMode==='km' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Entrega por Nós (KM)</h2></div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-bold">CEP Principal (Origem)</label><input type="text" value={cfg.km_origin_cep||cfg.origin_cep||''} onChange={e=>setCfg({...cfg,km_origin_cep:maskCep(e.target.value), origin_cep:maskCep(e.target.value)})} onBlur={e=>{ if(onlyDigits(e.target.value).length===8) applyCep(e.target.value); }} placeholder="00000-000" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Preço por KM (R$)</label><input type="number" value={cfg.km_price_per_km||''} onChange={e=>setCfg({...cfg,km_price_per_km:e.target.value})} placeholder="2,50" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Raio máximo (KM)</label><input type="number" value={cfg.km_max_radius_km||''} onChange={e=>setCfg({...cfg,km_max_radius_km:e.target.value})} placeholder="50" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Prazo base (dias)</label><input type="number" value={cfg.km_base_days||''} onChange={e=>setCfg({...cfg,km_base_days:e.target.value})} placeholder="1" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Taxa mínima (R$)</label><input type="number" value={cfg.km_min_fee||''} onChange={e=>setCfg({...cfg,km_min_fee:e.target.value})} placeholder="0,00" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Taxa máxima (R$)</label><input type="number" value={cfg.km_max_fee||''} onChange={e=>setCfg({...cfg,km_max_fee:e.target.value})} placeholder="0,00" className={inputCls} /></div>
                  <div className="space-y-2"><label className="text-sm font-bold">Dias extras por cada 10 KM</label><input type="number" value={cfg.km_extra_days_per_10km||''} onChange={e=>setCfg({...cfg,km_extra_days_per_10km:e.target.value})} placeholder="0" className={inputCls} /></div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-slate-50">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Simular cálculo</div>
                    <div className="text-xs text-slate-500">Use um CEP real de destino. O sistema valida o CEP, mede a distância aproximada e aplica seu raio, valor por KM e prazo.</div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input type="text" value={kmDestCep} onChange={e=>setKmDestCep(maskCep(e.target.value))} placeholder="CEP destino" className={inputCls} />
                    <button onClick={simulateKm} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">{kmLoading ? 'Calculando...' : 'Calcular'}</button>
                  </div>
                  {kmPreview?.success && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-slate-500 text-xs">Distância</div><div className="font-black text-slate-900">{Number(kmPreview.distance_km || 0).toFixed(2)} KM</div></div>
                      <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-slate-500 text-xs">Frete</div><div className="font-black text-slate-900">R$ {Number(kmPreview.price || 0).toFixed(2)}</div></div>
                      <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-slate-500 text-xs">Prazo</div><div className="font-black text-slate-900">{kmPreview.days || 0} dia(s)</div></div>
                    </div>
                  )}
                </div>
                <button onClick={()=>save('save_km',{ km_origin_cep:cfg.km_origin_cep||cfg.origin_cep||'', km_price_per_km:cfg.km_price_per_km||'', km_max_radius_km:cfg.km_max_radius_km||'', km_base_days:cfg.km_base_days||'', km_min_fee:cfg.km_min_fee||'', km_max_fee:cfg.km_max_fee||'', km_extra_days_per_10km:cfg.km_extra_days_per_10km||'', ...originPayload })} className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm">Salvar entrega por KM</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Dimensões Padrão</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500">ALTURA (CM)</label><input type="number" value={cfg.dim_height_cm ?? ''} onChange={e=>setCfg({...cfg,dim_height_cm:e.target.value})} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500">LARGURA (CM)</label><input type="number" value={cfg.dim_width_cm ?? ''} onChange={e=>setCfg({...cfg,dim_width_cm:e.target.value})} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500">COMPRIMENTO (CM)</label><input type="number" value={cfg.dim_length_cm ?? ''} onChange={e=>setCfg({...cfg,dim_length_cm:e.target.value})} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500">PESO (KG)</label><input type="number" value={cfg.dim_weight_kg ?? ''} onChange={e=>setCfg({...cfg,dim_weight_kg:e.target.value})} className={inputCls} /></div>
              </div>
              <button onClick={()=>save('save_dimensions',{ dim_enabled:true, dim_height_cm:cfg.dim_height_cm||'', dim_width_cm:cfg.dim_width_cm||'', dim_length_cm:cfg.dim_length_cm||'', dim_weight_kg:cfg.dim_weight_kg||'' })} className="w-full px-6 py-2.5 bg-[#0A1B57] text-white rounded-xl font-bold text-sm">Aplicar Dimensões</button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 space-y-2">
            <div className="font-black">Dica rápida</div>
            <p>No Melhor Envio, a etiqueta real depende de token válido, origem completa da loja, dimensões/peso e serviço de frete realmente selecionado no checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
