import { defineConfig } from 'vite';
const proxy={'/api':{target:'http://127.0.0.1:3001',changeOrigin:true}};
export default defineConfig({esbuild:{jsx:'automatic'},server:{host:'127.0.0.1',port:5173,strictPort:true,proxy},preview:{host:'127.0.0.1',proxy}});
