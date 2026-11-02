# Modèle de médiation cible — spécification de travail (NON implémentée)

## Méta-objets SPM proposés

- `MediationProfile` : identifiant, version, références de viewpoints et compatibilité SPM.
- `MediationViewDefinition` : viewpoint gouvernant, model kinds, composants de vue, composition et ensemble de politiques.
- `ArtifactSelector` : sélection déclarative d'objets BPMN natifs, y compris définitions hors diagramme et leurs références.
- `ArtifactComposition` : groupes, inclusion/exclusion, ordre, références à plusieurs documents, projections.
- `DataGroup` : champs structurés, vocabulaire, source des données, partage entre plusieurs artefacts, cardinalité et droits.
- `PaletteProfile` : outils BPMN visibles, admissibles et contextuels ; les restrictions sont également validées à l'import.
- `DataFormProfile` : champs, groupes, types, validations, visibilité et édition.
- `FilterProfile` : requêtes déclaratives sur le modèle sémantique et le contexte.
- `RenderingProfile` : noms métier, labels calculés, couleurs, légendes, overlays sans réécrire arbitrairement le `id` BPMN.
- `MappingSet` / `MediationMapping` : relations typées et correspondances **composites** entre ensembles d'artefacts et groupes de données ; provenance et cardinalités.
- `ValidationProfile` : règles syntaxiques, sémantiques, inter-modèles, sévérité, messages et moteur d'évaluation.

## Exemple de scénario d'acceptation

1. Définir un viewpoint « BPMN Data Mediation » orienté identité, partage et traçabilité de données.
2. Associer des sélecteurs BPMN `DataObject`, `DataObjectReference`, `DataStore`, `DataStoreReference`, `DataAssociation`, activités connectées et modèles de collaboration ; ne pas les recréer dans le XSD ISO42010.
3. Configurer une palette adaptée et un formulaire « Data Governance » comprenant un groupe de données partagé.
4. Créer une règle contrôlant la résolution des références et une règle contrôlant une propriété du groupe de données.
5. Exporter un paquet avec le profil ISO42010, sa configuration SPM et ses références documentées.
6. Valider les XSD et le manifeste, puis injecter dans SPM pour reproduire palette, formulaires, affichage et rapports de validation.

## Politique de représentation

Pour une même information, privilégier : BPMN Core > extension existante documentée > schéma SPM dédié. Les identifiants de l'architecture et du modèle BPMN sont distincts. Les libellés affichés peuvent être contextuels, les identités restent stables. Une composition n'est pas assimilée à un diagramme unique.

## Phase

Ce fichier est une **spécification de conception**, pas un export machine exploitable aujourd'hui. Aucun convertisseur d'injection SPM n'est livré dans cette baseline.
