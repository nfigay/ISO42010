# Canvas / SVG — Contrat d'intégration graphique

- Séparer modèle métier, scène/diagramme, couche interactive et overlays HTML/SVG/canvas.
- Mesurer les rectangles DOM et vérifier un conteneur non nul avant le rendu.
- Tester `document.elementFromPoint`, `pointer-events`, z-index et les stacking contexts, spécialement pour les contrôles situés au-dessus d'un canvas.
- Sur Canvas, gérer explicitement hit testing, densité de pixels et mise à l'échelle ; sur SVG, distinguer cible d'événement, groupe et transformations.
- Définir l'ordre des couches et qui reçoit clic, drag, wheel, clavier et hover.
- Pour chaque correctif interactif, tester de vrais clics non forcés **puis** l'effet graphique attendu ; un appel API réussi n'est pas une preuve UX.
