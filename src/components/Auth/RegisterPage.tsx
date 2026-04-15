import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Baby,
  Briefcase,
  Car,
  Check,
  CheckCircle2,
  Circle,
  Cpu,
  Eye,
  EyeOff,
  Gem,
  Globe,
  HeartPulse,
  Home,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  PenTool,
  Rocket,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Trophy,
  User,
  IdCard,
  Utensils,
  Watch,
  Dog,
  Gift,
} from "lucide-react";
import { authService } from "@/src/services/authService";
import { cn } from "@/src/lib/utils";
import { readStoredAffiliate } from "@/src/lib/platformAffiliate";

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const sanitizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-+/g, "-");
const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};
const maskPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
const maskCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type SubdomainStatus = "idle" | "checking" | "available" | "unavailable";
type ThemeId = "orange" | "black" | "blue" | "pink";

const SEGMENTS = [
  { id: "moda", label: "Moda", icon: Shirt },
  { id: "acessorios", label: "Acessórios", icon: Watch },
  { id: "eletronicos", label: "Eletrônicos", icon: Smartphone },
  { id: "beleza", label: "Beleza e cosméticos", icon: Sparkles },
  { id: "alimentacao", label: "Alimentação", icon: Utensils },
  { id: "casa", label: "Casa e decoração", icon: Home },
  { id: "saude", label: "Saúde e bem-estar", icon: HeartPulse },
  { id: "esportes", label: "Esportes", icon: Trophy },
  { id: "infantil", label: "Infantil", icon: Baby },
  { id: "pet", label: "Pet shop", icon: Dog },
  { id: "papelaria", label: "Papelaria", icon: PenTool },
  { id: "joias", label: "Joias e semijoias", icon: Gem },
  { id: "automotivo", label: "Automotivo", icon: Car },
  { id: "presentes", label: "Presentes", icon: Gift },
  { id: "tecnologia", label: "Tecnologia", icon: Cpu },
  { id: "servicos", label: "Serviços", icon: Briefcase },
  { id: "outros", label: "Outros", icon: MoreHorizontal },
];

const THEMES: { id: ThemeId; label: string; accent: string; bar: string; bg: string }[] = [
  { id: "orange", label: "Laranja", accent: "bg-[#FF6321]", bar: "bg-orange-200", bg: "from-orange-50 to-orange-100/80" },
  { id: "black", label: "Preto", accent: "bg-neutral-800", bar: "bg-neutral-300", bg: "from-neutral-50 to-neutral-200/80" },
  { id: "blue", label: "Azul", accent: "bg-blue-600", bar: "bg-blue-200", bg: "from-blue-50 to-blue-100/80" },
  { id: "pink", label: "Rosa", accent: "bg-pink-500", bar: "bg-pink-200", bg: "from-pink-50 to-pink-100/80" },
];

const GOALS = [
  { id: "local", title: "Vender na minha região", icon: Store },
  { id: "national", title: "Escalar para todo o Brasil", icon: Rocket },
];

const STAGES = [
  { id: "beginner", title: "Iniciante", message: "Começando do zero com estrutura profissional." },
  { id: "migrating", title: "Migrando operação", message: "Conte rapidamente como funciona hoje." },
  { id: "physical", title: "Loja física", message: "Leve sua operação física para o digital." },
];

const pwdStrength = (pwd: string) => {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, label: score <= 1 ? "Fraca" : score <= 3 ? "Média" : "Forte" };
};

