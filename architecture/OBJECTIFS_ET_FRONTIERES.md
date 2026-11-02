# Objectifs et frontières d'architecture

## Source : décisions formulées par le propriétaire du projet dans la conversation

1. Le workbench ISO42010 **produit** des modèles/profils de médiation **avant** leur injection dans Semantic Process Mediator.
2. Il n'est pas question d'introduire BPMN dans le workbench ISO42010.
3. Conserver le XSD et les données ISO42010 existants, avec consolidation préalable ; s'appuyer sur extensions BPMN et XML multi-schémas pour les informations absentes du BPMN Core.
4. Les objets de médiation ne se limitent pas aux diagrammes : composition des artefacts BPMN, groupes de données, palettes, data forms, filtres, contraintes et linting.
5. Le workbench et SPM doivent pouvoir évoluer indépendamment via un **contrat d'échange versionné**.

## Répartition des responsabilités — proposition

| Responsable | Fonctions |
|---|---|
| Workbench ISO42010 | Conception des stakeholders, concerns, viewpoints, model kinds, correspondences, *MediationProfile* ; validations de conception ; sérialisation et packaging |
| SPM | Chargement de profils ; interprétation des sélections d'artefacts BPMN ; palettes et data forms bpmn.io ; modèles BPMN natifs ; affichage et exécution des règles |
| BPMN 2.0 | Process, FlowElements, DataObject, DataObjectReference, DataStore, DataStoreReference, associations et références BPMN |
| Schémas additionnels | Concepts architecturaux ISO42010 et configuration de médiation non couverts par le Core ou les extensions retenues |

**Ne pas attribuer à ISO 42010 les types SPM spécifiques**, p. ex. *PaletteProfile*, *DataFormProfile*, *MediationMapping*. La norme aide à les gouverner par viewpoints/conventions ; leur sémantique est applicative.
