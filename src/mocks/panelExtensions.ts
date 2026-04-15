import { Category, Product, Collection, Customer, Affiliate, Marketplace } from '@/src/types/panelExtensions';

export const categoriesMock: Category[] = [
  { id: '1', name: 'Moda Feminina', type: 'category', status: 'active', icon: 'ShoppingBag' },
  { id: '2', name: 'Vestidos', type: 'subcategory', parentId: '1', status: 'active', icon: 'Shirt' },
  { id: '3', name: 'Eletrônicos', type: 'category', status: 'active', icon: 'Smartphone' },
  { id: '4', name: 'Smartphones', type: 'subcategory', parentId: '3', status: 'inactive', icon: 'Smartphone' },
];

export const productsMock: Product[] = [
  { id: '1', name: 'Vestido Floral Verão', image: 'https://picsum.photos/seed/dress1/400/400', price: 129.90 },
  { id: '2', name: 'iPhone 15 Pro', image: 'https://picsum.photos/seed/iphone/400/400', price: 7999.00 },
  { id: '3', name: 'Tênis Esportivo', image: 'https://picsum.photos/seed/shoe/400/400', price: 299.90 },
  { id: '4', name: 'Bolsa de Couro', image: 'https://picsum.photos/seed/bag/400/400', price: 450.00 },
];

export const collectionsMock: Collection[] = [
  {
    id: '1',
    name: 'Drop de Inverno',
    label: 'Oferta limitada',
    subtitle: 'Até 40% off em toda a linha Nomad',
    status: 'active',
    productIds: ['1', '3'],
    benefit1: '12x sem juros',
    benefit2: '-30% no Pix'
  }
];

export const customersMock: Customer[] = [
  { id: '1', name: 'João Silva', email: 'joao@example.com', createdAt: '2023-10-01' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@example.com', createdAt: '2023-11-15' },
  { id: '3', name: 'Pedro Santos', email: 'pedro@example.com', createdAt: '2024-01-20' },
];

export const affiliatesMock: Affiliate[] = [
  { id: '1', customerId: '1', commission: 10, status: 'active', createdAt: '2023-12-01' },
];

export const marketplacesMock: Marketplace[] = [
  { id: 'ml', name: 'Mercado Livre', logo: 'https://logodownload.org/wp-content/uploads/2018/10/mercado-livre-logo.png', status: 'not_connected' },
  { id: 'amz', name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', status: 'not_connected' },
  { id: 'shp', name: 'Shopee', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg', status: 'not_connected' },
];
