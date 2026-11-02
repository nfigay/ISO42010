# Revue de consolidation — contrat XML ISO 42010 vers Semantic Process Mediator

**Date :** 2026-11-02  
**Nature :** diagnostic du schéma existant, sans changement du schéma ni du workbench.  
**Sources analysées :** discussion Gemini transmise (`Texte collé(20261102-122408).txt`, section « Schéma XSD relationnel et non-arborescent ») et `iso42010_cytoscape_rendu_corrige.html` (version du workbench déclarée fonctionnelle pour Collapse/Expand).

## 1. Artefacts produits et tests reproductibles

- `iso42010_network_gemini_original.xsd` : transcription **inchangée** du dernier XSD relationnel `.../network` retrouvé dans la discussion Gemini.
- `iso42010_export_baseline_reconstructed.xml` : reconstruction fidèle de la structure de l'export `generateXML()` pour les données `DEFAULT_MODEL`, avec échappement nécessaire du caractère `&` afin d'isoler les erreurs de schéma. **Ce fichier n'est pas présenté comme un téléchargement réel du navigateur.**
- `iso42010_network_reference_valid.xml` : **exemple de compatibilité avec le XSD existant**, obtenu à partir des mêmes données et restructuré selon le schéma. Ce n'est pas un format cible proposé ni une modification silencieuse du modèle métier.

Vérification avec `lxml.etree.XMLSchema` :

