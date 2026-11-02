export const EVENT_PROTOCOL = 'iso42010.workspace-events';
export const EVENT_VERSION = 1;
export const EVENT_TYPES = Object.freeze({ WORKSPACE_UPDATED: 'workspace.updated' });
export function makeWorkspaceUpdated({ workspaceId, revision, sender, eventId, committedAt = new Date().toISOString() }) {
  if (typeof workspaceId !== 'string' || !workspaceId.trim()) throw new TypeError('workspaceId required');
  if (!Number.isSafeInteger(revision) || revision < 0) throw new TypeError('non-negative integer revision required');
  if (typeof sender !== 'string' || !sender.trim()) throw new TypeError('sender required');
  if (typeof eventId !== 'string' || !eventId.trim()) throw new TypeError('eventId required');
  return Object.freeze({ protocol: EVENT_PROTOCOL, version: EVENT_VERSION, type: EVENT_TYPES.WORKSPACE_UPDATED, workspaceId, revision, sender, eventId, committedAt });
}
export function isWorkspaceUpdated(value) {
  return !!value && typeof value === 'object' && value.protocol === EVENT_PROTOCOL && value.version === EVENT_VERSION && value.type === EVENT_TYPES.WORKSPACE_UPDATED && typeof value.workspaceId === 'string' && !!value.workspaceId && Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.sender === 'string' && !!value.sender && typeof value.eventId === 'string' && !!value.eventId && typeof value.committedAt === 'string';
}
