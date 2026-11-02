# AGENTS.md — Contrat d'ingénierie Cytoscape.js / ISO 42010

> À placer sous le nom `AGENTS.md` à la racine du projet. Ce document est une instruction de travail pour l'assistant qui lit le projet ; **il ne remplace ni le code, ni les dépendances, ni les tests navigateur**.

## 1. Mission et périmètre

Maintenir et faire évoluer l'application de visualisation ISO/IEC/IEEE 42010 basée sur **Cytoscape.js**, **cytoscape-expand-collapse**, **cytoscape-fcose** et, lorsque nécessaire, **cytoscape-undo-redo**.

Priorités, par ordre : (1) fonctionnement utilisateur réel ; (2) absence de régression ; (3) conformité aux APIs et démonstrateurs officiels ; (4) modifications minimales et vérifiables ; (5) lisibilité du code et des livrables.

Ne pas introduire de fonctions de clustering **Markov** dans les commandes Expand/Collapse du projet, sauf nouvelle demande explicite.

## 2. Sources de vérité et ordre de consultation

1. Code source de **la version effectivement utilisée par l'utilisateur**, pas une ancienne variante.
2. Bibliothèques JS effectivement chargées : fichiers embarqués, fichiers locaux ou versions verrouillées par URL.
3. Démonstrateur officiel : <https://github.com/iVis-at-Bilkent/cytoscape.js-expand-collapse/tree/master/demo>.
4. Code d'extension / documentation officielle : <https://github.com/iVis-at-Bilkent/cytoscape.js-expand-collapse>.
5. Sources comparatives fournies par l'utilisateur : `OntologyViewer.html`, `ArchiCG-standalone.html` (attention : leurs comportements ne prouvent pas à eux seuls ceux du projet courant).

Si le code utilisé ne permet pas de conclure, indiquer précisément l'élément manquant. **Ne jamais présenter une supposition comme une cause prouvée**.

## 3. Contrat d'architecture Cytoscape

- Une opération Expand/Collapse agit sur **l'instance `cy` du diagramme visible**, et sur l'API Expand/Collapse créée à partir de cette même instance.
- Initialiser les plugins dans leur ordre de dépendances compatible avec leurs versions ; vérifier au runtime la disponibilité des extensions avant utilisation.
- `cytoscape-expand-collapse` gère le repli/dépli des nœuds et le regroupement/restauration des arcs ; `cytoscape-fcose` calcule le layout ; `cytoscape-undo-redo` gère l'historique. **Ces rôles ne sont pas interchangeables**.
- Utiliser les méthodes documentées de l'API Expand/Collapse (`collapse`, `expand`, `collapseAll`, `expandAll`, opérations récursives, commandes sur les arcs) sur l'instance courante. Ne pas substituer l'historique Undo/Redo à la commande graphique.
- Établir explicitement le cycle de vie : création de `cy` → disponibilité du graphe → initialisation et récupération de l'API de l'extension → association des contrôles à l'API active → exécution → rendu.
- Ne pas détruire puis recréer `cy` lors d'un clic Collapse/Expand. La régénération du graphe est réservée aux modifications de modèle exigeant une reconstruction ; dans ce cas, réinitialiser explicitement et sans référence périmée l'API associée.
- Séparer l'état **métier** ISO 42010 de l'état **de présentation** Cytoscape (sélection, positions, éléments repliés, arcs agrégés, zoom).
- Éviter de restaurer immédiatement l'état initial de l'application après une opération Expand/Collapse, par exemple via une fonction globale `refreshUI()` qui redessine tout le graphe.

## 4. Rendu, overlays et interactions : contrôles obligatoires

**Incident avéré dans ce projet :** un `<canvas class="expand-collapse-canvas">` créé par l'extension interceptait les clics destinés au panneau Graph Controls. Les méthodes JavaScript fonctionnaient lorsqu'elles étaient appelées directement, mais les boutons restaient inactifs avec de vrais clics.

Avant toute intervention sur une commande apparemment inactive :

- Inspecter la hiérarchie DOM réelle, les conteneurs et la superposition des canvas/overlays.
- Contrôler `z-index`, `position`, `pointer-events`, dimensions, visibilité, et les contextes d'empilement CSS.
- Vérifier l'élément réellement au premier plan avec `document.elementFromPoint(x, y)` aux coordonnées centrales du bouton ; confronter ce résultat au bouton attendu.
- En cas d'interception, corriger **l'empilement et la zone de capture** sans désactiver par défaut les interactions nécessaires aux repères Expand/Collapse de Cytoscape.
- Vérifier la taille effective de `#cy` et de ses ancêtres (`getBoundingClientRect`), indépendamment de CDN CSS ; un graphe peut être initialisé mais invisible si sa taille est nulle.
- Confirmer la présence des styles de nœuds composés, nœuds repliés et arcs regroupés, en respectant la priorité des sélecteurs et l'ordre de la feuille de style Cytoscape.
- Pour fCoSE : vérifier que l'extension est enregistrée, que le layout est demandé sur la bonne instance et que l'exécution n'est pas masquée par une initialisation ou une recréation ultérieure.

## 5. Comportements attendus du panneau Graph Controls

