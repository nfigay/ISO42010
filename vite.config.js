import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';
import fs from 'node:fs';

const root = import.meta.dirname;
const input = resolve(root, 'index.html');
const targets = { standalone:'standalone', server:'server/workbench', modules:'modules/workbench', pages:'pages' };
function makeNoJekyll() {
  return {name:'iso42010-nojekyll', closeBundle() {
    const dir=resolve(root,'dist/pages'); fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(resolve(dir,'.nojekyll'),'');
  }};
}
export default defineConfig(({mode}) => {
  // Dev and Preview use development/production by default. Treat both as web server mode.
  const targetMode = (mode === 'development' || mode === 'production') ? 'server' : mode;
  if (!targets[targetMode]) throw new Error(`Mode de build inconnu: ${mode}`);
  const standalone = targetMode === 'standalone';
  const modular = targetMode === 'modules';
  const pages = targetMode === 'pages';
  return {
    base:pages ? '/ISO42010/' : './',
    plugins:[...(standalone?[viteSingleFile({useRecommendedBuildConfig:true})]:[]),...(pages?[makeNoJekyll()]:[])],
    build:{outDir:resolve(root,'dist',targets[targetMode]),emptyOutDir:true,target:'esnext',
      minify:!modular, sourcemap:modular,cssCodeSplit:!standalone,
      rollupOptions:{input, ...(modular?{output:{preserveModules:true,preserveModulesRoot:root,entryFileNames:'modules/[name].js',chunkFileNames:'modules/[name].js'}}:{})}
    }
  };
});
