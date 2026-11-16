import test from 'node:test';
import assert from 'node:assert/strict';
import {IncomingMessage,ServerResponse} from 'node:http';
import {Socket} from 'node:net';
import {createApp} from '../server/app.js';

// Exercise Express with real HTTP request/response streams, without opening a port.
// This also runs in environments that forbid listening sockets.
function request(app,path,{method='GET',headers={},body}={}) {
 return new Promise((resolve,reject)=>{
  const socket=new Socket();
  Object.defineProperty(socket,'remoteAddress',{value:'127.0.0.1'});
  const req=new IncomingMessage(socket);
  req.method=method;req.url=path;req.headers={host:'127.0.0.1:3001'};
  for(const [key,value] of Object.entries(headers))req.headers[key.toLowerCase()]=value;
  if(body!==undefined)req.headers['content-length']=String(Buffer.byteLength(body));
  const res=new ServerResponse(req);const chunks=[];
  res.write=chunk=>{chunks.push(Buffer.from(chunk));return true;};
  res.end=chunk=>{if(chunk)chunks.push(Buffer.from(chunk));const text=Buffer.concat(chunks).toString();resolve({status:res.statusCode,json:()=>JSON.parse(text)});return res;};
  app(req,res,reject);
  if(body!==undefined)req.push(body);req.push(null);
 });
}
test('read API supports combined filters, keyword search, categories and details',async()=>{
 const app=createApp();
 const response=await request(app,'/api/resources?q=react&category=React&level=Beginner&free=true');
 assert.equal(response.status,200);const rows=response.json();assert.ok(rows.length);assert.ok(rows.every(r=>r.category==='React'&&r.free&&r.level==='Beginner'));
 assert.equal((await request(app,'/api/categories')).json().length,16);
 assert.equal((await request(app,'/api/resources/not-found')).status,404);
 assert.equal((await request(app,'/api/resources/1')).status,200);
 assert.equal((await request(app,'/api/config')).json().adminEnabled,false);
});
test('write routes are disabled by default for every mutation',async()=>{
 for(const method of ['POST','PUT','DELETE']){
  const response=await request(createApp(),'/api/resources'+(method==='POST'?'':'/1'),{method,headers:{'Content-Type':'application/json'},body:method==='DELETE'?undefined:'{}'});
  assert.equal(response.status,403);
 }
});
test('enabled admin rejects untrusted hosts, origins, forwarding and missing custom header',async()=>{
 const app=createApp({admin:true});
 for(const headers of [{},{Host:'evil.example:3001',Origin:'http://localhost:5173','X-CodeHub-Admin':'local-development'},{Host:'localhost:3001',Origin:'https://evil.example','X-CodeHub-Admin':'local-development'},{Host:'localhost:3001',Origin:'http://localhost:5173'},{Host:'localhost:3001',Origin:'http://localhost:5173','X-CodeHub-Admin':'local-development','X-Forwarded-For':'127.0.0.1'}])assert.equal((await request(app,'/api/resources',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:'{}'})).status,403);
 assert.equal((await request(app,'/api/config')).json().adminEnabled,true);
});
test('trusted admin receives validation errors, duplicate rejection and not found',async()=>{
 const app=createApp({admin:true});
 const headers={Host:'localhost:3001',Origin:'http://localhost:5173','Content-Type':'application/json','X-CodeHub-Admin':'local-development'};
 assert.equal((await request(app,'/api/resources',{method:'POST',headers,body:'{}'})).status,400);
 const sample=(await request(app,'/api/resources/1')).json();
 assert.equal((await request(app,'/api/resources',{method:'POST',headers,body:JSON.stringify(sample)})).status,409);
 assert.equal((await request(app,'/api/resources/missing',{method:'PUT',headers,body:JSON.stringify(sample)})).status,404);
 assert.equal((await request(app,'/api/resources/missing',{method:'DELETE',headers})).status,404);
 assert.equal((await request(app,'/api/resources',{method:'POST',headers,body:'not json'})).status,400);
});

test('admin create, update and delete persist to an isolated JSON file',async()=>{
 const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {pathToFileURL}=await import('node:url');
 const {createStore}=await import('../server/store.js');
 const directory=await mkdtemp(join(tmpdir(),'codehub-api-'));
 const file=pathToFileURL(join(directory,'resources.json'));
 await writeFile(file,'[]');
 const app=createApp({admin:true,resourceStore:createStore(file)});
 const headers={Origin:'http://localhost:5173','Content-Type':'application/json','X-CodeHub-Admin':'local-development'};
 const resource={name:'Test guide',description:'An isolated test resource.',url:'https://example.com/guide',category:'HTML',level:'Beginner',type:'Documentation',free:true,keywords:['html']};
 try{
  const created=await request(app,'/api/resources',{method:'POST',headers,body:JSON.stringify(resource)});
  assert.equal(created.status,201);const id=created.json().id;assert.ok(id);
  assert.equal(JSON.parse(await readFile(file,'utf8')).length,1);
  const updated=await request(app,'/api/resources/'+id,{method:'PUT',headers,body:JSON.stringify({...resource,name:'Updated guide'})});
  assert.equal(updated.status,200);assert.equal(updated.json().id,id);
  assert.equal((await request(app,'/api/resources/'+id)).json().name,'Updated guide');
  assert.equal((await request(app,'/api/resources/'+id,{method:'DELETE',headers})).status,204);
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')),[]);
  await writeFile(file,'corrupted');
  assert.equal((await request(app,'/api/resources')).status,500);
  assert.equal((await request(app,'/api/resources',{method:'POST',headers,body:JSON.stringify(resource)})).status,500);
  assert.equal(await readFile(file,'utf8'),'corrupted');
 }finally{await rm(directory,{recursive:true,force:true});}
});
