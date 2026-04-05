import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['offscreen.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: 'offscreen.bundle.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  inject: ['./shim.js'],
  alias: {
    'url': './browser-shims/url.js',
    'fs': './browser-shims/fs.js',
    'path': './browser-shims/path.js',
  },
});
