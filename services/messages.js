// services/messages.js
import { api } from './api';

/** Mark a message as delivered (✓✓ gray) */
export async function markDelivered(id) {
  try {
    await api.patch(`/messages/${id}/delivered`);
  } catch (e) {
    // optional: console.warn('markDelivered failed', e?.message);
  }
}

/** Mark a message as read (✓✓ blue) */
export async function markRead(id) {
  try {
    await api.patch(`/messages/${id}/read`);
  } catch (e) {
    // optional: console.warn('markRead failed', e?.message);
  }
}
