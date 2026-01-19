import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../config/api'; // Use the configured axios instance

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Token exists, verify it with the backend
                    const res = await apiClient.get('/auth/me');
                    setUser(res.data); // The /auth/me endpoint returns the UserWithAccounts object
                } catch (error) {
                    // Token is invalid or expired
                    console.error("Session validation failed", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/auth/login', { username, password });
            const { access_token, user } = res.data;

            localStorage.setItem('token', access_token);
            setUser(user);
            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error('Login error', error);
            setLoading(false);
            return { success: false, message: error.response?.data?.detail || 'Login failed' };
        }
    };

    const register = async (userData) => {
        // Expects userData = { firstName, lastName, email, username, password }
        setLoading(true);
        try {
            await apiClient.post('/auth/register', {
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                username: userData.username,
                password: userData.password,
                initial_deposit: 0 // Or get this from form
            });
            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error('Registration error', error);
            setLoading(false);
            return { success: false, message: error.response?.data?.detail || 'Registration failed' };
        }
    };

    const logout = () => {
        // Even with JWT, calling logout can be useful for server-side logging
        apiClient.post('/auth/logout').catch(err => console.error("Logout API call failed", err));
        
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};