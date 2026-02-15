
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    displayName: string | null;
    signIn: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    googleSignIn: () => Promise<void>;
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.user) fetchDisplayName(session.user.id);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.user) fetchDisplayName(session.user.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchDisplayName = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();

        const profile = data as any;

        if (profile && (profile.first_name || profile.last_name)) {
            setDisplayName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
        }
    };

    const signIn = async (email: string) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });
            if (error) throw error;
            toast.success('Check your login email!');
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    }
                }
            });
            if (error) throw error;


            if (data.user) {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        first_name: firstName,
                        last_name: lastName,
                    } as any);
                setDisplayName(`${firstName} ${lastName}`.trim());
            }

            toast.success('Registration successful! Please check your email to verify.');
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    const signInWithPassword = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            toast.success('Welcome back!');
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    const googleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setDisplayName(null);
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const value = React.useMemo(() => ({
        session, user, loading, displayName, signIn, signOut, googleSignIn, signUp, signInWithPassword
    }), [session, user, loading, displayName]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
