# Contrat XML multi-schémas — décisions et points ouverts

## Existant prouvé

- Schéma réseau de référence : `schemas/iso42010-network-baseline.xsd` (baseline Gemini, validée au niveau XSD).
- `examples/architecture-reference-valid.xml` est conforme au XSD.
- Le générateur XML du workbench courant diverge de ce XSD : voir audit détaillé. **Ne pas prétendre que le round-trip actuel est validé**.

## Approche d'intégration cible

1. Garder le XML ISO42010 autonome et versionné.
2. Définir un namespace XSD séparé pour la configuration SPM (à produire après validation du métamodèle cible).
3. Dans les modèles BPMN, utiliser `bpmn:extensionElements` et les points d'extension existants seulement lorsque l'information doit accompagner des éléments BPMN ; sinon, utiliser une ressource externe référencée.
4. Établir une résolution explicite pour `(documentURI, elementId, modelVersion)` ; les `xs:IDREF` ne traversent pas les documents.
5. Concevoir la validation en couches : structure XML/XSD + références inter-documents + conventions de viewpoint + règles BPMN/lint + contraintes de médiation.
6. Tester l'import/export sur une instance bpmn-js de la version SPM cible avant de déclarer les extensions préservées.
7. Ajouter un manifeste de paquet versionné : URI des schémas, références des artefacts, versions et compatibilités.

## Points à décider avant implémentation

- Namespace et version v1 du nouveau schéma SPM.
- Identité logique stable et politique de migration des IDs BPMN.
- Profils intégrés vs références externes et politique de résolution offline.
- Langage déclaratif des sélecteurs, règles de filtres et expression des labels dynamiques.
- Ordre de priorités des modèles, propriétés et données surchargées par le tailoring.
- Format précis des rapports de validation et diagnostics.

**Exemple conceptuel** (ce vocabulaire n'existe PAS encore dans le XSD de référence) :

```xml
<bpmn:extensionElements>
  <spm:mediationRef xmlns:spm="urn:bpmnsm:mediation:proposal"
     profileURI="profiles/data-mediation.xml" viewpointRef="VP_DATA" />
</bpmn:extensionElements>
```
