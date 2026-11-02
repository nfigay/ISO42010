# ISO42010 — Architecture Workbench et conception des profils de médiation

**Statut : prototype fonctionnel du workbench + référentiel documentaire de conception.**

- Workbench : [`docs/index.html`](docs/index.html) — version dont l'utilisateur a confirmé les commandes Cytoscape Collapse All / Expand All.
- Schéma ISO42010 : [`schemas/iso42010-network-baseline.xsd`](schemas/iso42010-network-baseline.xsd), extrait de la discussion Gemini ; **baseline applicative expérimentale, pas schéma officiel ISO**.
- Audit des écarts XML : [`reference/REVUE_CONSOLIDATION_2026-11-02.md`](reference/REVUE_CONSOLIDATION_2026-11-02.md).
- Projet ChatGPT Plus : [`chatgpt/INSTRUCTIONS_PROJET.md`](chatgpt/INSTRUCTIONS_PROJET.md), à copier dans les paramètres du projet ChatGPT, et fichiers de référence à joindre en sources.
- Prompts de travail : [`prompts/`](prompts/).
- Connaissance technique sur les composants : [`components/`](components/).
- Cible fonctionnelle SPM : [`architecture/`](architecture/).

## Périmètre non négociable

Le workbench **conçoit et exporte** des descriptions d'architecture ISO 42010 et progressivement des *profils de médiation*. Il **n'embarque pas l'éditeur BPMN**. **Semantic Process Mediator (SPM)** consomme et interprète ces profils et conserve le noyau BPMN, ses extensions et sa gestion native des objets et références.

Les futurs profils incluront composition d'artefacts BPMN (pas seulement diagrammes), palettes, data forms, groupes de données, filtres, rendus, mappings composites et règles de validation / linting.

## Prévisualisation

Ouvrir `docs/index.html` dans un navigateur, ou servir le répertoire statique (ou `npx vite --host 127.0.0.1`, après configuration éventuelle de Vite ; le déploiement Pages sert directement `docs/`). L'application actuelle conserve des fonctionnalités dépendant du stockage navigateur ; ne pas présumer qu'un profil SPM est déjà exportable.

## Déploiement Pages

Workflow `.github/workflows/pages.yml` : pousse le répertoire `docs/` sur GitHub Pages lors des pushes sur `main`. Dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions**. URL attendue *après publication réussie* : `https://nfigay.github.io/ISO42010/`.

## Installation sur Mac

Voir [`scripts/INSTALL_MAC.md`](scripts/INSTALL_MAC.md) ; ce dépôt a été préparé hors du Mac : il n'a pas été installé sur `~/git/ISO42010`, ni poussé vers GitHub à ce stade.

## Tests

`sh tests/validate_xml.sh` (utilise `xmllint`, utilitaire XML ; sur GitHub Actions, le paquet `libxml2-utils` est installé sur le runner). L'exemple XML conforme doit être accepté, l'export historique reconstruit doit être rejeté. Ce test ne valide **pas** la conformité ISO 42010 de fond ni l'UI graphique.

## Sources / droits

Les bibliothèques embarquées dans l'HTML proviennent des composants tiers Cytoscape et extensions ; vérifier leurs licences avant redistribution publique. Les contenus de la discussion Gemini ne sont pas publiés en intégralité dans ce dépôt. Aucun code du dépôt local Semantic-Process-Mediator n'a été copié, faute d'accès à la machine.

## Conventions environnement utilisateur

Mac + commandes natives, Git, Node/npm/Vite et `gh` ; **pas de Python ni Perl**. Les commandes de diagnostic copient le compte rendu avec `pbcopy`. Tous les échanges de fichiers se font par archives ZIP. Ne pas intervenir sur `~/git/Semantic-Process-Mediator` ni écraser des fichiers existants.
