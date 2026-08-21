import axios from 'axios';

/**
 * API Service Module.
 * Connects the React Frontend to the Python FastAPI Backend (http://127.0.0.1:8000).
 * Heavily documented for fresher developer readability.
 */

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const PROD_BACKEND_HTTP = 'https://bochasan-yuvak-mandal.onrender.com';
const PROD_BACKEND_WS = 'wss://bochasan-yuvak-mandal.onrender.com';

function resolveBaseApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If running on deployed production (not localhost) but envUrl points to localhost/127.0.0.1, ignore it and use Render
    if (!isLocalhost && (envUrl.includes('127.0.0.1') || envUrl.includes('localhost'))) {
      return `${PROD_BACKEND_HTTP}/api`;
    }
    return `${envUrl.replace(/\/+$/, '')}/api`;
  }
  return isLocalhost ? 'http://127.0.0.1:8000/api' : `${PROD_BACKEND_HTTP}/api`;
}

export const API_BASE_URL = resolveBaseApiUrl();


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
// Upcoming Sabha Schedule API
// ==========================================

export async function getUpcomingSabhaApi() {
  return request('/content/upcoming-sabha');
}

export async function updateUpcomingSabhaApi(scheduleData, token) {
  return request('/karyakar/upcoming-sabha', {
    method: 'PUT',
    token,
    body: scheduleData
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

// ==========================================
// Hero Photo Slideshow APIs
// ==========================================

export async function getSlideshowSlidesApi() {
  return request('/content/slideshow');
}

export async function updateAllSlideshowSlidesApi(slides, token) {
  return request('/karyakar/slideshow', {
    method: 'PUT',
    token,
    body: { slides }
  });
}

export async function addSlideshowSlideApi(slide, token) {
  return request('/karyakar/slideshow/slide', {
    method: 'POST',
    token,
    body: slide
  });
}

export async function updateSingleSlideApi(slideId, slide, token) {
  return request(`/karyakar/slideshow/slide/${slideId}`, {
    method: 'PUT',
    token,
    body: slide
  });
}

export async function deleteSlideshowSlideApi(slideId, token) {
  return request(`/karyakar/slideshow/slide/${slideId}`, {
    method: 'DELETE',
    token
  });
}


/**
 * Returns the WebSocket URL for real-time cross-user event broadcasting.
 * Supports all users (Admins & Yuvaks).
 */
export function getRealtimeWebSocketUrl() {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) {
    if (!isLocalhost && (envWsUrl.includes('127.0.0.1') || envWsUrl.includes('localhost'))) {
      return `${PROD_BACKEND_WS}/api/ws`;
    }
    return `${envWsUrl.replace(/\/+$/, '')}/api/ws`;
  }

  if (isLocalhost) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//127.0.0.1:8000/api/ws`;
  }

  return `${PROD_BACKEND_WS}/api/ws`;
}

export function getAdminWebSocketUrl() {
  return getRealtimeWebSocketUrl();
}

/**
 * Returns the Server-Sent Events (SSE) stream URL for all clients.
 */
export function getRealtimeSseUrl() {
  return `${API_BASE_URL}/events/stream`;
}

export function getAdminSseUrl() {
  return getRealtimeSseUrl();
}



