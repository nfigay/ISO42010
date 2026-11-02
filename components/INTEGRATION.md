# Intégration des composants — Contrat transversal

Chaque composant doit documenter : **owner** de l'instance, cycle de vie, conteneur DOM, dépendances, version, événements produits/consommés, modèle d'identité et séquences d'import/export.

- Un conteneur w2ui ou une vue cachée peut invalider les dimensions calculées de Cytoscape/bpmn-js : attacher le resize lorsque la vue est rendue et visible.
- Choisir une source unique pour les données métier, éviter de prendre le renderer pour le référentiel et de forcer une reconstruction totale à chaque commande.
- Les événements multi-composants sont des contrats explicites ; gérer les cycles de sélection et les risques de boucles de synchronisation.
- Les erreurs d'intégration se diagnostiquent couche par couche (UI → commande → API → modèle → rendu), avec observations reproductibles.
- Les données ISO42010 produites par le workbench sont échangées avec SPM via contrat versionné XML/manifest, **pas** via accès au DOM ou aux variables globales d'une application à l'autre.
- Une définition de médiation doit configurer conjointement composition, palette, data forms, filtres, rendu et linting ; chaque bloc garde ses tests indépendants.
