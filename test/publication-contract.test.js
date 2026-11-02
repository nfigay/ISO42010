import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../scripts/prepare-publication.mjs',import.meta.url),'utf8');
test('publication locale : absence de push dans le mode par défaut',()=>{
  assert.match(code,/if\(!publish\)/);
  assert.match(code,/PUSH=NONE/);
  assert.match(code,/PUBLICATION_MODE=CHECK_ONLY/);
});
test('publication : tests, quatre builds, provenance et hachages',()=>{
  for(const s of ["run('npm',['test'])","run('npm',['run','build'])","source_commit=${sha}","createHash('sha256')",'pages/index.html','standalone/index.html','server/workbench/index.html','modules/workbench/index.html']) assert.ok(code.includes(s),s);
});
test('publication explicite protège git et ne modifie pas Pages',()=>{
  assert.match(code,/origin\/main/);
  assert.match(code,/git\('status','--porcelain'\)/);
  assert.match(code,/PAGES_SOURCE_CONFIG=UNCHANGED/);
});
