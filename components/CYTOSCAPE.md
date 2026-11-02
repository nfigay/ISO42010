# Cytoscape.js — Fiche technique réutilisable

**Périmètre** : graphe et extensions `cytoscape-expand-collapse`, `cytoscape-fcose`, `cytoscape-undo-redo`. Versions exactes à inventorier dans le fichier déployé avant modification.

- Identifier l'instance `cy` **visible** et l'API de chaque extension attachée à celle-ci ; éviter les références périmées lors des reconstructions.
- Expand/Collapse agit sur les nœuds composés et arcs admissibles ; Undo/Redo représente l'historique ; fCoSE représente le layout. Ne pas substituer une extension à une autre.
- **Incident confirmé dans ISO42010 :** `<canvas class="expand-collapse-canvas">` interceptait les clics sur Graph Controls. Diagnostiquer `elementFromPoint`, `z-index`, stacking context, `pointer-events` et dimensions avant de changer les API.
- Tests : vrais clics non forcés Collapse All / Expand All ; changements visuels avant/après ; relayout fCoSE ; sélection et commandes d'arcs si des arcs admissibles existent ; pas de régression.
- Éviter l'export de propriétés internes de rendu comme données métier.

Référence historique de diagnostic : `reference/CYTOSCAPE_DIAGNOSTIC_HISTORIQUE.md`. Démonstrateur officiel : https://github.com/iVis-at-Bilkent/cytoscape.js-expand-collapse/tree/master/demo
