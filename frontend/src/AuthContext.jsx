import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Vérifier le token au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Vérifier si le token est valide en faisant une requête
          const response = await fetch('/api/themes', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            // Le token est valide, récupérer les infos utilisateur du token
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            setUser({
              id: payload.id,
              username: payload.username,
              email: payload.email,
              role: payload.role || 'student'
            });
            setToken(storedToken);
          } else {
            // Token invalide, le supprimer
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }

    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role || 'student'
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);

    return data;
  };

  const register = async (username, email, password) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur d\'inscription');
    }

    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role || 'student'
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);

    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    getAuthHeaders,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
