import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
for (const mode of ['standalone','server','modules','pages']) {
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--mode',mode], {stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const p of ['standalone/index.html','server/workbench/index.html','modules/workbench/index.html','pages/index.html','pages/.nojekyll']) {
  if (!fs.existsSync(path.resolve('dist',p))) throw new Error(`Artefact absent: dist/${p}`);
}
const standaloneDir=path.resolve('dist/standalone');
const standaloneFiles=fs.readdirSync(standaloneDir,{recursive:true}).filter(x=>!x.endsWith('.map')&&!x.endsWith('.DS_Store'));
if (standaloneFiles.some(f=>f!=='index.html')) throw new Error(`Standalone non autonome: ${standaloneFiles.join(', ')}`);
console.log('BUILD_TARGETS=OK — standalone, server, modules, pages');
