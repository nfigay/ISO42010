import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('preview and dev resolve their default Vite modes to server', () => {
  const config = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(config, /mode === 'development' \|\| mode === 'production'/);
  assert.match(config, /targets\[targetMode\]/);
  assert.match(config, /targetMode === 'standalone'/);
  assert.match(config, /targetMode === 'modules'/);
  assert.match(config, /targetMode === 'pages'/);
});

test('npm preview uses the server build target', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url), 'utf8'));
  assert.match(pkg.scripts.preview, /vite preview --mode server/);
});
