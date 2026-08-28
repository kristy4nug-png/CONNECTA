const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = IS_PROD ? 'https://atlas-backend.onrender.com/api' : 'http://localhost:4000/api';
let authToken = localStorage.getItem('connecta-auth-token') || null;

const ApiClient = {
  setToken(token) {
    authToken = token;
    if(token) localStorage.setItem('connecta-auth-token', token);
    else localStorage.removeItem('connecta-auth-token');
  },

  isLoggedIn() {
    return !!authToken;
  },

  async register(email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to register');
    const data = await res.json();
    this.setToken(data.token);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to login');
    const data = await res.json();
    this.setToken(data.token);
    return data;
  },

  async logout() {
    this.setToken(null);
  },

  async syncPush(records) {
    if (!this.isLoggedIn()) return;
    try {
      await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ records })
      });
    } catch (e) {
      console.warn("Offline: sync push deferred", e);
    }
  },
  
  async syncPull() {
    if (!this.isLoggedIn()) return [];
    try {
      const res = await fetch(`${API_URL}/sync/pull`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if(res.ok) {
         const data = await res.json();
         return data.records;
      }
    } catch (e) {
      console.warn("Offline: sync pull deferred", e);
    }
    return [];
  }
};
