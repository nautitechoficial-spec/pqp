import React, { useState, useMemo } from 'react';
import { 
  Search, Headset, LifeBuoy, BookOpen, 
  MessageCircle, Mail, ChevronRight, ChevronDown,
  ShieldCheck, Smartphone, Package, ShoppingBag,
  CreditCard, Truck, Store, ExternalLink,
  LayoutDashboard, Users, Wallet, BarChart3,
  Grid, Layers, UserPlus, Settings, Crown,
  ArrowLeft, CheckCircle2, PlayCircle, X, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

const topics = [
  { id: 'dashboard', icon: LayoutDashboard, title: 'Dashboard', description: 'Métricas e indicadores' },
  { id: 'pedidos', icon: ShoppingBag, title: 'Pedidos', description: 'Gestão de vendas' },
  { id: 'produtos', icon: Package, title: 'Produtos', description: 'Catálogo e estoque' },
  { id: 'clientes', icon: Users, title: 'Clientes', description: 'Base de compradores' },
  { id: 'carteira', icon: Wallet, title: 'Carteira', description: 'Saldos e saques' },
  { id: 'relatorios', icon: BarChart3, title: 'Relatórios', description: 'Análise de dados' },
  { id: 'frete', icon: Truck, title: 'Frete', description: 'Configurações de entrega' },
  { id: 'categorias', icon: Grid, title: 'Categorias', description: 'Organização da loja' },
  { id: 'colecoes', icon: Layers, title: 'Coleções', description: 'Agrupamento de itens' },
  { id: 'afiliados', icon: UserPlus, title: 'Afiliados', description: 'Programa de parceiros' },
  { id: 'marketplaces', icon: Store, title: 'Marketplaces', description: 'Integrações externas' },
  { id: 'financeiro', icon: CreditCard, title: 'Financeiro', description: 'Faturas e cartões' },
  { id: 'planos', icon: Crown, title: 'Planos', description: 'Assinaturas e limites' },
  { id: 'configuracoes', icon: Settings, title: 'Configurações', description: 'Dados da loja' },
];

const topicContent: Record<string, any> = {
  produtos: {
    faqs: [
      { q: 'Como cadastrar um produto com variações?', a: 'No menu Produtos, clique em "Novo Produto" e acesse a aba "Variações". Lá você pode adicionar tamanhos, cores e outros atributos.' },
      { q: 'Posso importar produtos via planilha?', a: 'Sim! Na listagem de produtos, use o botão "Importar" para subir um arquivo CSV ou Excel seguindo nosso modelo.' },
      { q: 'Como funciona o controle de estoque?', a: 'O estoque é baixado automaticamente a cada pedido pago. Você pode definir alertas de estoque baixo nas configurações do produto.' },
      { q: 'Como adicionar vídeos aos produtos?', a: 'Na galeria do produto, você pode inserir links do YouTube ou Vimeo para exibir vídeos junto com as fotos.' },
      { q: 'O que são produtos digitais?', a: 'São itens que não exigem frete. Ao marcar como digital, o cliente recebe o link de download após a confirmação do pagamento.' },
    ],
    steps: [
      'Acesse o menu Produtos no sidebar',
      'Clique no botão "Novo Produto"',
      'Preencha nome, descrição e preço',
      'Adicione fotos de alta qualidade',
      'Defina a categoria e salve'
    ],
    cta: { label: 'Ir para Produtos', tab: 'produtos' }
  },
  financeiro: {
    faqs: [
      { q: 'Como alterar o cartão de crédito?', a: 'Vá em Financeiro > Meus Cartões e adicione o novo cartão. Você pode defini-lo como padrão para as próximas cobranças.' },
      { q: 'Onde baixo minhas notas fiscais?', a: 'Todas as notas fiscais de serviço ficam disponíveis em Financeiro > Notas Fiscais após a confirmação do pagamento.' },
      { q: 'Minha fatura venceu, o que fazer?', a: 'Faturas vencidas podem ser pagas via PIX com atualização imediata. O sistema reativa sua loja automaticamente.' },
      { q: 'Como funciona o ciclo de faturamento?', a: 'O faturamento é mensal ou anual, dependendo do plano escolhido, sempre na data de aniversário da sua assinatura.' },
    ],
    steps: [
      'Acesse o menu Financeiro',
      'Escolha entre Faturas, Notas ou Cartões',
      'Para pagar, selecione a fatura em aberto',
      'Escolha o método (PIX ou Cartão)',
      'Confirme o pagamento'
    ],
    cta: { label: 'Ver Faturas', tab: 'financeiro_faturas' }
  }
};

export function SupportPage({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredTopics = useMemo(() => {
    if (!searchTerm) return topics;
    return topics.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const currentContent = selectedTopic ? (topicContent[selectedTopic] || topicContent['produtos']) : null;

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {!selectedTopic ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Search Section */}
            <div className="relative bg-slate-900 rounded-[2.5rem] p-12 lg:p-20 overflow-hidden text-center shadow-2xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-bold backdrop-blur-md border border-white/10">
                  <LifeBuoy className="w-4 h-4 text-[#FF6B00]" />
                  Central de Ajuda MinhaBag
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Como podemos ajudar hoje?</h1>
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Busque por dúvidas, tutoriais ou tópicos..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl text-slate-900 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/20 shadow-2xl placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-[#FF6B00] rounded-full blur-[150px]" />
                <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-orange-600 rounded-full blur-[150px]" />
              </div>
            </div>

            {/* Topics Grid */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Navegue por tópicos</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredTopics.length} tópicos encontrados</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredTopics.map((topic) => (
                  <button 
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#FF6B00]/30 transition-all text-left group flex flex-col items-start"
                  >
                    <div className="p-4 bg-orange-50 rounded-2xl mb-4 group-hover:scale-110 group-hover:bg-[#FF6B00] transition-all duration-300">
                      <topic.icon className="w-6 h-6 text-[#FF6B00] group-hover:text-white" />
                    </div>
                    <h3 className="font-black text-slate-900 mb-1 text-sm lg:text-base">{topic.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{topic.description}</p>
                  </button>
                ))}
              </div>

              {filteredTopics.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Nenhum tópico encontrado para "{searchTerm}"</p>
                  <button onClick={() => setSearchTerm('')} className="mt-2 text-[#FF6B00] font-bold hover:underline">Limpar busca</button>
                </div>
              )}
            </div>

            {/* Quick Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#FF6B00] to-orange-600 rounded-[2.5rem] p-10 text-white flex flex-col lg:flex-row items-center gap-8 shadow-xl shadow-orange-100">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0">
                  <Headset className="w-12 h-12" />
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-black mb-2">Ainda não encontrou o que precisava?</h3>
                  <p className="text-white/80 text-sm font-medium mb-6">Nossa equipe de especialistas está pronta para te ajudar via WhatsApp ou E-mail.</p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    <button className="px-6 py-3 bg-white text-[#FF6B00] rounded-xl font-black text-sm hover:bg-orange-50 transition-all flex items-center gap-2 shadow-lg">
                      <MessageCircle className="w-5 h-5" />
                      Falar no WhatsApp
                    </button>
                    <button className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-black text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Enviar E-mail
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operacional
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'API de Vendas', status: '100%' },
                    { label: 'Painel Admin', status: '100%' },
                    { label: 'Lojas Online', status: '99.9%' },
                    { label: 'Checkout', status: '100%' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">{s.label}</span>
                      <span className="text-xs font-black text-emerald-600">{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Topic Header */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {topics.find(t => t.id === selectedTopic)?.title}
                </h2>
                <p className="text-sm text-slate-500">Tudo o que você precisa saber sobre este módulo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FAQs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#FF6B00]" />
                      Perguntas Frequentes
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {currentContent.faqs.map((faq: any, i: number) => (
                      <div key={i} className="group">
                        <button 
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-slate-900">{faq.q}</span>
                          <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 text-sm text-slate-500 leading-relaxed">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Steps */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-[#FF6B00]" />
                    Passo a Passo
                  </h3>
                  <div className="space-y-6">
                    {currentContent.steps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-orange-50 text-[#FF6B00] text-[10px] font-black flex items-center justify-center shrink-0 border border-orange-100">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Pronto para começar?</h4>
                  <p className="text-white/60 text-sm mb-8">Acesse agora o módulo e coloque em prática o que aprendeu.</p>
                  <button 
                    onClick={() => { /* Navigation logic */ }}
                    className="w-full py-4 bg-[#FF6B00] text-white rounded-2xl font-black text-sm hover:bg-[#E66000] transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
                  >
                    {currentContent.cta.label}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
