'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: 'user' | 'admin' | 'company';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (role && user.role !== role) {
                // Precise role separation
                if (user.role === 'admin') {
                    router.push('/admin');
                } else if (user.role === 'company') {
                    router.push('/company');
                } else {
                    router.push('/dashboard');
                }
            }
        }
    }, [user, loading, role, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (role && user.role !== role) {
        return null;
    }

    return <>{children}</>;
}
