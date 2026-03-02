const { randomInt } = require('crypto');

const TOTAL_DICE = 6;
const REQUIRED = [1, 4];

function rollDice(count) {
  return Array.from({ length: count }, () => randomInt(1, 7));
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function calculateScore(keptDice) {
  const sorted = [...keptDice].sort((a, b) => a - b);
  let has1 = false;
  let has4 = false;
  const scoringDice = [];

  for (const d of sorted) {
    if (!has1 && d === 1) { has1 = true; continue; }
    if (!has4 && d === 4) { has4 = true; continue; }
    scoringDice.push(d);
  }

  if (!has1 || !has4) return { qualified: false, score: 0 };
  return { qualified: true, score: scoringDice.reduce((s, v) => s + v, 0) };
}

function createPlayerTurnState() {
  return {
    keptDice: [],
    currentRoll: [],
    rollNumber: 0,
    finished: false,
    score: null,
  };
}

class Game {
  constructor(hostToken, hostName) {
    this.code = generateRoomCode();
    this.hostId = hostToken;
    this.players = [{ id: hostToken, name: hostName, disconnected: false }];
    this.waitingPlayers = [];
    this.state = 'lobby'; // lobby | playing | results
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.turns = {};
    this.scores = {};
    this.finalScores = [];
    this.disconnectTimers = {};
  }

  addPlayer(token, name) {
    const allPlayers = [...this.players, ...this.waitingPlayers];
    if (allPlayers.find(p => p.id === token)) return { error: 'Already in game' };
    if (allPlayers.length >= 8) return { error: 'Game is full (max 8 players)' };

    if (this.state !== 'lobby') {
      this.waitingPlayers.push({ id: token, name, disconnected: false });
      return { success: true, waiting: true };
    }

    this.players.push({ id: token, name, disconnected: false });
    return { success: true };
  }

  removePlayer(token) {
    this.players = this.players.filter(p => p.id !== token);
    this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== token);
    if (this.disconnectTimers[token]) {
      clearTimeout(this.disconnectTimers[token]);
      delete this.disconnectTimers[token];
    }
    if (token === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }
    return this.players.length + this.waitingPlayers.length;
  }

  markDisconnected(token) {
    const player = this.players.find(p => p.id === token) ||
                   this.waitingPlayers.find(p => p.id === token);
    if (player) player.disconnected = true;
  }

  markReconnected(token) {
    const player = this.players.find(p => p.id === token) ||
                   this.waitingPlayers.find(p => p.id === token);
    if (player) {
      player.disconnected = false;
      return true;
    }
    return false;
  }

  hasPlayer(token) {
    return !!(this.players.find(p => p.id === token) ||
              this.waitingPlayers.find(p => p.id === token));
  }

  start() {
    if (this.players.length < 2) return { error: 'Need at least 2 players' };
    this.state = 'playing';
    this.currentPlayerIndex = 0;
    this.turns = {};
    this.scores = {};
    this.finalScores = [];
    for (const p of this.players) {
      this.turns[p.id] = createPlayerTurnState();
      this.scores[p.id] = null;
    }
    return { success: true };
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  roll(token) {
    if (this.state !== 'playing') return { error: 'Game not in progress' };
    const current = this.getCurrentPlayer();
    if (current.id !== token) return { error: 'Not your turn' };

    const turn = this.turns[token];
    if (turn.finished) return { error: 'Turn already finished' };

    const diceToRoll = TOTAL_DICE - turn.keptDice.length;
    if (diceToRoll <= 0) return { error: 'No dice left to roll' };

    turn.currentRoll = rollDice(diceToRoll);
    turn.rollNumber++;
    return { success: true, roll: turn.currentRoll };
  }

  keepDice(token, indicesToKeep) {
    if (this.state !== 'playing') return { error: 'Game not in progress' };
    const current = this.getCurrentPlayer();
    if (current.id !== token) return { error: 'Not your turn' };

    const turn = this.turns[token];
    if (turn.finished) return { error: 'Turn already finished' };
    if (turn.currentRoll.length === 0) return { error: 'Roll first' };
    if (!indicesToKeep || indicesToKeep.length === 0) return { error: 'Must keep at least 1 die' };

    const uniqueIndices = [...new Set(indicesToKeep)];
    if (uniqueIndices.some(i => i < 0 || i >= turn.currentRoll.length)) {
      return { error: 'Invalid die index' };
    }

    const kept = uniqueIndices.map(i => turn.currentRoll[i]);
    turn.keptDice.push(...kept);
    turn.currentRoll = [];

    const allKept = turn.keptDice.length >= TOTAL_DICE;
    if (allKept) {
      return this._finishTurn(token);
    }

    return { success: true, keptDice: turn.keptDice, diceRemaining: TOTAL_DICE - turn.keptDice.length };
  }

  stopTurn(token) {
    if (this.state !== 'playing') return { error: 'Game not in progress' };
    const current = this.getCurrentPlayer();
    if (current.id !== token) return { error: 'Not your turn' };

    const turn = this.turns[token];
    if (turn.finished) return { error: 'Turn already finished' };
    if (turn.currentRoll.length > 0) return { error: 'Must keep dice from current roll first' };
    if (turn.rollNumber === 0) return { error: 'Must roll at least once' };

    return this._finishTurn(token);
  }

  _finishTurn(token) {
    const turn = this.turns[token];
    turn.finished = true;

    const result = calculateScore(turn.keptDice);
    turn.score = result;
    this.scores[token] = result;

    const allDone = this.players.every(p => this.turns[p.id].finished);
    if (allDone) {
      this._finishRound();
      return { success: true, turnScore: result, roundFinished: true, finalScores: this.finalScores };
    }

    this.currentPlayerIndex++;
    return { success: true, turnScore: result, roundFinished: false };
  }

  _finishRound() {
    this.state = 'results';
    this.finalScores = this.players.map(p => ({
      id: p.id,
      name: p.name,
      keptDice: this.turns[p.id].keptDice,
      ...this.scores[p.id],
    })).sort((a, b) => {
      if (a.qualified && !b.qualified) return -1;
      if (!a.qualified && b.qualified) return 1;
      return b.score - a.score;
    });
  }

  _promoteWaitingPlayers() {
    for (const wp of this.waitingPlayers) {
      if (this.players.length < 8) {
        this.players.push(wp);
      }
    }
    this.waitingPlayers = [];
  }

  playAgain() {
    this.round++;
    this._promoteWaitingPlayers();
    return this.start();
  }

  getPublicState() {
    const currentPlayer = this.state === 'playing' ? this.getCurrentPlayer() : null;
    return {
      code: this.code,
      state: this.state,
      round: this.round,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.id === this.hostId,
        disconnected: p.disconnected,
        turnState: this.turns[p.id] ? {
          keptDice: this.turns[p.id].keptDice,
          currentRoll: this.turns[p.id].currentRoll,
          rollNumber: this.turns[p.id].rollNumber,
          finished: this.turns[p.id].finished,
          score: this.turns[p.id].score,
        } : null,
      })),
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      finalScores: this.finalScores,
      waitingPlayers: this.waitingPlayers.map(p => ({ id: p.id, name: p.name, disconnected: p.disconnected })),
    };
  }
}

const rooms = new Map();

function createGame(hostToken, hostName) {
  const game = new Game(hostToken, hostName);
  rooms.set(game.code, game);
  return game;
}

function getGame(code) {
  return rooms.get(code?.toUpperCase()) || null;
}

function removeGame(code) {
  rooms.delete(code);
}

module.exports = { createGame, getGame, removeGame, calculateScore };
