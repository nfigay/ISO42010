import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorkspaceUpdated, isWorkspaceUpdated } from '../src/events/event-contract.js';
import { createEventBus } from '../src/events/event-bus.js';
function pair() { const handlers = [new Set(), new Set()]; return [0, 1].map(i => ({publish: message => { for (const fn of handlers[1-i]) fn(message); }, subscribe: fn => { handlers[i].add(fn); return () => handlers[i].delete(fn); }, close: () => handlers[i].clear()})); }
test('validated workspace event', () => {
 const e = makeWorkspaceUpdated({ workspaceId:'default',revision:2,sender:'A',eventId:'A:2' });
 assert.equal(isWorkspaceUpdated(e), true);
 assert.throws(()=>makeWorkspaceUpdated({workspaceId:'default',revision:-1,sender:'A',eventId:'x'}));
});
test('publish/subscribe, scope, deduplication and close', () => {
 const [ta,tb] = pair();
 const a = createEventBus({transport:ta,workspaceId:'default',sender:'A'});
 const b = createEventBus({transport:tb,workspaceId:'default',sender:'B'});
 const received=[]; b.subscribe(e=>received.push(e.revision));
 const e=makeWorkspaceUpdated({workspaceId:'default',revision:4,sender:'A',eventId:'x'});
 a.publishCommitted(e); a.publishCommitted(e);
 assert.deepEqual(received,[4]);
 assert.throws(() => a.publishCommitted(makeWorkspaceUpdated({workspaceId:'other',revision:5,sender:'A',eventId:'y'})));
 a.close(); b.close();
});
test('unsubscribe stops reception', () => {
 const [ta,tb]=pair();const a=createEventBus({transport:ta,workspaceId:'default',sender:'A'});const b=createEventBus({transport:tb,workspaceId:'default',sender:'B'});
 let count=0;const off=b.subscribe(()=>count++);off();a.publishCommitted(makeWorkspaceUpdated({workspaceId:'default',revision:1,sender:'A',eventId:'evt'}));assert.equal(count,0);a.close();b.close();
});
