const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_URL}${endpoint}`;
    const headers = this.getHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include', // Importante para cookies
    };

    try {
      const response = await fetch(url, config);
      
      // Manejar errores de autenticación
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        
        // Si es error de autenticación, limpiar token local y recargar
        if (response.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiration');
          
          // Esperar un momento y recargar para forzar logout
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
        
        const errorMessage = response.status === 401 
          ? 'Sesión expirada. Por favor inicia sesión nuevamente.'
          : 'No tienes permisos para realizar esta acción.';
        
        throw new Error(errorData.error || errorMessage);
      }
      
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Demasiadas peticiones. Por favor espera un momento.');
      }

      // Si la respuesta no es OK, intentar obtener el mensaje de error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      // Intentar parsear JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión. Verifica tu internet.');
    }
  }

  // GET
  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST
  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT
  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH
  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE
  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(username: string, password: string): Promise<any> {
    const response = await this.post('/auth/login', { username, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // Guardar fecha de expiración (7 días desde ahora)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      localStorage.setItem('tokenExpiration', expirationDate.toISOString());
    }
    return response;
  }

  async register(username: string, email: string, password: string, fullName?: string): Promise<any> {
    const response = await this.post('/auth/register', { username, email, password, fullName });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // Guardar fecha de expiración (7 días desde ahora)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      localStorage.setItem('tokenExpiration', expirationDate.toISOString());
    }
    return response;
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
  }

  async verifyToken(): Promise<any> {
    return await this.get('/auth/verify');
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/auth/me');
  }

  // Notification methods
  async getNotifications(options?: { limit?: number; skip?: number; unreadOnly?: boolean }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    
    const query = params.toString();
    return this.get(`/notifications${query ? '?' + query : ''}`);
  }

  async getUnreadCount(): Promise<any> {
    return this.get('/notifications/unread/count');
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.post(`/notifications/read/${notificationId}`);
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.post('/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<any> {
    return this.delete(`/notifications/${notificationId}`);
  }

  async deleteAllReadNotifications(): Promise<any> {
    return this.delete('/notifications/read/all');
  }

  // Upload methods
  async postFormData(endpoint: string, formData: FormData): Promise<any> {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        throw new Error(errorData.error || 'No autorizado');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión');
    }
  }
}

// Exportar instancia única (singleton)
export const api = new ApiService();
export default api;
