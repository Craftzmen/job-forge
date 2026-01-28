'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'company';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get('access_token');
            if (token) {
                try {
                    const response = await api.get('/auth/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    Cookies.remove('access_token');
                    Cookies.remove('refresh_token');
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = async (credentials: any) => {
        const response = await api.post('/auth/login/', credentials);
        const { access, refresh } = response.data;
        Cookies.set('access_token', access);
        Cookies.set('refresh_token', refresh);

        const userResponse = await api.get('/auth/me/');
        const userData = userResponse.data;
        setUser(userData);

        if (userData.role === 'admin') {
            router.push('/admin');
        } else if (userData.role === 'company') {
            router.push('/company');
        } else {
            router.push('/dashboard');
        }
    };

    const register = async (data: any) => {
        await api.post('/auth/register/', data);
        router.push('/login');
    };

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