function ProgressBar({ step, total = 9 }: { step: number; total?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        <span>Cadastro</span>
        <span>{step}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#FF6321] transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function SuccessOverlay({
  isOpen,
  storeName,
  storeUrl,
  onDashboard,
  onStore,
}: {
  isOpen: boolean;
  storeName: string;
  storeUrl: string;
  onDashboard: () => void;
  onStore: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-[2px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-10%] h-3 w-2 rounded-full animate-[fall_3.4s_linear_infinite]"
            style={{
              left: `${(i * 97) % 100}%`,
              animationDelay: `${(i % 9) * 0.15}s`,
              background: ["#FF6321", "#0EA5E9", "#22C55E", "#F472B6", "#111827"][i % 5],
              transform: `rotate(${(i * 37) % 360}deg)`,
            }}
          />
        ))}
      </div>
      <div className="relative w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1E9] text-[#FF6321]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6321]">Loja criada com sucesso</p>
          <h3 className="mt-2 text-3xl font-black text-neutral-950">Parabéns, {storeName || "sua loja"}!</h3>
          <p className="mt-3 text-sm text-neutral-500 sm:text-base">Seu cadastro foi concluído. Agora você pode entrar no painel ou abrir a sua loja.</p>
          <p className="mt-3 truncate text-sm font-bold text-neutral-700">{storeUrl}</p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button onClick={onDashboard} className="rounded-2xl bg-[#FF6321] px-5 py-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,99,33,0.28)] transition hover:brightness-95">Ir para o painel</button>
          <button onClick={onStore} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-900 transition hover:bg-neutral-50">Ver minha loja</button>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ onBack, onSuccess, initialPlanId, affiliateContext }: { onBack: () => void; onSuccess: (userData: any) => void; initialPlanId?: number; affiliateContext?: any }) {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubdomainManual, setIsSubdomainManual] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");
  const [addressLoading, setAddressLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    plan_id: initialPlanId || 1,
    storeName: "",
    subdomain: "",
    segment: "",
    theme: "orange" as ThemeId,
    salesScope: "",
    currentPlatform: "",
    isNewBusiness: "",
    adminName: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
    withoutNumber: false,
  });

  const storeNameRef = useRef<HTMLInputElement>(null);
  const subdomainRef = useRef<HTMLInputElement>(null);
  const adminNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const complementRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);

  const keepViewportStable = () => {
    if (typeof window === "undefined") return;
    const y = lastScrollYRef.current || window.scrollY || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
    });
  };

  useEffect(() => {
    if (formData.storeName && !isSubdomainManual) {
      setFormData((prev) => ({ ...prev, subdomain: sanitizeSubdomain(prev.storeName) }));
    }
  }, [formData.storeName, isSubdomainManual]);

  useEffect(() => {
    const sub = sanitizeSubdomain(formData.subdomain);
    if (!sub || sub.length < 3) {
      setSubdomainStatus("idle");
      return;
    }
    let isMounted = true;
    setSubdomainStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkSubdomain(sub);
        if (!isMounted) return;
        setSubdomainStatus(res.available ? "available" : "unavailable");
      } catch {
        if (!isMounted) return;
        setSubdomainStatus("idle");
      }
    }, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.subdomain]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const top = stepCardRef.current?.getBoundingClientRect().top ?? 0;
    const target = Math.max(0, window.scrollY + top - 20);
    requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: "auto" });
    });
  }, [step]);

  const title = useMemo(
    () =>
      ({
        1: ["Qual é o nome da", "sua marca?"],
        2: ["Escolha seu", "endereço exclusivo"],
        3: ["Selecione o", "segmento da loja"],
        4: ["Escolha seu", "estilo visual"],
        5: ["Qual é o", "seu objetivo?"],
        6: ["Qual seu", "estágio atual?"],
        7: ["Quem será o", "responsável?"],
        8: ["Onde sua loja", "está localizada?"],
        9: ["Crie uma", "senha segura"],
      } as Record<Step, [string, string]>),
    []
  );

  const pwd = pwdStrength(formData.password);
  const effectiveAffiliate = affiliateContext || readStoredAffiliate();
  const selectedPlanLabel = Number(formData.plan_id || initialPlanId || 0) === 2 ? "Growth" : Number(formData.plan_id || initialPlanId || 0) === 3 ? "Pro" : Number(formData.plan_id || initialPlanId || 0) === 1 ? "Start" : `Plano ${formData.plan_id || initialPlanId || ""}`;
  const detectedAddress = !!formData.street && !!formData.city && !!formData.state;

  const canAdvance = () => {
    switch (step) {
      case 1:
        return !!formData.storeName.trim();
      case 2:
        return !!formData.subdomain.trim() && subdomainStatus === "available";
      case 3:
        return !!formData.segment;
      case 4:
        return !!formData.theme;
      case 5:
        return !!formData.salesScope;
      case 6:
        return !!formData.isNewBusiness && (formData.isNewBusiness !== "migrating" || !!formData.currentPlatform.trim());
      case 7:
        return !!formData.adminName.trim() && !!formData.email.trim() && onlyDigits(formData.phone).length >= 10 && onlyDigits(formData.cpf).length === 11;
      case 8:
        return onlyDigits(formData.cep).length === 8 && detectedAddress && (formData.withoutNumber || !!formData.number.trim());
      case 9:
        return !!formData.password && pwd.score === 4 && formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const fetchAddressByCep = async (cepValue: string) => {
    const cep = onlyDigits(cepValue);
    if (cep.length !== 8) return;
    setAddressLoading(true);
    setCepError(null);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (data?.erro) {
        setCepError("CEP não identificado");
        setShowAddressDetails(false);
        setFormData((prev) => ({ ...prev, street: "", neighborhood: "", city: "", state: "" }));
        return;
      }
      setShowAddressDetails(true);
      setFormData((prev) => ({
        ...prev,
        cep: maskCEP(cep),
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: (data.uf || "").toUpperCase(),
        complement: prev.complement || data.complemento || "",
      }));
    } catch {
      setCepError("CEP não identificado");
      setShowAddressDetails(false);
    } finally {
      setAddressLoading(false);
    }
  };

  const goNext = () => {
    if (!canAdvance()) return;
    setStep((prev) => Math.min(prev + 1, 9) as Step);
  };
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1) as Step);

  const handleFinish = async () => {
    if (!canAdvance()) return;
    try {
      setIsLoading(true);
      setError(null);
      const payload = {
        ...formData,
        hasOnlineStore: formData.isNewBusiness === "beginner" ? "no" : "yes",
        number: formData.withoutNumber ? "S/N" : formData.number,
        platform_affiliate_slug: effectiveAffiliate?.slug || null,
        platform_affiliate_id: effectiveAffiliate?.id || null,
        platform_affiliate_manager_id: effectiveAffiliate?.manager_id || null,
        platform_affiliate_team_id: effectiveAffiliate?.team_id || null,
        platform_affiliate_click_id: effectiveAffiliate?.click_id || null,
        platform_affiliate_session_id: effectiveAffiliate?.session_id || null,
      };
      const response = await authService.register(payload);
      if (response.success) {
        authService.saveUser(response.user);
        setCreatedUser(response.user);
        onSuccess(response.user);
      } else {
        setError(response.error || "Erro ao realizar cadastro.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent, next?: () => void) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    next?.();
  };

  const desktopFooterCentered = step === 1;
  const progressStoreUrl = formData.subdomain ? `${formData.subdomain}.minhabagg.com.br` : "seudominio.minhabagg.com.br";

  const StepTitle = ({ stepKey }: { stepKey: Step }) => (
    <div className="space-y-1.5 sm:space-y-2">
      <h2 className="text-[1.9rem] leading-[0.96] sm:text-[2.35rem] md:text-[2.8rem] font-black tracking-tight text-neutral-900">
        {title[stepKey][0]}
        <br />
        <span className="text-[#FF6321]">{title[stepKey][1]}</span>
      </h2>
    </div>
  );

  const affiliateBanner = effectiveAffiliate?.slug ? (
    <div className="rounded-[1.4rem] border border-[#FFD6C4] bg-[#FFF7F2] px-4 py-3 text-sm text-[#8A3A14]">
      <div className="font-bold">Vendedor: {effectiveAffiliate?.name || effectiveAffiliate?.slug}</div>
      <div className="text-[#B45309]">@{effectiveAffiliate?.slug}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Plano selecionado: {selectedPlanLabel}</div>
    </div>
  ) : null;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={1} />
            <p className="text-sm sm:text-base text-neutral-500">Comece dando uma identidade para sua loja.</p>
            <div className="relative">
              <input
                ref={storeNameRef}
                type="text"
                placeholder="Ex: Minha Bag Store"
                value={formData.storeName}
                onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }}
                onChange={(e) => setFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                onKeyDown={(e) => onInputKeyDown(e, goNext)}
                className="w-full rounded-[1.4rem] border border-[#FF6321] bg-white px-5 py-4 text-base font-black outline-none sm:text-lg"
              />
              {formData.storeName && <CheckCircle2 className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#FF6321]" />}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={2} />
            <p className="text-sm sm:text-base text-neutral-500">Este será o link da sua loja na internet.</p>
            <div className="space-y-3">
              <div className="flex items-center rounded-[1.4rem] border border-neutral-200 bg-white px-4 py-3.5 focus-within:border-[#FF6321]">
                <input
                  ref={subdomainRef}
                  type="text"
                  value={formData.subdomain}
                  onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }}
                  onChange={(e) => {
                    setIsSubdomainManual(true);
                    setFormData((prev) => ({ ...prev, subdomain: sanitizeSubdomain(e.target.value) }));
                  }}
                  onKeyDown={(e) => onInputKeyDown(e, goNext)}
                  className="min-w-0 flex-1 bg-transparent text-base font-black outline-none"
                />
                <span className="max-w-[42%] truncate pl-2 text-sm font-bold text-neutral-400 sm:max-w-none sm:text-base">.minhabagg.com.br</span>
              </div>
              <div className="min-h-5 text-sm font-bold">
                {subdomainStatus === "checking" && <span className="inline-flex items-center gap-2 text-neutral-400"><Loader2 className="h-4 w-4 animate-spin" />Verificando disponibilidade...</span>}
                {subdomainStatus === "available" && <span className="inline-flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" />Disponível para usar</span>}
                {subdomainStatus === "unavailable" && <span className="inline-flex items-center gap-2 text-red-500"><AlertCircle className="h-4 w-4" />Esse endereço já está em uso</span>}
                {subdomainStatus === "idle" && <span className="text-neutral-400">Use pelo menos 3 caracteres</span>}
              </div>
              {formData.subdomain && (
                <div className="rounded-[1.35rem] border border-[#FFE0D1] bg-[#FFF7F2] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#FF6321] shadow-sm"><Globe className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FF6321]">Preview da loja</p>
                      <p className="mt-1 truncate text-sm font-black text-neutral-900">{progressStoreUrl}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={3} />
            <p className="text-sm sm:text-base text-neutral-500">Isso ajuda a deixar a configuração inicial mais certeira.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {SEGMENTS.map((segment) => {
                const Icon = segment.icon;
                const selected = formData.segment === segment.id;
                return (
                  <button
                    key={segment.id}
                    onClick={() => setFormData((prev) => ({ ...prev, segment: segment.id }))}
                    onKeyDown={(e) => onInputKeyDown(e, goNext)}
                    className={cn(
                      "rounded-[1.25rem] border p-3 text-left transition-all",
                      selected ? "border-[#FF6321] bg-[#FFF7F2]" : "border-neutral-200 bg-white"
                    )}
                  >
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", selected ? "bg-[#FF6321] text-white" : "bg-neutral-100 text-neutral-500")}><Icon className="h-5 w-5" /></div>
                    <p className="text-sm font-black leading-tight text-neutral-900 sm:text-[15px]">{segment.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={4} />
            <p className="text-sm sm:text-base text-neutral-500">Você poderá mudar tudo depois, mas vamos começar com um tema.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {THEMES.map((theme) => {
                const selected = formData.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setFormData((prev) => ({ ...prev, theme: theme.id }))}
                    onKeyDown={(e) => onInputKeyDown(e, goNext)}
                    className={cn(
                      "rounded-[1.5rem] border bg-gradient-to-b p-3 text-left transition-all",
                      theme.bg,
                      selected ? "border-[#FF6321] shadow-[0_10px_24px_rgba(255,99,33,0.12)]" : "border-neutral-200"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={cn("h-6 w-16 rounded-full", theme.bar)} />
                      {selected ? <CheckCircle2 className="h-5 w-5 text-[#FF6321]" /> : <Circle className="h-5 w-5 text-neutral-300" />}
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="h-12 rounded-2xl border border-black/5 bg-white/80" />
                      <div className="h-12 rounded-2xl border border-black/5 bg-white/70" />
                    </div>
                    <div className={cn("mb-2 h-9 rounded-2xl", theme.accent)} />
                    <p className="text-center text-sm font-black text-neutral-900 sm:text-base">{theme.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={5} />
            <p className="text-sm sm:text-base text-neutral-500">Assim conseguimos preparar a loja no foco certo.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {GOALS.map((goal) => {
                const Icon = goal.icon;
                const selected = formData.salesScope === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setFormData((prev) => ({ ...prev, salesScope: goal.id }))}
                    onKeyDown={(e) => onInputKeyDown(e, goNext)}
                    className={cn("rounded-[1.5rem] border p-4 text-left transition-all", selected ? "border-[#FF6321] bg-[#FFF7F2]" : "border-neutral-200 bg-white")}
                  >
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", selected ? "bg-[#FF6321] text-white" : "bg-neutral-100 text-neutral-500")}><Icon className="h-5 w-5" /></div>
                    <p className="text-base font-black text-neutral-900 sm:text-lg">{goal.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={6} />
            <p className="text-sm sm:text-base text-neutral-500">Personalizamos sua experiência com base nisso.</p>
            <div className="space-y-3">
              {STAGES.map((stage) => {
                const selected = formData.isNewBusiness === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setFormData((prev) => ({ ...prev, isNewBusiness: stage.id }))}
                    onKeyDown={(e) => onInputKeyDown(e, goNext)}
                    className={cn("w-full rounded-[1.4rem] border p-4 text-left transition-all", selected ? "border-[#FF6321] bg-[#FFF7F2]" : "border-neutral-200 bg-white")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-neutral-900 sm:text-lg">{stage.title}</p>
                        <p className="mt-1 text-sm text-neutral-500">{stage.message}</p>
                      </div>
                      {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FF6321]" /> : <Circle className="h-5 w-5 shrink-0 text-neutral-300" />}
                    </div>
                  </button>
                );
              })}
              {formData.isNewBusiness === "migrating" && (
                <textarea
                  value={formData.currentPlatform}
                  onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currentPlatform: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      goNext();
                    }
                  }}
                  placeholder="Conte rapidamente como funciona hoje..."
                  className="min-h-24 w-full rounded-[1.4rem] border border-neutral-200 bg-white px-4 py-3 text-base font-medium outline-none focus:border-[#FF6321]"
                />
              )}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={7} />
            <p className="text-sm sm:text-base text-neutral-500">Precisamos dos dados principais do administrador.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-neutral-500">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input ref={adminNameRef} value={formData.adminName} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, adminName: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, () => emailRef.current?.focus())} className="w-full rounded-[1.2rem] border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-base font-bold outline-none focus:border-[#FF6321]" />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-neutral-500">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input ref={emailRef} value={formData.email} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, () => phoneRef.current?.focus())} className="w-full rounded-[1.2rem] border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-base font-bold outline-none focus:border-[#FF6321]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input ref={phoneRef} value={formData.phone} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, phone: maskPhoneBR(e.target.value) }))} onKeyDown={(e) => onInputKeyDown(e, () => cpfRef.current?.focus())} className="w-full rounded-[1.2rem] border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-base font-bold outline-none focus:border-[#FF6321]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500">CPF</label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input ref={cpfRef} value={formData.cpf} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }))} onKeyDown={(e) => onInputKeyDown(e, goNext)} className="w-full rounded-[1.2rem] border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-base font-bold outline-none focus:border-[#FF6321]" />
                </div>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={8} />
            <p className="text-sm sm:text-base text-neutral-500">Digite o CEP e a busca acontece automaticamente.</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500">CEP</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={cepRef}
                    value={formData.cep}
                    onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }}
                    onChange={(e) => {
                      const nextValue = maskCEP(e.target.value);
                      setFormData((prev) => ({ ...prev, cep: nextValue }));
                      if (onlyDigits(nextValue).length === 8) fetchAddressByCep(nextValue);
                      if (onlyDigits(nextValue).length < 8) {
                        setShowAddressDetails(false);
                        setCepError(null);
                      }
                    }}
                    onKeyDown={(e) => onInputKeyDown(e, () => onlyDigits(formData.cep).length === 8 && showAddressDetails ? numberRef.current?.focus() : undefined)}
                    className="w-full rounded-[1.3rem] border border-neutral-200 bg-white py-3.5 pl-11 pr-11 text-base font-black outline-none focus:border-[#FF6321]"
                    placeholder="00000-000"
                  />
                  {addressLoading ? <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-neutral-400" /> : onlyDigits(formData.cep).length === 8 && detectedAddress ? <CheckCircle2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" /> : null}
                </div>
                {cepError && <p className="text-sm font-bold text-red-500">{cepError}</p>}
              </div>
              {showAddressDetails && detectedAddress && (
                <>
                  <div className="rounded-[1.35rem] border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF1E9] text-[#FF6321]"><MapPin className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-neutral-900 sm:text-base">{formData.street}</p>
                        <p className="truncate text-xs text-neutral-500 sm:text-sm">{formData.neighborhood}, {formData.city} - {formData.state}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 md:grid-cols-[170px_auto_1fr]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-500">Número</label>
                      <input ref={numberRef} type="text" disabled={formData.withoutNumber} value={formData.number} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, () => complementRef.current?.focus())} className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-3 py-3 text-base font-bold outline-none focus:border-[#FF6321] disabled:opacity-50" />
                    </div>
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, withoutNumber: !prev.withoutNumber, number: !prev.withoutNumber ? "S/N" : "" }))} className={cn("mb-0.5 inline-flex h-11 items-center gap-2 rounded-full border px-3 text-xs font-black transition", formData.withoutNumber ? "border-[#FF6321] bg-[#FFF7F2] text-[#FF6321]" : "border-neutral-200 bg-white text-neutral-500") }>
                      <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition", formData.withoutNumber ? "bg-[#FF6321]" : "bg-neutral-300")}>
                        <span className={cn("absolute h-4 w-4 rounded-full bg-white transition", formData.withoutNumber ? "left-4" : "left-0.5")} />
                      </span>
                      Sem número
                    </button>
                    <div className="space-y-1.5 md:max-w-[240px]">
                      <label className="text-xs font-bold text-neutral-500">Complemento</label>
                      <input ref={complementRef} value={formData.complement} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, goNext)} className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-3 py-3 text-base font-bold outline-none focus:border-[#FF6321]" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-5">
            <StepTitle stepKey={9} />
            <p className="text-sm sm:text-base text-neutral-500">Crie uma senha forte para proteger seu negócio.</p>
            <div className="space-y-4">
              <div className="relative">
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">Senha</label>
                <input ref={passwordRef} type={showPassword ? "text" : "password"} value={formData.password} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, () => confirmPasswordRef.current?.focus())} className="w-full rounded-[1.25rem] border border-neutral-200 bg-white px-4 py-3.5 pr-12 text-base font-bold outline-none focus:border-[#FF6321]" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-[42px] text-neutral-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs font-black text-neutral-500"><Lock className="h-4 w-4 text-[#FF6321]" />Força da senha</div>
                  <span className={cn("text-xs font-black", pwd.score === 4 ? "text-emerald-600" : "text-[#FF6321]")}>{pwd.label}</span>
                </div>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-neutral-100"><div className={cn("h-full rounded-full", pwd.score === 4 ? "bg-emerald-500" : "bg-[#FF6321]")} style={{ width: `${(pwd.score / 4) * 100}%` }} /></div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-neutral-700 sm:text-sm">
                  <div className="inline-flex items-center gap-2">{pwd.checks.length ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-neutral-300" />}8+ caracteres</div>
                  <div className="inline-flex items-center gap-2">{pwd.checks.upper ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-neutral-300" />}Letra maiúscula</div>
                  <div className="inline-flex items-center gap-2">{pwd.checks.number ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-neutral-300" />}Número</div>
                  <div className="inline-flex items-center gap-2">{pwd.checks.special ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-neutral-300" />}Especial</div>
                </div>
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">Confirmar senha</label>
                <input ref={confirmPasswordRef} type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onFocus={() => { lastScrollYRef.current = window.scrollY; keepViewportStable(); }} onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))} onKeyDown={(e) => onInputKeyDown(e, handleFinish)} className="w-full rounded-[1.25rem] border border-neutral-200 bg-white px-4 py-3.5 pr-12 text-base font-bold outline-none focus:border-[#FF6321]" />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-[42px] text-neutral-400">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <style>{`@keyframes fall {0% {transform: translateY(-15vh) rotate(0deg); opacity:1;} 100% {transform: translateY(110vh) rotate(540deg); opacity:0.2;}}`}</style>
      <div className="min-h-screen bg-[#F6F5F2] text-neutral-900">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-3 py-3 sm:px-5 sm:py-6">
          <div className="w-full max-w-3xl rounded-[2rem] border border-neutral-200 bg-[#FAFAF8] shadow-[0_20px_70px_rgba(0,0,0,0.04)]">
            <div className="px-4 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <button onClick={step === 1 ? onBack : goBack} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-full max-w-xl">
                  <ProgressBar step={step} />
                </div>
              </div>
              <div ref={stepCardRef} className="mx-auto max-w-2xl space-y-5">{affiliateBanner}{renderStep()}</div>
              {error && (
                <div className="mx-auto mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 rounded-b-[2rem] border-t border-neutral-200 bg-[#FAFAF8]/95 px-4 py-4 backdrop-blur sm:px-8 ">
              <div className={cn("mx-auto flex max-w-2xl items-center gap-3", desktopFooterCentered ? "justify-center" : "justify-between") }>
                {!desktopFooterCentered && (
                  <button onClick={goBack} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50">
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </button>
                )}

                <button
                  onClick={step === 9 ? handleFinish : goNext}
                  disabled={!canAdvance() || isLoading}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6321] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,99,33,0.24)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
                    desktopFooterCentered ? "min-w-[260px]" : "min-w-[180px]"
                  )}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{step === 9 ? "Criar minha loja" : "Continuar"}<ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
