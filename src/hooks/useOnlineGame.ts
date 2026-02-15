import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../lib/types/database-types';

export type Player = 'X' | 'O';
export type GameStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

type BroadcastEvent =
    | { type: 'player_joined'; playerId: string; playerName: string; role: Player }
    | { type: 'move'; board: (Player | null)[]; turn: Player; winner: Player | 'DRAW' | null; status: GameStatus }
    | { type: 'game_abandoned'; abandonedBy: string; abandonerName: string; winnerSymbol: Player }
    | { type: 'game_cancelled' }
    | { type: 'rematch_request'; requestorName: string }
    | { type: 'game_reset'; newTurn: Player };


function calculateWinner(squares: (Player | null)[]): Player | 'DRAW' | null {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return squares.every((s) => s !== null) ? 'DRAW' : null;
}

async function fetchPlayerName(userId: string): Promise<string> {
    const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

    const profile = data as any;

    if (profile && (profile.first_name || profile.last_name)) {
        return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Desconocido';
}

const isEmail = (n: string) => n && n.includes('@');


export function useOnlineGame() {
    const { id } = useParams<{ id: string }>();
    const { user, displayName } = useAuth();
    const navigate = useNavigate();


    const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
    const [status, setStatus] = useState<GameStatus>('WAITING');
    const [turn, setTurn] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [playerRole, setPlayerRole] = useState<Player | 'SPECTATOR'>('SPECTATOR');


    const [playerXName, setPlayerXName] = useState('Esperando...');
    const [playerOName, setPlayerOName] = useState('Esperando...');
    const [playerXId, setPlayerXId] = useState<string | null>(null);
    const [playerOId, setPlayerOId] = useState<string | null>(null);
    const [gameResetCount, setGameResetCount] = useState(0);


    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAbandonModal, setShowAbandonModal] = useState(false);
    const [abandoning, setAbandoning] = useState(false);
    const [isAbandonedGame, setIsAbandonedGame] = useState(false);


    const [waitingForRematch, setWaitingForRematch] = useState(false);
    const [rematchIncoming, setRematchIncoming] = useState<string | null>(null);


    const channelRef = useRef<RealtimeChannel | null>(null);
    const hasJoinedRef = useRef(false);
    const hasRecordedFinishRef = useRef(false);
    const statusRef = useRef<GameStatus>('WAITING');
    const isAbandonedGameRef = useRef(false);

    useEffect(() => {
        statusRef.current = status;
        isAbandonedGameRef.current = isAbandonedGame;
    }, [status, isAbandonedGame]);


    const recordMatchForUser = useCallback(async (
        userId: string,
        role: Player,
        winnerResult: Player | 'DRAW',
        finalBoard: (Player | null)[],
        opponentName: string,
        isAbandoned: boolean = false,
    ) => {
        let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
        if (winnerResult !== 'DRAW') {
            result = winnerResult === role ? 'WIN' : 'LOSS';
        }

        await (supabase.from('matches') as any).insert({
            user_id: userId,
            winner: winnerResult,
            board_final: finalBoard,
            moves_count: finalBoard.filter((c) => c !== null).length,
            my_role: role,
            result,
            opponent_name: opponentName,
            game_type: 'online',
            is_abandoned: isAbandoned,
        });

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profile) {
            const p = profile as any;
            const updateData: any = {
                total_games: (p.total_games || 0) + 1,
                updated_at: new Date().toISOString()
            };

            if (winnerResult === 'DRAW') {
                updateData.draws = (p.draws || 0) + 1;
            } else if (winnerResult === role) {
                const wCol = role === 'X' ? 'x_wins' : 'o_wins';
                updateData[wCol] = (p[wCol] || 0) + 1;
            } else {
                const lCol = role === 'X' ? 'x_losses' : 'o_losses';
                updateData[lCol] = (p[lCol] || 0) + 1;
            }
            await (supabase.from('profiles') as any).update(updateData).eq('id', userId);
        }
    }, []);


    const broadcast = useCallback((event: BroadcastEvent) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'game_event',
                payload: event,
            });
        }
    }, []);


    useEffect(() => {
        if (!user) return;
        if (user.id === playerXId) {
            setPlayerRole('X');
        } else if (user.id === playerOId) {
            setPlayerRole('O');
        } else {
            setPlayerRole('SPECTATOR');
        }
    }, [user?.id, playerXId, playerOId]);


    useEffect(() => {

        if (!id || !user?.id) return;
        let mounted = true;

        const init = async () => {

            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (!mounted) return;

            if (error || !data) {
                toast.error('Partida no encontrada', { id: 'toast-not-found' });
                navigate('/');
                return;
            }

            const game = data as any;

            setBoard((game.board as (Player | null)[]) || Array(9).fill(null));
            setStatus(game.status as GameStatus);
            setTurn((game.current_turn as Player) || 'X');
            setWinner(game.winner as Player | 'DRAW' | null);

            if (game.player_x) setPlayerXId(game.player_x);
            if (game.player_o) setPlayerOId(game.player_o);


            if (game.player_x_name && !isEmail(game.player_x_name)) {
                setPlayerXName(game.player_x_name);
            } else if (game.player_x) {
                setPlayerXName(await fetchPlayerName(game.player_x));
            }

            if (game.player_o_name && !isEmail(game.player_o_name)) {
                setPlayerOName(game.player_o_name);
            } else if (game.player_o) {
                setPlayerOName(await fetchPlayerName(game.player_o));
            }

            if (game.status === 'FINISHED') {
                hasRecordedFinishRef.current = true;
                if (game.abandoned_by) setIsAbandonedGame(true);
            }


            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }

            const channel = supabase.channel(`game-broadcast-${id}`, {
                config: { broadcast: { self: false } },
            });

            channel
                .on('broadcast', { event: 'game_event' }, (msg) => {
                    if (!mounted) return;
                    const event = msg.payload as BroadcastEvent;

                    switch (event.type) {
                        case 'player_joined': {
                            if (event.role === 'X') {
                                setPlayerXName(event.playerName);
                                setPlayerXId(event.playerId);
                            } else {
                                setPlayerOName(event.playerName);
                                setPlayerOId(event.playerId);
                            }
                            setStatus('PLAYING');
                            toast.success('¡La partida ha comenzado!', { id: 'toast-start' });
                            break;
                        }
                        case 'move': {
                            setBoard(event.board);
                            setTurn(event.turn);
                            setStatus(event.status);
                            if (event.winner) setWinner(event.winner);
                            break;
                        }
                        case 'game_abandoned': {
                            setStatus('FINISHED');
                            setWinner(event.winnerSymbol);
                            setIsAbandonedGame(true);
                            toast.success(`🏆 ${event.abandonerName} abandonó la partida. ¡Ganaste!`, { duration: 5000, id: 'toast-abandoned' });
                            break;
                        }
                        case 'game_cancelled': {
                            toast('La partida ha sido cancelada.', { icon: '🚫', id: 'toast-cancelled' });
                            navigate('/');
                            break;
                        }
                        case 'rematch_request': {
                            if (!waitingForRematch) setRematchIncoming(event.requestorName);
                            break;
                        }
                        case 'game_reset': {
                            setBoard(Array(9).fill(null));
                            setStatus('PLAYING');
                            setWinner(null);
                            setTurn(event.newTurn);
                            setIsAbandonedGame(false);
                            hasRecordedFinishRef.current = false;
                            setWaitingForRematch(false);
                            setRematchIncoming(null);
                            setGameResetCount((c) => c + 1);
                            toast.success('¡Nueva partida comenzada!', { id: 'new-game-started' });
                            break;
                        }
                    }
                })
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` },
                    async (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['games']['Row']>) => {
                        if (!mounted) return;
                        const newGame = payload.new as Database['public']['Tables']['games']['Row'];

                        const currentStatus = statusRef.current;
                        if (newGame.status && newGame.status !== currentStatus) {
                            if (newGame.status === 'PLAYING' && currentStatus === 'FINISHED') {
                                setBoard(newGame.board as (Player | null)[]);
                                setStatus('PLAYING');
                                setWinner(null);
                                setTurn(newGame.current_turn as Player);
                                setIsAbandonedGame(false);
                                hasRecordedFinishRef.current = false;
                                setWaitingForRematch(false);
                                setRematchIncoming(null);
                                setGameResetCount((c) => c + 1);
                            }

                            if (newGame.status === 'PLAYING') {
                                setStatus('PLAYING'); // <-- FIX: Update local status!
                                if (newGame.player_x && newGame.player_x !== playerXId) {
                                    setPlayerXId(newGame.player_x);
                                    if (newGame.player_x_name) setPlayerXName(newGame.player_x_name);
                                }
                                if (newGame.player_o && newGame.player_o !== playerOId) {
                                    setPlayerOId(newGame.player_o);
                                    if (newGame.player_o_name) setPlayerOName(newGame.player_o_name);
                                }
                                toast.success('¡La partida ha comenzado!', { id: 'toast-start' });
                            }
                        }

                        if (newGame.status === 'FINISHED' && newGame.abandoned_by && !isAbandonedGameRef.current) {
                            setIsAbandonedGame(true);
                            setWinner(newGame.winner as Player | 'DRAW' | null);
                        }
                    }
                )
                .subscribe();
            channelRef.current = channel;

            if (!mounted) return;


            const isAlreadyPlayer = user.id === game.player_x || user.id === game.player_o;
            if (!isAlreadyPlayer && (!game.player_x || !game.player_o) && !hasJoinedRef.current) {
                hasJoinedRef.current = true;

                let myRealName = displayName;
                if (!myRealName || myRealName.includes('@')) {
                    const fetched = await fetchPlayerName(user.id);
                    if (fetched !== 'Desconocido') myRealName = fetched;
                }
                const myName = myRealName || user.email || 'Desconocido';
                const joiningAsX = !game.player_x;

                const updateData: Database['public']['Tables']['games']['Update'] = { status: 'PLAYING' };
                if (joiningAsX) {
                    updateData.player_x = user.id;
                    updateData.player_x_name = myName;
                    setPlayerXName(myName);
                    setPlayerXId(user.id);
                } else {
                    updateData.player_o = user.id;
                    updateData.player_o_name = myName;
                    setPlayerOName(myName);
                    setPlayerOId(user.id);
                }
                setStatus('PLAYING');

                if (!mounted) return;
                const { error: joinError } = await (supabase.from('games') as any).update(updateData).eq('id', id);
                if (joinError) {
                    toast.error('No se pudo unir a la partida', { id: 'toast-join-error' });
                    navigate('/');
                    return;
                }

                toast.success('¡Te uniste a la partida!', { id: 'toast-joined' });
                broadcast({
                    type: 'player_joined',
                    playerId: user.id,
                    playerName: myName,
                    role: joiningAsX ? 'X' : 'O',
                });
            }

            setLoading(false);
        };

        init();

        return () => {
            mounted = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

    }, [id, user?.id, user?.email, displayName, broadcast, navigate, waitingForRematch]);


    useEffect(() => {
        if (status !== 'FINISHED' || !winner || !user || hasRecordedFinishRef.current) return;
        if (playerRole === 'SPECTATOR') return;

        hasRecordedFinishRef.current = true;
        const myOpponent = playerRole === 'X' ? playerOName : playerXName;
        recordMatchForUser(user.id, playerRole as Player, winner, board, myOpponent, isAbandonedGame);
    }, [status, winner, user, playerRole, board, playerXName, playerOName, isAbandonedGame, recordMatchForUser]);


    const handleMove = useCallback(async (index: number) => {
        if (!id || board[index] || winner || status !== 'PLAYING') return;
        if (playerRole !== turn) return;

        const newBoard = [...board];
        newBoard[index] = playerRole;

        const result = calculateWinner(newBoard);
        const nextTurn: Player = result ? turn : (turn === 'X' ? 'O' : 'X');
        const nextStatus: GameStatus = result ? 'FINISHED' : 'PLAYING';

        setBoard(newBoard);
        setTurn(nextTurn);
        setStatus(nextStatus);
        if (result) setWinner(result);

        broadcast({
            type: 'move',
            board: newBoard,
            turn: nextTurn,
            winner: result,
            status: nextStatus,
        });

        (supabase
            .from('games') as any)
            .update({ board: newBoard, current_turn: nextTurn, status: nextStatus, winner: result })
            .eq('id', id)
            .then();

        if (result) {
            hasRecordedFinishRef.current = true;
            const myOpponent = playerRole === 'X' ? playerOName : playerXName;
            if (user) {
                await recordMatchForUser(user.id, playerRole as Player, result, newBoard, myOpponent);
            }
        }
    }, [id, board, winner, status, playerRole, turn, broadcast, user, playerOName, playerXName, recordMatchForUser]);

    const handleCancelGame = useCallback(async () => {
        if (!id) return;
        try {
            broadcast({ type: 'game_cancelled' });
            await supabase.from('games').delete().eq('id', id);
            toast.success('Partida cancelada', { id: 'toast-cancel' });
            navigate('/');
        } catch {
            toast.error('Error al cancelar', { id: 'toast-cancel-error' });
        }
    }, [id, broadcast, navigate]);

    const handleAbandonGame = useCallback(async () => {
        if (!id || !user || playerRole === 'SPECTATOR') return;
        setAbandoning(true);
        try {
            const winnerSymbol: Player = playerRole === 'X' ? 'O' : 'X';
            const myName = displayName || user.email || 'Desconocido';

            broadcast({
                type: 'game_abandoned',
                abandonedBy: user.id,
                abandonerName: myName,
                winnerSymbol,
            });

            await (supabase
                .from('games') as any)
                .update({ status: 'FINISHED', winner: winnerSymbol, abandoned_by: user.id })
                .eq('id', id);

            hasRecordedFinishRef.current = true;
            const myOpponent = playerRole === 'X' ? playerOName : playerXName;
            await recordMatchForUser(user.id, playerRole as Player, winnerSymbol, board, myOpponent, true);

            toast.error('Has abandonado la partida. Se registró como derrota.', { duration: 4000, id: 'toast-abandon-result' });
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error('Error al abandonar la partida', { id: 'toast-abandon-error' });
        } finally {
            setAbandoning(false);
            setShowAbandonModal(false);
        }
    }, [id, user, playerRole, displayName, broadcast, playerOName, playerXName, recordMatchForUser, board, navigate]);

    const requestRematch = useCallback(() => {
        if (isAbandonedGame) return;
        setWaitingForRematch(true);
        const myName = displayName || user?.email || 'Jugador';
        broadcast({ type: 'rematch_request', requestorName: myName });
        toast.success('Solicitud de revancha enviada', { id: 'rematch-sent' });
    }, [isAbandonedGame, displayName, user, broadcast]);

    const acceptRematch = useCallback(async () => {
        if (!id || isAbandonedGame) return;
        const startTurn = 'X';
        const emptyBoard = Array(9).fill(null);

        setBoard(emptyBoard);
        setStatus('PLAYING');
        setWinner(null);
        setTurn(startTurn);
        setIsAbandonedGame(false);
        setRematchIncoming(null);
        hasRecordedFinishRef.current = false;
        setGameResetCount((c) => c + 1);

        toast.success('¡Revancha aceptada!', { id: 'rematch-accepted' });

        broadcast({ type: 'game_reset', newTurn: startTurn });

        await (supabase.from('games') as any).update({
            board: emptyBoard,
            status: 'PLAYING',
            winner: null,
            current_turn: startTurn,
            abandoned_by: null,
        }).eq('id', id);
    }, [id, isAbandonedGame, broadcast]);

    const copyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('¡Link copiado!');
    }, []);

    return {

        board,
        status,
        turn,
        winner,
        playerRole,
        playerXName,
        playerOName,
        copied,
        loading,
        showAbandonModal,
        abandoning,
        isAbandonedGame,
        waitingForRematch,
        rematchIncoming,
        gameResetCount,



        handleMove,
        handleCancelGame,
        handleAbandonGame,
        copyLink,
        setShowAbandonModal,
        navigate,
        requestRematch,
        acceptRematch,
    };
}
