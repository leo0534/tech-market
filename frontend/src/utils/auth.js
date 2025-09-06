// Eliminar cualquier process.env, usar valores fijos
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isVerified = () => {
  const user = getCurrentUser();
  return user?.isVerified || false;
};

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const setAuthData = (accessToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

export const logout = async () => {
  try {
    // Intentar hacer logout en el backend
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
  } catch (error) {
    console.warn('Error durante logout del backend:', error);
  } finally {
    // Siempre limpiar datos locales y redirigir
    clearAuthData();
    window.location.href = '/';
  }
};

export const requireAuth = (nextState, replace, callback) => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  callback();
};

export const requireVerified = (nextState, replace, callback) => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  
  if (!isVerified()) {
    window.location.href = '/verification';
    return;
  }
  
  callback();
};