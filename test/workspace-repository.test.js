import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidArchitecture,readLegacyState} from '../src/storage/workspace-repository.js';
const model = {systemOfInterest:{id:'SOI'},models:[{id:'M'}], stakeholders:[],concerns:[],viewpoints:[],views:[],correspondences:[]};
test('architecture schema preserved and invalid states rejected', () => {
 assert.ok(isValidArchitecture(model));
 assert.ok(!isValidArchitecture({...model, models:[]}));
 assert.ok(!isValidArchitecture({...model,views:null}));
});
test('legacy reads without destructive side effects',()=>{
 let calls=0;
 const storage={getItem:key=>{calls++; assert.equal(key,'ISO42010_Architecture_State');return JSON.stringify(model);}};
 assert.deepEqual(readLegacyState(storage),model);
 assert.equal(calls,1);
});
test('invalid legacy preserved and not treated as valid',()=>{
 const storage={getItem:()=>'{not json'};
 assert.equal(readLegacyState(storage),null);
});
