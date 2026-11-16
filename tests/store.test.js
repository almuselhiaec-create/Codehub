import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {store,createStore,validateResource,normalizedUrl,categories} from '../server/store.js';
const sample={id:'test',name:'Example',description:'An example resource.',url:'https://example.com/',category:'HTML',level:'Beginner',type:'Documentation',free:true,keywords:['html']};
test('catalog contains 50+ validated unique links and covers every category',async()=>{const rows=await store.read();assert.ok(rows.length>=50);for(const category of categories)assert.ok(rows.some(r=>r.category===category));});
test('validates URL schemes, required fields, enums, booleans and keywords',()=>{
 assert.equal(validateResource(sample).name,'Example');
 for(const patch of [{url:'javascript:alert(1)'},{url:'ftp://example.com'},{url:'https://user:pass@example.com'},{name:''},{category:'unknown'},{level:'easy'},{type:'unknown'},{free:'true'},{featured:'true'},{keywords:[123]},{description:'x'.repeat(1201)}])assert.throws(()=>validateResource({...sample,...patch}));
 assert.equal(normalizedUrl('https://EXAMPLE.com:443/#anchor'),normalizedUrl('https://example.com'));
});
test('serializes concurrent mutations without losing updates',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'codehub-'));const file=pathToFileURL(join(dir,'resources.json'));await writeFile(file,'[]');
 try{const local=createStore(file);await Promise.all(Array.from({length:12},(_,i)=>local.mutate(rows=>rows.push({...sample,id:String(i),url:`https://example.com/${i}`}))));assert.equal((await local.read()).length,12);}finally{await rm(dir,{recursive:true,force:true});}
});
test('corrupt storage is never overwritten and a failed mutation releases the queue',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'codehub-'));const file=pathToFileURL(join(dir,'resources.json'));await writeFile(file,'broken');
 try{const local=createStore(file);await assert.rejects(local.mutate(rows=>rows.push(sample)));assert.equal(await readFile(file,'utf8'),'broken');await writeFile(file,'[]');await assert.rejects(local.mutate(()=>{throw Error('cancel');}));await local.mutate(rows=>rows.push(sample));assert.equal((await local.read()).length,1);}finally{await rm(dir,{recursive:true,force:true});}
});
