#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// Load .env if present
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (e) {}

async function start() {
  const token = process.env.NGROK_AUTHTOKEN;
  if (!token) {
    console.error('NGROK_AUTHTOKEN is not set. Set it in .env or environment.');
    process.exit(1);
  }

  // Ensure authtoken is installed into ngrok config
  try {
    console.log('Installing ngrok authtoken (writes to user ngrok config)');
    spawnSync('ngrok authtoken ' + token, { stdio: 'inherit', shell: true });
  } catch (e) {
    // ignore
  }

  console.log('\n🚀 Starting ngrok tunnel (backend: http://localhost:8000)');
  const ngrokProc = spawn('ngrok http 8000 --log=stdout', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    shell: true,
  });

  console.log('🚀 Starting Next.js dev server on http://localhost:3000\n');
  const next = spawn('npx next dev', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    shell: true,
  });

  const cleanup = () => {
    console.log('\n⏹️  Shutting down ngrok and Next dev server...');
    try {
      ngrokProc.kill();
    } catch (e) {}
    next.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// spawn and spawnSync already imported above

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
