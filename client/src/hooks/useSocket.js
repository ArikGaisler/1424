import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

function getOrCreateToken() {
  let token = sessionStorage.getItem('player-token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('player-token', token);
  }
  return token;
}

function getSavedRoom() {
  return sessionStorage.getItem('room-code');
}

function saveRoom(code) {
  if (code) sessionStorage.setItem('room-code', code);
}

function clearRoom() {
  sessionStorage.removeItem('room-code');
}

export function useSocket() {
  const socketRef = useRef(null);
  const tokenRef = useRef(getOrCreateToken());
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  const token = tokenRef.current;

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      const savedRoom = getSavedRoom();
      if (savedRoom) {
        socket.emit('rejoin', { token, code: savedRoom }, (res) => {
          if (res?.error) {
            clearRoom();
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game-state', (state) => {
      setGameState(state);
      setError(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const emit = useCallback((event, data = {}) => {
    return new Promise((resolve) => {
      socketRef.current?.emit(event, data, (response) => {
        if (response?.error) {
          setError(response.error);
          resolve(response);
        } else {
          setError(null);
          resolve(response);
        }
      });
    });
  }, []);

  const createGame = useCallback(async (playerName) => {
    const res = await emit('create-game', { playerName, token });
    if (res.success) saveRoom(res.code);
    return res;
  }, [emit, token]);

  const joinGame = useCallback(async (code, playerName) => {
    const res = await emit('join-game', { code, playerName, token });
    if (res.success) saveRoom(res.code);
    return res;
  }, [emit, token]);

  const startGame = useCallback(() => emit('start-game', { token }), [emit, token]);
  const rollDice = useCallback(() => emit('roll-dice', { token }), [emit, token]);
  const keepDice = useCallback((indices) => emit('keep-dice', { indices, token }), [emit, token]);
  const stopTurn = useCallback(() => emit('stop-turn', { token }), [emit, token]);
  const playAgain = useCallback(() => emit('play-again', { token }), [emit, token]);

  const leaveGame = useCallback(() => {
    clearRoom();
    setGameState(null);
    setError(null);
  }, []);

  return {
    connected,
    playerId: token,
    gameState,
    error,
    setError,
    createGame,
    joinGame,
    startGame,
    rollDice,
    keepDice,
    stopTurn,
    playAgain,
    leaveGame,
    clearRoom,
  };
}
