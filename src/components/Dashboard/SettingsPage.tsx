import React, { useEffect, useMemo, useState } from 'react';
import { 
  Store, CreditCard, Shield, Phone, Mail, 
  Upload, Check, AlertCircle, ChevronRight,
  Lock, User, Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { panelConfigService } from '@/src/services/panelConfigService';
import { authService } from '@/src/services/authService';

export function SettingsPage({ user, onNavigate }: { user?: any; onNavigate?: (tab: string)=>void }) {
  const [notice, setNotice] = useState<{type:'success'|'error', text:string}|null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [planFeatures, setPlanFeatures] = useState<any[]>([]);
  const [accountEmail, setAccountEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState(user?.store_name || '');
  const [subdomain, setSubdomain] = useState(user?.subdomain || '');
  const [description, setDescription] = useState(user?.store_description || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [supportEmail, setSupportEmail] = useState(user?.email || '');

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const res: any = await panelConfigService.getSettings();
      const st = res?.store || {};
      const ct = res?.contact || {};
      const acc = res?.account || {};
      setStoreName(st.name || user?.store_name || '');
      setSubdomain(st.subdomain || user?.subdomain || '');
      setDescription(st.description || '');
      setWhatsapp(ct.whatsapp || '');
      setSupportEmail(ct.support_email || '');
      setAccountEmail(acc.email || user?.email || '');
      setPlanData(res?.plan || null);
      setPlanFeatures(Array.isArray(res?.plan_features) ? res.plan_features : []);
    } catch (e: any) {
      setNotice({ type:'error', text: e.message || 'Erro ao carregar configurações' });
    } finally { setSettingsLoading(false); }
  };

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { if (!notice) return; const t=setTimeout(()=>setNotice(null), 3500); return ()=>clearTimeout(t); }, [notice]);

  const handleSave = async (section: string) => {
    try {
      if (section === 'loja') {
        await panelConfigService.saveStoreInfo({ name: storeName, description, subdomain: subdomain || undefined });
        const updatedUser = { ...(user || {}), store_name: storeName, subdomain, store_description: description };
        authService.saveUser(updatedUser);
        setNotice({ type:'success', text:'Informações da loja salvas com sucesso.' });
      } else if (section === 'contato') {
        await panelConfigService.saveContact({ whatsapp, support_email: supportEmail });
        setNotice({ type:'success', text:'Contato atualizado com sucesso.' });
      } else if (section === 'seguranca') {
        await panelConfigService.updatePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setNotice({ type:'success', text:'Senha atualizada com sucesso.' });
      }
      await loadSettings();
    } catch (e:any) {
      setNotice({ type:'error', text: e.message || 'Erro ao salvar' });
    }
  };

  const planName = (planData?.display_name || planData?.name || user?.plan || 'Plano').toString();
  const planPrice = planData?.price_monthly != null ? Number(planData.price_monthly) : null;

  return (
    <div className="space-y-8 pb-20">
      {notice && <div className={`rounded-xl border px-4 py-3 text-sm ${notice.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{notice.text}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 1) Informações da Loja */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Store className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Informações da Loja</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-[#FF6B00] transition-all overflow-hidden">
                    <img src="https://picsum.photos/seed/logo/200/200" alt="Logo" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input type="file" className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <Upload className="w-4 h-4 text-slate-600" />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nome da Loja</label>
                      <input 
                        type="text" 
                        value={storeName} 
                        onChange={e => setStoreName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Subdomínio</label>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          value={subdomain}
                          onChange={e => setSubdomain(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-l-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]" 
                        />
                        <span className="px-4 py-2 bg-slate-200 border border-l-0 border-slate-200 rounded-r-lg text-sm font-bold text-slate-600">.minhabag.com.br</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição da Loja</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => handleSave('loja')}
                  className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm hover:bg-[#E66000] transition-all shadow-lg shadow-orange-100"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>

          {/* 3) Conta e Segurança */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Conta e Segurança</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email da Conta</label>
                  <input 
                    type="email" 
                    value={accountEmail} 
                    readOnly
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Senha Atual</label>
                  <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="********" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label>
                  <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nova Senha</label>
                  <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleSave('seguranca')}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  Atualizar Senha
                </button>
              </div>
            </div>
          </div>

          {/* 4) Contato */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Contato</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email de Suporte</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={supportEmail}
                      onChange={e => setSupportEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleSave('contato')}
                  className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm hover:bg-[#E66000] transition-all shadow-lg shadow-orange-100"
                >
                  Salvar Contato
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 2) Plano e Assinatura */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Plano Atual</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{planName}</div>
                  <div className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Assinatura Ativa
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{planPrice != null ? `R$ ${planPrice.toFixed(2).replace('.',',')}` : "--"}</div>
                  <div className="text-xs text-slate-500">por mês</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">O que inclui:</div>
                <ul className="space-y-2">
                  {(planFeatures.length ? planFeatures : [{ feature_text: 'Plano configurado no banco' }]).map((feature:any, idx:number) => (
                    <li key={feature.feature_text || idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {feature.feature_text || feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Próxima cobrança:</span>
                  <span className="font-bold text-slate-900">10/03/2024</span>
                </div>
                <button className="w-full py-2.5 bg-[#FF6B00] text-white rounded-xl font-bold text-sm hover:bg-[#E66000] transition-all">
                  Trocar Plano
                </button>
                <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                  Gerenciar Pagamento
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Domínio Próprio</h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Conecte seu próprio domínio (ex: www.sualoja.com.br) para passar mais profissionalismo.
              </p>
              <button className="flex items-center gap-2 text-sm font-bold text-[#FF6B00] hover:underline">
                Configurar Domínio
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
