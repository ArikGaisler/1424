const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { createGame, getGame, removeGame } = require('./game');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const GRACE_PERIOD_MS = 30000;

// token -> { socketId, code }
const tokenMap = new Map();

function getSocketByToken(token) {
  const entry = tokenMap.get(token);
  if (!entry) return null;
  return io.sockets.sockets.get(entry.socketId) || null;
}

function broadcastGameState(game) {
  io.to(game.code).emit('game-state', game.getPublicState());
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('create-game', ({ playerName, token }, cb) => {
    if (!token) return cb({ error: 'Missing token' });
    const game = createGame(token, playerName);
    socket.join(game.code);
    tokenMap.set(token, { socketId: socket.id, code: game.code });
    cb({ success: true, code: game.code });
    broadcastGameState(game);
  });

  socket.on('join-game', ({ code, playerName, token }, cb) => {
    if (!token) return cb({ error: 'Missing token' });
    const game = getGame(code);
    if (!game) return cb({ error: 'Game not found' });

    const result = game.addPlayer(token, playerName);
    if (result.error) return cb({ error: result.error });

    socket.join(game.code);
    tokenMap.set(token, { socketId: socket.id, code: game.code });
    cb({ success: true, code: game.code });
    broadcastGameState(game);
  });

  socket.on('rejoin', ({ token, code }, cb) => {
    if (!token || !code) return cb({ error: 'Missing token or code' });
    const game = getGame(code);
    if (!game) return cb({ error: 'Game not found' });

    if (!game.hasPlayer(token)) return cb({ error: 'Not in this game' });

    // Cancel any pending disconnect timer
    if (game.disconnectTimers[token]) {
      clearTimeout(game.disconnectTimers[token]);
      delete game.disconnectTimers[token];
    }

    game.markReconnected(token);
    socket.join(game.code);
    tokenMap.set(token, { socketId: socket.id, code: game.code });

    console.log(`Player rejoined: token=${token.slice(0, 8)}... room=${code}`);
    cb({ success: true, code: game.code });
    broadcastGameState(game);
  });

  socket.on('start-game', ({ token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });
    if (game.hostId !== token) return cb({ error: 'Only the host can start' });

    const result = game.start();
    if (result.error) return cb({ error: result.error });

    cb({ success: true });
    broadcastGameState(game);
  });

  socket.on('roll-dice', ({ token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });

    const result = game.roll(token);
    if (result.error) return cb({ error: result.error });

    cb({ success: true });
    broadcastGameState(game);
  });

  socket.on('keep-dice', ({ indices, token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });

    const result = game.keepDice(token, indices);
    if (result.error) return cb({ error: result.error });

    cb({ success: true });
    broadcastGameState(game);
  });

  socket.on('stop-turn', ({ token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });

    const result = game.stopTurn(token);
    if (result.error) return cb({ error: result.error });

    cb({ success: true });
    broadcastGameState(game);
  });

  socket.on('play-again', ({ token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });
    if (game.hostId !== token) return cb({ error: 'Only the host can restart' });

    const result = game.playAgain();
    if (result.error) return cb({ error: result.error });

    cb({ success: true });
    broadcastGameState(game);
  });

  socket.on('leave-game', ({ token }, cb) => {
    const entry = tokenMap.get(token);
    if (!entry) return cb({ error: 'Not in a game' });
    const game = getGame(entry.code);
    if (!game) return cb({ error: 'Game not found' });

    if (game.disconnectTimers[token]) {
      clearTimeout(game.disconnectTimers[token]);
      delete game.disconnectTimers[token];
    }

    const remaining = game.removePlayer(token);
    socket.leave(game.code);
    tokenMap.delete(token);

    if (remaining === 0) {
      removeGame(game.code);
    } else {
      broadcastGameState(game);
    }

    cb({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    // Find which token this socket belongs to
    let disconnectedToken = null;
    for (const [token, entry] of tokenMap.entries()) {
      if (entry.socketId === socket.id) {
        disconnectedToken = token;
        break;
      }
    }
    if (!disconnectedToken) return;

    const entry = tokenMap.get(disconnectedToken);
    if (!entry) return;
    const game = getGame(entry.code);
    if (!game) return;

    game.markDisconnected(disconnectedToken);
    broadcastGameState(game);

    // Start grace period
    game.disconnectTimers[disconnectedToken] = setTimeout(() => {
      delete game.disconnectTimers[disconnectedToken];
      console.log(`Grace period expired for token=${disconnectedToken.slice(0, 8)}...`);

      const remaining = game.removePlayer(disconnectedToken);
      tokenMap.delete(disconnectedToken);

      if (remaining === 0) {
        removeGame(game.code);
      } else {
        broadcastGameState(game);
      }
    }, GRACE_PERIOD_MS);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
