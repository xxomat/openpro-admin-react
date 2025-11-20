# Cursor Rules - OpenPro Admin

Ce dossier contient les règles de codage pour le projet OpenPro Admin.

## Structure

- `openpro-admin.md` : Règles principales de codage pour tout le projet

## Migration depuis .cursorrules

Les règles ont été migrées depuis le fichier `.cursorrules` (legacy) vers cette nouvelle structure dans `.cursor/rules/`.

La nouvelle méthode offre plusieurs avantages :
- ✅ Règles versionnées avec Git
- ✅ Organisation modulaire (plusieurs fichiers de règles possibles)
- ✅ Métadonnées configurables (globs, alwaysApply, etc.)
- ✅ Meilleure intégration avec Cursor

## Format des règles

Chaque fichier de règles peut inclure un frontmatter YAML optionnel :

```yaml
---
description: Description de la règle
globs: ["**/*.tsx", "**/*.ts"]  # Fichiers concernés (optionnel)
alwaysApply: true  # Toujours appliquer cette règle
---
```

Le contenu principal est en Markdown et contient les instructions pour l'IA.

## Documentation

Pour plus d'informations sur les règles dans Cursor, consultez :
https://docs.cursor.com/fr/context/rules

