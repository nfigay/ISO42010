# bpmn.io / bpmn-js — Fiche d'intégration

**Statut** : contrat de bonnes pratiques ; à vérifier sur la version déployée dans Semantic Process Mediator.

- `bpmn-js` est le moteur de modélisation/visualisation, `diagram-js` fournit l'infrastructure interactive, `bpmn-moddle` les objets et la sérialisation XML ; ne pas confondre le modèle BPMN et le dessin SVG.
- **Respecter BPMN Core** : `DataObject` ≠ `DataObjectReference`, `DataStore` ≠ `DataStoreReference`. Conserver les références et identifiants lors de l'export/import. Prévoir les définitions non visibles sur diagramme.
- Modules / API à exploiter selon le besoin : `additionalModules`, `moddleExtensions`, palette, `rules`, properties panel, overlays, custom renderer, event bus, modeling, command stack.
- Différencier palette masquée (UX) et règles réellement imposées ; importer un XML doit déclencher validation même si la palette interdit un objet.
- Garder les IDs stables ; afficher des `name` ou labels contextuels selon profil sans changer arbitrairement les ID de l'objet métier. Les UUID seuls ne résolvent ni les migrations ni les correspondances inter-modèles.
- Pour les extensions XML : tester un round-trip import/export sur la version réelle, y compris l'absence de perte de contenu XML inconnu ; un namespace n'implique pas validation multi-XSD.
- SPM interprète les profils de médiation produit par ISO42010 ; le workbench ISO42010 **n'intègre pas bpmn-js** dans son noyau.

Références : https://bpmn.io/toolkit/bpmn-js/ ; https://github.com/bpmn-io/bpmn-js-examples ; https://github.com/bpmn-io/bpmn-moddle
