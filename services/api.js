// frontend/services/api.js
import { Platform } from 'react-native';

// ------------------------------
// Pick correct API root depending on platform
// ------------------------------

// Default to localhost for iOS simulator
let API_ROOT = 'http://localhost:5000';

// Android Emulator special alias for localhost
if (Platform.OS === 'android') {
  API_ROOT = 'http://10.0.2.2:5000';
}

// ✅ For real devices (Android phone, iPad):
// Replace with your computer’s LAN IP (found via ipconfig/ifconfig)
// Example: http://192.168.1.50:5000
// Comment/uncomment as needed:
API_ROOT = 'http://192.168.59.131:5000';  // <-- change this to your real IP when testing on devices

// Always call your Express mount with /api
export const BASE_URL = `${API_ROOT}/api`;

// Build a full API URL from a path.
// Works with: API('/tasks') → http://host:port/api/tasks
export function API(path = '') {
  const p = String(path || '');
  const normalized = p.startsWith('/') ? p : `/${p}`;
  return `${BASE_URL}${normalized}`;
}

/**
 * Ultra-compatible default export:
 * - `import API from '...'; API('/tasks')` ✅
 * - `import api from '...'; api.API('/tasks')` ✅
 * - `import { API } from '...'; API('/tasks')` ✅
 * - `import { BASE_URL } from '...'; axios.get(`${BASE_URL}/tasks`)` ✅
 */
const api = Object.assign(API, { API, BASE_URL, API_ROOT });
export default api;
