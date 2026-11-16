import {store,categories} from './store.js';
const resources=await store.read();
if(resources.length<50) throw new Error('At least 50 resources required.');
for(const category of categories) if(!resources.some(r=>r.category===category)) throw new Error(`Missing category: ${category}`);
console.log(`Validated ${resources.length} unique resources across ${categories.length} categories.`);
