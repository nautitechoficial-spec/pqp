import { API_BASE_URL } from "../config/api";

export const authService = {
  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async register(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async checkSubdomain(subdomain: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/check_subdomain.php?subdomain=${encodeURIComponent(subdomain)}`);
    return response.json();
  },

  saveUser(user: any) {
    localStorage.setItem('bagg_user', JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem('bagg_user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('bagg_user');
  },

  async checkStatus(storeId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/check_status.php?store_id=${storeId}`);
    return response.json();
  }
};
