// =============================================
// FloodSense LK — Test Environment Orchestrator
// Starts all services in the correct order:
//   1. Mock Kafka Broker (port 9092)
//   2. Mock API Server (port 5000)
//   3. Socket.IO Server (port 3001)
//   4. Mock Kafka Producer (event generator)
//
// Usage: cd test && npm start
// Then in another terminal: cd web && npm run dev
// =============================================

const { spawn } = require('child_process');
const path = require('path');

const processes = [];

function startProcess(name, script, cwd, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`  Starting: ${name}`);
      console.log(`${'═'.repeat(50)}\n`);

      const proc = spawn('node', [script], {
        cwd: cwd || __dirname,
        stdio: 'inherit',
        env: { ...process.env },
      });

      proc.on('error', (err) => {
        console.error(`[${name}] Failed to start:`, err.message);
      });

      proc.on('exit', (code) => {
        console.log(`[${name}] Exited with code ${code}`);
      });

      processes.push({ name, proc });
      resolve(proc);
    }, delay);
  });
}

async function main() {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║    FloodSense LK — Test Environment          ║
  ║                                               ║
  ║    Mock Kafka     → ws://127.0.0.1:19092       ║
  ║    Mock API       → http://127.0.0.1:5000      ║
  ║    Socket.IO      → http://localhost:3001      ║
  ║    Dashboard      → http://localhost:3000      ║
  ║                   (start separately)           ║
  ╚══════════════════════════════════════════════╝
  `);

  // 1. Mock Kafka Broker — must start first (0ms delay)
  await startProcess(
    'Mock Kafka Broker',
    'mock-kafka.js',
    __dirname,
    0
  );

  // 2. Mock API Server — independent, start after 1s
  await startProcess(
    'Mock API Server',
    'mock-api-server.js',
    __dirname,
    1000
  );

  // 3. Socket.IO Server — needs Kafka, start after 2s
  await startProcess(
    'Socket.IO Server',
    'server.js',
    path.join(__dirname, '..', 'sockets'),
    2000
  );

  // 4. Mock Kafka Producer — needs Kafka, start after 4s
  await startProcess(
    'Mock Kafka Producer',
    'mock-kafka-producer.js',
    __dirname,
    3000
  );

  console.log('\n[TestEnv] All services started! Open http://localhost:3000 in your browser.');
  console.log('[TestEnv] Press Ctrl+C to stop all services.\n');
}

// ── Graceful shutdown ────────────────────────────────
function shutdown() {
  console.log('\n[TestEnv] Shutting down all services...');
  processes.forEach(({ name, proc }) => {
    try {
      proc.kill('SIGINT');
      console.log(`[TestEnv] Stopped ${name}`);
    } catch (e) {
      // Process may have already exited
    }
  });
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(console.error);
