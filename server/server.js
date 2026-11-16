import { createApp } from './app.js';
const port=Number(process.env.PORT || 3001);
const admin=process.env.NODE_ENV==='development' && process.env.ENABLE_LOCAL_ADMIN==='true';
createApp({admin,port}).listen(port,'127.0.0.1',()=>console.log(`CodeHub API: http://127.0.0.1:${port} | local editing ${admin?'enabled':'disabled'}`));
