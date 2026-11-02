#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if ! command -v xmllint >/dev/null 2>&1; then
  echo 'ERREUR: xmllint absent. Installer/activer les outils macOS fournissant xmllint, sans Python ni Perl.' >&2
  exit 2
fi
XSD=schemas/iso42010-network-baseline.xsd
GOOD=examples/architecture-reference-valid.xml
BAD=examples/legacy-export-reconstructed-invalid.xml
xmllint --noout "$XSD"
xmllint --noout --schema "$XSD" "$GOOD"
if xmllint --noout --schema "$XSD" "$BAD" >/dev/null 2>&1; then
  echo 'ECHEC: le XML historique invalide a été accepté.' >&2
  exit 1
fi
echo 'OK: XSD bien formé; exemple valide accepté; export historique invalide rejeté.'