| Vérification | Résultat |
|---|---|
| Compilation du XSD Gemini `network` | **OK** |
| XML reconstruit, syntaxe bien formée (caractères XML échappés pour l'audit) | **OK** |
| Validation de l'export reconstruit contre le XSD | **ÉCHEC** |
| Validation de l'exemple réorganisé contre le même XSD | **OK** |

Erreurs constatées pour l'export reconstruit :

1. Attribut `id="SOI_PAYMENT_SYS"` présent à la fois sur `architectureDescription` et `systemOfInterest`, or `xs:ID` impose l'unicité dans le document.
2. Le schéma attend `<iso:stakeholders>` comme entrée répétable (contenant directement les attributs du stakeholder), alors que l'export écrit `<iso:stakeholder>` ; le même décalage de nom existe pour `concerns`/`concern`, `viewpoints`/`architectureViewpoint`, `models`/`architectureModel`, `views`/`architectureView`, `correspondences`/`correspondence`.
3. Le XSD impose l'ordre de séquence `systemOfInterest`, `stakeholders`, `concerns`, `viewpoints`, `modelKinds`, `models`, `views`, `rationales`, `correspondenceRules`, `correspondences`. L'export met `views` avant `models` et ne produit pas `modelKinds`.
4. L'export omet `usedModelKindRefs` alors que `tArchitectureViewpoint` l'exige ; le champ existe pourtant dans `DEFAULT_MODEL`.
5. Le générateur XML concatène des valeurs interpolées dans les attributs / textes sans échappement XML. Par exemple `Security & Compliance` et `Security & Risk Viewpoint` rendent l'export brut **non bien formé**. Dans le fichier reconstruit, seul l'échappement de ces caractères a été appliqué pour poursuivre le test de validation XSD.

Autres écarts documentés :
- Le schéma définit `ArchitectureRationale` et `CorrespondenceRule`, mais le modèle d'état et l'export n'en gèrent pas encore les données.
- Le XSD porte un namespace d'application `http://iso.org/iso-iec-ieee-42010/network` qui **ne doit pas être présenté comme namespace normatif ISO publié** sans vérification documentaire indépendante.
- Le fichier HTML contient des boutons `Import XML` et un `<input type="file">`, mais **aucun gestionnaire d'import XML n'a été identifié** dans ce script. L'export est câblé. Cela contredit l'hypothèse d'un round-trip XML complet pour cette version vérifiée ; un autre état de l'application pourrait exister.
- Le XSD `xs:IDREF(S)` vérifie les références à des identifiants, mais n'exprime pas que `governedByViewpointRef` doit désigner *un viewpoint* plutôt qu'un élément d'un autre type ; de tels contrôles nécessiteront des règles complémentaires.

## 2. Matrice initiale de consolidation

| Concept / champ | XSD Gemini | État workbench observé | Décision proposée |
|---|---|---|---|
| `architectureDescription` | Racine `id`, `name` | Racine reprend ID SOI | **Corriger** l'identité propre de la description |
| `systemOfInterest` | Objet distinct, `environmentDescription`, `mission` | Données présentes, ID dupliqué | **Conserver**, distinguer les IDs |
| `stakeholders` / `Stakeholder` | Type `tStakeholder` | Données présentes, nom XML divergent | **Aligner le mapping XML**, préserver les données |
| `concerns` | `holderStakeholderRefs` | Présent, nom XML divergent | **Aligner et valider** références |
| `viewpoints` | `framedConcernRefs`, `usedModelKindRefs` | Second champ non sérialisé | **Compléter export/import** |
| `modelKinds` | `governingNotation` | Présent dans état, absent export | **Compléter export/import** |
| `models` | `governedByModelKindRef`, `artifactURI` | Présent, ordre et nom divergents | **Aligner sérialisation** |
| `views` | `governedByViewpointRef`, `containedModelRefs` | Présent, ordre et nom divergents | **Aligner sérialisation** |
| `rationales` | Prévu XSD | Pas d'entité métier gérée | **Reporter**, définir données requises |
| `correspondenceRules` | Prévu XSD | Pas d'entité métier gérée | **Reporter**, préciser langage de règles |
| `correspondences` | Source, cible, relation, règle optionnelle | Relations présentes, pas de règle | **Conserver et compléter** |
| Références vers objets BPMN natifs | Aucune adresse inter-document standardisée | `artifactURI` au niveau modèle | **Concevoir contrat d'identité et de résolution** sans recopier le core BPMN |

## 3. Décisions d'architecture suggérées, non encore adoptées

**A. Maintenir le schéma réseau Gemini comme baseline.** Éviter une refonte conceptuelle pendant la correction du mapping. Nommer la baseline (par ex. `network-v0`) avant d'introduire des changements incompatibles.

**B. Implémenter une couche de sérialisation dédiée** au workbench plutôt que continuer les interpolations de chaînes. Export et import doivent être symétriques et validés par l'XSD, avec escape XML, ID uniques, stabilité des noms et préservation des champs inconnus selon une politique explicite.

**C. Distinguer deux modes d'intégration dans SPM** : (i) description architecturale XML autonome référençable par URI, (ii) références/agrégats via `bpmn:extensionElements` sous un namespace BPMNSM distinct, avec mapping documenté et conservation du contenu non connu par bpmn-js. Ne pas supposer que l'ajout d'un namespace équivaut à une validation multi-XSD.

**D. Réutiliser le modèle BPMN natif pour ce qu'il sait représenter** : tâches, événements, processus, données, références, associations. Les concepts ISO 42010 et liens transversaux vont dans l'extension ou la description architecturale, non dans une duplication du core BPMN.

**E. Établir une table stable `architectureElementId` ↔ `documentURI + BPMN element id`**, avec provenance et politique de version. Les références externes ne peuvent pas être traitées comme des `xs:IDREF` locaux, limités au document courant.

## 4. Séquence de travail suggérée

1. **P0 — Acter la baseline** : conserver XSD original, XML de référence conforme et fixtures de tests ; figer l'intention sur `.../network` avant d'optimiser.
2. **P1 — Réparer le contrat d'échange du workbench** : modèle avec `architectureDescription.id` distinct, export conforme au XSD, vrai import, échappement, round-trip et rejet clair des références invalides ; ne pas toucher aux mécanismes Cytoscape validés.
3. **P2 — Formaliser le mapping SPM** : matrice de couverture « core BPMN / extension BPMN existante / ISO 42010 XML », noms d'espaces, résolution d'URI, identité, cycle de vie, stratégie de validation multi-schémas.
4. **P3 — Prototype d'intégration limité dans SPM** : associer un BPMN réel à `ArchitectureDescription`, relier quelques `Concern` / `Viewpoint` et parcourir ces références dans SPM ; valider import → édition → export BPMN sans perte.
5. **P4 — Étendre** aux correspondances externes, règles et gouvernance de versions et variantes, avec jeux de tests de non-régression.

## 5. Limites de la présente revue

- Elle compare le XSD de la discussion et le dernier HTML Cytoscape disponible ; le **fichier XSD autonome originel**, s'il existe en une autre version, n'a pas été fourni séparément.
- Aucun code actuel de Semantic Process Mediator n'a été fourni pour cette revue : les contrats d'adaptateur BPMN et les choix de résolution d'URI restent **des propositions** et ne sont pas validés par une implémentation SPM.
- La conformité juridique/normative exhaustive à ISO/IEC/IEEE 42010:2022 n'a pas été démontrée. La compilation XSD n'est pas un audit de conformité ISO.
