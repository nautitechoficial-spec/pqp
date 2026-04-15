/**
 * Serviço de integração com a API PHP
 */

import { authService } from "./authService";
import { API_BASE_URL } from "../config/api";

const API_URL = API_BASE_URL;

const getStoreId = () => {
  const user = authService.getUser();
  return user?.store_id || 0;
};

export interface DashboardData {
  totalSales: number;
  paidOrders?: number;
  totalOrders?: number;
  todayOrders: number;
  openOrders: number;
  revenue: number;
  period?: string;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  chartData: { date: string; total: number }[];
  topProducts: {
    id: number;
    name: string;
    image: string;
    totalSold: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    type?: string;
  }[];
}

export interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: string;
  active: number;
  features?: string[];
}

export interface Invoice {
  id: number;
  number: string;
  date: string;
  type: string;
  status: string;
  value: number;
  pix_code?: string;
  pix_qr?: string;
  plan_name?: string;
  customer_data?: any;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  tracking_code?: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    variation?: string;
    quantity: number;
    price: number;
  }[];
}

export interface OrdersResponse {
  orders: Order[];
  insights: {
    total: number;
    paid: number;
    pending: number;
  };
}

export const dashboardService = {
  async getDashboardData(period: string = '7d'): Promise<DashboardData> {
    const response = await fetch(`${API_BASE_URL}/dashboard.php?period=${encodeURIComponent(period)}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar dados do servidor');
    }
    return response.json();
  },

  async getOrders(): Promise<OrdersResponse> {
    const response = await fetch(`${API_BASE_URL}/orders.php?store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar pedidos');
    }
    return response.json();
  },

  async getCustomers(search: string = ''): Promise<any> {
    let querySearch = search || '';
    let status = 'all';
    const match = querySearch.match(/status:(all|active|inactive)/i);
    if (match) {
      status = match[1].toLowerCase();
      querySearch = querySearch.replace(match[0], '').trim();
    }
    const response = await fetch(`${API_BASE_URL}/customers.php?search=${encodeURIComponent(querySearch)}&status=${encodeURIComponent(status)}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar clientes');
    }
    return response.json();
  },

  async updateCustomerStatus(id: number, status: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, action: 'status', store_id: getStoreId() })
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar status do cliente');
    }
    return response.json();
  },

  async editCustomer(customer: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...customer, action: 'edit', store_id: getStoreId() })
    });
    if (!response.ok) {
      throw new Error('Erro ao editar cliente');
    }
    return response.json();
  },


  async createOrder(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, store_id: getStoreId(), action: 'create' })
    });
    if (!response.ok) throw new Error('Erro ao criar pedido');
    return response.json();
  },

  async createCustomer(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, store_id: getStoreId(), action: 'create' })
    });
    if (!response.ok) throw new Error('Erro ao criar cliente');
    return response.json();
  },

  async saveBankAccount(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, store_id: getStoreId(), action: 'save_bank_account' })
    });
    if (!response.ok) throw new Error('Erro ao salvar dados bancários');
    return response.json();
  },

  async requestWithdrawal(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, store_id: getStoreId(), action: 'request_withdrawal' })
    });
    if (!response.ok) throw new Error('Erro ao solicitar saque');
    return response.json();
  },

  async cancelWithdrawal(withdrawalId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal_id: withdrawalId, store_id: getStoreId(), action: 'cancel_withdrawal' })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || 'Erro ao cancelar saque');
    }
    return response.json();
  },



  async updateOrderLogistics(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, store_id: getStoreId() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) throw new Error(data?.error || 'Erro ao atualizar logística');
    return data;
  },

  async generateOrderLabel(orderId: number | string): Promise<any> {
    return this.updateOrderLogistics({ action: 'generate_label', order_id: orderId });
  },

  async printOrderLabel(orderId: number | string): Promise<any> {
    return this.updateOrderLogistics({ action: 'print_label', order_id: orderId });
  },

  async syncOrderLabel(orderId: number | string): Promise<any> {
    return this.updateOrderLogistics({ action: 'sync_label', order_id: orderId });
  },

  async getWalletData(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet.php?store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar dados da carteira');
    }
    return response.json();
  },

  async getProducts(search: string = '', limit: number = 15, offset: number = 0): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/products.php?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar produtos');
    }
    return response.json();
  },

  async getReports(type: string = 'summary', period: string = '30d', channel: string = 'all'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reports.php?type=${encodeURIComponent(type)}&period=${encodeURIComponent(period)}&channel=${encodeURIComponent(channel)}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar relatórios');
    }
    return response.json();
  },

  async getProductDetails(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/products.php?id=${id}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar detalhes do produto');
    }
    return response.json();
  },

  async saveProduct(product: any): Promise<any> {
    const response = await fetch(`${API_URL}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, store_id: getStoreId() })
    });
    if (!response.ok) {
      throw new Error('Erro ao salvar produto');
    }
    return response.json();
  },

  async deleteProduct(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/products.php?id=${id}&store_id=${getStoreId()}`, {
      method: 'DELETE'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || 'Erro ao deletar produto');
    }
    return payload;
  },

  async updateProductStatus(id: number, active: boolean): Promise<any> {
    const response = await fetch(`${API_URL}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: active ? 1 : 0, action: 'toggle_status', store_id: getStoreId() })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || 'Erro ao atualizar status do produto');
    }
    return payload;
  },

  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_URL}/plans.php`);
    if (!response.ok) {
      throw new Error('Erro ao carregar planos');
    }
    return response.json();
  },

  async getInvoices(status?: string): Promise<Invoice[]> {
    const url = new URL(`${API_BASE_URL}/finance.php`, window.location.origin);
    url.searchParams.append('action', 'invoices');
    url.searchParams.append('store_id', getStoreId().toString());
    if (status) url.searchParams.append('status', status);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Erro ao carregar faturas');
    }
    return response.json();
  },

  async getInvoiceDetails(id: number): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/finance.php?action=invoice_details&id=${id}&store_id=${getStoreId()}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar detalhes da fatura');
    }
    return response.json();
  },

  async createSubscription(planId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/finance.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, store_id: getStoreId(), action: 'create_sub' })
    });
    if (!response.ok) {
      throw new Error('Erro ao criar assinatura');
    }
    return response.json();
  }
};