| Action | Comportement attendu |
| --- | --- |
| Collapse All Nodes | Replie les groupes repliables visibles, selon la politique de racine choisie dans l'UI. |
| Expand All Nodes | Restaure les groupes repliés, y compris les descendants accessibles. |
| Collapse / Expand Selected | Ne cible que les nœuds composés sélectionnés et admissibles. |
| Collapse / Expand Recursively | Applique la variante récursive documentée aux groupes sélectionnés. |
| Collapse / Expand All Edges | Utilise les méthodes **spécifiques aux arcs** et les options de regroupement. |
| Selected Edges / Between Selected Nodes | Utilise les collections Cytoscape et les méthodes d'arcs appropriées ; annoncer un « aucun effet applicable » plutôt qu'un faux succès si la sélection n'est pas admissible. |
| Run fCoSE | Relance effectivement la disposition sur `cy` sans perdre l'état métier ni rompre l'API. |
| Undo / Redo | Revient sur une opération historisée, sans se substituer au moteur Expand/Collapse. |

Concernant les arcs : un regroupement demande des arcs regroupables (par exemple des arcs parallèles) ; ne pas promettre de changement visuel s'il n'existe aucun groupe admissible.

L'inspecteur doit afficher les propriétés **métier** ISO 42010 ; ne pas afficher en vrac les métadonnées internes de l'extension (`collapsedChildren`, positions de sauvegarde, objets temporaires).

## 6. Protocole de diagnostic (avant correction)

1. **Reproduire** le dysfonctionnement sur le fichier et les dépendances exacts.
2. **Observer un vrai clic non forcé** sur le bouton, la cible DOM et l'éventuelle interception par un overlay.
3. Vérifier si le gestionnaire reçoit l'interaction ; seulement ensuite vérifier l'appel à l'API, son instance, ses arguments et son résultat.
4. Contrôler les événements de l'extension et l'état visuel final : groupes effectivement repliés/dépliés, arcs attendus, styles et disposition.
5. Produire une hypothèse précise et une expérience qui puisse la confirmer ou l'infirmer.
6. Corriger **la cause démontrée** avec le changement minimal, sans modifier d'autres extensions sans nécessité prouvée.

Les traces console peuvent servir pendant le diagnostic, mais les tests de clic et panneaux de logs temporaires ne doivent **pas** rester dans l'interface finale sans demande explicite.

## 7. Tests navigateur obligatoires avant livraison

Privilégier un navigateur automatisé (par exemple Playwright/Chromium) en chargeant le projet **avec les dépendances et CSS réellement utilisés**.

- Réaliser des **clics réels non forcés** (`locator.click()`), et non uniquement `element.click()`, `dispatchEvent`, appel direct de `api.*` ou `force: true`.
- Si un clic échoue, lire le message d'interception et identifier l'élément recouvrant la cible ; ne pas contourner le défaut avec un clic forcé.
- Faire une capture **avant** et **après** chaque scénario visuel critique. Vérifier la différence attendue et non le simple changement du nombre de nœuds.
- Vérifier : Collapse All → rendu replié, Expand All → restauration, sélection et repli individuel, opérations récursives, opérations sur arcs parallèles lorsqu'elles sont testables, Run fCoSE, zoom/pan, inspecteur et changement d'onglet.
- Vérifier l'absence d'erreurs JavaScript non traitées et de ressources essentielles manquantes.
- Effectuer un test de non-régression après toute correction touchant aux CSS, extensions ou à l'initialisation.
- En cas de dépendances externes bloquées, mentionner la limite ; ne **jamais** annoncer un test visuel réussi s'il n'a pas eu lieu.

**Critère minimal de réussite pour les boutons Expand/Collapse :** un clic souris réel atteint le bouton, invoque l'API du `cy` affiché, et entraîne le repli puis la restauration **visuellement constatables** des groupes attendus, sans casser fCoSE.

## 8. Gestion des dépendances et reproductibilité

- Conserver les versions effectivement validées, y compris leur compatibilité et ordre de chargement ; proscrire les URL non vérifiées.
- Si possible fournir un ensemble reproductible (fichiers locaux/embarqués ou lockfile), et documenter explicitement les ressources qui restent externes.
- Ne pas substituer un layout `preset` à fCoSE sans positions définies et sans raison vérifiée.
- Ne pas introduire de dépendances manquantes ou de références à une feuille CSS inexistante.
- Ne pas prétendre qu'un fichier HTML est autonome tant qu'il dépend encore de CDN essentiels.

## 9. Règles de livraison

Chaque livraison doit mentionner brièvement :

1. **Cause prouvée** et preuve associée (ou incertitude restant à lever).
2. Fichiers modifiés et changement minimal effectué.
3. Tests réellement exécutés, avec distinction nette : syntaxe / API / clic utilisateur / rendu visuel / non-régression.
4. Limitations du test, si elles existent.

Ne pas multiplier les variantes conjecturales. Après un échec, **revenir aux observations**, ne pas répéter un ajustement de paramètres. Ne pas supprimer des fonctionnalités existantes pour faire « marcher » un bouton.

## 10. Référence initiale du projet

Version reconnue fonctionnelle par l'utilisateur pour les boutons globaux après correction de l'interception des clics : `iso42010_cytoscape_rendu_corrige.html`. La garder comme **baseline de comparaison**, sans supposer que tous les scénarios avancés (notamment les arcs) ont été testés.

Pour chaque nouvelle intervention : comparer à cette baseline, puis confirmer que Collapse All, Expand All et Run fCoSE ne régressent pas.
