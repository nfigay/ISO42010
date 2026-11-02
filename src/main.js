
    // ------------------------------------------------------------------
    // 1. PRELOADED BASELINE MODEL (PCI-DSS Enterprise Payment System)
    // ------------------------------------------------------------------
    const DEFAULT_MODEL = {
      systemOfInterest: {
        id: "SOI_PAYMENT_SYS",
        name: "Enterprise Payment Platform",
        environment: "Hybrid Cloud Microservices",
        mission: "PCI-DSS Compliant Payment Settlement Processing"
      },
      stakeholders: [
        { id: "STK_CISO", name: "Chief Information Security Officer", role: "Security & Compliance" },
        { id: "STK_OPS", name: "Operations Director", role: "Business Operations" }
      ],
      concerns: [
        { id: "CON_PCI", name: "PCI-DSS Data Protection", holderStakeholderRefs: ["STK_CISO"] },
        { id: "CON_LATENCY", name: "Transaction Execution Latency", holderStakeholderRefs: ["STK_OPS"] }
      ],
      viewpoints: [
        { id: "VP_SEC", name: "Security & Risk Viewpoint", framedConcernRefs: ["CON_PCI"], usedModelKindRefs: ["MK_BPMN20"] },
        { id: "VP_OPS", name: "Operational Workflow Viewpoint", framedConcernRefs: ["CON_LATENCY"], usedModelKindRefs: ["MK_BPMN20"] }
      ],
      modelKinds: [
        { id: "MK_BPMN20", name: "BPMN 2.0 Process Notation", governingNotation: "OMG BPMN 2.0 XML Schema" }
      ],
      models: [
        { id: "MOD_PAYMENT", name: "Payment Settlement Process", governedByModelKindRef: "MK_BPMN20", artifactURI: "process_payment_v2.bpmn" },
        { id: "MOD_AUDIT", name: "Audit Trail Sub-process", governedByModelKindRef: "MK_BPMN20", artifactURI: "subprocess_audit.bpmn" }
      ],
      views: [
        { id: "VIEW_SEC", name: "Security Compliance View", governedByViewpointRef: "VP_SEC", containedModelRefs: ["MOD_AUDIT"] },
        { id: "VIEW_OPS", name: "Operational Workflow View", governedByViewpointRef: "VP_OPS", containedModelRefs: ["MOD_PAYMENT", "MOD_AUDIT"] }
      ],
      correspondences: [
        { id: "CORR_01", name: "Process Invocation Link", sourceElementRef: "MOD_PAYMENT", targetElementRef: "MOD_AUDIT", relationType: "invokesCallActivity" },
        { id: "CORR_02", name: "Compliance Satisfaction", sourceElementRef: "MOD_AUDIT", targetElementRef: "CON_PCI", relationType: "satisfies" }
      ]
    };

    let state = null;
    let cy = null;
    let api = null; // cytoscape-expand-collapse API handle
    let ur = null; // history only
    const STORAGE_KEY = "ISO42010_Architecture_State";

    // ------------------------------------------------------------------
    // 2. STATE PERSISTENCE
    // ------------------------------------------------------------------
    // IndexedDB : stockage principal. L'ancienne clé localStorage reste intacte
    // pendant la migration pour permettre un retour arrière sans perte.
    const WORKSPACE_DB = 'ISO42010_Workspace_DB';
    const WORKSPACE_ID = 'default';
    let workspaceDb = null;
    let storageMode = 'initializing';
    let saveQueue = Promise.resolve();
    let storageErrorNotified = false;
    // Révision globale de l'espace, vérifiée dans la transaction d'écriture.
    let workspaceRevision = 0;
    let pendingSaves = 0;
    let externalChangePending = false;
    let syncChannel = null;
    let syncBus = null;
    let syncMakeEvent = null;
    let syncLegacyUnsubscribe = null;
    let reconcileRunning = false;
    const syncOrigin = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();

    function editorIsOpen() {
      const editor = document.getElementById('modal-editor');
      return editor && !editor.classList.contains('hidden');
    }

    function showRemoteChangeNotice() {
      let el = document.getElementById('iso42010-sync-notice');
      if (!el) {
        el = document.createElement('div');
        el.id = 'iso42010-sync-notice';
        el.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;background:#7f1d1d;color:white;padding:12px 16px;border-radius:8px;max-width:380px;box-shadow:0 4px 20px #0008;font:14px sans-serif';
        el.setAttribute('role', 'alert');
        document.body.appendChild(el);
      }
      el.textContent = 'Modifications détectées dans un autre onglet. Terminez ou annulez votre formulaire, puis rechargez les données avant de modifier.';
      el.style.display = 'block';
    }

    function clearRemoteChangeNotice() {
      const el = document.getElementById('iso42010-sync-notice');
      if (el) el.style.display = 'none';
    }

    async function reconcileWorkspace() {
      if (reconcileRunning || storageMode !== 'indexeddb' || !workspaceDb) return;
      if (pendingSaves || editorIsOpen()) {
        // Ne jamais écraser un formulaire ouvert ou une écriture locale en attente.
        externalChangePending = true;
        showRemoteChangeNotice();
        return;
      }
      reconcileRunning = true;
      try {
        const record = await readWorkspace(workspaceDb);
        if (!record || record.schemaVersion !== 1 || !isValidArchitecture(record.data))
          throw new Error('Données distantes incompatibles');
        const revision = Number(record.revision || 0);
        if (revision !== workspaceRevision) {
          state = record.data;
          workspaceRevision = revision;
          refreshUI();
          console.info('[ISO42010 sync] Vue actualisée depuis IndexedDB, révision', revision);
        }
        externalChangePending = false;
        clearRemoteChangeNotice();
      } catch (error) {
        showStorageProblem(error);
      } finally {
        reconcileRunning = false;
      }
    }

    async function setupWorkspaceSync() {
      if (typeof BroadcastChannel !== 'undefined') {
        // Les modules sont servis depuis docs/modules; le canal reste identique.
        const [{makeWorkspaceUpdated}, {createEventBus}, {createBroadcastChannelTransport}] = await Promise.all([
          import('./events/event-contract.js'),
          import('./events/event-bus.js'),
          import('./transports/broadcast-channel-transport.js')
        ]);
        const transport = createBroadcastChannelTransport();
        syncChannel = transport;
        syncBus = createEventBus({transport, workspaceId:WORKSPACE_ID, sender:syncOrigin});
        syncMakeEvent = makeWorkspaceUpdated;
        syncBus.subscribe(() => { void reconcileWorkspace(); });
        // Compatibilité ascendante: les anciens onglets emettent 'committed'.
        syncLegacyUnsubscribe = transport.subscribe(msg => {
          if (msg?.type === 'committed' && msg.workspaceId === WORKSPACE_ID && msg.sender !== syncOrigin)
            void reconcileWorkspace();
        });
      }
      // Rattrape une notification manquée (onglet suspendu ou navigateur sans BroadcastChannel).
      window.addEventListener('focus', () => { void reconcileWorkspace(); });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void reconcileWorkspace();
      });
      ['modal-close','modal-cancel'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => {
          // Le gestionnaire original masque le formulaire pendant cet événement.
          queueMicrotask(() => { if (externalChangePending) void reconcileWorkspace(); });
        });
      });
    }


    // Persistence implementation is shared by source and published ESM modules.
    // Loading is asynchronous, completed before the workbench renders.
    let workspaceRepository = null;
    async function loadWorkspaceRepository() {
      if (!workspaceRepository) workspaceRepository = await import('./storage/workspace-repository.js');
      return workspaceRepository;
    }
    function isValidArchitecture(candidate) {
      return workspaceRepository.isValidArchitecture(candidate);
    }

    function showStorageProblem(error) {
      console.error('[ISO42010 stockage]', error);
      const el = document.getElementById('save-indicator');
      if (el) {
        el.classList.remove('opacity-0', 'text-emerald-400');
        el.classList.add('text-rose-400');
        el.textContent = 'Sauvegarde indisponible — exporter le XML';
      }
      if (!storageErrorNotified) {
        storageErrorNotified = true;
        alert('Impossible de confirmer la sauvegarde locale. Exportez le XML avant de fermer la page. Détail : ' + error.message);
      }
    }

    function openWorkspaceDb() {
      return workspaceRepository.openWorkspaceDb(WORKSPACE_DB, () => { workspaceDb = null; });
    }

    function readWorkspace(db) {
      return workspaceRepository.readWorkspace(db, WORKSPACE_ID);
    }

    function writeWorkspace(db, snapshot, expectedRevision = null) {
      return workspaceRepository.writeWorkspace(db, snapshot, expectedRevision, WORKSPACE_ID);
    }

    function readLegacyState() {
      return workspaceRepository.readLegacyState(localStorage, STORAGE_KEY);
    }

    async function loadState() {
      try { await loadWorkspaceRepository(); }
      catch (error) {
        console.error('[ISO42010] Module de persistance indisponible', error);
        throw error;
      }
      const legacy = readLegacyState();
      try {
        if (typeof indexedDB === 'undefined') throw new Error('API IndexedDB absente');
        workspaceDb = await openWorkspaceDb();
        const existing = await readWorkspace(workspaceDb);
        if (existing) {
          if (existing.schemaVersion !== 1 || !isValidArchitecture(existing.data))
            throw new Error('Espace IndexedDB incompatible ou endommagé : aucune écriture automatique');
          state = existing.data;
          workspaceRevision = Number(existing.revision || 0);
          storageMode = 'indexeddb';
          console.info('[ISO42010] Espace existant chargé depuis IndexedDB');
        } else {
          state = legacy || JSON.parse(JSON.stringify(DEFAULT_MODEL));
          workspaceRevision = await writeWorkspace(workspaceDb, structuredClone(state), 0);
          storageMode = 'indexeddb';
          console.info('[ISO42010] Initialisé dans IndexedDB', legacy ? 'depuis localStorage' : 'depuis le modèle par défaut');
        }
      } catch (error) {
        storageMode = 'fallback';
        state = legacy || JSON.parse(JSON.stringify(DEFAULT_MODEL));
        console.warn('[ISO42010] Mode dégradé localStorage', error);
        const el = document.getElementById('save-indicator');
        if (el) {
          el.classList.remove('opacity-0');
          el.textContent = 'Mode localStorage (IndexedDB indisponible)';
        }
      }
    }

    function saveState() {
      // Le modèle visible change immédiatement, mais seule la transaction validée fait foi.
      refreshUI();
      const snapshot = structuredClone(state);
      pendingSaves++;
      saveQueue = saveQueue.then(async () => {
        if (externalChangePending) throw new Error('Conflit entre onglets : recharger avant de sauvegarder.');
        if (storageMode === 'indexeddb' && workspaceDb) {
          workspaceRevision = await writeWorkspace(workspaceDb, snapshot, workspaceRevision);
          if (syncBus && syncMakeEvent) {
            syncBus.publishCommitted(syncMakeEvent({workspaceId:WORKSPACE_ID,
              sender:syncOrigin, revision:workspaceRevision,
              eventId:syncOrigin + ':' + workspaceRevision}));
            // Notification pour les onglets encore sur le protocole historique.
            syncChannel.publish({type:'committed', workspaceId:WORKSPACE_ID,
              sender:syncOrigin, revision:workspaceRevision});
          }
        } else if (storageMode === 'fallback') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } else {
          throw new Error('Stockage non initialisé');
        }
        showSaveIndicator();
      }).catch(error => {
        externalChangePending = true;
        showRemoteChangeNotice();
        showStorageProblem(error);
      }).finally(() => {
        pendingSaves--;
        if (externalChangePending && !pendingSaves && !editorIsOpen())
          showRemoteChangeNotice(); // L'utilisateur doit décider comment résoudre le conflit.
      });
    }

    function showSaveIndicator() {
      const el = document.getElementById("save-indicator");
      el.classList.remove("opacity-0");
      setTimeout(() => el.classList.add("opacity-0"), 2000);
    }

    // ------------------------------------------------------------------
    // 3. CYTOSCAPE COMPOUND GRAPH & FCOSE PHYSICS ENGINE
    // ------------------------------------------------------------------
    function renderCytoscapeGraph() {
      const elements = [];
      const soi = state.systemOfInterest;

      // A. ROOT COMPOUND PARENT NODE: System of Interest
      elements.push({
        data: { id: soi.id, label: `System: ${soi.name}`, type: "SystemOfInterest" },
        classes: "compound-system"
      });

      // B. VIEWPOINT COMPOUND PARENTS (Inside System)
      state.viewpoints.forEach(vp => {
        elements.push({
          data: { id: vp.id, parent: soi.id, label: `Viewpoint: ${vp.name}`, type: "ArchitectureViewpoint" },
          classes: "compound-vp"
        });
      });

      // C. VIEW COMPOUND PARENTS (Inside System)
      state.views.forEach(v => {
        elements.push({
          data: { id: v.id, parent: soi.id, label: `View: ${v.name}`, type: "ArchitectureView" },
          classes: "compound-view"
        });
      });

      // D. CONCERNS (Child of Viewpoint if framed, or child of System)
      state.concerns.forEach(c => {
        const vpParent = state.viewpoints.find(vp => vp.framedConcernRefs?.includes(c.id));
        elements.push({
          data: { id: c.id, parent: vpParent ? vpParent.id : soi.id, label: c.name, type: "Concern" },
          classes: "node-concern"
        });
      });

      // E. ARCHITECTURE MODELS (Child of View if contained, or child of System)
      state.models.forEach(m => {
        const viewParent = state.views.find(v => v.containedModelRefs?.includes(m.id));
        elements.push({
          data: { id: m.id, parent: viewParent ? viewParent.id : soi.id, label: `BPMN: ${m.name}`, type: "ArchitectureModel", artifact: m.artifactURI },
          classes: "node-model"
        });
      });

      // F. CORRESPONDENCES & EDGES
      state.correspondences.forEach(corr => {
        elements.push({
          data: { id: corr.id, source: corr.sourceElementRef, target: corr.targetElementRef, label: corr.relationType, type: "Correspondence" }
        });
      });

      if (cy) { cy.destroy(); cy = null; api = null; ur = null; }

      // Initialize Cytoscape Instance
      cy = cytoscape({
        container: document.getElementById("cy"),
        elements: elements,
        style: [
          // COMPOUND PARENT STYLES
          {
            selector: ':parent',
            style: {
              'label': 'data(label)',
              'background-opacity': 0.08,
              'border-width': 2,
              'border-style': 'dashed',
              'text-valign': 'top',
              'text-halign': 'center',
              'font-size': '11px',
              'font-weight': 'bold',
              'padding': '18px'
            }
          },
          { selector: '.compound-system', style: { 'background-color': '#a855f7', 'border-color': '#9333ea', 'color': '#c084fc' } },
          { selector: '.compound-view', style: { 'background-color': '#3b82f6', 'border-color': '#2563eb', 'color': '#60a5fa' } },
          { selector: '.compound-vp', style: { 'background-color': '#f59e0b', 'border-color': '#d97706', 'color': '#fbbf24' } },

          // LEAF NODE STYLES
          {
            selector: '.node-model',
            style: {
              'background-color': '#0891b2',
              'border-width': 1,
              'border-color': '#22d3ee',
              'label': 'data(label)',
              'color': '#ffffff',
              'font-size': '10px',
              'shape': 'roundrectangle',
              'width': '130px',
              'height': '36px',
              'text-valign': 'center'
            }
          },
          {
            selector: '.node-concern',
            style: {
              'background-color': '#e11d48',
              'border-width': 1,
              'border-color': '#fb7185',
              'label': 'data(label)',
              'color': '#ffffff',
              'font-size': '10px',
              'shape': 'ellipse',
              'width': '120px',
              'height': '36px',
              'text-valign': 'center'
            }
          },

          { selector: 'node.cy-expand-collapse-collapsed-node', style: {
            'label':'data(label)', 'text-valign':'center', 'text-halign':'center',
            'background-opacity':0.8, 'border-style':'solid','border-width':3,
            'shape':'roundrectangle','width':190,'height':55,
            'text-wrap':'wrap','text-max-width':170,'font-size':11
          }},
          // EDGE STYLES
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#3b82f6',
              'target-arrow-color': '#3b82f6',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '9px',
              'color': '#94a3b8'
            }
          },
          { selector: 'edge.cy-expand-collapse-collapsed-edge', style: {
            'line-color':'#22d3ee','target-arrow-color':'#22d3ee',
            'width':5,'line-style':'dashed','label':'data(label)'
          }}
        ],
        // Position initiale temporaire : fCoSE est lancé dès que les extensions sont prêtes.
        layout: { name: 'preset', fit: false }
      });

      // Même cycle que demo/demo-compounds.js : disposition, puis extension.
      // Les actions utilisent toujours l'API de CE graphe, sans reconstruire cy.
      if (typeof cy.expandCollapse !== 'function') {
        throw new Error('Extension cytoscape-expand-collapse indisponible');
      }
      cy.layout({name:'fcose', randomize:true, quality:'default', animate:false,
        fit:true, padding:45}).run();
      ur = typeof cy.undoRedo === 'function' ? cy.undoRedo({undoableDrag:false}) : null;
      api = cy.expandCollapse({
        layoutBy: {name:'fcose', randomize:false, animate:false, fit:true, padding:45},
        fisheye:false, animate:false, cueEnabled:true, undoable:false
      });
      // L'API active est conservée jusqu'à la prochaine recréation de cy.
      // Ne pas utiliser le panneau de propriétés pour le retour des commandes.

      // Inspector: architecture data only, never the extension's private state.
      const architectureFields = ['artifact', 'relationType', 'source', 'target'];
      const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      cy.on('tap', 'node, edge', function(evt) {
        const el = evt.target;
        const d = el.data();
        const collapsed = el.hasClass('cy-expand-collapse-collapsed-node') ||
                          el.hasClass('cy-expand-collapse-collapsed-edge');
        const html = [
          '<div class="space-y-3">',
          '<div><span class="text-xs text-blue-300">' + escapeHTML(d.type || (el.isEdge() ? 'Correspondence' : 'Element')) + '</span>',
          '<h4 class="font-bold text-white text-base mt-1">' + escapeHTML(d.label || d.id) + '</h4>',
          '<p class="font-mono text-xs text-slate-500">ID: ' + escapeHTML(d.id) + '</p></div>',
          collapsed ? '<p class="text-xs text-amber-300">Groupe replié</p>' : '',
          ...architectureFields.filter(k => d[k] != null).map(k =>
            '<p class="text-xs"><span class="text-slate-500">' + k + ': </span>' +
            '<span class="text-slate-200">' + escapeHTML(d[k]) + '</span></p>'),
          '</div>'
        ].join('');
        document.getElementById('inspector-content').innerHTML = html;
      });

    }

    // ------------------------------------------------------------------
    // 4. INVENTORY TABLE & CRUD MANAGEMENT
    // ------------------------------------------------------------------
    function renderInventoryTable() {
      const tbody = document.getElementById("inventory-table-body");
      tbody.innerHTML = "";

      const allItems = [
        ...state.stakeholders.map(i => ({ ...i, type: "Stakeholder" })),
        ...state.concerns.map(i => ({ ...i, type: "Concern" })),
        ...state.viewpoints.map(i => ({ ...i, type: "ArchitectureViewpoint" })),
        ...state.views.map(i => ({ ...i, type: "ArchitectureView" })),
        ...state.models.map(i => ({ ...i, type: "ArchitectureModel" })),
        ...state.correspondences.map(i => ({ ...i, type: "Correspondence" }))
      ];

      allItems.forEach(item => {
        let details = item.description || item.role || item.artifactURI || "";
        if (item.containedModelRefs) details = `Contained Models: [${item.containedModelRefs.join(", ")}]`;
        if (item.framedConcernRefs) details = `Framed Concerns: [${item.framedConcernRefs.join(", ")}]`;
        if (item.sourceElementRef) details = `${item.sourceElementRef} ➔ ${item.targetElementRef} (${item.relationType})`;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/50 transition";
        tr.innerHTML = `
          <td class="p-3 font-mono text-blue-400 font-medium">${item.id}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">${item.type}</span></td>
          <td class="p-3 font-semibold text-white">${item.name}</td>
          <td class="p-3 text-slate-400">${details}</td>
          <td class="p-3 text-right space-x-2">
            <button onclick="editElement('${item.type}', '${item.id}')" class="text-blue-400 hover:text-blue-300"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteElement('${item.type}', '${item.id}')" class="text-rose-400 hover:text-rose-300"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function deleteElement(type, id) {
      if (!confirm(`Delete ${type} [${id}]?`)) return;
      if (type === "Stakeholder") state.stakeholders = state.stakeholders.filter(i => i.id !== id);
      if (type === "Concern") state.concerns = state.concerns.filter(i => i.id !== id);
      if (type === "ArchitectureViewpoint") state.viewpoints = state.viewpoints.filter(i => i.id !== id);
      if (type === "ArchitectureView") state.views = state.views.filter(i => i.id !== id);
      if (type === "ArchitectureModel") state.models = state.models.filter(i => i.id !== id);
      if (type === "Correspondence") state.correspondences = state.correspondences.filter(i => i.id !== id);
      saveState();
    }

    function editElement(type, id) {
      const all = [...state.stakeholders, ...state.concerns, ...state.viewpoints, ...state.views, ...state.models, ...state.correspondences];
      const item = all.find(i => i.id === id);
      if (!item) return;

      document.getElementById("input-is-edit").value = "true";
      document.getElementById("input-type").value = type;
      document.getElementById("input-type").disabled = true;
      document.getElementById("input-id").value = item.id;
      document.getElementById("input-id").disabled = true;
      document.getElementById("input-name").value = item.name;
      document.getElementById("input-desc").value = item.description || item.role || item.artifactURI || "";

      renderDynamicRelationsForm(type, item);
      document.getElementById("modal-editor").classList.remove("hidden");
    }

    function renderDynamicRelationsForm(type, item = {}) {
      const container = document.getElementById("dynamic-relations-container");
      container.innerHTML = "";

      if (type === "ArchitectureView") {
        const opts = state.models.map(m => `<option value="${m.id}" ${item.containedModelRefs?.includes(m.id) ? 'selected' : ''}>${m.name} (${m.id})</option>`).join("");
        container.innerHTML = `<label class="block text-slate-400 mb-1">Contained Models (IDREFS Multi-select)</label><select id="rel-contained-models" multiple class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 h-24">${opts}</select><p class="text-slate-400 mt-1">Maintenir Cmd (Mac) ou Ctrl pour sélectionner/désélectionner plusieurs modèles. Valider avec Save.</p>`;
      } else if (type === "ArchitectureViewpoint") {
        const opts = state.concerns.map(c => `<option value="${c.id}" ${item.framedConcernRefs?.includes(c.id) ? 'selected' : ''}>${c.name} (${c.id})</option>`).join("");
        container.innerHTML = `<label class="block text-slate-400 mb-1">Framed Concerns (IDREFS Multi-select)</label><select id="rel-framed-concerns" multiple class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 h-24">${opts}</select><p class="text-slate-400 mt-1">Maintenir Cmd (Mac) ou Ctrl pour sélectionner/désélectionner plusieurs préoccupations. Valider avec Save.</p>`;
      } else if (type === "ArchitectureModel") {
        const mkOpts = state.modelKinds.map(mk => `<option value="${mk.id}">${mk.name}</option>`).join("");
        container.innerHTML = `
          <div><label class="block text-slate-400 mb-1">Model Kind</label><select id="rel-model-kind" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200">${mkOpts}</select></div>
          <div><label class="block text-slate-400 mb-1">Artifact URI (.bpmn)</label><input type="text" id="rel-artifact-uri" value="${item.artifactURI || 'process.bpmn'}" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200"></div>`;
      } else if (type === "Correspondence") {
        const all = [...state.models, ...state.concerns, ...state.views];
        const opts = all.map(e => `<option value="${e.id}">${e.name} (${e.id})</option>`).join("");
        container.innerHTML = `
          <div class="grid grid-cols-2 gap-2">
            <div><label class="block text-slate-400 mb-1">Source Element</label><select id="rel-source" class="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200">${opts}</select></div>
            <div><label class="block text-slate-400 mb-1">Target Element</label><select id="rel-target" class="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200">${opts}</select></div>
          </div>`;
        if (item.sourceElementRef) document.getElementById("rel-source").value = item.sourceElementRef;
        if (item.targetElementRef) document.getElementById("rel-target").value = item.targetElementRef;
      }
    }

    // ------------------------------------------------------------------
    // 5. TRACEABILITY MATRIX & XML PIVOT GENERATOR
    // ------------------------------------------------------------------
    function renderTraceabilityMatrix() {
      const container = document.getElementById("matrix-container");
      let html = `<table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-800 text-slate-300">
            <th class="p-2.5 border border-slate-700">BPMN Models \\ Concerns</th>
            ${state.concerns.map(c => `<th class="p-2.5 border border-slate-700 text-center font-semibold text-rose-300">${c.name} (${c.id})</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">`;

      state.models.forEach(m => {
        html += `<tr class="hover:bg-slate-800/40">
          <td class="p-2.5 border border-slate-700 font-semibold text-cyan-300">${m.name} (${m.id})</td>`;
        state.concerns.forEach(c => {
          const linked = state.correspondences.some(corr =>
            (corr.sourceElementRef === m.id && corr.targetElementRef === c.id) ||
            (corr.sourceElementRef === c.id && corr.targetElementRef === m.id)
          );
          html += `<td class="p-2.5 border border-slate-700 text-center">
            ${linked ? '<span class="px-2 py-1 bg-emerald-900/60 text-emerald-400 border border-emerald-700 rounded font-bold"><i class="fa-solid fa-check"></i> Aligned</span>' : '<span class="text-slate-600">-</span>'}
          </td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    }

    function generateXML() {
      return `<?xml version="1.0" encoding="UTF-8"?>
<iso:architectureDescription
  xmlns:iso="http://iso.org/iso-iec-ieee-42010/network"
  id="${state.systemOfInterest.id}"
  name="${state.systemOfInterest.name}">

  <iso:systemOfInterest id="${state.systemOfInterest.id}" name="${state.systemOfInterest.name}">
    <iso:environmentDescription>${state.systemOfInterest.environment}</iso:environmentDescription>
    <iso:mission>${state.systemOfInterest.mission}</iso:mission>
  </iso:systemOfInterest>

  <!-- Stakeholders -->
  ${state.stakeholders.map(s => `<iso:stakeholder id="${s.id}" name="${s.name}" role="${s.role}"/>`).join('\n  ')}

  <!-- Concerns -->
  ${state.concerns.map(c => `<iso:concern id="${c.id}" name="${c.name}" holderStakeholderRefs="${c.holderStakeholderRefs?.join(' ') || ''}"/>`).join('\n  ')}

  <!-- Viewpoints -->
  ${state.viewpoints.map(vp => `<iso:architectureViewpoint id="${vp.id}" name="${vp.name}" framedConcernRefs="${vp.framedConcernRefs?.join(' ') || ''}"/>`).join('\n  ')}

  <!-- Views -->
  ${state.views.map(v => `<iso:architectureView id="${v.id}" name="${v.name}" governedByViewpointRef="${v.governedByViewpointRef}" containedModelRefs="${v.containedModelRefs?.join(' ') || ''}"/>`).join('\n  ')}

  <!-- Architecture Models -->
  ${state.models.map(m => `<iso:architectureModel id="${m.id}" name="${m.name}" governedByModelKindRef="${m.governedByModelKindRef}" artifactURI="${m.artifactURI}"/>`).join('\n  ')}

  <!-- Correspondences -->
  ${state.correspondences.map(corr => `<iso:correspondence id="${corr.id}" name="${corr.name}" sourceElementRef="${corr.sourceElementRef}" targetElementRef="${corr.targetElementRef}" relationType="${corr.relationType}"/>`).join('\n  ')}

</iso:architectureDescription>`;
    }

    function refreshUI() {
      renderCytoscapeGraph();
      renderInventoryTable();
      renderTraceabilityMatrix();
      document.getElementById("xml-display").textContent = generateXML();
    }

    // ------------------------------------------------------------------
    // 6. EVENT BINDINGS & INITIALIZATION
    // ------------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", async () => {
      await loadState();
      if (storageMode === 'indexeddb') {
        try { await setupWorkspaceSync(); }
        catch (error) { console.error('[ISO42010 sync] Modules indisponibles; synchronisation des onglets desactivee', error); }
      }

      // Navigation Tabs
      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-active"));
          document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
          btn.classList.add("tab-active");
          const tabId = btn.getAttribute("data-tab");
          document.getElementById(tabId).classList.remove("hidden");
          if (tabId === "tab-graph" && cy) cy.resize();
        });
      });

      // Portage des commandes du démonstrateur officiel demo-compounds.js.
      // Chaque gestionnaire utilise directement l'API de l'instance en cours.
      const edgeOptions = () => ({
        groupEdgesOfSameTypeOnCollapse: document.getElementById('ec-group-types').checked,
        allowNestedEdgeCollapse: document.getElementById('ec-nested-edges').checked
      });
      function withGraph(fn) {
        return () => {
          try {
            if (!cy || !api || cy.destroyed()) throw new Error('Graphe non initialisé');
            fn(cy, api);
          } catch (error) {
            console.error('[ISO42010 Expand/Collapse]', error);
          }
        };
      }
      const on = (id, fn) => document.getElementById(id).addEventListener('click', withGraph(fn));
      on('btn-re-layout', (g) => g.layout({name:'fcose',randomize:false,animate:true,fit:true,padding:45}).run());
      on('btn-fit-graph', (g) => g.fit(g.elements(), 45));
      on('btn-collapse-all', (g, ex) => {
        if (!document.getElementById('ec-keep-root').checked) ex.collapseAll();
        else {
          const root = g.getElementById(state.systemOfInterest.id);
          ex.collapseRecursively(root.children().filter(':parent'));
        }
      });
      on('btn-expand-all', (g, ex) => ex.expandAll());
      on('btn-collapse-selected', (g, ex) => ex.collapse(g.nodes(':selected')));
      on('btn-expand-selected', (g, ex) => ex.expand(g.nodes(':selected')));
      on('btn-collapse-recursive', (g, ex) => ex.collapseRecursively(g.nodes(':selected')));
      on('btn-expand-recursive', (g, ex) => ex.expandRecursively(g.nodes(':selected')));
      on('btn-collapse-all-edges', (g, ex) => ex.collapseAllEdges(edgeOptions()));
      on('btn-expand-all-edges', (g, ex) => ex.expandAllEdges(edgeOptions()));
      on('btn-collapse-selected-edges', (g, ex) => {
        const edges = g.edges(':selected');
        if (edges.length >= 2) ex.collapseEdges(edges, edgeOptions());
      });
      on('btn-expand-selected-edges', (g, ex) => ex.expandEdges(g.edges(':selected'), edgeOptions()));
      on('btn-collapse-between', (g, ex) => ex.collapseEdgesBetweenNodes(g.nodes(':selected'), edgeOptions()));
      on('btn-expand-between', (g, ex) => ex.expandEdgesBetweenNodes(g.nodes(':selected'), edgeOptions()));
      on('ec-undo', () => { if (ur) ur.undo(); });
      on('ec-redo', () => { if (ur) ur.redo(); });

      // Preset Reload Button
      document.getElementById("btn-reload-preset").addEventListener("click", () => {
        if (confirm("Reset architecture model to baseline PCI-DSS configuration?")) {
          state = JSON.parse(JSON.stringify(DEFAULT_MODEL));
          saveState();
        }
      });

      // Add Element Modal Trigger
      document.getElementById("btn-add-entity").addEventListener("click", () => {
        document.getElementById("input-is-edit").value = "false";
        document.getElementById("input-type").disabled = false;
        document.getElementById("input-id").disabled = false;
        document.getElementById("input-id").value = "ELEM_" + Math.floor(Math.random() * 1000);
        document.getElementById("input-name").value = "";
        document.getElementById("input-desc").value = "";
        renderDynamicRelationsForm(document.getElementById("input-type").value);
        document.getElementById("modal-editor").classList.remove("hidden");
      });

      document.getElementById("input-type").addEventListener("change", (e) => renderDynamicRelationsForm(e.target.value));
      document.getElementById("modal-close").addEventListener("click", () => document.getElementById("modal-editor").classList.add("hidden"));
      document.getElementById("modal-cancel").addEventListener("click", () => document.getElementById("modal-editor").classList.add("hidden"));

      // Modal Form Submit Handler
      document.getElementById("form-entity").addEventListener("submit", (e) => {
        e.preventDefault();
        if (externalChangePending) {
          alert('Modifications externes détectées : annulez ce formulaire et rechargez la page avant de sauvegarder.');
          return;
        }
        const isEdit = document.getElementById("input-is-edit").value === "true";
        const type = document.getElementById("input-type").value;
        const id = document.getElementById("input-id").value;
        const name = document.getElementById("input-name").value;
        const desc = document.getElementById("input-desc").value;

        // Capturer les relations AVANT de réinitialiser le formulaire ou le graphe.
        const selectedRefs = (selector) => Array.from(
          document.querySelector(selector)?.selectedOptions || [], option => option.value
        );
        const containedModelRefs = selectedRefs("#rel-contained-models");
        const framedConcernRefs = selectedRefs("#rel-framed-concerns");

        if (!isEdit) {
          if (type === "Stakeholder") state.stakeholders.push({ id, name, role: desc });
          if (type === "Concern") state.concerns.push({ id, name, holderStakeholderRefs: [] });
          if (type === "ArchitectureViewpoint") state.viewpoints.push({ id, name, framedConcernRefs, usedModelKindRefs: [] });
          if (type === "ArchitectureView") state.views.push({ id, name, governedByViewpointRef: "", containedModelRefs });
          if (type === "ArchitectureModel") {
            const uri = document.getElementById("rel-artifact-uri")?.value || desc || "process.bpmn";
            state.models.push({ id, name, governedByModelKindRef: "MK_BPMN20", artifactURI: uri });
          }
          if (type === "Correspondence") {
            const src = document.getElementById("rel-source")?.value || "";
            const tgt = document.getElementById("rel-target")?.value || "";
            state.correspondences.push({ id, name, sourceElementRef: src, targetElementRef: tgt, relationType: "relates" });
          }
        } else {
          if (type === "Stakeholder") {
            const stakeholder = state.stakeholders.find(s => s.id === id);
            if (stakeholder) {
              stakeholder.name = name;
              stakeholder.role = desc;
            }
          } else if (type === "ArchitectureView") {
            const view = state.views.find(v => v.id === id);
            if (view) {
              view.name = name;
              view.containedModelRefs = containedModelRefs;
            }
          } else if (type === "ArchitectureViewpoint") {
            const vp = state.viewpoints.find(v => v.id === id);
            if (vp) {
              vp.name = name;
              vp.framedConcernRefs = framedConcernRefs;
            }
          }
        }

        saveState();
        document.getElementById("modal-editor").classList.add("hidden");
      });

      // Export / Copy XML Buttons
      document.getElementById("btn-export-xml").addEventListener("click", () => {
        const blob = new Blob([generateXML()], { type: "text/xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "iso42010_architecture.xml";
        a.click();
      });

      document.getElementById("btn-copy-xml").addEventListener("click", () => {
        document.execCommand('copy');
        alert("XML pivot output copied to clipboard!");
      });
      try { refreshUI(); } catch (error) { console.error('Graph startup failed', error); alert('Initialisation du graphe impossible : ' + error.message); }
    });

window.editElement = editElement;
window.deleteElement = deleteElement;
