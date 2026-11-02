# w2ui.js — Fiche d'intégration

**Statut** : guide préliminaire ; la version précise et la configuration de Semantic-Process-Mediator ne sont pas disponibles ici.

- Inventorier `w2layout`, `w2grid`, `w2toolbar`, leurs noms et éléments DOM propriétaires ; ne pas dupliquer les instances globales.
- Différencier événement déclenché, gestionnaire réellement exécuté et modification visible du widget.
- Lorsque w2ui redimensionne ou masque un panneau contenant Cytoscape ou bpmn-js, prévoir le recalcul de taille/zoom via les API de chaque composant, après que le conteneur possède une taille non nulle.
- Vérifier les overlays/menu popup : focus, ordre d'empilement, capture souris et clavier, propagation des événements.
- Définir et tester la destruction/réinstallation des widgets lors des changements de vue ; nettoyer abonnements et éléments DOM.
- Vérifier les opérations réelles utilisateur : toolbar, panels, sélection, resize, drag & drop, persistance.

Documentation : https://w2ui.com/web/docs/ ; ne pas supposer une signature d'API identique entre versions.
