
export interface Category {
  id: string;
  name: string;
  type: 'category' | 'subcategory';
  parentId?: string;
  image?: string;
  icon?: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
}

export interface Collection {
  id: string;
  name: string;
  label?: string;
  subtitle?: string;
  banner?: string;
  featuredProductId?: string;
  featuredSlogan?: string;
  featuredDescription?: string;
  benefit1?: string;
  benefit2?: string;
  status: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  productIds: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Affiliate {
  id: string;
  customerId: string;
  commission: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Marketplace {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'not_connected';
}
