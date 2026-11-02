// src/storage/workspace-repository.js
/** ISO42010 IndexedDB persistence. No DOM, event bus or Cytoscape dependencies.
* Schema version 1, store names and persisted document shape remain unchanged.
* All read/write promises settle on transaction completion (not request success).
*/
function isValidArchitecture(candidate) {
	return candidate && typeof candidate === "object" && candidate.systemOfInterest && typeof candidate.systemOfInterest.id === "string" && Array.isArray(candidate.models) && candidate.models.length > 0 && [
		"stakeholders",
		"concerns",
		"viewpoints",
		"views",
		"correspondences"
	].every((key) => Array.isArray(candidate[key]));
}
function openWorkspaceDb(dbName, onVersionChange = () => {}) {
	return new Promise((resolve, reject) => {
		let request;
		try {
			request = indexedDB.open(dbName, 1);
		} catch (error) {
			reject(error);
			return;
		}
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains("workspaces")) db.createObjectStore("workspaces", { keyPath: "id" });
			if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
		};
		request.onsuccess = () => {
			const db = request.result;
			db.onversionchange = () => {
				db.close();
				onVersionChange();
			};
			resolve(db);
		};
		request.onerror = () => reject(request.error || /* @__PURE__ */ new Error("Ouverture IndexedDB refusée"));
		request.onblocked = () => reject(/* @__PURE__ */ new Error("Ouverture IndexedDB bloquée par un autre onglet"));
	});
}
function readWorkspace(db, workspaceId = "default") {
	return new Promise((resolve, reject) => {
		const tx = db.transaction("workspaces", "readonly");
		const request = tx.objectStore("workspaces").get(workspaceId);
		let result;
		request.onsuccess = () => {
			result = request.result;
		};
		tx.oncomplete = () => resolve(result || null);
		tx.onerror = () => reject(tx.error || /* @__PURE__ */ new Error("Lecture IndexedDB échouée"));
		tx.onabort = () => reject(tx.error || /* @__PURE__ */ new Error("Lecture IndexedDB annulée"));
	});
}
function writeWorkspace(db, snapshot, expectedRevision = null, workspaceId = "default") {
	return new Promise((resolve, reject) => {
		const tx = db.transaction("workspaces", "readwrite");
		const store = tx.objectStore("workspaces");
		const get = store.get(workspaceId);
		let nextRevision = 0;
		let conflict = null;
		get.onsuccess = () => {
			const current = get.result;
			const revision = Number(current?.revision || 0);
			if (expectedRevision !== null && revision !== expectedRevision) {
				conflict = /* @__PURE__ */ new Error("Conflit : une autre vue a modifié le modèle. Annulez le formulaire, puis rechargez. Aucune écriture effectuée.");
				tx.abort();
				return;
			}
			nextRevision = revision + 1;
			store.put({
				id: workspaceId,
				schemaVersion: 1,
				revision: nextRevision,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: snapshot
			});
		};
		tx.oncomplete = () => resolve(nextRevision);
		tx.onerror = () => reject(conflict || tx.error || /* @__PURE__ */ new Error("Écriture IndexedDB échouée"));
		tx.onabort = () => reject(conflict || tx.error || /* @__PURE__ */ new Error("Écriture IndexedDB annulée"));
	});
}
function readLegacyState(storage = globalThis.localStorage, storageKey = "ISO42010_Architecture_State") {
	try {
		const serialized = storage.getItem(storageKey);
		if (!serialized) return null;
		const candidate = JSON.parse(serialized);
		if (!isValidArchitecture(candidate)) {
			console.warn("[ISO42010] État localStorage ancien invalide, conservé sans modification");
			return null;
		}
		return candidate;
	} catch (error) {
		console.warn("[ISO42010] Ancienne sauvegarde illisible, conservée", error);
		return null;
	}
}
export { isValidArchitecture, openWorkspaceDb, readLegacyState, readWorkspace, writeWorkspace };

//# sourceMappingURL=workspace-repository.js.map