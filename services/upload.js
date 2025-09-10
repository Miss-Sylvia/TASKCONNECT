// services/upload.js
import { BASE_URL } from './api';

export async function uploadFileAsync(uri, fieldName = 'file') {
  const filename = uri.split('/').pop() || `upload-${Date.now()}`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `application/octet-stream`;

  const formData = new FormData();
  formData.append(fieldName, { uri, name: filename, type });

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed: ${txt}`);
  }
  return res.json(); // expect { url: 'http://.../uploads/...' }
}
