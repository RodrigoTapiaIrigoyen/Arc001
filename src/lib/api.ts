// Centralized API client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: ApiOptions = {}): Promise<any> {
    const { method = 'GET', body, headers: customHeaders } = options;
    
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: this.getHeaders(customHeaders)
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      // Si la respuesta no es ok, lanzar error con el mensaje del servidor
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      // Intentar parsear JSON, si no hay contenido devolver null
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error: any) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Métodos HTTP
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, body?: any) {
    return this.request(endpoint, { method: 'POST', body });
  }

  async put(endpoint: string, body?: any) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  async patch(endpoint: string, body?: any) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  async delete(endpoint: string, options?: { data?: any }) {
    return this.request(endpoint, { method: 'DELETE', body: options?.data });
  }

  // Métodos de autenticación
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async register(username: string, email: string, password: string) {
    return this.post('/auth/register', { username, email, password });
  }

  async verifyToken() {
    return this.get('/auth/verify');
  }

  async logout() {
    return this.post('/auth/logout');
  }
}

// Exportar instancia singleton
const api = new ApiClient(API_URL);
export default api;
