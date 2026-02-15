import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/types/database-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, X, Circle, History as HistoryIcon,
    Crown, Skull, Minus, Swords, TrendingUp, Gamepad2, Clock,
    Bot
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type Player = 'X' | 'O';

interface Stats {
    x_wins: number;
    o_wins: number;
    draws: number;
    total_games: number;
}

interface RecentMatch {
    id: string;
    winner: 'X' | 'O' | 'DRAW';
    result: 'WIN' | 'LOSS' | 'DRAW' | null;
    opponent_name: string | null;
    created_at: string;
    game_type: 'local' | 'online' | null;
    is_abandoned: boolean | null;
    my_role: 'X' | 'O' | null;
}

export default function GamePage() {
    const { user, displayName } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({ x_wins: 0, o_wins: 0, draws: 0, total_games: 0 });
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSymbolPicker, setShowSymbolPicker] = useState(false);

    const [globalStats, setGlobalStats] = useState({ x_wins: 0, o_wins: 0 });

    const fetchStats = useCallback(async () => {
        if (!user) return;

        // Perfil del usuario actual
        const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userData) {
            const p = userData as any;
            setStats({
                x_wins: p.x_wins || 0,
                o_wins: p.o_wins || 0,
                draws: p.draws || 0,
                total_games: p.total_games || 0,
            });
        }

        // Estadísticas globales (Suma de todos los jugadores)
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('x_wins, o_wins');

        if (allProfiles) {
            const totalX = (allProfiles as any[]).reduce((acc, p) => acc + (p.x_wins || 0), 0);
            const totalO = (allProfiles as any[]).reduce((acc, p) => acc + (p.o_wins || 0), 0);
            setGlobalStats({ x_wins: totalX, o_wins: totalO });
        }
    }, [user]);

    const fetchRecentMatches = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('matches')
            .select('id, winner, result, opponent_name, created_at, game_type, is_abandoned, my_role')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setRecentMatches(data as RecentMatch[]);
        setLoadingMatches(false);
    }, [user]);

    useEffect(() => {
        fetchStats();
        fetchRecentMatches();
    }, [fetchStats, fetchRecentMatches]);

    const createOnlineGame = async (mySymbol: Player) => {
        if (!user) return;
        setSaving(true);
        setShowSymbolPicker(false);
        try {
            let finalName = displayName;
            if (!finalName || finalName.includes('@')) {
                const { data } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    const profileData = data as any;
                    if (profileData.first_name || profileData.last_name) {
                        finalName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
                    }
                }
            }
            const myName = finalName || user.email || 'Desconocido';

            const gameData: Database['public']['Tables']['games']['Insert'] = {
                status: 'WAITING',
                player_x: null,
                player_o: null,
                player_x_name: null,
                player_o_name: null,
            };

            if (mySymbol === 'X') {
                gameData.player_x = user.id;
                gameData.player_x_name = myName;
            } else {
                gameData.player_o = user.id;
                gameData.player_o_name = myName;
            }

            const { data, error } = await supabase.from('games').insert(gameData as any).select().single();
            if (error) throw error;
            if (data) navigate(`/game/${(data as any).id}`);
        } catch {
            toast.error('No se pudo crear la partida online');
        } finally {
            setSaving(false);
        }
    };

    const winRate = stats.total_games > 0
        ? Math.round(((stats.x_wins + stats.o_wins) / stats.total_games) * 100)
        : 0;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const getResultStyle = (result: string | null) => {
        switch (result) {
            case 'WIN': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Crown, label: 'Victoria' };
            case 'LOSS': return { color: 'text-red-400', bg: 'bg-red-500/10', icon: Skull, label: 'Derrota' };
            case 'DRAW': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Minus, label: 'Empate' };
            default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Gamepad2, label: 'Partida' };
        }
    };

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="py-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            ¡Hola, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{displayName || 'Jugador'}</span>!
                        </h1>
                        <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-muted)' }}>
                            {stats.total_games === 0
                                ? 'Comienza tu primera partida'
                                : `${stats.total_games} partidas jugadas`
                            }
                        </p>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {/* Tarjeta Jugar con un Amigo (Online) */}
                    <div className="relative group">
                        <motion.div
                            whileHover={saving ? {} : { y: -5 }}
                            className={`p-6 rounded-2xl relative overflow-hidden h-full ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                            onClick={() => !saving && setShowSymbolPicker(!showSymbolPicker)}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Swords className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                    ) : (
                                        <Swords className="w-6 h-6" />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold mb-2">
                                    {saving ? 'Iniciando...' : 'Jugar con un Amigo'}
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    Invita a alguien mediante un enlace y jugad online.
                                </p>
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {showSymbolPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSymbolPicker(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute inset-0 z-50 p-6 rounded-2xl flex flex-col justify-center items-center gap-4 backdrop-blur-md"
                                        style={{ backgroundColor: 'var(--bg-secondary)ee' }}
                                    >
                                        <p className="text-sm font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-primary)' }}>
                                            Elige tu símbolo
                                        </p>
                                        <div className="flex gap-4 w-full max-w-[240px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); createOnlineGame('X'); }}
                                                className="flex-1 flex flex-col items-center p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 transition-all text-blue-400 group/btn"
                                            >
                                                <X className="w-10 h-10 mb-2 group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold">Primero</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); createOnlineGame('O'); }}
                                                className="flex-1 flex flex-col items-center p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all text-emerald-400 group/btn"
                                            >
                                                <Circle className="w-10 h-10 mb-2 group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold">Segundo</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSymbolPicker(false); }}
                                            className="text-xs font-medium underline" style={{ color: 'var(--text-muted)' }}
                                        >
                                            Cancelar
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tarjeta Jugar vs Máquina (Local) */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-6 rounded-2xl relative overflow-hidden group cursor-pointer"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                        onClick={() => navigate('/local-game?mode=AI')}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Bot className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Jugar vs Máquina</h3>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Pon a prueba tus habilidades contra la IA en modo local.
                            </p>
                        </div>
                    </motion.div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                >
                    <div className="rounded-xl p-4 sm:p-5 space-y-1" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Partidas</span>
                            <Gamepad2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black">{stats.total_games}</p>
                    </div>

                    <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-4 sm:p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-500/70 font-medium uppercase tracking-wider">Victorias</span>
                            <Crown className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-emerald-400">{stats.x_wins + stats.o_wins}</p>
                    </div>

                    <div className="bg-red-500/[0.04] border border-red-500/10 rounded-xl p-4 sm:p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-red-500/70 font-medium uppercase tracking-wider">Derrotas</span>
                            <Skull className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-red-400">
                            {Math.max(0, stats.total_games - stats.x_wins - stats.o_wins - stats.draws)}
                        </p>
                    </div>

                    <div className="bg-yellow-500/[0.04] border border-yellow-500/10 rounded-xl p-4 sm:p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-yellow-500/70 font-medium uppercase tracking-wider">Empates</span>
                            <Minus className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-yellow-400">{stats.draws}</p>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                >
                    <div className="bg-purple-500/[0.04] border border-purple-500/10 rounded-xl p-4 sm:p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-500/70 font-medium uppercase tracking-wider">Win Rate General</span>
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl sm:text-4xl font-black text-purple-400">{winRate}%</p>
                            <div className="w-32 bg-white/5 rounded-full h-1.5 mb-3 hidden sm:block">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${winRate}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl p-4 sm:p-5 space-y-1 border border-blue-500/10 bg-blue-500/[0.02]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-500/70 font-medium uppercase tracking-wider">Victorias Mundiales (X)</span>
                            <X className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-400">{globalStats.x_wins}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Logros de toda la comunidad</p>
                    </div>

                    <div className="rounded-xl p-4 sm:p-5 space-y-1 border border-emerald-500/10 bg-emerald-500/[0.02]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-500/70 font-medium uppercase tracking-wider">Victorias Mundiales (O)</span>
                            <Circle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{globalStats.o_wins}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Logros de toda la comunidad</p>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <HistoryIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            Partidas Recientes
                        </h2>
                        <Link to="/history" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                            Ver todo →
                        </Link>
                    </div>

                    {loadingMatches ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="rounded-lg p-4 animate-pulse" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3.5 rounded w-24" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                                            <div className="h-2.5 rounded w-16" style={{ backgroundColor: 'var(--bg-tertiary)', opacity: 0.5 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentMatches.length === 0 ? (
                        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                            <Trophy className="mx-auto w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sin partidas aún</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentMatches.map((match, i) => {
                                const style = getResultStyle(match.result);
                                const Icon = style.icon;

                                return (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 + i * 0.05 }}
                                        className="rounded-lg p-3 sm:p-4 flex items-center gap-3 transition-colors group"
                                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                                    >
                                        <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-4 h-4 ${style.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${style.color}`}>{style.label}</span>
                                                {match.my_role && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.my_role === 'X' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{match.my_role}</span>
                                                )}
                                            </div>
                                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                {match.opponent_name ? `vs ${match.opponent_name}` : 'Partida local'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                                            <Clock className="w-3 h-3" />
                                            {formatDate(match.created_at)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </main>
        </div>
    );
}
