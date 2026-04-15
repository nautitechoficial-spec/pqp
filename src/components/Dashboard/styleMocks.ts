export type Marketplace = { id: string; name: string; logo: string; status: "connected" | "not_connected" }

export const reportDataMock = [
  { day: '01/02', sales: 4000, orders: 24 },
  { day: '02/02', sales: 3000, orders: 18 },
  { day: '03/02', sales: 2000, orders: 12 },
  { day: '04/02', sales: 2780, orders: 20 },
  { day: '05/02', sales: 1890, orders: 15 },
  { day: '06/02', sales: 2390, orders: 22 },
  { day: '07/02', sales: 3490, orders: 28 },
];

export const topProductsMock = [
  { name: 'Vestido Floral', value: 400, color: '#FF6B00' },
  { name: 'iPhone 15', value: 300, color: '#3B82F6' },
  { name: 'Tênis Sport', value: 200, color: '#10B981' },
  { name: 'Bolsa Couro', value: 100, color: '#8B5CF6' },
  { name: 'Relógio Luxo', value: 50, color: '#F59E0B' },
];



export const marketplacesMock: Marketplace[] = [
  { id: "mercado-livre", name: "Mercado Livre", logo: "/logos/mercado-livre.svg", status: "not_connected" },
  { id: "amazon", name: "Amazon", logo: "/logos/amazon.svg", status: "not_connected" },
  { id: "shopee", name: "Shopee", logo: "/logos/shopee.svg", status: "not_connected" },
  { id: "outros", name: "+1 Outros", logo: "/logos/outros.svg", status: "not_connected" },
];
