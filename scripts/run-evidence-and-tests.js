const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  console.log('1. Starting Next.js server on port 3000...');
  const nextProcess = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
    shell: true,
    stdio: 'inherit',
  });

  try {
    console.log('2. Waiting for http://localhost:3000 to be responsive...');
    await waitForServer('http://localhost:3000');
    console.log('   Next.js is up and responding at http://localhost:3000!\n');

    console.log('3. Running capture-evidence.js to generate fresh screenshots...');
    execSync('node scripts/capture-evidence.js', { stdio: 'inherit', env: { ...process.env, TEST_URL: 'http://localhost:3000' } });
    console.log('   Evidence screenshots updated successfully in ./evidence/!\n');

    console.log('4. Executing Authoritative Playwright CLI Test Suite...');
    execSync('npx playwright test', { stdio: 'inherit', env: { ...process.env, TEST_URL: 'http://localhost:3000' } });
    console.log('   All 6 Playwright CLI test scenarios passed successfully!\n');

  } finally {
    console.log('5. Stopping Next.js server...');
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${nextProcess.pid} /T /F`);
      } catch {}
    } else {
      nextProcess.kill();
    }
    console.log('   Next.js server stopped cleanly.');
  }
}

main().catch((err) => {
  console.error('Execution failed:', err.message);
  process.exit(1);
});
