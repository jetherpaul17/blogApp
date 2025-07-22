import React, { createContext, useContext, useReducer } from 'react';

// Auth Context
const AuthContext = createContext();

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
      };
    case 'CLEAR_LOADING':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

// Auth State Provider
const AuthState = ({ children }) => {
  const initialState = {
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false,
    loading: false,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize user from stored token on app load
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken) {
        const user = {
          id: decodedToken.id,
          username: decodedToken.username || 'User',
          email: decodedToken.email,
          isAdmin: decodedToken.isAdmin || false,
          role: decodedToken.isAdmin ? 'admin' : 'user' // Set role based on isAdmin field
        };
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: token,
            user: user
          },
        });
        
        console.log('User initialized from token:', user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Login User
  const login = async (formData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      console.log('Attempting login with:', formData);
      
      const res = await fetch('https://blogapp-fkb5.onrender.com/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      console.log('Login response:', data);
      
      if (res.ok && (data.token || data.access)) {
        const token = data.token || data.access;
        localStorage.setItem('token', token);
        
        // Try to decode token to get user info
        const decodedToken = decodeToken(token);
        const user = data.user || (decodedToken ? { 
          id: decodedToken.id,
          username: decodedToken.username || 'User',
          email: decodedToken.email || formData.email,
          isAdmin: decodedToken.isAdmin || false,
          role: decodedToken.isAdmin ? 'admin' : 'user' // Set role based on isAdmin field
        } : { username: 'User', email: formData.email, isAdmin: false, role: 'user' });
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: token,
            user: user
          },
        });
        
        console.log('Login successful! User:', user);
      } else {
        console.error('Login failed:', data.message || 'Unknown error');
        dispatch({ type: 'LOGIN_FAIL' });
      }
      
      return { ...data, token: data.token || data.access };
    } catch (err) {
      console.error('Login error:', err);
      dispatch({ type: 'LOGIN_FAIL' });
      throw err;
    }
  };

  // Register User
  const register = async (formData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      console.log('Attempting registration with:', formData);
      
      const res = await fetch('https://blogapp-fkb5.onrender.com/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      console.log('Registration response:', data);
      
      if (res.ok) {
        // Registration successful, but don't auto-login
        console.log('Registration successful:', data);
        dispatch({ type: 'CLEAR_LOADING' }); // Reset loading state without clearing auth
      } else {
        console.error('Registration failed:', data.message || 'Unknown error');
        dispatch({ type: 'LOGIN_FAIL' });
      }
      
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      dispatch({ type: 'LOGIN_FAIL' });
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthState');
  }
  return context;
};

export default AuthState;
