import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type PlayerSymbol = 'X' | 'O';
export type GameMode = 'FRIEND' | 'AI';
export type GameStatus = 'PLAYING' | 'FINISHED';

function calculateWinner(squares: (PlayerSymbol | null)[]): PlayerSymbol | 'DRAW' | null {
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


function minimax(board: (PlayerSymbol | null)[], depth: number, isMaximizing: boolean, aiSymbol: PlayerSymbol): number {
    const winner = calculateWinner(board);
    const opponentSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    if (winner === aiSymbol) return 10 - depth;
    if (winner === opponentSymbol) return depth - 10;
    if (winner === 'DRAW') return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (!board[i]) {
                board[i] = aiSymbol;
                const score = minimax(board, depth + 1, false, aiSymbol);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (!board[i]) {
                board[i] = opponentSymbol;
                const score = minimax(board, depth + 1, true, aiSymbol);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function getBestMove(board: (PlayerSymbol | null)[], aiSymbol: PlayerSymbol): number {
    const playingPerfect = Math.random() > 0.3;

    if (!playingPerfect) {
        const availableMoves = board.map((val, idx) => val === null ? idx : null).filter((v): v is number => v !== null);
        if (availableMoves.length > 0) {
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    }

    let bestScore = -Infinity;
    let moves: number[] = [];

    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = aiSymbol;
            const score = minimax(board, 0, false, aiSymbol);
            board[i] = null;

            if (score > bestScore) {
                bestScore = score;
                moves = [i];
            } else if (score === bestScore) {
                moves.push(i);
            }
        }
    }

    if (moves.length > 0) {
        return moves[Math.floor(Math.random() * moves.length)];
    }
    return -1;
}

export function useLocalGame(mode: GameMode, userSymbol: PlayerSymbol = 'X') {
    const { user } = useAuth();
    const [board, setBoard] = useState<(PlayerSymbol | null)[]>(Array(9).fill(null));
    const [turn, setTurn] = useState<PlayerSymbol>('X');
    const [status, setStatus] = useState<GameStatus>('PLAYING');
    const [winner, setWinner] = useState<PlayerSymbol | 'DRAW' | null>(null);
    const [gameResetCount, setGameResetCount] = useState(0);
    const hasRecordedRef = useRef(false);

    const aiSymbol: PlayerSymbol = userSymbol === 'X' ? 'O' : 'X';

    const recordMatch = useCallback(async (winnerResult: PlayerSymbol | 'DRAW', finalBoard: (PlayerSymbol | null)[]) => {
        if (!user || mode !== 'AI' || hasRecordedRef.current) return;
        hasRecordedRef.current = true;

        const role = userSymbol;
        let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
        if (winnerResult !== 'DRAW') {
            result = winnerResult === role ? 'WIN' : 'LOSS';
        }

        try {
            await (supabase.from('matches') as any).insert({
                user_id: user.id,
                winner: winnerResult,
                board_final: finalBoard,
                moves_count: finalBoard.filter((c) => c !== null).length,
                my_role: role,
                result,
                opponent_name: 'Máquina',
                game_type: 'local',
                is_abandoned: false,
            });

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
                await (supabase.from('profiles') as any).update(updateData).eq('id', user.id);
            }
        } catch (error) {
            console.error('Error recording local match:', error);
        }
    }, [user, mode, userSymbol]);

    const handleMove = useCallback((index: number) => {
        if (board[index] || winner || status !== 'PLAYING') return;

        if (mode === 'AI' && turn !== userSymbol) return;

        const newBoard = [...board];
        newBoard[index] = turn;

        const result = calculateWinner(newBoard);
        setBoard(newBoard);

        if (result) {
            setWinner(result);
            setStatus('FINISHED');
            recordMatch(result, newBoard);
            return;
        }

        setTurn(turn === 'X' ? 'O' : 'X');
    }, [board, winner, status, turn, mode, userSymbol, recordMatch]);


    useEffect(() => {
        if (mode === 'AI' && turn === aiSymbol && status === 'PLAYING' && !winner) {
            const timer = setTimeout(() => {
                const move = getBestMove(board, aiSymbol);
                if (move !== -1) {
                    const newBoard = [...board];
                    newBoard[move] = aiSymbol;
                    const result = calculateWinner(newBoard);
                    setBoard(newBoard);

                    if (result) {
                        setWinner(result);
                        setStatus('FINISHED');
                        recordMatch(result, newBoard);
                        return;
                    }
                    setTurn(userSymbol);
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [mode, turn, aiSymbol, status, winner, board, userSymbol, recordMatch]);

    const resetGame = useCallback(() => {
        setBoard(Array(9).fill(null));
        setTurn('X');
        setStatus('PLAYING');
        setWinner(null);
        setGameResetCount(c => c + 1);
        hasRecordedRef.current = false;
        toast.success('¡Partida reiniciada!');
    }, []);

    return {
        board,
        turn,
        status,
        winner,
        gameResetCount,
        handleMove,
        resetGame,
    };
}
