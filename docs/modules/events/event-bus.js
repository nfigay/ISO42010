import { isWorkspaceUpdated } from './event-contract.js';
/** Transport contract: publish(message), subscribe(handler) => unsubscribe, close(). */
export function createEventBus({ transport, workspaceId, sender, onError = console.error }) {
  if (!transport || typeof transport.publish !== 'function' || typeof transport.subscribe !== 'function') throw new TypeError('transport invalid');
  if (!workspaceId || !sender) throw new TypeError('workspaceId/sender required');
  const listeners = new Set();
  const seen = new Set();
  let closed = false;
  const accept = message => {
    if (closed || !isWorkspaceUpdated(message) || message.workspaceId !== workspaceId || message.sender === sender || seen.has(message.eventId)) return;
    seen.add(message.eventId);
    // Bound memory; missing events are handled by workspace revision checks at focus/reopen.
    if (seen.size > 512) seen.delete(seen.values().next().value);
    for (const listener of [...listeners]) {
      try { listener(message); } catch (error) { onError(error); }
    }
  };
  const unsubscribeTransport = transport.subscribe(accept);
  return Object.freeze({
    publishCommitted(event) {
      if (closed) throw new Error('event bus closed');
      if (!isWorkspaceUpdated(event) || event.workspaceId !== workspaceId || event.sender !== sender) throw new TypeError('invalid committed event');
      transport.publish(event);
    },
    subscribe(listener) {
      if (closed || typeof listener !== 'function') throw new TypeError('invalid subscription');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() { if (closed) return; closed = true; listeners.clear(); unsubscribeTransport(); transport.close?.(); }
  });
}
