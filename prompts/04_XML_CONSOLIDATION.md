# Prompt — Consolider le XML ISO42010 existant

Compare les sources réelles de génération/import XML du workbench avec `schemas/iso42010-network-baseline.xsd` et les exemples. Fournis une matrice « élément, attribut, type, cardinalité, référence, divergence, stratégie ». Préserve la baseline et propose corrections incrémentales avec migrations explicites. Valide réellement le XML et le XSD, les identités, les références locales et inter-documents. Ne prétends pas que le namespace `http://iso.org/iso-iec-ieee-42010/network` est officiel ISO. Documente les tests de round-trip restant à faire.
