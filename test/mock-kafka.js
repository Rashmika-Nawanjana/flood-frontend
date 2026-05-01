// =============================================
// FloodSense LK — Mock Kafka Broker
// Lightweight HTTP + WebSocket pub/sub that mimics Kafka
//
// How it works:
//   - Producers connect via WebSocket and send:
//     { action: 'publish', topic: 'sensor-updates', message: {...} }
//   - Consumers connect and send:
//     { action: 'subscribe', topics: ['sensor-updates', ...] }
//   - When a message is published, all subscribers to that topic receive it
// =============================================

const http = require('http');
const WebSocket = require('ws');

const PORT = parseInt(process.env.KAFKA_PORT || '19092', 10);
const HOST = '127.0.0.1';

// topic -> Set<ws>
const subscriptions = new Map();
let messageCount = 0;

// Use http.createServer + ws upgrade to bind to 127.0.0.1 specifically
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'mock-kafka', status: 'ok', messages: messageCount }));
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const clientId = req.headers['x-client-id'] || `client-${Date.now()}`;
  ws._clientId = clientId;
  ws._subscribedTopics = new Set();
  console.log(`[MockKafka] Client connected: ${clientId}`);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      console.error('[MockKafka] Invalid JSON:', raw.toString());
      return;
    }

    if (msg.action === 'subscribe') {
      const topics = Array.isArray(msg.topics) ? msg.topics : [msg.topics];
      topics.forEach((topic) => {
        ws._subscribedTopics.add(topic);
        if (!subscriptions.has(topic)) subscriptions.set(topic, new Set());
        subscriptions.get(topic).add(ws);
      });
      console.log(`[MockKafka] ${clientId} subscribed to: ${topics.join(', ')}`);
      ws.send(JSON.stringify({ action: 'subscribed', topics }));
    }

    if (msg.action === 'publish') {
      messageCount++;
      const subscribers = subscriptions.get(msg.topic) || new Set();
      const payload = JSON.stringify({ topic: msg.topic, message: msg.message, offset: messageCount });

      let delivered = 0;
      subscribers.forEach((sub) => {
        if (sub.readyState === WebSocket.OPEN && sub !== ws) {
          sub.send(payload);
          delivered++;
        }
      });

      if (messageCount % 20 === 0) {
        console.log(`[MockKafka] ${msg.topic} → ${delivered} subscriber(s) | total messages: ${messageCount}`);
      }
    }
  });

  ws.on('close', () => {
    ws._subscribedTopics.forEach((topic) => {
      const subs = subscriptions.get(topic);
      if (subs) subs.delete(ws);
    });
    console.log(`[MockKafka] Client disconnected: ${clientId}`);
  });

  ws.on('error', (err) => {
    console.error(`[MockKafka] Client error (${clientId}):`, err.message);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[MockKafka] Broker running on ws://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[MockKafka] Port ${PORT} already in use. Is another instance running?`);
    process.exit(1);
  }
  if (err.code === 'EACCES') {
    console.error(`[MockKafka] Port ${PORT} access denied. Try a different port with KAFKA_PORT env var.`);
    process.exit(1);
  }
  console.error('[MockKafka] Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n[MockKafka] Shutting down...');
  wss.close();
  server.close(() => process.exit(0));
});
