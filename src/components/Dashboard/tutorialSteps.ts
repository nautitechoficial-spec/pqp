import type { TutorialStepDef } from "./DashboardTutorial";

export function getDashboardTutorialSteps(isMobile: boolean): TutorialStepDef[] {
  const topSteps: TutorialStepDef[] = [
    {
      id: "tutorial-trigger",
      title: "Tutorial do painel",
      description: "Esse botão com raio reabre o guia sempre que você quiser. Ele fica no topo para você revisar o painel quando precisar.",
      targetIds: [isMobile ? "btn-tutorial-trigger-mobile" : "btn-tutorial-trigger-desktop"],
      beforeFocus: "close-more-actions",
    },
    {
      id: "theme-toggle",
      title: "Modo claro e escuro",
      description: "Aqui você alterna entre modo claro e dark mode do painel. O botão fica sempre visível para mudar a aparência rapidamente.",
      targetIds: ["btn-theme-toggle"],
      beforeFocus: "close-more-actions",
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Nesse sino você acompanha alertas importantes como pedidos pendentes, estoque baixo e avisos do sistema.",
      targetIds: ["btn-notifications"],
      beforeFocus: "close-more-actions",
    },
  ];

  if (isMobile) {
    topSteps.push(
      {
        id: "more-actions",
        title: "Mais ações",
        description: "Esses três pontinhos reúnem atalhos extras do topo no celular, para a tela ficar limpa e organizada.",
        targetIds: ["btn-more-actions"],
        beforeFocus: "close-more-actions",
      },
      {
        id: "more-actions-panel",
        title: "Atalhos rápidos",
        description: "Ao abrir os três pontinhos, você encontra atalhos rápidos como tutorial, suporte, financeiro e configurações.",
        targetIds: ["mobile-quick-actions-panel"],
        beforeFocus: "open-more-actions",
      },
      {
        id: "mobile-menu-button",
        title: "Abrir menu lateral",
        description: "Agora vamos para a navegação principal. No celular, toque nesse botão para abrir o menu lateral do painel.",
        targetIds: ["btn-mobile-menu"],
        beforeFocus: "close-sidebar",
      },
    );
  }

  return [
    ...topSteps,
    { id: "dashboard", title: "Dashboard", description: "Aqui você acompanha visão geral, vendas, pedidos e métricas principais da loja.", targetIds: ["nav-dashboard"], beforeFocus: isMobile ? "open-sidebar" : "none" },
    { id: "orders", title: "Pedidos", description: "Em Pedidos você acompanha pagamento, separação, envio e andamento de cada compra.", targetIds: ["nav-orders"], beforeFocus: "open-sidebar" },
    { id: "products", title: "Produtos", description: "Cadastre, edite preços, estoque e organize o catálogo da sua loja.", targetIds: ["nav-products"], beforeFocus: "open-sidebar" },
    { id: "customers", title: "Clientes", description: "Veja a base de clientes, histórico e informações importantes de atendimento.", targetIds: ["nav-customers"], beforeFocus: "open-sidebar" },
    { id: "wallet", title: "Carteira", description: "Na Carteira você acompanha saldos, repasses e informações financeiras da operação.", targetIds: ["nav-wallet"], beforeFocus: "open-sidebar" },
    { id: "reports", title: "Relatórios", description: "Use Relatórios para analisar desempenho, vendas e indicadores da loja.", targetIds: ["nav-reports"], beforeFocus: "open-sidebar" },
    { id: "shipping", title: "Frete", description: "Em Frete você gerencia entregas, cotações e integrações logísticas.", targetIds: ["nav-shipping"], beforeFocus: "open-sidebar" },
    { id: "categories", title: "Categorias", description: "Organize os produtos por categorias para melhorar navegação e vitrine.", targetIds: ["nav-categories"], beforeFocus: "open-sidebar" },
    { id: "collections", title: "Coleções", description: "Monte coleções temáticas para destacar produtos e campanhas.", targetIds: ["nav-collections"], beforeFocus: "open-sidebar" },
    { id: "affiliates", title: "Afiliados", description: "Na área de Afiliados você acompanha parcerias e indicações da plataforma.", targetIds: ["nav-affiliates"], beforeFocus: "open-sidebar" },
    { id: "marketplaces", title: "Marketing", description: "Aqui ficam integrações e canais externos para ampliar alcance e operação.", targetIds: ["nav-marketplaces"], beforeFocus: "open-sidebar" },
    { id: "plans", title: "Benefícios e planos", description: "Em Planos você consulta benefícios, limites e opções de upgrade da sua conta.", targetIds: ["nav-plans"], beforeFocus: "open-sidebar" },
    { id: "support", title: "Suporte", description: "Sempre que precisar de ajuda, entre em Suporte para atendimento e orientações.", targetIds: ["nav-support"], beforeFocus: "open-sidebar" },
    { id: "settings", title: "Configurações", description: "Por fim, em Configurações você ajusta dados da loja, conta e preferências gerais.", targetIds: ["nav-settings"], beforeFocus: "open-sidebar" },
  ];
}
