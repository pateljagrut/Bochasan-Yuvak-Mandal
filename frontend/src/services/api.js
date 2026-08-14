import axios from 'axios';

/**
 * API Service Module.
 * Connects the React Frontend to the Python FastAPI Backend (http://127.0.0.1:8000).
 * Heavily documented for fresher developer readability.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'https://bochasan-yuvak-mandal.onrender.com/api';


/**
 * Generic HTTP Request Helper.
 * Handles JSON payload serialization, Authorization headers, and HTTP error catching.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

// ==========================================
// Authentication APIs
// ==========================================

export async function loginApi(identifier, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { identifier, password }
  });
}

export async function registerYuvakApi(yuvakData) {
  return request('/auth/register', {
    method: 'POST',
    body: yuvakData
  });
}

// ==========================================
// Yuvak Dashboard APIs
// ==========================================

export async function getYuvakProfileApi(token) {
  return request('/yuvak/profile', { token });
}

export async function getYuvakAttendanceApi(token) {
  return request('/yuvak/attendance', { token });
}

// ==========================================
// Karyakar (Admin) Operational APIs
// ==========================================

export async function getAllYuvaksApi(token) {
  return request('/karyakar/yuvaks', { token });
}

export async function updateYuvakProfileApi(yuvakId, updateData, token) {
  return request(`/karyakar/yuvak/${yuvakId}`, {
    method: 'PUT',
    token,
    body: updateData
  });
}

export async function deleteYuvakMemberApi(yuvakId, token) {
  return request(`/karyakar/yuvak/${yuvakId}`, {
    method: 'DELETE',
    token
  });
}

export async function recordAttendanceApi(attendanceData, token) {
  return request('/karyakar/attendance', {
    method: 'POST',
    token,
    body: attendanceData
  });
}

export async function getAttendanceSessionsApi(token) {
  return request('/karyakar/attendance-sessions', { token });
}

export async function postContentApi(contentData, token) {
  return request('/karyakar/content', {
    method: 'POST',
    token,
    body: contentData
  });
}

export async function updateContentFeedApi(contentId, updateData, token) {
  return request(`/karyakar/content/${contentId}`, {
    method: 'PUT',
    token,
    body: updateData
  });
}

export async function deleteContentFeedApi(contentId, token) {
  return request(`/karyakar/content/${contentId}`, {
    method: 'DELETE',
    token
  });
}

export async function getContentFeedsApi() {
  return request('/content');
}

// ==========================================
// Event Photo Gallery APIs
// ==========================================

export async function getEventsApi() {
  return request('/content/photos');
}

export async function getEventPhotosApi() {
  return request('/content/photos');
}

export async function postEventPhotoApi(photoData, token) {
  return request('/karyakar/photos', {
    method: 'POST',
    token,
    body: photoData
  });
}

export async function updateEventPhotoApi(photoId, updateData, token) {
  return request(`/karyakar/photos/${photoId}`, {
    method: 'PUT',
    token,
    body: updateData
  });
}

export async function deleteEventPhotoApi(photoId, token) {
  return request(`/karyakar/photos/${photoId}`, {
    method: 'DELETE',
    token
  });
}

// ==========================================
// Admin Security (RBAC) API
// ==========================================

export async function createKaryakarAdminApi(adminData, token) {
  return request('/admin/create-karyakar', {
    method: 'POST',
    token,
    body: adminData
  });
}

/**
 * Returns the WebSocket URL for real-time cross-user event broadcasting.
 * Supports all users (Admins & Yuvaks).
 */
export function getRealtimeWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/api/ws`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '127.0.0.1:8000' 
    : window.location.host;
  return `${protocol}//${host}/api/ws`;
}

export function getAdminWebSocketUrl() {
  return getRealtimeWebSocketUrl();
}

/**
 * Returns the Server-Sent Events (SSE) stream URL for all clients.
 */
export function getRealtimeSseUrl() {
  const baseUrl = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://127.0.0.1:8000/api';
  return `${baseUrl}/events/stream`;
}

export function getAdminSseUrl() {
  return getRealtimeSseUrl();
}



