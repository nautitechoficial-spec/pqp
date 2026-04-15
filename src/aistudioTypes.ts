
export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'category' | 'subcategory';
  parentId?: string;
  image?: string;
  image_url?: string;
  icon?: string;
  status: 'active' | 'inactive';
  display_order?: number;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: string;
  attributes?: Record<string, any>;
  variationKey?: string;
  minStockAlert?: number;
}

export interface ProductVariationValue {
  label: string;
  colorHex?: string;
  image?: string;
  stock?: number;
  sku?: string;
  priceExtra?: number;
  minStockAlert?: number;
}

export interface ProductVariationAttribute {
  name: string;
  type?: 'color' | 'size' | 'material' | 'model' | 'other';
  values: Array<string | ProductVariationValue>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  collectionIds?: string[];
  status: 'active' | 'inactive';
  shortDescription: string;
  fullDescription: string;
  tags?: string[];
  
  price: number;
  compareAtPrice?: number;
  cost?: number;
  
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  
  mainImage: string;
  galleryImages: string[];
  
  shippingType: 'melhor_envio' | 'fixo' | 'retirada' | 'digital';
  useDefaultShipping?: boolean;
  weight: number;
  height: number;
  width: number;
  length: number;
  declaredValue?: number;
  freeShipping?: boolean;
  
  hasVariants: boolean;
  variants: ProductVariant[];
  variationAttributes?: ProductVariationAttribute[];
  
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
  
  featured: boolean;
  allowReviews: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  email: string;
  code: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  status: 'active' | 'inactive';
  clicks: number;
  sales: number;
  totalCommission: number;
  createdAt: string;
  lastActivity?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  variation?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  statusPayment: 'paid' | 'pending' | 'cancelled';
  statusLogistic: 'awaiting_separation' | 'ready_for_shipping' | 'label_generated' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  shippingMethod: 'melhor_envio' | 'fixo' | 'km';
  shippingValue: number;
  shippingDeadline?: string;
  trackingCode?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  paymentMethod: string;
  channel?: 'store' | 'affiliate' | 'marketplace';
  originName?: string;
  logisticHistory: {
    status: string;
    timestamp: string;
    description?: string;
  }[];
  meShipmentId?: string;
  meLabelId?: string;
  meLabelUrl?: string;
  shippingService?: string;
}


export interface ShippingRule {
  id: string;
  name: string;
  target: 'all' | 'cep_range' | 'uf' | 'city';
  targetValue?: string;
  conditions: {
    weightMin?: number;
    weightMax?: number;
    cartTotalMin?: number;
    cartTotalMax?: number;
    itemQtyMin?: number;
    itemQtyMax?: number;
  };
  action: 'block' | 'add_value' | 'discount' | 'free';
  actionValue?: number;
  applyTo: ('melhor_envio' | 'fixo' | 'km')[];
  priority: number;
}

export interface ShippingSettings {
  mode: 'melhor_envio' | 'fixo' | 'km';
  melhorEnvio: {
    token?: string;
    environment: 'sandbox' | 'production';
    enabledServices: string[];
    isDefault: boolean;
    lastCheck?: string;
    status: 'connected' | 'failed' | 'invalid_token' | 'no_token';
  };
  fixo: {
    value: number;
    deadline: number;
    isDefault: boolean;
    freeShippingOver: {
      enabled: boolean;
      value: number;
    };
  };
  km: {
    originZipCode: string;
    valuePerKm: number;
    maxRadius: number;
    baseDeadline: number;
    minTax: number;
    maxTax: number;
    outsideRadiusAction: 'block' | 'fallback_fixed';
  };
  defaultDimensions: {
    enabled: boolean;
    height: number;
    width: number;
    length: number;
    weight: number;
  };
}

export interface SupportArticle {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  content: string;
  relatedIds?: string[];
}

export interface SupportCategory {
  id: string;
  title: string;
  icon: string;
  articles: SupportArticle[];
}

export interface Marketplace {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'not_connected';
}

export interface Store {
  name: string;
  status: 'active' | 'inactive';
  slug: string;
}
