import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

const tsPlugin = () => typescript({
  tsconfig: './tsconfig.json',
  declaration: false,
  sourceMap: true,
});

const getPlugins = (isEsm = false) => [
  tsPlugin(),
  resolve(),
  commonjs(),
  terser(),
  ...(isEsm ? [visualizer({ filename: 'stats.html', gzipSize: true, open: false })] : []),
];

const external = ['three'];

export default [
  // 1. CommonJS
  {
    input: 'src/index.ts',
    external,
    output: { file: 'dist/rack3d-visualizer.cjs.js', format: 'cjs', sourcemap: true, exports: 'auto' },
    plugins: getPlugins(),
  },

  // 2. ES Module
  {
    input: 'src/index.ts',
    external,
    output: { file: 'dist/rack3d-visualizer.esm.js', format: 'es', sourcemap: true },
    plugins: getPlugins(true),
  },

  // 3. UMD
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/rack3d-visualizer.umd.js',
      format: 'umd',
      name: 'Rack3DVisualizer',
      globals: { three: 'THREE' },
      sourcemap: true,
    },
    plugins: getPlugins(),
  },

  // 4. Type declarations bundle
  {
    input: 'src/index.ts',
    external,
    output: { file: 'dist/index.d.ts', format: 'es', sourcemap: false },
    plugins: [typescript({ tsconfig: './tsconfig.json', declaration: false, sourceMap: false }), dts()],
  },
];
