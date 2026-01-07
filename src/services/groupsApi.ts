const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchGroups(filters = {}) {
  const params = new URLSearchParams(filters as any).toString();
  const res = await fetch(`${API_URL}/groups?${params}`);
  if (!res.ok) throw new Error('Error al cargar grupos');
  return await res.json();
}

export async function createGroup(data: any, token: string) {
  const res = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear grupo');
  return await res.json();
}


// Solicitar ingreso a grupo
export async function requestJoinGroup(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/request-join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al solicitar ingreso');
  return await res.json();
}

// Aceptar solicitud de ingreso
export async function acceptJoinRequest(groupId: string, userId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/accept-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Error al aceptar solicitud');
  return await res.json();
}

// Rechazar solicitud de ingreso
export async function rejectJoinRequest(groupId: string, userId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/reject-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Error al rechazar solicitud');
  return await res.json();
}

export async function fetchGroupMessages(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al cargar mensajes');
  return await res.json();
}

export async function sendGroupMessage(groupId: string, content: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Error al enviar mensaje');
  return await res.json();
}
