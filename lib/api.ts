export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // FIXED: Properly handles fallback URLs without causing a parsing crash
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://domainassess-rmb9.onrender.com' 
    : 'http://localhost:5000');
    
  const token = typeof window !== 'undefined' ? localStorage.getItem('domainassess_admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Inject JWT token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  
  // Globally handle token expiration or unauthorized access
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('domainAssess_auth');
    localStorage.removeItem('domainassess_admin_token');
    localStorage.removeItem('domainassess_admin_name');
    window.location.href = '/admin/login';
  }

  return res;
}