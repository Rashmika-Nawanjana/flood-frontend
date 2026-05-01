// =============================================
// FloodSense LK — Socket.IO Real-Time Server
// Consumes events from Kafka (or mock Kafka broker)
// and pushes them to connected dashboard clients.
//
// Listens on: http://localhost:3001 (path: /ws/live)
// =============================================

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');

// ── Config ───────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const SOCKET_PATH = process.env.SOCKET_PATH || '/ws/live';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const KAFKA_URL = process.env.KAFKA_URL || 'ws://localhost:19092';

// ── HTTP + Socket.IO ─────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  path: SOCKET_PATH,
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ── Track connected clients ──────────────────────────
let clientCount = 0;

io.on('connection', (socket) => {
  clientCount++;
  console.log(`[SocketIO] Client connected: ${socket.id} (${clientCount} total)`);

  // ── Room subscriptions ────────────────────────────
  socket.on('subscribe:region', (regionId) => {
    socket.join(`region:${regionId}`);
    console.log(`[SocketIO] ${socket.id} joined room region:${regionId}`);
  });

  socket.on('subscribe:sensor', (sensorId) => {
    socket.join(`sensor:${sensorId}`);
    console.log(`[SocketIO] ${socket.id} joined room sensor:${sensorId}`);
  });

  // ── Disconnect ────────────────────────────────────
  socket.on('disconnect', (reason) => {
    clientCount--;
    console.log(`[SocketIO] Client disconnected: ${socket.id} (${reason}) — ${clientCount} remaining`);
  });
});

// ── Kafka Topic → Socket.IO Event Mapping ────────────
const TOPIC_EVENT_MAP = {
  'sensor-updates':     'sensor:update',
  'zone-risk-updates':  'zone:risk:update',
  'predictions':        'prediction:new',
  'alerts-new':         'alert:new',
  'alerts-resolved':    'alert:resolved',
  'sensor-offline':     'sensor:offline',
  'anomalies':          'anomaly:new',
};

const ALL_TOPICS = Object.keys(TOPIC_EVENT_MAP);

// ── Connect to Kafka (Mock Broker) ───────────────────
function connectToKafka() {
  console.log(`[SocketIO] Connecting to Kafka broker at ${KAFKA_URL}...`);

  const kafka = new WebSocket(KAFKA_URL, {
    headers: { 'x-client-id': 'socketio-server' },
  });

  kafka.on('open', () => {
    console.log('[SocketIO] Connected to Kafka broker');
    kafka.send(JSON.stringify({
      action: 'subscribe',
      topics: ALL_TOPICS,
    }));
  });

  kafka.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }

    // Ignore non-message payloads (e.g. subscription confirmations)
    if (!data.topic || !data.message) return;

    const eventName = TOPIC_EVENT_MAP[data.topic];
    if (!eventName) return;

    const payload = data.message;

    // Broadcast strategy:
    //   sensor:update → also to region room
    //   zone:risk:update → also to region room
    //   everything → broadcast to all connected clients
    switch (data.topic) {
      case 'sensor-updates':
        io.emit(eventName, payload);
        if (payload.zone_id) {
          io.to(`region:${payload.zone_id}`).emit(eventName, payload);
        }
        break;

      case 'zone-risk-updates':
        io.emit(eventName, payload);
        if (payload.zone_id) {
          io.to(`region:${payload.zone_id}`).emit(eventName, payload);
        }
        break;

      default:
        // All other events: broadcast to everyone
        io.emit(eventName, payload);
        break;
    }
  });

  kafka.on('close', () => {
    console.warn('[SocketIO] Kafka connection lost. Reconnecting in 3s...');
    setTimeout(connectToKafka, 3000);
  });

  kafka.on('error', (err) => {
    console.error('[SocketIO] Kafka connection error:', err.message);
    // on('close') will fire after this, triggering reconnect
  });
}

// ── Start Server ─────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[SocketIO] Server running on http://localhost:${PORT}`);
  console.log(`[SocketIO] Socket.IO path: ${SOCKET_PATH}`);
  console.log(`[SocketIO] CORS origin: ${CORS_ORIGIN}`);

  // Connect to Kafka after server is ready
  connectToKafka();
});

// ── Graceful shutdown ────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[SocketIO] Shutting down...');
  io.close();
  server.close(() => process.exit(0));
});
