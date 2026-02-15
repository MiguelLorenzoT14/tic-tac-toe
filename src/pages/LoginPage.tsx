
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const { signInWithPassword, signUp, resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isRecovery) {
            await resetPasswordForEmail(email);
            setIsRecovery(false);
        } else if (isLogin) {
            await signInWithPassword(email, password);
        } else {
            await signUp(email, password, firstName, lastName);
        }
        setLoading(false);
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
                        {isRecovery ? 'Recuperar Contraseña' : (isLogin ? '¡Bienvenido de nuevo!' : 'Crear Cuenta')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isRecovery
                            ? 'Ingresa tu correo para recibir un enlace de recuperación'
                            : (isLogin ? 'Ingresa tus credenciales para continuar' : 'Regístrate para comenzar a jugar')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && !isRecovery && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="Miguel"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Apellido</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="García"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            placeholder="tu@ejemplo.com"
                            required
                        />
                    </div>
                    {!isRecovery && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsRecovery(true)}
                                        className="text-xs hover:underline transition-all"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
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
                    )}

                    <Button type="submit" className="w-full" isLoading={loading} size="lg">
                        {isRecovery ? 'Enviar Enlace' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                    </Button>
                </form>

                <div className="text-center space-y-4">
                    <button
                        onClick={() => {
                            if (isRecovery) {
                                setIsRecovery(false);
                            } else {
                                setIsLogin(!isLogin);
                            }
                        }}
                        className="text-sm transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {isRecovery
                            ? 'Volver al inicio de sesión'
                            : (isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
