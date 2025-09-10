// utils/api.js
const BASE_URL = 'http://192.168.59.131:5000'; // ← update to your backend IP:PORT

export async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// For quick currency display
export function cedis(n) {
  const v = Number(n || 0);
  return `₵${v.toFixed(2)}`;
}
