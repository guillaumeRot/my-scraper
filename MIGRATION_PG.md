# Migration de Prisma vers PostgreSQL natif (pg)

## Changements effectués

### 1. Dépendances mises à jour

- ✅ Supprimé `@prisma/client` et `prisma` des dépendances
- ✅ Conservé `pg` et `@types/pg` pour la connexion PostgreSQL native

### 2. Base de données

- ✅ Remplacé `src/db.ts` avec une implémentation utilisant `pg`
- ✅ Créé `init_db.sql` pour l'initialisation de la table
- ✅ Créé `scripts/init-db.js` pour exécuter l'initialisation

### 3. Scripts npm

- ✅ Supprimé les scripts Prisma (`prisma:generate`, `prisma:migrate`, `prisma:studio`)
- ✅ Ajouté le script `init-db` pour initialiser la base de données

### 4. Docker

- ✅ Supprimé la copie du client Prisma généré du Dockerfile

### 5. Fichiers supprimés

- ✅ Supprimé le dossier `prisma/` et tous ses fichiers

## Utilisation

### Initialisation de la base de données

```bash
npm run init-db
```

### Variables d'environnement

Assurez-vous que `DATABASE_URL` est configuré dans votre fichier `.env` :

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Fonctionnalités conservées

- ✅ `insertAnnonce()` - Insertion/mise à jour des annonces (UPSERT)
- ✅ `deleteMissingAnnonces()` - Suppression des annonces obsolètes
- ✅ `initDb()` et `closeDb()` - Gestion des connexions

## Avantages de la migration

1. **Performance** : Requêtes SQL natives plus rapides
2. **Simplicité** : Moins de dépendances et de complexité
3. **Contrôle** : Accès direct aux requêtes SQL
4. **Taille** : Bundle plus léger sans le client Prisma

## Notes importantes

- Les données existantes sont préservées (même structure de table)
- Les requêtes sont maintenant en SQL natif au lieu du Prisma Query Engine
- La gestion des connexions utilise un pool de connexions PostgreSQL
