import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

// Shared plugin stack to keep the config DRY (Don't Repeat Yourself)
const getPlugins = (isEsm = false) => [
  resolve(),
  commonjs(),
  terser(),
  // Only generate the size report during the ESM build to save time
  ...(isEsm ? [visualizer({ 
    filename: 'stats.html', 
    gzipSize: true,
    open: false // Set to true if you want it to pop up in the browser every build
  })] : [])
];

const external = ['three'];

export default [
  // 1. CommonJS build (for older Node.js/Tools)
  {
    input: 'src/index.js',
    external,
    output: {
      file: 'dist/rack3d-visualizer.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
    },
    plugins: getPlugins(),
  },

  // 2. ES Module build (for modern Bundlers like Vite/Webpack)
  {
    input: 'src/index.js',
    external,
    output: {
      file: 'dist/rack3d-visualizer.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: getPlugins(true), // Generates stats.html here
  },

  // 3. UMD build (for direct Browser <script> tags)
  {
    input: 'src/index.js',
    external,
    output: {
      file: 'dist/rack3d-visualizer.umd.js',
      format: 'umd',
      name: 'Rack3DVisualizer',
      globals: {
        three: 'THREE', // Maps the external 'three' to the global 'THREE' variable
      },
      sourcemap: true,
    },
    plugins: getPlugins(),
  },
];