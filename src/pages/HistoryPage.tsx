import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Trophy, Swords, Clock, Crown, Skull, Minus, Gamepad2, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Match {
    id: string;
    winner: 'X' | 'O' | 'DRAW';
    moves_count: number | null;
    created_at: string;
    my_role: 'X' | 'O' | null;
    result: 'WIN' | 'LOSS' | 'DRAW' | null;
    opponent_name: string | null;
    game_type: 'local' | 'online' | null;
    is_abandoned: boolean | null;
}

export default function HistoryPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'DRAW'>('ALL');
    const { user } = useAuth();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('matches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                toast.error('Error al cargar historial');
            } else {
                setMatches((data as Match[]) || []);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);



    const filtered = filter === 'ALL'
        ? matches
        : matches.filter(m => m.result === filter);

    const stats = {
        wins: matches.filter(m => m.result === 'WIN').length,
        losses: matches.filter(m => m.result === 'LOSS').length,
        draws: matches.filter(m => m.result === 'DRAW').length,
    };

    const getResultConfig = (result: string | null) => {
        switch (result) {
            case 'WIN': return {
                label: 'Victoria',
                icon: Crown,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                badge: 'bg-emerald-500/20 text-emerald-400',
            };
            case 'LOSS': return {
                label: 'Derrota',
                icon: Skull,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                badge: 'bg-red-500/20 text-red-400',
            };
            case 'DRAW': return {
                label: 'Empate',
                icon: Minus,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/30',
                badge: 'bg-yellow-500/20 text-yellow-400',
            };
            default: return {
                label: 'Partida',
                icon: Gamepad2,
                color: 'text-gray-400',
                bg: 'bg-gray-500/10',
                border: 'border-gray-500/30',
                badge: 'bg-gray-500/20 text-gray-400',
            };
        }
    };

    const getRoleBadge = (role: string | null) => {
        if (role === 'X') return { text: 'X', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
        if (role === 'O') return { text: 'O', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
        return null;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Hace un momento';
        if (mins < 60) return `Hace ${mins} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                <div className="flex items-center justify-between">
                    <Link to="/">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>

                </div>


                <div className="space-y-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Swords className="w-8 h-8 text-purple-400" />
                        Historial de Partidas
                    </h1>

                    {matches.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="glass-panel p-4 text-center border border-emerald-500/20"
                            >
                                <Crown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
                                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Victorias</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="glass-panel p-4 text-center border border-red-500/20"
                            >
                                <Skull className="w-5 h-5 text-red-400 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Derrotas</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="glass-panel p-4 text-center border border-yellow-500/20"
                            >
                                <Minus className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
                                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Empates</p>
                            </motion.div>
                        </div>
                    )}


                    {matches.length > 0 && (
                        <div className="flex gap-2">
                            {(['ALL', 'WIN', 'LOSS', 'DRAW'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                                        ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                                        : 'border border-transparent hover:border-[var(--border-color)]'
                                        }`}
                                    style={filter !== f ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' } : undefined}
                                >
                                    {f === 'ALL' ? 'Todas' : f === 'WIN' ? 'Victorias' : f === 'LOSS' ? 'Derrotas' : 'Empates'}
                                    <span className="ml-1.5 opacity-60">
                                        {f === 'ALL' ? matches.length : matches.filter(m => m.result === f).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-panel p-5 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-700/50" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-700/50 rounded w-1/3" />
                                        <div className="h-3 bg-gray-700/30 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-16 glass-panel rounded-2xl"
                    >
                        <Trophy className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                        <p className="text-xl text-gray-400 font-medium">
                            {filter === 'ALL' ? 'No hay partidas registradas' : 'No hay partidas con ese filtro'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {filter === 'ALL' ? '¡Juega tu primera partida para verla aquí!' : 'Intenta con otro filtro'}
                        </p>
                        {filter === 'ALL' && (
                            <Link to="/" className="mt-6 inline-block">
                                <Button>Jugar Ahora</Button>
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((match, index) => {
                            const config = getResultConfig(match.result);
                            const roleBadge = getRoleBadge(match.my_role);
                            const ResultIcon = config.icon;

                            return (
                                <motion.div
                                    key={match.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className={`glass-panel p-4 sm:p-5 rounded-xl border ${config.border} transition-all`}
                                >
                                    <div className="flex items-center gap-4">

                                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                            <ResultIcon className={`w-6 h-6 ${config.color}`} />
                                        </div>


                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">

                                                <span className={`font-bold ${config.color}`}>
                                                    {config.label}
                                                </span>


                                                {roleBadge && (
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${roleBadge.className}`}>
                                                        Jugaste {roleBadge.text}
                                                    </span>
                                                )}


                                                {match.game_type === 'online' && (
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                                        Con un Amigo
                                                    </span>
                                                )}


                                                {match.is_abandoned && (
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                                                        <Flag className="w-3 h-3" /> Abandono
                                                    </span>
                                                )}
                                            </div>


                                            <div className="flex items-center gap-2 mt-1.5">
                                                {match.opponent_name ? (
                                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        vs <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{match.opponent_name}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Partida local</p>
                                                )}
                                            </div>


                                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                <Clock className="w-3 h-3" />
                                                {formatDate(match.created_at)}
                                            </p>
                                        </div>


                                        <div className="text-right flex-shrink-0">
                                            <div className={`text-3xl font-black ${match.winner === 'X' ? 'text-blue-400/40' :
                                                match.winner === 'O' ? 'text-emerald-400/40' : 'text-purple-400/40'
                                                }`}>
                                                {match.winner === 'DRAW' ? '=' : match.winner}
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                {match.moves_count ? `${match.moves_count} mov.` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
