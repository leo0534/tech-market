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

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  window.location.href = '/';
};