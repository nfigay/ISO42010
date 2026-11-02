# Tests et critères de validation

## Workbench existant

1. Ouvrir `docs/index.html` dans un navigateur, vérifier les dimensions visibles du graphe et l'absence d'erreurs d'initialisation.
2. Clic souris **réel non forcé** sur Collapse All → groupes effectivement repliés ; clic sur Expand All → restauration ; vérifier qu'aucun canvas n'intercepte les boutons.
3. Déclencher fCoSE → layout effectivement recalculé, boutons toujours accessibles.
4. Refaire les opérations sur sélection/nœuds/arcs avec un graphe contenant réellement des éléments admissibles.
5. Ne pas déclarer les scénarios réussis sans les avoir exécutés dans le navigateur concerné.

## XML

- Exécuter `python3 tests/validate_xml.py` (requiert `lxml`).
- L'exemple XSD valide passe ; l'ancien export reconstruit est délibérément non conforme : il sert de test de non-régression documentaire.
- Avant mise en production du mapping : scénarios import→export→import ; contrôle des IDs et références ; échappement ; tests des valeurs absentes et non connues ; validation multi-document additionnelle.

## SPM (futur)

- Contrat d'import de profils : manifeste, version, schéma, refs résolues et gestion de conflit.
- Palette : éléments disponibles selon viewpoint ; validation indépendante même après import XML.
- Forms : champs obligatoires, groupes partagés, droits et contraintes contextuelles.
- Lint : diagnostic corrélé à l'élément BPMN ou à la composition, et règle versionnée.
- Rendu : propriétés et diagramme cohérents, sans altérer le BPMN Core.

**Statut :** aucun test E2E automatisé du workbench ou de SPM n'est inclus dans cette première arborescence ; ce document définit la méthode et les critères de livraison.
