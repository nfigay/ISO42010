// src/events/event-contract.js
var EVENT_PROTOCOL = "iso42010.workspace-events";
var EVENT_VERSION = 1;
var EVENT_TYPES = Object.freeze({ WORKSPACE_UPDATED: "workspace.updated" });
function makeWorkspaceUpdated({ workspaceId, revision, sender, eventId, committedAt = (/* @__PURE__ */ new Date()).toISOString() }) {
	if (typeof workspaceId !== "string" || !workspaceId.trim()) throw new TypeError("workspaceId required");
	if (!Number.isSafeInteger(revision) || revision < 0) throw new TypeError("non-negative integer revision required");
	if (typeof sender !== "string" || !sender.trim()) throw new TypeError("sender required");
	if (typeof eventId !== "string" || !eventId.trim()) throw new TypeError("eventId required");
	return Object.freeze({
		protocol: EVENT_PROTOCOL,
		version: 1,
		type: EVENT_TYPES.WORKSPACE_UPDATED,
		workspaceId,
		revision,
		sender,
		eventId,
		committedAt
	});
}
function isWorkspaceUpdated(value) {
	return !!value && typeof value === "object" && value.protocol === "iso42010.workspace-events" && value.version === 1 && value.type === EVENT_TYPES.WORKSPACE_UPDATED && typeof value.workspaceId === "string" && !!value.workspaceId && Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.sender === "string" && !!value.sender && typeof value.eventId === "string" && !!value.eventId && typeof value.committedAt === "string";
}
export { EVENT_PROTOCOL, EVENT_TYPES, EVENT_VERSION, isWorkspaceUpdated, makeWorkspaceUpdated };

//# sourceMappingURL=event-contract.js.map