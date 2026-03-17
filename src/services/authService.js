const API_URL = import.meta.env.VITE_API_URL || '';

class AuthService {
  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  removeUser() {
    localStorage.removeItem('user');
  }

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async parseResponse(response) {
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message = data.error || data.message || 'Error de autenticacion';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  async register(userData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await this.parseResponse(response);

    if (data.token) this.setToken(data.token);
    if (data.user) this.setUser(data.user);
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await this.parseResponse(response);

    if (data.token) this.setToken(data.token);
    if (data.user) this.setUser(data.user);
    return data;
  }

  async logout() {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore logout network failures; local session is still cleared.
      }
    }

    this.removeToken();
    this.removeUser();
  }

  logoutKeepalive() {
    const token = this.getToken();

    if (token) {
      try {
        fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          keepalive: true,
        });
      } catch {
        // Ignore page-exit network errors.
      }
    }

    this.removeToken();
    this.removeUser();
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      await this.logout();
      return null;
    }

    const data = await this.parseResponse(response);
    const user = data.user || null;
    if (user) this.setUser(user);
    return user;
  }
}

export default new AuthService();
