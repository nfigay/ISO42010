export const DEFAULT_CHANNEL = 'ISO42010_Workspace_Sync_v1';
export function createBroadcastChannelTransport({ channelName = DEFAULT_CHANNEL, BroadcastChannelClass = globalThis.BroadcastChannel } = {}) {
  if (typeof BroadcastChannelClass !== 'function') throw new Error('BroadcastChannel unavailable');
  const channel = new BroadcastChannelClass(channelName);
  const handlers = new Set();
  const onMessage = e => { for (const fn of [...handlers]) fn(e.data); };
  channel.addEventListener('message', onMessage);
  let closed = false;
  return Object.freeze({
    publish(message) { if (closed) throw new Error('transport closed'); channel.postMessage(message); },
    subscribe(fn) { if (closed) throw new Error('transport closed'); handlers.add(fn); return () => handlers.delete(fn); },
    close() { if (closed) return; closed = true; handlers.clear(); channel.removeEventListener('message', onMessage); channel.close(); }
  });
}
