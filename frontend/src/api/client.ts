const BASE_URL = '/api/v1';

class ApiError extends Error {
  public status: number;
  public data: any;
  
  constructor(status: number, data: any) {
    super(data?.detail || 'An error occurred');
    this.status = status;
    this.data = data;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-unauthorized'));
  }

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(response.status, data);
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const apiClient = {
  get: (url: string) => fetchWithAuth(url),
  post: (url: string, body: any) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(body) }),
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};
