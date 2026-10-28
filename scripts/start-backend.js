const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

// Check for venv python binaries first, falling back to system python
const candidatePaths = [
  path.join(rootDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, 'backend', 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, 'backend', '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
];

let pythonExe = candidatePaths.find(p => fs.existsSync(p));

if (!pythonExe) {
  pythonExe = isWin ? 'python' : 'python3';
}

const args = [
  '-m', 'uvicorn', 'app.main:app',
  '--app-dir', 'backend',
  '--host', '127.0.0.1',
  '--port', '8000',
  '--reload'
];

console.log(`\x1b[36m[Backend]\x1b[0m Python executable: ${pythonExe}`);
console.log(`\x1b[36m[Backend]\x1b[0m Starting FastAPI (Uvicorn) on http://127.0.0.1:8000...`);

const child = spawn(pythonExe, args, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWin && !path.isAbsolute(pythonExe),
  env: {
    ...process.env,
    PYTHONPATH: path.join(rootDir, 'backend') + (process.env.PYTHONPATH ? (path.delimiter + process.env.PYTHONPATH) : '')
  }
});

child.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m Failed to start backend:', err.message);
});

child.on('exit', (code, signal) => {
  if (code !== null && code !== 0) {
    console.error(`\x1b[31m[Backend]\x1b[0m Exited with code ${code}`);
  }
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
