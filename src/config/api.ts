/**
 * Configuração centralizada de URLs para Produção/Desenvolvimento
 */

const isProd = import.meta.env.PROD;

// Em produção, usamos caminhos relativos ou o domínio atual
// Em desenvolvimento, apontamos para o localhost do XAMPP
export const API_BASE_URL = isProd 
  ? '/api-painel' 
  : 'http://localhost/api-painel';

export const IMAGE_BASE_URL = isProd 
  ? window.location.origin
  : 'http://localhost';

export const APP_URL = isProd
  ? window.location.origin
  : 'http://localhost:3000';


export const API_BASE = API_BASE_URL;
