# Installation et publication sur macOS

## Prérequis

- Archive `ISO42010-macos-no-python.zip` téléchargée dans `~/Downloads/` (ou autre emplacement connu).
- Terminal macOS, Git et (pour création et push) GitHub CLI `gh` connecté au compte `nfigay` (`gh auth login`).
- Le dossier cible est **`~/git/ISO42010`** (ne pas interpréter `utilisateur/git/ISO42010` comme un chemin relatif inconnu).

## Installation non destructive

Depuis le Mac, lorsque le dossier ISO42010 n’existe pas encore :

```bash
mkdir -p ~/git
if [ -e ~/git/ISO42010 ]; then
  echo "Dossier ~/git/ISO42010 existant : examiner avant toute copie" >&2
  exit 1
fi
unzip -q "$HOME/Downloads/ISO42010-macos-no-python.zip" -d "$HOME/git"
cd ~/git/ISO42010
sh tests/validate_xml.sh
```

## Création du dépôt et publication

**Créer un dépôt PUBLIC** sur `nfigay` avec GitHub CLI, puis pousser la branche main :

```bash
cd ~/git/ISO42010
gh auth status
gh api user --jq .login   # doit afficher nfigay

git init -b main
git add .
git commit -m "Initialize ISO42010 workbench and mediation design docs"
gh repo create nfigay/ISO42010 --public --source=. --remote=origin --push
```

Si le dépôt GitHub existe déjà, **ne pas** relancer sa création ; inspecter `git remote -v` et adapter les commandes sans écraser l'historique existant.

## GitHub Pages

Dans `https://github.com/nfigay/ISO42010` : Settings → Pages → Build and deployment → Source = **GitHub Actions**. Ensuite Actions → workflow « Deploy ISO42010 GitHub Pages » → Run workflow, ou push vers `main` ; vérifier le déploiement. URL théorique après publication : `https://nfigay.github.io/ISO42010/`.

## Comparer avec Semantic-Process-Mediator sur le Mac

Le dépôt précédent est sur **ton** Mac et n'a pas été lu par ChatGPT. Pour vérifier l'alignement sans modifier ce projet :

```bash
find ~/git/Semantic-Process-Mediator/.github -maxdepth 3 -type f 2>/dev/null
ls -la ~/git/Semantic-Process-Mediator
```

Comparer ensuite les workflows, les chemins Pages et les variables de configuration avant de reprendre les conventions du projet existant.

## Attention

Ne jamais placer tokens, identifiants, informations sensibles, données métier confidentielles ou fichiers locaux de configuration dans `docs/`, car GitHub Pages est une publication web publique. Vérifier les licences de redistribution des JS embarqués avant publication.

## Diagnostic à coller dans ChatGPT

```sh
{
  echo "== ISO42010 =="
  ls -ld "$HOME/git/ISO42010" 2>&1
  if [ -d "$HOME/git/ISO42010" ]; then
    cd "$HOME/git/ISO42010" || exit 1
    ls -la | head -20
    git status --short 2>&1
    sh tests/validate_xml.sh 2>&1
  fi
} 2>&1 | tee /tmp/iso42010-install-check.txt | pbcopy
```
