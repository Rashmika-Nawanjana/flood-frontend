/**
 * Routing smoke tests — no test framework required.
 * Verifies REST API goes through Kong and WebSocket connects on the correct path.
 *
 * Usage:
 *   GATEWAY_URL=https://flood-stg.157-245-102-69.sslip.io node scripts/test-routing.js
 *
 * Requires Node 18+ (built-in fetch).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { io } = require("socket.io-client");

const GATEWAY = process.env.GATEWAY_URL || "https://flood-stg.157-245-102-69.sslip.io";
const WS_URL  = process.env.WS_URL || GATEWAY;
const WS_PATH = "/ws/live/socket.io";

let passed = 0;
let failed = 0;

function ok(name) {
  console.log(`  pass  ${name}`);
  passed++;
}

function fail(name, reason) {
  console.error(`  FAIL  ${name}`);
  console.error(`        ${reason}`);
  failed++;
}

// ─── Print all response headers ──────────────────────────────────────────────

async function showHeaders(endpoint) {
  console.log(`\n== Response headers: ${endpoint} ==`);
  let res;
  try {
    res = await fetch(`${GATEWAY}${endpoint}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error(`  Could not reach ${endpoint}: ${e.message}`);
    return;
  }

  console.log(`  Status: ${res.status} ${res.statusText}`);
  console.log("  Headers:");

  // Kong-specific headers listed first so they stand out
  const kongHeaders = [
    "x-kong-upstream-latency",
    "x-kong-proxy-latency",
    "x-kong-request-id",
    "via",
    "server",
  ];

  for (const key of kongHeaders) {
    const value = res.headers.get(key);
    if (value !== null) {
      console.log(`    [kong]  ${key}: ${value}`);
    }
  }

  // All remaining headers
  for (const [key, value] of res.headers.entries()) {
    if (!kongHeaders.includes(key)) {
      console.log(`            ${key}: ${value}`);
    }
  }
}

// ─── REST / Kong checks ───────────────────────────────────────────────────────

async function checkKongHeaders() {
  console.log("\n-- REST API -> Kong routing --");

  let res;
  try {
    res = await fetch(`${GATEWAY}/v1/sensors`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    fail("GET /v1/sensors reachable", e.message);
    return;
  }

  // Any non-5xx proves Caddy + Kong received the request
  if (res.status < 500) {
    ok(`GET /v1/sensors responded (${res.status})`);
  } else {
    fail(`GET /v1/sensors responded (${res.status})`, "5xx - Kong or upstream may be down");
  }

  const kongLatency = res.headers.get("x-kong-upstream-latency");
  const kongProxy   = res.headers.get("x-kong-proxy-latency");

  if (kongLatency !== null) {
    ok(`X-Kong-Upstream-Latency present (${kongLatency} ms)`);
  } else {
    fail(
      "X-Kong-Upstream-Latency header missing",
      "Request did not pass through Kong — check NEXT_PUBLIC_GATEWAY_URL and Caddy->Kong routing"
    );
  }

  if (kongProxy !== null) {
    ok(`X-Kong-Proxy-Latency present (${kongProxy} ms)`);
  } else {
    fail("X-Kong-Proxy-Latency header missing", "Request did not pass through Kong");
  }

  const server = res.headers.get("server") || "";
  if (server.toLowerCase().includes("vercel")) {
    fail(
      `Server header is Vercel (${server})`,
      "Request is hitting the Vercel frontend, not Kong — NEXT_PUBLIC_GATEWAY_URL is wrong or not set in Vercel"
    );
  } else {
    ok(`Server header: "${server}" (not Vercel)`);
  }
}

async function checkAuthEndpoint() {
  console.log("\n-- Auth endpoint reachable through Kong --");

  let res;
  try {
    res = await fetch(`${GATEWAY}/api/auth/me`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    fail("GET /api/auth/me reachable", e.message);
    return;
  }

  // 401/403 = correct (no token sent). 404 = Kong has no route for /api
  if (res.status === 401 || res.status === 403) {
    ok(`GET /api/auth/me returned ${res.status} (expected — no token sent)`);
  } else if (res.status === 404) {
    fail("GET /api/auth/me returned 404", "Kong has no route for /api — check Konnect route config");
  } else {
    ok(`GET /api/auth/me returned ${res.status}`);
  }
}

// ─── WebSocket checks ─────────────────────────────────────────────────────────

function checkWebSocket() {
  console.log("\n-- WebSocket -> correct Socket.IO path --");

  return new Promise((resolve) => {
    const socket = io(WS_URL, {
      path: WS_PATH,
      transports: ["websocket"],
      timeout: 8000,
      reconnection: false,
    });

    const timer = setTimeout(() => {
      fail(
        `Socket.IO connect to ${WS_URL} path ${WS_PATH}`,
        "Timed out — check WS_URL and that /ws/* is routed in Caddy to api:8000"
      );
      socket.disconnect();
      resolve();
    }, 9000);

    socket.on("connect", () => {
      clearTimeout(timer);
      ok(`Socket.IO connected (id=${socket.id})`);
      ok(`Path ${WS_PATH} is correct`);
      socket.disconnect();
      resolve();
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      fail(`Socket.IO connect to ${WS_URL} path ${WS_PATH}`, err.message);
      socket.disconnect();
      resolve();
    });
  });
}

function checkWrongPath() {
  console.log("\n-- Default /socket.io path should be rejected --");

  return new Promise((resolve) => {
    const socket = io(WS_URL, {
      path: "/socket.io",        // default path — backend does NOT use this
      transports: ["websocket"],
      timeout: 5000,
      reconnection: false,
    });

    const timer = setTimeout(() => {
      ok("Default /socket.io path correctly rejected (no server on this path)");
      socket.disconnect();
      resolve();
    }, 6000);

    socket.on("connect", () => {
      clearTimeout(timer);
      fail(
        "Default /socket.io path should be rejected",
        "Connected unexpectedly — backend may be responding on the wrong path"
      );
      socket.disconnect();
      resolve();
    });

    socket.on("connect_error", () => {
      clearTimeout(timer);
      ok("Default /socket.io path correctly rejected");
      socket.disconnect();
      resolve();
    });
  });
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nFloodSense routing smoke tests`);
  console.log(`Gateway : ${GATEWAY}`);
  console.log(`WS URL  : ${WS_URL}`);
  console.log(`WS path : ${WS_PATH}`);

  await showHeaders("/v1/sensors");
  await showHeaders("/api/auth/me");

  await checkKongHeaders();
  await checkAuthEndpoint();
  await checkWebSocket();
  await checkWrongPath();

  console.log(`\n${"─".repeat(44)}`);
  console.log(`  Passed: ${passed}   Failed: ${failed}`);
  console.log(`${"─".repeat(44)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
