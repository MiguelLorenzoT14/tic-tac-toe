import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/types/database-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, X, Circle,
    Crown, Skull, Minus, Swords, TrendingUp, Gamepad2,
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
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

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
            .select('first_name, last_name, x_wins, o_wins, total_games');

        if (allProfiles) {
            const totalX = (allProfiles as any[]).reduce((acc, p) => acc + (p.x_wins || 0), 0);
            const totalO = (allProfiles as any[]).reduce((acc, p) => acc + (p.o_wins || 0), 0);
            setGlobalStats({ x_wins: totalX, o_wins: totalO });

            // Calcular leaderboard (Top por victorias totales)
            const sortedLeaderboard = [...allProfiles as any[]]
                .map(p => ({
                    ...p,
                    total_wins: (p.x_wins || 0) + (p.o_wins || 0)
                }))
                .filter(p => (p.first_name || p.last_name))
                .sort((a, b) => b.total_wins - a.total_wins)
                .slice(0, 5);
            setLeaderboard(sortedLeaderboard);
        }
    }, [user]);

    const fetchRecentMatches = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('matches')
            .select('id, winner, result, opponent_name, created_at, game_type, is_abandoned, my_role')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(8); // Aumentamos a 8 para llenar más espacio si es necesario

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

    const userLevel = Math.floor(stats.total_games / 5) + 1;
    const nextLevelGames = (userLevel * 5) - stats.total_games;
    const levelProgress = ((stats.total_games % 5) / 5) * 100;

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* COLUMNA IZQUIERDA: Acciones y Actividad Reciente */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Sección de Bienvenida de Diseño Premium */}
                        <motion.section
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"
                        >
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                                        ¡Hola, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{displayName || 'Jugador'}</span>!
                                    </h1>
                                    <p className="text-sm sm:text-base mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                                        Nivel {userLevel} • {stats.total_games} partidas jugadas
                                    </p>
                                </div>
                                <div className="flex-1 max-w-xs">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                                        <span>Progreso Nivel {userLevel + 1}</span>
                                        <span>{stats.total_games % 5} / 5</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${levelProgress}%` }}
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        />
                                    </div>
                                    <p className="text-[10px] mt-2 italic opacity-50 text-right">Faltan {nextLevelGames} partidas para el siguiente nivel</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Tarjetas de Juego Principales */}
                        <motion.section
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {/* Tarjeta Jugar con un Amigo */}
                            <div className="relative group">
                                <motion.div
                                    whileHover={saving ? {} : { y: -8, scale: 1.02 }}
                                    className={`p-8 rounded-3xl relative overflow-hidden h-full transition-all border ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-blue-500/50 shadow-2xl shadow-blue-500/10'}`}
                                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                                    onClick={() => !saving && setShowSymbolPicker(!showSymbolPicker)}
                                >
                                    <div className="absolute -top-4 -right-4 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Swords className="w-40 h-40" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20">
                                            {saving ? (
                                                <div className="w-6 h-6 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                            ) : (
                                                <Swords className="w-7 h-7" />
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                                            {saving ? 'Iniciando...' : 'Modo Online'}
                                        </h3>
                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                            Duelo en tiempo real. Envía un enlace a tu rival y demuestra quién manda.
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
                                                className="absolute inset-0 z-50 p-6 rounded-3xl flex flex-col justify-center items-center gap-6 backdrop-blur-xl"
                                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
                                            >
                                                <p className="text-sm font-black uppercase tracking-[0.2em] text-center text-blue-400">
                                                    Escoge tu Bando
                                                </p>
                                                <div className="flex gap-4 w-full max-w-[280px]">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); createOnlineGame('X'); }}
                                                        className="flex-1 flex flex-col items-center p-5 rounded-2xl border-2 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 transition-all text-blue-400 group/btn"
                                                    >
                                                        <X className="w-12 h-12 mb-2 group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Atacante (X)</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); createOnlineGame('O'); }}
                                                        className="flex-1 flex flex-col items-center p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all text-emerald-400 group/btn"
                                                    >
                                                        <Circle className="w-12 h-12 mb-2 group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Defensor (O)</span>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowSymbolPicker(false); }}
                                                    className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                                                >
                                                    Volver
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Tarjeta Jugar vs Máquina */}
                            <motion.div
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="p-8 rounded-3xl relative overflow-hidden group cursor-pointer border transition-all hover:border-purple-500/50 shadow-2xl shadow-purple-500/10"
                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                                onClick={() => navigate('/local-game?mode=AI')}
                            >
                                <div className="absolute -top-4 -right-4 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Bot className="w-40 h-40" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 border border-purple-500/20">
                                        <Bot className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">VS Inteligencia</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                        Entrena tus jugadas contra nuestra IA. Sin esperas, sin lag, puro desafío técnico.
                                    </p>
                                </div>
                            </motion.div>
                        </motion.section>

                        {/* Partidas Recientes (Ahora con más estilo) */}
                        <motion.section
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 lg:p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-3">
                                    <div className="w-2 h-8 bg-purple-500 rounded-full" />
                                    Actividad Reciente
                                </h2>
                                <Link to="/history" className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                    Ver todas
                                </Link>
                            </div>

                            {loadingMatches ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/5" />
                                    ))}
                                </div>
                            ) : recentMatches.length === 0 ? (
                                <div className="py-20 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                                    <Trophy className="mx-auto w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-30">Aún no has librado batallas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recentMatches.map((match, i) => {
                                        const style = getResultStyle(match.result);
                                        const Icon = style.icon;

                                        return (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 + i * 0.05 }}
                                                className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.05] transition-all hover:border-white/10"
                                            >
                                                <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center shrink-0 border border-white/5`}>
                                                    <Icon className={`w-5 h-5 ${style.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-xs font-black uppercase tracking-wider ${style.color}`}>{style.label}</span>
                                                        {match.my_role && (
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${match.my_role === 'X' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{match.my_role}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium truncate opacity-60">
                                                        {match.opponent_name ? `vs ${match.opponent_name}` : 'Duelo Local'}
                                                    </p>
                                                </div>
                                                <div className="text-[10px] font-bold opacity-30 group-hover:opacity-60 transition-opacity uppercase tracking-tighter">
                                                    {formatDate(match.created_at)}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* COLUMNA DERECHA: Sidebar de Estadísticas y Comunidad */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Win Rate Destacado */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-3xl border border-white/5 bg-gradient-to-tr from-white/[0.02] to-transparent relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Eficiencia</h3>
                                <TrendingUp className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="opacity-5" />
                                        <motion.circle
                                            cx="48" cy="48" r="40" fill="transparent" stroke="var(--accent-primary, #a855f7)" strokeWidth="8"
                                            strokeDasharray={251}
                                            initial={{ strokeDashoffset: 251 }}
                                            animate={{ strokeDashoffset: 251 - (251 * winRate) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black tracking-tighter">{winRate}%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black uppercase tracking-tight">Victoria</p>
                                    <p className="text-xs opacity-40 font-medium">Basado en tus últimas {stats.total_games} partidas oficiales.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Grid de Stats 2x2 */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Partidas', value: stats.total_games, icon: Gamepad2, color: 'text-gray-400' },
                                { label: 'Victorias', value: stats.x_wins + stats.o_wins, icon: Crown, color: 'text-emerald-400' },
                                { label: 'Derrotas', value: Math.max(0, stats.total_games - stats.x_wins - stats.o_wins - stats.draws), icon: Skull, color: 'text-red-400' },
                                { label: 'Empates', value: stats.draws, icon: Minus, color: 'text-yellow-400' },
                            ].map((s, idx) => (
                                <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.05 }}
                                    className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{s.label}</span>
                                        <s.icon className={`w-3 h-3 ${s.color} opacity-70`} />
                                    </div>
                                    <span className="text-2xl font-black tracking-tighter">{s.value}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Leaderboard / Top Jugadores */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="p-6 rounded-3xl border border-white/5 bg-white/[0.01]"
                        >
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-2">
                                <Trophy className="w-3 h-3" /> Ranking Comunidad
                            </h3>
                            <div className="space-y-4">
                                {leaderboard.map((player, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 opacity-50'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">
                                                {player.first_name} {player.last_name}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[10px] font-black text-emerald-400">{player.total_wins} WIN</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Victorias Globales */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4"
                        >
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Marcador Global</h3>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <X className="w-3 h-3 text-blue-500" />
                                        <span className="text-xs font-bold text-blue-400">Team X</span>
                                    </div>
                                    <p className="text-xl font-black">{globalStats.x_wins}</p>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="space-y-1 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="text-xs font-bold text-emerald-400">Team O</span>
                                        <Circle className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <p className="text-xl font-black">{globalStats.o_wins}</p>
                                </div>
                            </div>
                        </motion.section>

                    </div>
                </div>
            </main>
        </div>
    );
}
