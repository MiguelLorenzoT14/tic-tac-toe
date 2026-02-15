
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [urlError, setUrlError] = useState<string | null>(null);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const error = params.get('error_description');
            if (error) {
                setUrlError(error.replace(/\+/g, ' '));
                return;
            }
        }

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && !urlError) {
                setUrlError('No se encontró una sesión válida. Por favor, solicita un nuevo enlace de recuperación.');
            }
        };
        checkSession();
    }, [urlError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (urlError) {
            toast.error(urlError);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(password);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error('No se pudo actualizar la contraseña. Es posible que el enlace haya expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-md space-y-6"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        {urlError ? 'Error de Recuperación' : 'Nueva Contraseña'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {urlError ? 'Hubo un problema con tu enlace' : 'Ingresa tu nueva contraseña para recuperar el acceso'}
                    </p>
                </div>

                {urlError ? (
                    <div className="space-y-6 text-center">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {urlError}
                        </div>
                        <Button onClick={() => navigate('/login')} className="w-full" size="lg">
                            Volver al Inicio de Sesión
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading} size="lg">
                            Cambiar Contraseña
                        </Button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
