import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchPublicCatalog} from '../lib/catalog-sync';
test('fetches later pages, excludes private tracks and deduplicates IDs',async()=>{
 let calls=0;
 const tracks=await fetchPublicCatalog(async()=>++calls===1?{collection:[{id:1,sharing:'public'},{id:2,sharing:'private'}],next_href:'https://api.soundcloud.com/next'}:{collection:[{id:1,sharing:'public'},{id:3,sharing:'public'}],next_href:null});
 assert.equal(calls,2);assert.deepEqual(tracks.map(t=>t.id),[1,3]);
});
test('rejects repeated pages, incomplete pagination and API errors instead of publishing a partial catalog',async()=>{
 await assert.rejects(fetchPublicCatalog(async()=>({collection:[],next_href:'same'})));
 await assert.rejects(fetchPublicCatalog(async()=>({collection:[],next_href:'next'}),1));
 await assert.rejects(fetchPublicCatalog(async()=>{throw new Error('API unavailable');}));
});
