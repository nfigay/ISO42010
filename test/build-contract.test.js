import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('../',import.meta.url);
const read = f => fs.readFileSync(new URL(f,root),'utf8');
test('Vite entry is isolated without mutating published docs/index.html',()=>{
 const html=read('index.html');
 assert.match(html,/<script type="module" src="\/src\/main.js"><\/script>/);
 assert.match(read('docs/index.html'),/JAVASCRIPT APPLICATION LOGIC/);
});
test('legacy onclick actions exposed by module entry',()=>{
 const app=read('src/main.js');
 assert.match(app,/window\.editElement = editElement/);
 assert.match(app,/window\.deleteElement = deleteElement/);
 assert.match(app,/import\('\.\/storage\/workspace-repository\.js'\)/);
});
test('the build has four independent target modes',()=>{
 const config=read('vite.config.js');
 for (const m of ['standalone','server','modules','pages']) assert.match(config,new RegExp(`\\b${m}\\b`));
 assert.match(read('scripts/build-targets.mjs'),/BUILD_TARGETS=OK/);
});
