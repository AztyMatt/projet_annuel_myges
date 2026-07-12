# PROJECT_AUDIT_AND_ROADMAP — MyGES 2.0

> Audit complet du dépôt réalisé le **2026-07-10** (branche `develop`, dernier commit `b04b18f`).
> Méthode : lecture intégrale de `Sujet.pdf`, `cahierDesCharges.md`, `README.md`, `WORKFLOW.md`, `CLAUDE.md`, puis vérification **dans le code** de chaque exigence, de bout en bout (UI → API → use case → repository → PostgreSQL). Chaque constat cite les fichiers réels ; les chemins proposés pour des fichiers à créer sont explicitement marqués comme tels.

---

## 1. Résumé exécutif

### État général

Le projet est **très avancé sur le cœur applicatif** et **quasi vierge sur les exigences transverses de la grille de notation** (tests, observabilité, sauvegardes, pare-feu).

Le socle est solide et réel — ce n'est pas une maquette :

- **Backend** : 26 modules Express, **273 endpoints**, 47 entités de domaine (`domain/`), 47 adaptateurs Postgres (`infrastructure/backend/express/src/postgres/`), autorisation par capacités dans les use cases, résultats typés par unions discriminées. Zéro `any` dans tout le code applicatif.
- **Frontend** : **38 pages Next.js** toutes branchées sur le vrai backend via un client API centralisé (`lib/api.ts`) — aucune donnée métier statique restante (l'ancienne maquette `infrastructure/frontend/MyGes refonte/` est supprimée, suppression actuellement stagée non commitée).
- **Auth** : complète et conforme au Sujet — Argon2, mot de passe fort 12+, expiration 60 j, verrouillage 5 tentatives/15 min, TOTP (obligatoire `SUPER_ADMIN`), mot de passe oublié par token email à usage unique, cookie `httpOnly` + garde de rôle dans `middleware.ts` (vérification de signature `jose`).
- **Infra** : Docker multi-stage, Kubernetes (2/3 réplicas, probes, Infisical, GHCR, Traefik TLS, rollback automatique en CD).

### Estimation d'avancement : **≈ 60–65 % de la note visée**

Argumentation (pondérée sur les rubriques du `Sujet.pdf`, pas sur le volume de fichiers) : Sécurité ≈ 90 % · Infrastructure ≈ 70 % · Réponse métier/architecture ≈ 85 % · Design/a11y ≈ 30 % (rien d'audité/outillé) · **Tests = 0 %** · **Observabilité = 0 %** · Gestion de projet ≈ non vérifiable depuis le repo · **Sauvegardes = 0 %**. Quatre rubriques entières de la grille sont aujourd'hui à zéro ou presque : c'est là que se perd la note, pas sur le métier.

### Problèmes bloquants (par gravité)

1. **Aucun test** (unitaire, API, E2E) et **CI sans lint/typecheck/test** — rubrique entière de la grille à zéro. Aucune dépendance de test dans aucun `package.json`.
2. **Pas de stockage réel de fichiers** : `POST /files` ne crée que des métadonnées ; `infrastructure/backend/express/src/storage/storage.adapter.ts` est un **stub no-op** (`delete()` au corps vide). Bloque justificatifs d'absence, documents administratifs, supports de cours, rendus d'évaluation, contrats d'alternance — soit 6 pages front volontairement dégradées.
3. **Journalisation d'audit factice** (§3.8) : l'API `GET /audit-logs` et les 2 pages `/superadmin/*` existent, mais **aucune ligne de code n'écrit jamais dans la table `audit_log`** (vérifié : seuls des `SELECT` dans `application/` et `infrastructure/backend/express/src/`). Les écrans d'audit affichent une liste vide en permanence.
4. **Régression RGPD** : le front appelle `DELETE /users/me` (`app/(app)/parametres/page.tsx:118`) mais le backend n'expose plus que `DELETE /users/:id` réservé à `SUPER_ADMIN` (`auth.use-cases.ts:467` → `if (!auth.isSuperAdmin) return Forbidden`). **L'auto-suppression de compte est cassée** depuis le refactor `e91555b`.
5. **Bug K8s** : `k8s/backend/cleanup-cronjob.yml` appelle `http://backend…:3001/admin/auth/cleanup-sessions` **sans le préfixe `/api`** alors que tous les routeurs sont montés sous `/api` (`app.ts:65`) → le CronJob reçoit un 404 chaque nuit, les sessions 2FA expirées ne sont jamais purgées.
6. **Aucune notification temps réel** (WebSocket) — requis par `cahierDesCharges.md` §3.1/§3.5 et cité comme service attendu par le Sujet (« Serveurs Web, WebSocket, WebRTC »).
7. **Aucune sauvegarde** (stratégie 3-2-1, `pg_dump`, sauvegarde externe) et **aucune observabilité** (Grafana/Sentry/Matomo).

### Risques principaux

- Rendu final noté sur des rubriques (tests, observabilité, sauvegarde) qui demandent du lead time infra — à ne pas garder pour la fin.
- Documents de pilotage divergents : `WORKFLOW.md` (2026-06-23) décrit un état obsolète du projet et est pourtant **stagé pour commit** ; `CLAUDE.md` (2026-07-10) est presque à jour mais contient 3 affirmations désormais fausses (détail §3).
- Dépôt git imbriqué `infrastructure/frontend/next/.git` : les fichiers sont bien suivis par le dépôt parent (74 fichiers vérifiés via `git ls-files`), mais ce `.git` résiduel peut faire silencieusement échouer de futurs `git add`.

---

## 2. Documents et périmètre analysés

**Documents lus intégralement** : `Sujet.pdf` (grille officielle, 4 pages) · `cahierDesCharges.md` · `README.md` · `WORKFLOW.md` (1 607 lignes, daté 2026-06-23) · `CLAUDE.md` (daté 2026-07-10).

**Code inspecté** : `domain/` (47 entités) · `application/` (26 groupes de use cases, ports) · `infrastructure/backend/express/` (routes, adapters, schéma Drizzle, 7 migrations) · `infrastructure/frontend/next/` (38 pages, middleware, lib) · `docker/` (2 Dockerfiles, nginx) · `docker-compose.yml` + `docker-compose.prod.yml` · `k8s/` (16 manifests) · `.github/workflows/` (`ci.yml`, `cd.yml`) · `scripts/export-dev-env.sh` · `.infisical.json` · `.env.example` · tous les `package.json` · `.gitignore` / `.dockerignore`.

**Non vérifiable statiquement (à confirmer manuellement)** :
- Le VPS réel, le pare-feu (`ufw`/`iptables`), le DNS et la provenance du secret TLS `myges-tls` (aucun `Issuer`/`ClusterIssuer` cert-manager dans `k8s/`).
- Le contenu réel d'Infisical (notamment : `JWT_SECRET` est-il bien synchronisé vers le pod frontend ? `CRON_SECRET`, `FRONTEND_PUBLIC_URL` existent-ils en prod ?).
- L'usage de GitHub Projects / sprints (aucune trace dans `.github/`).
- L'état du cluster k8s réel (réplicas effectifs, secret `myges-tls`).

**État git au moment de l'audit** : refactor non commité stagé (suppression de `application/types/errors.ts`, `application/utils/errors.ts`, `domain/errors/index.ts`, `domain/types/errors.ts`, `infrastructure/adaptaters/utils/env.ts`, et de toute la maquette `infrastructure/frontend/MyGes refonte/`), ajout de `WORKFLOW.md` ; `Sujet.pdf` non suivi.

---

## 3. Incohérences entre les documents

| ID | Sujet | Source A | Source B | Décision retenue | Justification | Impact |
|----|-------|----------|----------|------------------|---------------|--------|
| INC-01 | Orchestrateur | `cahierDesCharges.md` §6 « Docker swarm (k3s) » | Code : `k8s/` complet, CD `kubectl` | **Kubernetes** (`REMPLACÉ PAR UNE SOLUTION ÉQUIVALENTE`) | `Sujet.pdf` autorise explicitement Kubernetes (« Une exception est faite pour Kubernetes (AKS, EKS, GKS, k3s) ») ; consigne de ce prompt | Aucun — ne pas « corriger » vers Swarm ; aucune config Swarm résiduelle trouvée |
| INC-02 | Ingress Controller | `cahierDesCharges.md` §6 « Nginx » | Code : Traefik (`k8s/*/ingressRoute.yml`) | **Traefik** | Choix technique équivalent et fonctionnel (TLS + redirection HTTP→HTTPS en place) ; le Sujet n'impose pas Nginx | À justifier à l'oral ; Nginx reste utilisé dans `docker-compose.prod.yml` (lui-même obsolète, voir INC-08) |
| INC-03 | Nombre de rôles | `cahierDesCharges.md` §2.1 : 3 administrations distinctes + super admin | Code : 4 rôles (`domain/auth/user.enums.ts`) — admin unifié | **Code (4 rôles)** | Le Sujet n'impose aucun modèle de rôles ; l'unification est un choix métier assumé, documenté dans `CLAUDE.md` §11 | Documenter la fusion dans le dossier de soutenance ; le cahier des charges devrait être amendé |
| INC-04 | Autorisation backend | `CLAUDE.md` §1 : « middleware `requireRole` appliqué sur toutes les routes sensibles » | Code : **`requireRole` n'existe pas** ; l'autorisation se fait par capacités (`domain/auth/authorization-policy.ts` → `getAuthFlags` → contrôles dans les use cases) | **Code** | Le refactor `e91555b` a déplacé l'autorisation dans la couche application — c'est mieux (règle métier hors du contrôleur), mais `CLAUDE.md` ne l'a pas suivi | Mettre à jour `CLAUDE.md` ; vérifier module par module qu'aucun use case n'a « perdu » son contrôle au passage (voir DEL-001 : au moins un cas de régression avéré) |
| INC-05 | Dégel des notes | `CLAUDE.md` §11.5 : « aucun endpoint unlock n'existe » | Code : `POST /grades/:id/unlock` existe (`grade/routes.ts:69`) | **Code** | Endpoint ajouté après la rédaction de CLAUDE.md | Le front `/scolarite/notes` n'offre toujours pas de « Dégeler » alors que le backend le permet — quick win (NOTE-001) |
| INC-06 | Suppression de compte | `CLAUDE.md` §1 : « Suppression de compte — `DELETE /users/me` » | Code : seul `DELETE /users/:id` existe, réservé `SUPER_ADMIN` (`auth/routes.ts:296`, `auth.use-cases.ts:467`) | **Aucune des deux — c'est une régression** | Le front appelle une route qui n'existe plus / est interdite ; exigence RGPD du cahier §5.2 | Bloquant RGPD, tâches DEL-001…005 |
| INC-07 | État du projet | `WORKFLOW.md` (2026-06-23) : « aucun domaine n'a de use case ni de route HTTP », « 100 % des données front sont mock » | Code réel + `CLAUDE.md` (2026-07-10) | **CLAUDE.md + code** | `WORKFLOW.md` décrit un état antérieur de 3 semaines ; 273 endpoints et 38 pages branchées existent | `WORKFLOW.md` est **stagé pour commit** alors qu'il est obsolète — le retirer ou le marquer archivé (DOC-002) |
| INC-08 | Compose prod | `docker-compose.prod.yml` (Nginx + images `myges/*:latest`, sans `JWT_SECRET` ni seed) | Prod réelle = k8s (README, CD) | **k8s** | Le CD ne référence jamais ce fichier ; il ne démarre pas en l'état (variables manquantes) | Fichier mort à supprimer ou à réparer et documenter comme alternative (TECH-003) |
| INC-09 | Plateformes d'images | `README.md` « Docker images are built for `linux/amd64` » | `ci.yml` : `platforms: linux/amd64,linux/arm64` | **Code (ci.yml)** | Le workflow fait foi | Corriger le README (DOC-003) |
| INC-10 | `.env.example` | `README.md` : « there is no `.env.example` to copy manually » | `.env.example` existe à la racine | **Code** | Fichier ajouté après le README | Corriger le README (DOC-003) |
| INC-11 | Notes entreprise | `cahierDesCharges.md` §3.2 « Distinction notes académiques / appréciations entreprise » | Schéma : aucun champ de ce type sur `grade`/`assessment` | **Code, décision assumée** | Décision d'équipe documentée dans `CLAUDE.md` §11.3 (« l'inventer aurait été trompeur ») | À assumer à l'oral ou à ajouter (hors périmètre de cette roadmap sauf décision) |
| INC-12 | URL du CronJob | `k8s/backend/cleanup-cronjob.yml` : `POST …:3001/admin/auth/cleanup-sessions` | `app.ts:65` : tout est monté sous `/api` | **Le code Express** | La route réelle est `/api/admin/auth/cleanup-sessions` | Le CronJob échoue en 404 → correctif K8S-001 |
| INC-13 | Lockfile | `.gitignore` contient `package-lock.json` | `package-lock.json` est suivi par git (vérifié `git ls-files`) | **Suivi (comportement actuel)** | Un fichier déjà suivi ignore le `.gitignore` ; `npm ci` (Dockerfiles, CI) exige le lockfile | Retirer la ligne du `.gitignore` pour éviter qu'un `git rm` accidentel ne casse toute la CI (TECH-004) |

---

## 4. Architecture actuelle

### Structure générale

Monorepo **npm workspaces** (`package.json` racine) :

```
domain/                          # Entités + règles métier pures (47 *.entity.ts, enums, security-policy)
application/                     # Use cases (26 *.use-cases.ts) + ports (repositories, services) + types (results, auth-context, unit-of-work)
infrastructure/
├── backend/express/             # Adapters HTTP (routes) + Postgres (Drizzle) + auth (JWT/TOTP/Argon2) + storage (stub)
│   ├── src/<module>/routes.ts   # 26 routeurs, montés sous /api (src/app.ts)
│   ├── src/postgres/schema/     # 47 tables Drizzle
│   ├── src/container.ts         # Composition root (injection manuelle des dépendances)
│   └── drizzle/                 # 7 migrations SQL, appliquées au démarrage (server.ts)
└── frontend/next/               # Next.js 16 App Router, 38 pages, middleware (proxy /api + garde de rôle)
docker/  k8s/  .github/workflows/  scripts/
```

### Flux et dépendances

- **Direction des dépendances respectée** : `domain` n'importe rien d'externe, `application` n'importe que `domain` (vérifié par grep : aucun import `express`/`drizzle`/`pg`/`jsonwebtoken`/`argon2` sous `domain/` ni `application/`). Les ports (`*.repository.ts`, `*-provider.port.ts`, `email-sender.port.ts`, `storage.service.ts`) sont dans `application/`, les adaptateurs dans `infrastructure/`.
- **Composition root** : `infrastructure/backend/express/src/container.ts` instancie chaque `UseCases` avec ses adapters — injection de dépendances manuelle, simple et lisible.
- **Gestion des erreurs** : unions discriminées (`application/types/results.ts` : `NotFound`/`MissingFields`/`Forbidden` + variantes métier par use case), traduites en HTTP par `respond()`/`send()` (`src/http/responses.ts`), avec un error handler global pour les violations Postgres 23505/23503 (`app.ts:71-77`).
- **Autorisation** : `capabilitiesForRole` (`domain/auth/authorization-policy.ts`) produit un `AuthContext` (`isAdmin`/`isSuperAdmin`/`isStaff`/`isInstructor`) passé aux use cases, qui décident. Le HTTP ne fait que l'authentification (`requireAuth`, JWT).
- **Auth front** : `app/api/auth/login/route.ts` transforme le token JSON en cookie `httpOnly` (`secure` en prod, `SameSite=Lax`) ; `middleware.ts` vérifie la signature (`lib/auth.ts`, `jose`) et applique la garde par préfixe de route ; le même middleware réécrit `/api/*` vers Express en réinjectant le token en header `Authorization`.
- **Base de données** : migrations Drizzle exécutées au boot (`server.ts:11`), puis seed optionnel de 2 comptes admin (`auth/seed.service.ts`, gouverné par `SEED_ON_START`/`SEED_PASSWORD`).

### Points corrects

- Clean Architecture réellement appliquée, pas décorative : ports/adapters systématiques, domaine pur, `UnitOfWork` abstrait (`application/types/unit-of-work.ts` → `src/postgres/unit-of-work.ts`) pour les cascades transactionnelles de suppression.
- Typage exemplaire : **0 occurrence de `: any` / `as any`** dans `domain/`, `application/`, le backend et le front.
- Le pattern `respond(result, handlers)` force à la compilation la gestion exhaustive de chaque variante de résultat — très bon garde-fou.
- Nettoyage en cours cohérent : les anciens systèmes d'erreurs (`domain/errors/`, `application/types/errors.ts`…) sont supprimés (stagé) au profit des résultats typés.

### Violations ou problèmes d'architecture

1. **Adapter factice en production de code** : `src/storage/storage.adapter.ts` implémente `StorageService.delete()` par un corps vide. Le port existe, l'adaptateur ment. Les use cases de suppression croient nettoyer le stockage (`storage-warning.ts` loggue même les « échecs ») alors qu'aucun fichier n'a jamais existé.
2. **Module audit-log sans producteur** : couche complète (entité, port, use cases, adapter, 6 routes, 2 pages front) pour des données que personne n'écrit. Soit brancher l'écriture dans les use cases sensibles (recommandé, AUD-*), soit c'est du code mort.
3. **Autorisation hétérogène après refactor** : la migration `requireRole` → capacités s'est faite en masse (`e91555b`) ; au moins une règle a changé de sémantique au passage (suppression de compte devenue super-admin-only, DEL-001). Un passage en revue systématique des `Forbidden` par module est nécessaire (SEC-101).
4. **Migrations au démarrage de chaque réplica** (`server.ts:11`) : avec `replicas: 2` et `maxSurge: 2`, deux pods peuvent exécuter `migrate()` simultanément. Drizzle pose un verrou de session Postgres, mais le pattern propre en k8s est un `Job` de migration pré-déploiement (K8S-004).
5. **`/api/hello`** (`app.ts:67`) : endpoint de debug public, à retirer.
6. **`otplib` installé mais jamais importé** (`infrastructure/backend/express/package.json` — seul `speakeasy` est utilisé, `totp-provider.adapter.ts:1`).

### Refactorisations nécessaires (non urgentes)

- Extraire la logique de résolution note→module dupliquée entre `app/(app)/etudiant/notes/page.tsx` et `app/(app)/scolarite/notes/page.tsx` dans un helper `lib/` partagé.
- `application/auth/auth.use-cases.ts` (~500 lignes) concentre signup/login/2FA/reset/GDPR/delete/liste admin — découpage possible en 2-3 fichiers si le fichier continue de grossir.
- Pages front > 400 lignes (`messagerie`, `formations`, `superadmin/gestion`, `intervenant/evaluations`) : extraire les sous-composants (table, modales) au fur et à mesure.

---

## 5. Matrice de couverture des exigences

Sources : **S** = `Sujet.pdf`, **C** = `cahierDesCharges.md`. Priorité : **P0** = noté explicitement dans la grille, **P1** = exigé par le cahier des charges, **P2** = optionnel/bonus.

| ID | Exigence | Source | Prio | Statut | Implémentation trouvée | Éléments manquants |
|----|----------|--------|------|--------|------------------------|--------------------|
| SEC-01 | Inscription | S, C§5.1 | P0 | `TERMINÉ` | `POST /auth/signup` (`auth/routes.ts:169`), page `app/signup/page.tsx`, consentement RGPD obligatoire | — |
| SEC-02 | Connexion | S, C§5.1 | P0 | `TERMINÉ` | `POST /auth/login` + `/auth/login/2fa`, `app/login/page.tsx`, états d'erreur distincts (verrouillé, expiré, pending role, 2FA) | — |
| SEC-03 | Mot de passe oublié | S | P0 | `TERMINÉ` | Token à usage unique + TTL 1 h (`auth.use-cases.ts:32,325`), `POST /auth/password/forgot` / `reset-with-token`, pages `/forgot-password` + `/reset-password?token=` | Envoi email réel = `console.log` (`email-sender.adapter.ts`) — OK en dev, SMTP à brancher pour la prod (AUTH-001) |
| SEC-04 | Réinitialisation de mot de passe | S | P0 | `TERMINÉ` | 3 flux : authentifié (`/auth/password/reset`), expiré (`reset-with-credentials`), token (`reset-with-token`) | — |
| SEC-05 | Mot de passe fort 12+ | S, C§5.1 | P0 | `TERMINÉ` | `domain/auth/security-policy.ts` (`isStrongPassword`), indicateur temps réel sur `/signup` | Validation uniquement à l'inscription/reset — pas de re-validation côté front seul (OK, la règle est côté serveur) |
| SEC-06 | Renouvellement 60 jours | S, C§5.1 | P0 | `TERMINÉ` | `PASSWORD_MAX_AGE_DAYS = 60`, `needsPasswordReset` vérifié à chaque login | — |
| SEC-07 | Blocage tentatives infructueuses | S, C§5.1 | P0 | `TERMINÉ` | 5 tentatives → 15 min (`MAX_FAILED_ATTEMPTS`, `LOCK_DURATION_MS`), déblocage auto, `lockedUntil` affiché au front | Pas de rate limiting IP complémentaire (SEC-103, recommandation) |
| SEC-08 | 2FA TOTP | S, C§5.1 | P0 | `TERMINÉ` | `speakeasy` (`totp-provider.adapter.ts`), à l'inscription, au login, activation a posteriori (`/auth/2fa/enable` + `/2fa/setup`), **obligatoire pour SUPER_ADMIN**, sessions 2FA en DB avec purge (mais voir K8S-001) | — |
| SEC-09 | OAuth2/OIDC, lien magique, SMS | S (au choix), C§5.1 « optionnel » | P2 | `NON COMMENCÉ` | — | Le Sujet demande « les systèmes parmi les suivants » : email+mdp **est** dans la liste → exigence couverte par SEC-01/02 ; OIDC = bonus |
| SEC-10 | Hachage sécurisé | S, C§5.2 | P0 | `TERMINÉ` | Argon2 (`password-hasher.adapter.ts`) | — |
| SEC-11 | Secrets via env | S, C§5.2 | P0 | `TERMINÉ` | Infisical (CLI dev via `scripts/export-dev-env.sh`, opérateur k8s en prod), aucun secret en dur trouvé dans git | — |
| SEC-12 | Séparation stricte des rôles | C§5.2 | P0 | `TERMINÉ` (à re-vérifier) | Capacités dans les use cases + garde front par préfixe (`middleware.ts`) | Revue systématique post-refactor à faire (SEC-101) ; une régression déjà trouvée (DEL-001) |
| SEC-13 | RGPD/CNIL | C§5.2 | P1 | `PARTIEL` | Consentement (`gdprConsentAt`), export (`GET /gdpr/export`) | **Suppression de compte cassée** (DEL-*) ; pages légales absentes (bonus, LEG-*) |
| INF-01 | Conteneurs Docker | S, C§6 | P0 | `TERMINÉ` | `docker-compose.yml`, Dockerfiles multi-stage dev/builder/prod | Conteneurs prod en root (SEC-105) |
| INF-02 | Serveur VPS | S | P0 | `À VÉRIFIER MANUELLEMENT` | Non vérifiable depuis le repo | Confirmer l'hébergement réel |
| INF-03 | Orchestration (Swarm→k8s), ≥2 réplicas | S, C§6 | P0 | `REMPLACÉ PAR UNE SOLUTION ÉQUIVALENTE` / `TERMINÉ` | k8s : backend ×2, frontend ×3, postgres ×1 (normal), RollingUpdate, probes, rollback CD | Voir audit §14 pour les durcissements |
| INF-04 | WebSocket (notifications) | S (« WebSocket »), C§3.1/3.5 | P1 | `NON COMMENCÉ` | Aucune trace (grep `socket.io`/`ws` négatif) | Feature complète NOTIF-* |
| INF-05 | WebRTC | S (« … ») | — | `HORS PÉRIMÈTRE` | Aucun besoin métier (pas de visio au cahier des charges) | — |
| INF-06 | Registre Docker | S | P0 | `TERMINÉ` | GHCR, push en CI sur `main`, `imagePullSecrets: ghcr-secret` créé par le CD | — |
| INF-07 | Pare-feu ports non utilisés | S | P0 | `NON COMMENCÉ` / `À VÉRIFIER MANUELLEMENT` | Rien dans le repo (ni ufw ni NetworkPolicy) | K8S-005 + action VPS hors repo |
| INF-08 | Domaine public + SSL valide | S | P0 | `PARTIEL` | IngressRoutes TLS (`secretName: myges-tls`) + redirection HTTP→HTTPS | Aucun cert-manager `Issuer` versionné → provenance/renouvellement du certificat inconnus (K8S-002) |
| INF-09 | Pas de solution clé en main | S | P0 | `TERMINÉ` | Auto-hébergé k8s | — |
| INF-10 | PostgreSQL volumes persistants | C§6 | P0 | `TERMINÉ` | PVC 5Gi `local-path` (`k8s/postgres/pvc.yml`), strategy `Recreate` | `local-path` = données liées à un seul nœud — à documenter |
| MET-01 | Planning temps réel | C§3.1 | P1 | `PARTIEL` | CRUD sessions complet (étudiant/intervenant/scolarité, 3 pages planning) | « Temps réel » = notifications (INF-04) ; pas de gestion dédiée jours fériés/fermetures (modélisé comme modification/suppression de session, choix documenté sur `/scolarite/planning`) |
| MET-02 | Notes : saisie, moyennes, gel, traçabilité | C§3.2 | P1 | `PARTIEL` | Saisie intervenant (`/intervenant/notes`), moyennes pondérées, gel (`POST /grades/:id/lock`), **dégel backend présent** (`unlock`) non exposé au front | Traçabilité des modifications = audit-log jamais écrit (AUD-*) ; distinction académique/entreprise écartée (INC-11) |
| MET-03 | Absences : déclaration, justificatif, workflow | C§3.3 | P1 | `PARTIEL` | Déclaration + validation/rejet bout en bout (`absence/routes.ts:50-64`, pages étudiant + scolarité) ; table `file_justification` prête | Dépôt de justificatif bloqué par l'upload (FILE-*) ; historique des décisions non journalisé (AUD-*) |
| MET-04 | Documents : dossier centralisé, contrats, alertes | C§3.4 | P1 | `PARTIEL` | Pages `/etudiant/documents`, `/scolarite/documents`, `/scolarite/entreprises` ; statuts, validation, alertes expiration ±30 j | Upload/téléchargement réels (FILE-*) ; génération de documents officiels non commencée ; création de contrat bloquée (exige un fichier) |
| MET-05 | Messagerie classe/module/ciblée | C§3.5 | P1 | `PARTIEL` | `/messagerie` branchée (conversations classe/cours/privées, envoi, lu) | Noms d'utilisateurs non résolus (USR-*) ; `ADMIN` simple ne peut pas initier (endpoint `GET /admins/user/:userId` réservé SUPER_ADMIN — `admin/routes.ts:16`) ; temps réel (NOTIF-*) |
| MET-06 | Supports & rendus TP | C§3.6 | P1 | `PARTIEL` | Bibliothèque par module, évaluations, groupes de rendu, statuts Rendu/En retard | Dépôt et téléchargement réels bloqués par FILE-* |
| MET-07 | Gestion administrative/pédagogique | C§3.7 | P1 | `TERMINÉ` | 13 pages `/scolarite/*` (filières, blocs, modules, classes, groupes, cours, campus, salles, examens, externes, année académique) sur endpoints réels | Aide à la décision = affichage des spécialités uniquement (conforme « non automatique ») |
| MET-08 | Audit & traçabilité | C§3.8 | P1 | `INCORRECT` | API lecture + pages `/superadmin/securite` et dashboard | **Aucune écriture d'audit dans tout le code** — fonctionnalité factice en l'état (AUD-*) |
| MET-09 | Cas dégradés (§4) | C§4 | P1 | `PARTIEL` | Gel des notes ; réaffectation intervenant possible via `/scolarite/cours` ; sous-effectif documenté comme procédure manuelle | Changement de statut initial↔alternant non modélisé ; traçabilité renforcée dépend d'AUD-* |
| DES-01 | UI/UX, accessibilité, SEO | S | P0 | `PARTIEL` | Charte cohérente (Tailwind 4, shadcn/radix, StatusBadge/ConfirmDialog/toast mutualisés), états chargement/vide/erreur présents sur les pages vérifiées | Aucun outil a11y (axe/Lighthouse), pas de `robots.txt`/`sitemap` (vérifié absent), responsive non audité, barre de recherche factice (`TopBar.tsx:83`) |
| TEST-01 | Tests unitaires | S, C§9 | P0 | `NON COMMENCÉ` | Aucun fichier `*.test.*`/`*.spec.*`, aucune dépendance de test | TEST-* |
| TEST-02 | Tests fonctionnels API | S, C§9 | P0 | `NON COMMENCÉ` | — | TEST-* |
| TEST-03 | Tests E2E | S, C§9 | P0 | `NON COMMENCÉ` | — | TEST-* |
| OBS-01 | Santé des conteneurs | S, C§7 | P0 | `NON COMMENCÉ` | Probes k8s ≠ observabilité (pas de dashboard/alerting) | OBS-* |
| OBS-02 | Erreurs applicatives (Sentry) | S, C§7 | P0 | `NON COMMENCÉ` | — | OBS-* |
| OBS-03 | Analytique RGPD | S, C§7 | P0 | `NON COMMENCÉ` | — | OBS-* |
| BAK-01 | Sauvegarde 3-2-1 (DB + fichiers) | S, C§8 | P0 | `NON COMMENCÉ` | — | BAK-* |
| BAK-02 | IaC | S | P0 | `TERMINÉ` | Dockerfiles + manifests k8s versionnés (forme d'IaC acceptée par le Sujet) | — |
| GP-01 | Agile, sprints, outil de suivi | S, C§10 | P0 | `À VÉRIFIER MANUELLEMENT` | Historique git propre (PR mergées #53→#62) | Preuves GitHub Projects à apporter (PM-001) |
| CICD-01 | CI/CD | (implicite S) | P1 | `PARTIEL` | Build multi-arch + push GHCR + déploiement k8s avec rollback auto | **Zéro lint/typecheck/test dans la CI** ; pas de scan de vulnérabilités (CICD-*) |
| BON-01 | Pages légales CGU/CGV/cookies | S bonus | P2 | `NON COMMENCÉ` | — | LEG-* |
| BON-02 | App mobile | S bonus | P2 | `NON COMMENCÉ` | — | Hors roadmap sauf décision |
| BON-03 | Proxmox/auto-hébergement | S bonus | P2 | `À VÉRIFIER MANUELLEMENT` | — | Dépend de l'infra physique |

---

## 6. Fonctionnalités déjà terminées

> « Terminé » = chaîne complète UI → API → use case → repository → PostgreSQL vérifiée, hors tests (aucune fonctionnalité n'a de test, voir §16).

### 6.1 Authentification complète
- **Implémenté** : signup (+ RGPD + 2FA optionnelle avec QR), login 2 étapes, verrouillage, expiration 60 j, reset 3 flux, forgot-password par token email (TTL 1 h, usage unique — supprimé après usage et purgé par date), activation 2FA a posteriori, 2FA forcée SUPER_ADMin, `GET /users/me`, seed de comptes démo.
- **Fichiers** : `application/auth/auth.use-cases.ts` · `infrastructure/backend/express/src/auth/{routes,middleware,password-hasher.adapter,totp-provider.adapter,token-provider.adapter,email-sender.adapter,seed.service}.ts` · `domain/auth/{user.entity,user.enums,security-policy,authorization-policy}.ts` · front : `app/{login,signup,forgot-password,reset-password}/page.tsx`, `app/2fa/setup/`, `app/api/auth/{login,login/2fa,logout}/route.ts`.
- **Tables** : `users`, `two_factor_sessions`, `password_reset_tokens` (`src/postgres/schema/auth.ts`).
- **Limites** : email = console.log (AUTH-001) ; purge des sessions 2FA cassée par le 404 du CronJob (K8S-001) ; token JWT 8 h sans refresh ni révocation.

### 6.2 Garde d'accès frontend
- Cookie `httpOnly` + `SameSite=Lax` + `secure` (prod), signature vérifiée par `jose` dans `middleware.ts` avant tout rendu ; redirection par rôle (`ROLE_HOME`) ; proxy `/api/*` avec réinjection `Authorization` ; 401 → redirection `/login` (`lib/api.ts`).
- **Fichiers** : `infrastructure/frontend/next/{middleware.ts,lib/auth.ts,lib/api.ts,lib/use-current-user.ts}`.

### 6.3 Gestion administrative et pédagogique (§3.7)
- 13 pages `/scolarite/*` + `/superadmin/gestion` (attribution de rôle, changement de niveau admin, retrait) toutes branchées ; CRUD réels sur programs/blocs/modules/classes/groupes/cours/campus/salles/examens/externes/années/périodes.
- **Endpoints** : routeurs `program`, `bloc`, `module`, `class`, `group`, `course`, `session`, `session-exam`, `campus`, `classroom`, `academic-year`, `period`, `external`, `admin`, `student`, `instructor` (273 endpoints au total).
- **Limites transverses** : pas de noms d'utilisateurs joints (USR-*), pagination absente partout (listes complètes côté client).

### 6.4 Workflow d'absences (hors justificatif)
- Déclaration étudiant → `POST /absences` ; validation/rejet en un clic côté scolarité (`POST /absences/:id/validate|reject`) ; statuts réels affichés des deux côtés.
- **Fichiers** : `application/absence/absence.use-cases.ts`, `src/absence/routes.ts`, `app/(app)/etudiant/absences/page.tsx`, `app/(app)/scolarite/absences/page.tsx`.

### 6.5 Notes (saisie, moyennes, gel)
- Sélecteur cours→évaluation→roster, création/édition de notes, gel par la scolarité, moyennes pondérées par coefficient, export CSV.
- **Fichiers** : `src/grade/routes.ts`, `application/grade/grade.use-cases.ts`, `app/(app)/intervenant/notes/page.tsx`, `app/(app)/scolarite/notes/page.tsx`, `app/(app)/etudiant/notes/page.tsx`.

### 6.6 Infrastructure de déploiement
- CI build multi-arch + cache GHA + push GHCR (main) ; CD self-hosted : injection images/hosts/secrets, `kubectl apply -R`, rollout 120 s, `rollout undo` sur échec.
- **Fichiers** : `.github/workflows/{ci,cd}.yml`, `docker/{backend,frontend}/Dockerfile`, `k8s/**`.

---

## 7. Fonctionnalités partiellement terminées

### 7.1 Gestion de fichiers (justificatifs, documents, supports, rendus, contrats) — **le gap n° 1**
- **Existe** : modèle complet (`file`, `file_assessment`, `file_course`, `file_document`, `file_justification`, `file_assessment_instruction` — `src/postgres/schema/file.ts`), routes CRUD de métadonnées, port `StorageService` (`application/file/storage.service.ts`), règles de suppression avec avertissement de nettoyage (`storage-warning.ts`).
- **Fonctionne** : lister/supprimer des métadonnées ; les 6 pages front concernées affichent les listes réelles.
- **Simulé** : `storage.adapter.ts` est un no-op ; aucun octet n'est jamais stocké ; aucun endpoint multipart ; aucun volume/PVC/bucket dédié dans `docker-compose.yml` ni `k8s/`.
- **Manque** : backend (multipart + écriture disque/S3 + endpoint download + validation MIME/taille), infra (volume), front (dropzones sur 6 pages qui affichent aujourd'hui un message explicite), sécurité (contrôle d'accès au téléchargement), tests.
- **Fichiers à modifier** : `src/file/routes.ts`, `application/file/*.ts`, `src/storage/storage.adapter.ts`, `docker-compose.yml`, `k8s/backend/deployment.yml`, pages `etudiant/{absences,documents,evaluations}`, `intervenant/supports`, `scolarite/{documents,entreprises}`.
- → Tâches **FILE-001…FILE-024** (§9.1).

### 7.2 Audit & traçabilité (§3.8) — statut `INCORRECT`
- **Existe** : table `audit_log`, entité, use cases de lecture, 6 endpoints GET, refus de DELETE (405), pages `/superadmin/securite` (filtres, pagination client, diff avant/après) et dashboard.
- **Ne fonctionne pas** : la table est éternellement vide — **aucun `save`/`insert` d'audit dans tout le code** (seuls des `existsByUserId`/`SELECT`).
- **Manque** : un service applicatif d'écriture + appels dans les use cases sensibles (auth, grades lock/unlock, absences validate/reject, documents validate, attributions de rôle, suppressions).
- → Tâches **AUD-001…AUD-010** (§9.3).

### 7.3 Suppression de compte RGPD — statut `INCORRECT` (régression)
- **Existe** : UI complète avec `ConfirmDialog` (`parametres/page.tsx:118` → `api.delete("/users/me")`), use case `deleteAccount` avec garde-fous (rôle actif, fichiers, messages, audit).
- **Cassé** : le backend n'expose que `DELETE /users/:id` (`auth/routes.ts:296`) et `deleteAccount` retourne `Forbidden` pour tout non-SUPER_ADMIN (`auth.use-cases.ts:468`). Un étudiant qui confirme la suppression reçoit une erreur.
- → Tâches **DEL-001…DEL-005** (§9.4).

### 7.4 Messagerie (§3.5)
- **Fonctionne** : conversations classe/cours/privées reconstruites côté client, envoi, marquage lu.
- **Dégradé** : pas de noms affichables (gap USR), `ADMIN` simple exclu de la messagerie ciblée (`GET /admins/user/:userId` réservé SUPER_ADMIN), pas de temps réel, pas d'endpoint agrégé « mes conversations » (N appels en cascade).
- → USR-*, NOTIF-*, API-001.

### 7.5 Notifications temps réel (§3.1, §3.5) — `NON COMMENCÉ` côté code, listé ici car les pages hôtes existent
- → Feature **NOTIF-001…NOTIF-012** (§9.2).

### 7.6 Résolution des identités (nom/prénom)
- **Vérifié** : `GET /students`, `/students/:id`, `/instructors/:id`, courses, messages ne renvoient que des IDs ; seuls `/users/me`, `/students/me`, `/instructors/me` et `/admin/security/users` (SUPER_ADMIN) exposent un nom. Le front affiche des libellés génériques (« Intervenant », « Administration ») — choix d'équipe transitoire documenté.
- **Impact** : messagerie, dashboards, `/scolarite/etudiants`, `/scolarite/intervenants`, audit.
- → Tâches **USR-101…USR-108** (§9.5).

### 7.7 Design / accessibilité / SEO
- **Existe** : charte appliquée, composants mutualisés, états UI corrects.
- **Manque** : audit a11y outillé, `robots.txt`/`sitemap.ts`/metadata par page (aucun trouvé), vérification responsive, barre de recherche non fonctionnelle à retirer ou brancher (`components/layout/TopBar.tsx:83`).
- → Tâches **UI-001…UI-008**.

---

## 8. Fonctionnalités non commencées

1. **Stockage physique des fichiers** (détail en 7.1 — le modèle existe, l'octet n'existe pas).
2. **Notifications temps réel** : aucun serveur WS/SSE, aucune table `notification`, aucune cloche UI. Comportement attendu (cahier §3.1/3.5) : notification à la modification d'une session de planning, à la publication d'une note, à un nouveau message, à la validation/rejet d'une absence ou d'un document.
3. **Écriture des journaux d'audit** (détail en 7.2).
4. **Tests** : rien — ni framework, ni config, ni CI.
5. **Observabilité** : aucun composant (ni Uptime Kuma/Prometheus/Grafana, ni Sentry/GlitchTip, ni Matomo/Plausible), aucun endpoint `/health` HTTP (les probes k8s sont en `tcpSocket`).
6. **Sauvegardes** : aucun `pg_dump`, aucun CronJob de backup, aucune destination externe.
7. **Pare-feu / NetworkPolicies** : rien de versionné.
8. **cert-manager** : aucun `Issuer`/`ClusterIssuer` ; le secret TLS `myges-tls` est de provenance inconnue.
9. **Génération de documents officiels** (cahier §3.4 « Génération et téléchargement ») : rien (dépend de FILE-*).
10. **Pages légales** (bonus) : aucune route `/cgu`, `/mentions-legales`, etc.
11. **Changement de statut étudiant initial↔alternance** (cahier §4) : non modélisé (le statut n'est même pas un champ — il se déduit de l'existence d'un contrat).

---

## 9. Roadmap détaillée avec cases à cocher

> Ordonnée par dépendances — voir §18 pour le phasage. Conventions de chemins : les fichiers marqués « *(à créer)* » n'existent pas ; tous les autres existent et sont à modifier.

### 9.0 Correctifs immédiats (bugs avérés, < 1 jour chacun)

- [ ] `K8S-001` Corriger l'URL du CronJob 2FA : `k8s/backend/cleanup-cronjob.yml` → `http://backend.backend.svc.cluster.local:3001/api/admin/auth/cleanup-sessions` (préfixe `/api` manquant, cf. `app.ts:65`).
- [ ] `DEL-001` Rétablir l'auto-suppression de compte (voir feature détaillée §9.4).
- [ ] `NOTE-001` Exposer le dégel des notes au front : bouton « Dégeler ce module » sur `app/(app)/scolarite/notes/page.tsx` appelant `POST /grades/:id/unlock` (endpoint déjà présent, `src/grade/routes.ts:69`) ; mettre à jour `CLAUDE.md` qui affirme que l'endpoint n'existe pas.
- [ ] `TECH-001` Supprimer le dépôt git imbriqué : `rm -rf infrastructure/frontend/next/.git` (les fichiers sont déjà suivis par le dépôt parent — vérifié).
- [ ] `TECH-002` Retirer l'endpoint de debug `GET /api/hello` (`src/app.ts:67`).
- [ ] `TECH-004` Retirer la ligne `package-lock.json` de `.gitignore` (le lockfile est suivi et requis par `npm ci` en CI/Docker).
- [ ] `TECH-005` Désinstaller `otplib` (`infrastructure/backend/express/package.json`) — seul `speakeasy` est utilisé.
- [ ] `DOC-002` Trancher le sort de `WORKFLOW.md` (obsolète mais stagé) : le retirer de l'index ou lui ajouter un bandeau « ARCHIVÉ — remplacé par CLAUDE.md/PROJECT_AUDIT_AND_ROADMAP.md ».
- [ ] `DOC-003` Corriger le `README.md` : plateformes d'images (amd64+arm64), existence de `.env.example`, noms de rôles seed (`ADMIN`/`SUPER_ADMIN`).
- [ ] `UI-001` Retirer (ou brancher) la barre de recherche factice de `components/layout/TopBar.tsx:83`.

---

### 9.1 Fonctionnalité : upload et stockage réel des fichiers

**Statut actuel :** partiel (métadonnées seules ; adaptateur stockage no-op).

**Objectif fonctionnel :** permettre le dépôt, le téléchargement et la suppression physiques de fichiers pour les 5 usages métier : justificatif d'absence, document administratif étudiant, support de cours, rendu d'évaluation, contrat d'alternance.

**Backend :**

- [ ] `FILE-001` Choisir et documenter la cible de stockage (disque + volume k8s en V1 ; S3-compatible en option) — décision à inscrire dans `README.md`.
- [ ] `FILE-002` Ajouter `multer` (ou équivalent) au workspace `@myges/express` et créer un middleware d'upload avec limite de taille (ex. 10 Mo) et liste blanche MIME (PDF, images, zip).
- [ ] `FILE-003` Implémenter réellement `StorageService` : `save(buffer, path)`, `read(path)`, `delete(path)` dans `infrastructure/backend/express/src/storage/storage.adapter.ts` (remplacer le no-op).
- [ ] `FILE-004` Créer `POST /files/upload` (multipart) : écrit l'octet, puis crée la ligne `file` (nom original, MIME, taille, `uploadedBy`, `storagePath` généré — jamais fourni par le client).
- [ ] `FILE-005` Créer `GET /files/:id/download` : vérifie l'autorisation métier (propriétaire, staff, intervenant du cours, membre du groupe de rendu selon le type de lien), streame le fichier avec `Content-Disposition`.
- [ ] `FILE-006` Étendre `application/file/file.use-cases.ts` : use case `upload` (validation taille/MIME côté application) et `download` (résolution des droits par type de rattachement).
- [ ] `FILE-007` Câbler la suppression physique : les cascades de suppression existantes appellent déjà `storageService.delete` — vérifier chaque chemin après FILE-003 (le `storage-warning.ts` devient enfin significatif).
- [ ] `FILE-008` Interdire la création de métadonnées orphelines : déprécier/restreindre `POST /files` nu au profit de `POST /files/upload`.

**Infrastructure :**

- [ ] `FILE-009` Ajouter un volume dédié dev dans `docker-compose.yml` (ex. `uploads_data:/app/uploads`).
- [ ] `FILE-010` Ajouter un PVC + `volumeMounts` dans `k8s/backend/deployment.yml` — ⚠️ avec `replicas: 2`, un PVC `local-path` (RWO) ne peut pas être partagé : soit stockage S3/MinIO, soit PVC RWX (NFS), soit affinité — décision à prendre avec FILE-001. *(fichier à créer : `k8s/backend/uploads-pvc.yml`)*
- [ ] `FILE-011` Inclure le répertoire d'uploads dans la politique de sauvegarde (dépend de BAK-*).

**Frontend :**

- [ ] `FILE-012` Créer un composant dropzone mutualisé `components/ui/file-upload.tsx` *(à créer)* : sélection, barre de progression, erreurs taille/type, `fetch` multipart (le client `lib/api.ts` est JSON-only — ajouter `api.upload()`).
- [ ] `FILE-013` `app/(app)/etudiant/absences/page.tsx` : remplacer le message « dépôt indisponible » (ligne 284) par le dépôt de justificatif → `POST /files/upload` + `POST /file-justifications`.
- [x] `FILE-014` `app/(app)/etudiant/documents/page.tsx` : activer dépôt et téléchargement réels.
- [x] `FILE-015` `app/(app)/etudiant/evaluations/page.tsx` : activer le dépôt de rendu (`POST /file-assessments` avec le `fileId` fraîchement créé) ; afficher la date de dépôt. *(2026-07-12 : dépôt fait, groupe solo auto-créé pour les évaluations individuelles ; date de dépôt non affichée, non bloquant)*
- [x] `FILE-016` `app/(app)/intervenant/supports/page.tsx` : réactiver le dépôt de support (`POST /file-courses`).
- [x] `FILE-017` `app/(app)/intervenant/evaluations/page.tsx` : lien de téléchargement des rendus par groupe. *(2026-07-12, nécessitait d'élargir `FileUseCases.findById` pour l'intervenant du cours et les membres du groupe)*
- [ ] `FILE-018` `app/(app)/scolarite/entreprises/page.tsx` : débloquer la création de contrat (upload du fichier puis `POST /document-apprenticeship-contracts`).
- [ ] `FILE-019` `app/(app)/scolarite/documents/page.tsx` + `app/(app)/etudiant/cours/page.tsx` : liens de téléchargement.

**Tests :**

- [ ] `FILE-020` Unitaires : validation MIME/taille, génération de `storagePath`, droits de téléchargement par type de lien.
- [ ] `FILE-021` API : upload → download round-trip ; upload refusé (taille, type, non authentifié) ; download interdit (mauvais rôle/étudiant d'un autre groupe).
- [ ] `FILE-022` API : suppression d'entité → fichier physique effacé (et cas d'échec → `storageCleanupFailed`).
- [ ] `FILE-023` E2E : parcours étudiant « déclarer une absence + déposer un justificatif + le voir validé ».
- [ ] `FILE-024` E2E : parcours intervenant « déposer un support » → étudiant « le télécharger ».

**Critères d'acceptation :** un fichier déposé survit à un redémarrage du conteneur ; il est téléchargeable par les seuls rôles légitimes ; sa suppression efface l'octet ; les 6 messages « désactivé » du front ont disparu.

**Dépendances :** aucune (à faire en premier — débloque MET-03/04/06 et la moitié des limitations front).

---

### 9.2 Fonctionnalité : notifications temps réel (WebSocket)

**Statut actuel :** non commencé.

**Objectif fonctionnel :** notifier en temps réel (cloche globale + toast) les événements du cahier §3.1/§3.5 : modification de planning, nouvelle note, nouveau message, décision sur absence/document.

**Backend :**

- [ ] `NOTIF-001` Créer la table `notification` (id, userId FK, type, entityId, message, readAt, createdAt) — schéma *(à créer)* `src/postgres/schema/notification.ts` + migration.
- [ ] `NOTIF-002` Créer `domain/notification/notification.entity.ts`, `application/notification/{notification.repository.ts,notification.use-cases.ts}`, adapter Postgres, routes `GET /notifications`, `POST /notifications/:id/read` *(tous à créer, en suivant le pattern des 26 modules existants)*.
- [ ] `NOTIF-003` Ajouter un serveur WebSocket (`socket.io` ou `ws`) attaché au serveur HTTP Express (`server.ts`), authentifié par le JWT (même `tokenProvider`), une room par `userId`.
- [ ] `NOTIF-004` Créer un port `application/notification/notification-publisher.port.ts` *(à créer)* et son adapter WS, injectés via `container.ts`.
- [ ] `NOTIF-005` Émettre depuis les use cases : `session.update/delete` (→ étudiants du groupe), `grade.create/update` (→ étudiant), `message.create` (→ participants), `absence.validate/reject` et `fileDocument.validate` (→ étudiant).
- [ ] `NOTIF-006` K8s : le WS doit traverser Traefik (IngressRoute existante OK pour websecure) et supporter 2 réplicas — soit sticky sessions Traefik, soit adapter Redis pub/sub ; en V1, documenter la limite ou passer `replicas: 1` justifié.

**Frontend :**

- [ ] `NOTIF-007` Client WS dans un provider global (`app/(app)/layout.tsx`), reconnexion automatique.
- [ ] `NOTIF-008` Cloche dans `components/layout/TopBar.tsx` : badge non-lus, dropdown listant `GET /notifications`, marquage lu.
- [ ] `NOTIF-009` Toast temps réel via le `ToastProvider` existant (`components/ui/toast.tsx`).
- [ ] `NOTIF-010` Rafraîchissement des données de la page courante à réception (au minimum : messagerie et plannings).

**Tests :**

- [ ] `NOTIF-011` API : création de notification à la validation d'une absence ; liste et marquage lu ; interdiction de lire celles d'autrui.
- [ ] `NOTIF-012` E2E : deux navigateurs, modification de session par la scolarité → notification côté étudiant sans rechargement.

**Dépendances :** aucune côté code ; NOTIF-006 avant mise en prod.

---

### 9.3 Fonctionnalité : journalisation d'audit réelle (§3.8)

**Statut actuel :** incorrect (lecture seule d'une table jamais alimentée).

**Backend :**

- [ ] `AUD-001` Ajouter au port `application/audit-log/audit-log.repository.ts` une méthode `save(entry)` et l'implémenter dans `src/postgres/audit-log/audit-log.adapter.ts`.
- [ ] `AUD-002` Créer un service applicatif `application/audit-log/audit-recorder.ts` *(à créer)* : `record({ userId, action, entity, entityId, oldValue, newValue })`, non bloquant (échec d'audit loggué, jamais propagé à l'utilisateur).
- [ ] `AUD-003` Injecter le recorder via `container.ts` dans les use cases sensibles.
- [ ] `AUD-004` Auth : journaliser login réussi/échoué, verrouillage, reset de mot de passe, activation 2FA (`auth.use-cases.ts`).
- [ ] `AUD-005` Notes : create/update/lock/unlock/delete avec `oldValue`/`newValue` (`grade.use-cases.ts`) — exigence explicite « traçabilité complète des modifications » (§3.2).
- [ ] `AUD-006` Absences : validate/reject avec décideur (`absence.use-cases.ts`) — « historique et traçabilité des décisions » (§3.3).
- [ ] `AUD-007` Documents : validate/expire/delete (`document.use-cases.ts`, `file.use-cases.ts`).
- [ ] `AUD-008` Rôles : attribution/retrait/changement (`admin`, `student`, `instructor` use cases) + suppression de compte.
- [ ] `AUD-009` Vérifier que `enteredBy`/`processedBy` et l'audit restent cohérents (pas de double source de vérité).

**Frontend :**

- [ ] `AUD-010` Rien à créer — vérifier que `/superadmin/securite` et le dashboard affichent correctement les vraies entrées (les pages existent et sont branchées ; adapter le rendu du diff si le format `oldValue/newValue` choisi diffère).

**Tests :** couverts dans TEST-* (cas : chaque action sensible produit une entrée ; un échec d'écriture d'audit ne fait pas échouer l'action).

**Critères d'acceptation :** après un scénario de démo (login, saisie de note, gel, validation d'absence, attribution de rôle), `/superadmin/securite` affiche ≥ 5 entrées horodatées exactes.

**Dépendances :** aucune. À faire avant la démo — c'est une exigence du cahier au statut aujourd'hui factice.

---

### 9.4 Fonctionnalité : suppression de compte RGPD (régression à corriger)

**Statut actuel :** incorrect.

- [ ] `DEL-002` Backend : réintroduire `DELETE /users/me` dans `src/auth/routes.ts` (ou faire accepter `me` explicitement), appelant un use case `deleteOwnAccount(requesterId)` distinct du `deleteAccount` super-admin.
- [ ] `DEL-003` Application : dans `auth.use-cases.ts`, autoriser l'auto-suppression (requester = cible) sans exiger `isSuperAdmin` ; conserver les garde-fous (rôle actif, fichiers, messages) mais **décider et documenter** le comportement RGPD quand ils bloquent (le droit à l'effacement ne peut pas être refusé indéfiniment parce qu'on a envoyé un message — prévoir anonymisation en V2, tâche documentée).
- [ ] `DEL-004` Front : gérer les nouveaux cas d'erreur de blocage sur `app/(app)/parametres/page.tsx` (messages explicites au lieu d'un échec générique).
- [ ] `DEL-005` Test API : un étudiant supprime son compte → login refusé ensuite ; un étudiant ne peut pas supprimer le compte d'un autre ; SUPER_ADMIN peut supprimer un compte sans rôle.

**Dépendances :** SEC-101 (revue des autorisations) idéalement en même temps.

---

### 9.5 Fonctionnalité : résolution des identités (noms affichables)

**Statut actuel :** partiel — le front affiche des libellés génériques partout où un nom est attendu.

**Backend :**

- [ ] `USR-101` Décision d'API (une des deux, recommandation = A) : **(A)** joindre `firstname`/`lastname` dans les réponses `students`/`instructors`/`admins` listées par le staff ; **(B)** endpoint minimal `GET /users/:id/public` (nom seul) accessible aux authentifiés.
- [ ] `USR-102` Implémenter la jointure dans `src/postgres/student/student.adapter.ts` et `instructor.adapter.ts` (+ vues correspondantes dans `application/student|instructor/*.use-cases.ts`).
- [ ] `USR-103` Enrichir les messages : joindre le nom de l'expéditeur dans `message.use-cases.ts`.
- [ ] `USR-104` Enrichir `GET /audit-logs` avec le nom de l'acteur.
- [ ] `USR-105` Ne jamais exposer email/hash/état de verrouillage dans ces vues publiques (le hash n'est déjà jamais sérialisé — maintenir).

**Frontend :**

- [ ] `USR-106` Remplacer les libellés génériques : `messagerie`, dashboards, `scolarite/etudiants`, `scolarite/intervenants`, `scolarite/classes`, `superadmin/securite`, `intervenant/evaluations` (membres de groupes).
- [ ] `USR-107` `messagerie` : sélection d'un destinataire par nom (plus par ID tronqué).
- [ ] `USR-108` Test API : un étudiant ne peut pas lister les noms de tous les étudiants hors de ses groupes (définir la portée exacte avec USR-101).

**Dépendances :** aucune. Fort effet démo pour un coût modéré.

---

### 9.6 Fonctionnalité : messagerie — corrections ciblées

- [ ] `API-001` Créer `GET /conversations/mine` (agrégat serveur : conversations + dernier message + non-lus) pour remplacer la cascade d'appels client de `app/(app)/messagerie/page.tsx` (451 lignes, en partie à cause de cette reconstruction).
- [ ] `API-002` Permettre à un `ADMIN` de retrouver son propre `adminId` : soit ouvrir `GET /admins/user/:userId` à l'intéressé lui-même (`admin/routes.ts:16` — vérifier `requesterId === userId`), soit ajouter `GET /admins/me`. Retire la « fonctionnalité limitée pour votre rôle ».
- [ ] `API-003` Test API : un ADMIN non-super crée une conversation privée de bout en bout.

**Dépendances :** USR-* pour l'affichage des noms.

---

### 9.7 Sécurité — durcissement (voir audit §13 pour la classification)

- [ ] `SEC-101` **Revue systématique des autorisations post-refactor** : pour chacun des 26 modules, tabler `endpoint → capacité exigée` (à partir des `Forbidden` des use cases) et comparer à la matrice voulue de `CLAUDE.md` §11. Livrable : tableau dans `docs/authorization-matrix.md` *(à créer)*. La régression DEL-001 prouve que c'est nécessaire.
- [ ] `SEC-102` Restreindre CORS : `app.ts:62` `cors()` → `cors({ origin: [FRONTEND_PUBLIC_URL], credentials: false })`. En prod le front passe par le middleware Next (server-side), donc la liste peut être stricte.
- [ ] `SEC-103` Rate limiting : `express-rate-limit` sur `/auth/login`, `/auth/login/2fa`, `/auth/password/forgot` (anti-bruteforce IP, en plus du verrouillage compte ; anti-énumération sur forgot).
- [ ] `SEC-104` En-têtes de sécurité : `helmet` sur Express **et** en-têtes Next (`next.config.ts` `headers()` : CSP, `X-Frame-Options`, `X-Content-Type-Options`) — aujourd'hui seuls ceux du nginx dev existent (`docker/nginx/nginx.conf`), la prod Traefik n'en pose aucun.
- [ ] `SEC-105` Conteneurs non-root : ajouter `USER node` aux stages prod des deux Dockerfiles (`docker/backend/Dockerfile`, `docker/frontend/Dockerfile`) + `securityContext` (`runAsNonRoot: true`, `readOnlyRootFilesystem` si compatible) dans les deux deployments k8s.
- [ ] `SEC-106` Hacher les tokens sensibles au repos : `password_reset_tokens.token` et `two_factor_sessions.token` sont stockés en clair (`src/postgres/schema/auth.ts`) — stocker un hash (SHA-256) et comparer sur hash ; une fuite de dump ne doit pas permettre de reset.
- [ ] `SEC-107` Ajouter une colonne `expiresAt` explicite aux tokens de reset (aujourd'hui expiration calculée depuis `createdAt`, acceptable mais implicite) — optionnel si SEC-106 fait.
- [ ] `SEC-108` Journaliser les échecs de login avec IP (dépend d'AUD-004) sans jamais logguer mot de passe/token.
- [ ] `SEC-109` Documenter la rotation de `JWT_SECRET` (partagé backend/frontend via Infisical) et vérifier sa présence dans le path Infisical du frontend avant le prochain déploiement (point ouvert de `CLAUDE.md` §11.7).
- [ ] `SEC-110` Limite de taille du body JSON explicite : `express.json({ limit: "1mb" })` (`app.ts:63`).

---

### 9.8 Tests (rubrique de note entière — partir de zéro)

**Mise en place :**

- [ ] `TEST-001` Installer Vitest à la racine (workspaces `domain`, `application`, `@myges/express`) + config `vitest.config.ts` *(à créer)* avec les alias de `tsconfig.base.json`.
- [ ] `TEST-002` Installer Supertest pour les tests d'API Express (l'`app` est exportée sans `listen` — `src/app.ts` est déjà testable telle quelle).
- [ ] `TEST-003` Base de test : Testcontainers Postgres ou service Postgres GitHub Actions ; script `npm run test` racine.
- [ ] `TEST-004` Installer Playwright pour l'E2E (`infrastructure/frontend/next`), projet chromium minimum.

**Unitaires (domaine/application — sans DB) :**

- [ ] `TEST-010` `domain/auth/security-policy.ts` : force du mot de passe (8 cas), expiration 60 j (bornes), verrouillage.
- [ ] `TEST-011` `application/auth/auth.use-cases.ts` avec repositories en mémoire : login (7 variantes de résultat), verrouillage après 5 échecs, flux forgot/reset token (expiré, réutilisé, inconnu), enable2fa.
- [ ] `TEST-012` `application/grade/grade.use-cases.ts` : création, update refusé si `isLocked`, lock/unlock selon capacités, delete (not_owner, locked).
- [ ] `TEST-013` `application/absence/absence.use-cases.ts` : validate/reject selon capacités, double décision.
- [ ] `TEST-014` `capabilitiesForRole` : matrice des 4 rôles.

**Fonctionnels API (Supertest + Postgres) :**

- [ ] `TEST-020` Auth bout en bout : signup → login → `GET /users/me` ; login 2FA avec un TOTP généré par `speakeasy` ; 401 sans token ; 403 pending role.
- [ ] `TEST-021` RBAC : pour 6-8 endpoints représentatifs (grades lock, absences validate, admins, audit-logs, students), vérifier 403 pour chaque rôle interdit (fixtures des 4 rôles via le seed).
- [ ] `TEST-022` Contraintes DB : 409 sur doublon (23505), 409 sur suppression référencée (23503) — l'error handler `app.ts:71` est aujourd'hui non testé.
- [ ] `TEST-023` Parcours métier : création filière→classe→groupe→cours→session→absence→validation (le fil rouge de la démo).

**Interface (Playwright) :**

- [ ] `TEST-030` Login (mauvais mdp, compte verrouillé simulé, succès + redirection par rôle).
- [ ] `TEST-031` Garde de route : accès `/scolarite` avec un cookie étudiant → redirection.
- [ ] `TEST-032` Saisie d'une note par un intervenant et lecture par l'étudiant.
- [ ] `TEST-033` Déclaration + validation d'absence (2 rôles).

**Intégration CI :** voir CICD-002.

---

### 9.9 CI/CD

- [ ] `CICD-001` Ajouter un job `quality` dans `.github/workflows/ci.yml` (avant les builds Docker) : `npm ci`, `tsc -b` (backend + `tsc --noEmit` front), `next lint`, `prettier --check`.
- [ ] `CICD-002` Ajouter un job `test` : unitaires + API (service Postgres), `needs: quality` ; conditionner le build/push Docker à sa réussite (`needs: [quality, test]`).
- [ ] `CICD-003` Ajouter Playwright en CI (au moins sur PR vers `main`) — peut être un workflow séparé si trop lent.
- [ ] `CICD-004` Scan de vulnérabilités des images (Trivy) après build, bloquant sur CRITICAL.
- [ ] `CICD-005` Étape de validation des migrations : `drizzle-kit generate` en CI doit être un no-op (échec si le schéma et les migrations divergent).
- [ ] `CICD-006` Lint backend inexistant : ajouter ESLint au workspace `@myges/express` (seul le front en a).

---

### 9.10 Kubernetes / déploiement (au-delà des correctifs 9.0)

- [ ] `K8S-002` Versionner la gestion TLS : installer cert-manager + `ClusterIssuer` Let's Encrypt + annotation/`Certificate` pour `myges-tls` *(fichiers à créer : `k8s/cert-manager/cluster-issuer.yml`, `k8s/cert-manager/certificate.yml`)* — ou documenter précisément la procédure actuelle si le certificat est géré hors repo.
- [ ] `K8S-003` Endpoint santé HTTP : `GET /health` (vérifie un `SELECT 1`) dans Express *(route à créer, hors `/api` ou sous `/api/health`)* et basculer readiness/liveness de `tcpSocket` vers `httpGet` dans `k8s/backend/deployment.yml`.
- [ ] `K8S-004` Sortir les migrations du démarrage : `Job`/`initContainer` de migration pré-rollout *(à créer : `k8s/backend/migrate-job.yml`)* ; retirer `migrate()` de `server.ts` en prod (le garder en dev).
- [ ] `K8S-005` `NetworkPolicy` : postgres accessible uniquement depuis le namespace `backend` ; backend uniquement depuis Traefik + frontend *(à créer : `k8s/postgres/network-policy.yml`, `k8s/backend/network-policy.yml`)*. Complète l'exigence « pare-feu » du Sujet côté cluster ; le pare-feu VPS (ufw) reste une action hors repo à documenter.
- [ ] `K8S-006` Trancher `docker-compose.prod.yml` (obsolète, cf. INC-08) : suppression recommandée.
- [ ] `K8S-007` Documenter la procédure complète de mise en prod dans le README (prérequis cluster : Traefik, opérateur Infisical, cert-manager, classe de stockage) — aujourd'hui dispersée/implicite.

---

### 9.11 Observabilité (rubrique à zéro)

- [ ] `OBS-001` Santé des conteneurs : déployer **Uptime Kuma** (le moins coûteux) *(à créer : `k8s/monitoring/uptime-kuma.yml`)* pointé sur `/health` backend + `/` frontend, ou stack kube-prometheus si le temps le permet.
- [ ] `OBS-002` Erreurs applicatives : intégrer **Sentry** (ou GlitchTip auto-hébergé) — SDK Node dans `server.ts`/error handler `app.ts:75`, SDK Next (`instrumentation.ts` *(à créer)*), DSN via Infisical.
- [ ] `OBS-003` Analytique RGPD : **Plausible** ou Matomo auto-hébergé, script dans `app/layout.tsx`, mention dans la politique cookies (lié à LEG-002).
- [ ] `OBS-004` Capturer les erreurs du error handler Express dans Sentry (aujourd'hui simple `console.error`).

---

### 9.12 Politique de sauvegarde (rubrique à zéro)

- [ ] `BAK-001` CronJob `pg_dump` quotidien vers le PVC + rétention 7/30 j *(à créer : `k8s/postgres/backup-cronjob.yml`)*.
- [ ] `BAK-002` Copie vers un second médium : upload du dump chiffré (age/gpg) vers un stockage objet **chez un fournisseur différent** de l'hébergeur du VPS (exigence 3-2-1 du Sujet).
- [ ] `BAK-003` Étendre aux fichiers utilisateurs une fois FILE-* livré (même destination).
- [ ] `BAK-004` Documenter et **tester une restauration** (procédure dans `docs/backup-restore.md` *(à créer)*) — une sauvegarde non testée ne compte pas.

---

### 9.13 Design, accessibilité, SEO, légal

- [ ] `UI-002` Lancer un audit Lighthouse/axe sur les 6 pages principales, corriger les violations bloquantes (labels de formulaires, contrastes, focus visibles, navigation clavier des modales radix — en grande partie fourni par radix, à vérifier).
- [ ] `UI-003` Ajouter `app/robots.ts` et `app/sitemap.ts` *(à créer)* + `metadata` par page (title/description) — seules les pages publiques ont besoin d'être indexables.
- [ ] `UI-004` Vérifier le responsive des 38 pages (les tableaux `/scolarite/*` sont les plus à risque) ; wrapper `overflow-x-auto` systématique.
- [ ] `UI-005` États vides/erreur : passage en revue systématique (échantillon vérifié OK, mais non exhaustif).
- [ ] `LEG-001` Pages légales `/mentions-legales`, `/cgu`, `/politique-cookies` *(à créer, bonus Sujet)* accessibles depuis le footer public et `/parametres`.
- [ ] `LEG-002` Bandeau cookies si un analytique est déployé (lié OBS-003 ; Plausible sans cookies peut éviter le bandeau — le documenter).

---

### 9.14 Gestion de projet & documentation

- [ ] `PM-001` Rendre la gestion de projet démontrable : GitHub Projects alimenté (importer cette roadmap), jalons par séance de suivi, assignations équilibrées (la répartition est notée).
- [ ] `DOC-001` Mettre à jour `CLAUDE.md` : autorisation par capacités (plus de `requireRole`), endpoint `unlock` existant, statut réel de la suppression de compte et de l'audit-log.
- [ ] `DOC-004` Documentation API minimale : soit OpenAPI généré, soit `docs/api.md` listant les 26 routeurs et conventions (`respond`, formats d'erreur `{ error, type? }`) — le Sujet exige une « documentation claire qui permet de reproduire le projet ».
- [ ] `DOC-005` Guide de reproduction locale vérifié de bout en bout (README §Running + `.env.example` — tester sur machine vierge).

---

## 10. Audit frontend

**Routes** : 38 pages — 6 publiques (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/2fa/setup`) + 32 sous `(app)` (layout `Sidebar`+`TopBar`). Arborescence conforme aux 4 rôles ; garde par préfixe dans `middleware.ts` avec vérification de signature — **pas seulement un décodage**, c'est correct.

**Points vérifiés corrects** : client API unique (`lib/api.ts`, erreurs normalisées `ApiError`, 401 → `/login`) ; **toutes les pages `(app)` appellent l'API réelle** (vérifié : seules les pages d'auth utilisent `fetch` direct, ce qui est normal — elles passent par les route handlers cookie) ; composants mutualisés (`StatusBadge`, `ConfirmDialog`, `ToastProvider`) réellement utilisés ; confirmation avant destructions ; hook `use-current-user.ts` pour le rôle réel sur pages communes.

**Problèmes** :
1. Barre de recherche décorative (`TopBar.tsx:83`) — bouton/champ sans action (UI-001).
2. Suppression de compte cassée (DEL-*) — le seul « bouton qui ne marche pas » trouvé, et il est critique.
3. Fonctionnalités volontairement désactivées avec messages explicites (6 pages, upload) — honnête, mais à résorber (FILE-*).
4. Pas de pagination nulle part : toutes les listes chargent tout (`GET /grades` = toutes les notes du système pour `/scolarite/notes`) — acceptable en démo, à surveiller (noté, pas de tâche dédiée hors API-001).
5. Pas de cache/SWR : chaque navigation refetch tout — acceptable à cette échelle.
6. Duplication de la logique note→module entre 2 pages (§4, refactorisation).
7. A11y/SEO/responsive non audités (UI-002/003/004) ; aucune metadata par page.
8. Reste un `.git` imbriqué et des assets Next par défaut (`public/vercel.svg`…) — cosmétique.

---

## 11. Audit backend

**Chiffres** : 26 routeurs, 273 endpoints, montés sous `/api` (`src/app.ts`). 26 fichiers use-cases, 47 adapters, 47 ports repository.

**Corrects** : authentification JWT systématique via `authed()` (aucune route métier non protégée trouvée hors auth publiques et `/api/hello`) ; autorisation dans les use cases par capacités ; résultats typés exhaustifs traduits par `respond()` (statuts HTTP cohérents : 400/401/403/404/405/409/423) ; erreurs Postgres traduites (unicité, FK) ; règles de suppression par entité avec cascades transactionnelles (`UnitOfWork`) ; mots de passe/hash jamais sérialisés dans les vues.

**Problèmes** :
1. **Validation d'entrée minimale** : pas de couche de validation déclarative (zod a été retiré) ; les use cases vérifient la présence des champs (`missing_fields`) mais peu les formats/bornes (ex. `value` d'une note non bornée 0–20, dates non validées). Recommandation : valider aux use cases (pas de retour de zod obligatoire) — à traiter au fil de l'eau, prioritairement sur grades/sessions/absences.
2. **Audit-log jamais écrit** (AUD-*) — la « journalisation » n'existe pas.
3. **`storage.adapter.ts` no-op** (FILE-*).
4. **Régression d'autorisation** sur la suppression de compte (DEL-*) ; revue générale nécessaire (SEC-101).
5. Endpoints présents mais non consommés par le front : `POST /grades/:id/unlock` (NOTE-001), `GET /audit-logs/user/:userId` et variantes (utiles après AUD-*), `DELETE /users/:id` (superadmin — pas d'UI de suppression de compte dans `/superadmin/gestion`, seulement retrait de rôle).
6. Pas d'endpoint agrégé pour la messagerie (API-001) ni de pagination serveur (audit-logs paginés côté client).
7. `console.*` comme seule journalisation applicative — pas de logger structuré (acceptable ; Sentry via OBS-002 comblera l'essentiel).
8. Pas de documentation API (DOC-004).

---

## 12. Audit de la base de données

**Schéma** : 47 tables (`src/postgres/schema/*.ts`), PK `text` (UUID générés applicativement via `randomUUID()`), FKs systématiques avec `onDelete` réfléchis (`cascade` pour les liens de composition, `set null` pour les auteurs — ex. `grade.enteredBy`), contraintes d'unicité métier pertinentes (`unique(gradeId, assessmentId)`, `unique(moduleId, name)`, email unique).

**Migrations** : 7 fichiers SQL (`drizzle/0000…0006`), cohérents avec le schéma (dernier : `password_reset_tokens`). Appliquées au boot (`server.ts:11` — voir K8S-004).

**Points d'attention** :
1. **Pas d'index hors contraintes uniques** : les colonnes de recherche fréquentes (`grade.student_id`, `session.course_id`, `absence.student_id`, `audit_log.user_id`…) n'ont pas d'index explicite — Postgres n'indexe pas automatiquement les FKs. Non bloquant à l'échelle démo ; à créer si volumétrie (pas de tâche P0).
2. **Pas de `createdAt`/`updatedAt` généralisés** : seules certaines tables ont des timestamps (users, file, grade.enteredAt…). Assumé, mais limite la traçabilité (renforce le besoin d'AUD-*).
3. **Timestamps posés par l'application** (pas de `defaultNow()`) — cohérent avec le choix « logique dans l'application », mais toute insertion hors API perd l'information.
4. **Tokens en clair** (`password_reset_tokens.token`, `two_factor_sessions.token`) — SEC-106.
5. **Seed minimal** : 2 comptes admin seulement (`seed.service.ts`). Aucune donnée de démonstration métier (filières, classes, étudiants) — pour la soutenance, prévoir soit un script de seed métier *(à créer : `src/postgres/seed-demo.ts`)*, soit un dump. Recommandé mais non exigé (pas d'ID de tâche P0 ; à raccrocher à PM-001/démo).
6. `student` sans champ de statut initial/alternant : le statut se déduit de l'existence d'un `document_apprenticeship_contract` — choix cohérent, à documenter à l'oral (cas §4 « changement de statut » = créer/clore un contrat).

**Risques de perte/incohérence** : pas de sauvegardes (BAK-*) ; PVC `local-path` mono-nœud ; suppression physique de fichiers non transactionnelle avec la DB (le pattern `storage-warning` gère le cas — bien).

---

## 13. Audit de sécurité

| Niveau | Constat | Preuve | Correctif |
|--------|---------|--------|-----------|
| **Critique** | Suppression de compte RGPD inopérante (droit à l'effacement cassé) | `parametres/page.tsx:118` vs `auth.use-cases.ts:468` | DEL-* |
| **Élevé** | Aucun test de sécurité/CI qualité : une régression d'autorisation (avérée, DEL-001) peut atteindre `main` sans détection | `ci.yml` (build seul) | TEST-021, CICD-001/002, SEC-101 |
| **Élevé** | CORS ouvert à tous les origins | `app.ts:62` `cors()` sans options | SEC-102 |
| **Élevé** | Aucun en-tête de sécurité en prod (Traefik ne pose rien ; helmet absent ; nginx avec headers = dev/compose uniquement) | `app.ts`, `k8s/*/middleware.yml` (redirect seulement), `docker/nginx/nginx.conf` | SEC-104 |
| **Moyen** | Pas de rate limiting IP (login/forgot) — le verrouillage compte existe mais l'énumération/bruteforce distribué reste possible | `app.ts` (aucun middleware) | SEC-103 |
| **Moyen** | Tokens de reset et sessions 2FA stockés en clair en DB | `schema/auth.ts` (`passwordResetTokens.token` PK en clair) | SEC-106 |
| **Moyen** | Conteneurs prod en root, pas de `securityContext`, pas de `NetworkPolicy`, pare-feu VPS non versionné | `docker/*/Dockerfile` (pas de `USER`), `k8s/**` | SEC-105, K8S-005 |
| **Moyen** | Purge des sessions 2FA en échec silencieux (404 CronJob) → tokens de session 2FA persistants en DB | `k8s/backend/cleanup-cronjob.yml` vs `app.ts:65` | K8S-001 |
| **Moyen** | JWT 8 h sans révocation ni refresh (un token volé reste valide 8 h, y compris après suppression du rôle) | `token-provider.adapter.ts` (`JWT_EXPIRES_IN = "8h"`) | Documenter/accepter, ou réduire à 1-2 h + refresh (hors P0) |
| **Faible** | CSRF : surface résiduelle faible — cookie `SameSite=Lax` + le middleware ne relaie le token qu'en même-origine ; pas de token CSRF | `app/api/auth/login/route.ts:37-42` | Acceptable en l'état ; noter dans le dossier |
| **Faible** | Injection SQL : néant constaté (Drizzle paramétré partout, aucun SQL brut trouvé) | grep `sql\`` négatif | — |
| **Faible** | XSS : React échappe par défaut ; aucun `dangerouslySetInnerHTML` trouvé | grep négatif | — |
| **Faible** | Secrets dans git : rien trouvé (`.env` ignoré, Infisical, `KUBECONFIG`/tokens en GitHub Secrets) ; `.env.example` ne contient que des valeurs de dev explicitement marquées | `.env.example`, `.gitignore` | — |
| **Faible** | Messages d'erreur : neutres sur forgot-password (anti-énumération OK) ; « Invalid credentials » générique OK | `auth/routes.ts:125-131` | — |

---

## 14. Audit Docker, Kubernetes et déploiement

### Développement (`docker-compose.yml`)
- ✅ Postgres healthcheck + volume ; hot-reload backend (`tsx watch`) et frontend ; `node_modules` en volumes nommés (workflow documenté au README) ; variables obligatoires (`:?`) ; seed conditionnel.
- ⚠️ Pas de service nginx en dev malgré le README (« Nginx (dev) ») — les services sont exposés directement (3000/3001). Fonctionnel, mais la config `docker/nginx/` n'est utilisée que par `docker-compose.prod.yml`, lui-même obsolète (INC-08). Mettre la doc en cohérence (DOC-003/K8S-006).
- ⚠️ `CRON_SECRET` et `FRONTEND_PUBLIC_URL` partiellement câblés (FRONTEND_PUBLIC_URL a un défaut ; CRON_SECRET absent du compose — la route cleanup répond 401 en dev, sans gravité).

### Production (k8s)
- ✅ Multi-stage prod sans devDependencies ; images standalone Next ; GHCR + `imagePullSecrets` ; namespaces séparés (`frontend`/`backend`/`postgres`) ; réplicas 3/2/1 ; RollingUpdate justifié + `Recreate` postgres ; requests/limits partout ; probes 3 niveaux (startup/readiness/liveness) ; Infisical opérateur ; rollback automatique CD.
- ❌ CronJob 2FA en 404 (K8S-001) · pas de cert-manager versionné (K8S-002) · probes `tcpSocket` (un backend dont la DB est morte reste "ready") (K8S-003) · migrations par réplica (K8S-004) · pas de NetworkPolicy (K8S-005) · root containers (SEC-105) · pas de stockage pour les uploads futurs (FILE-010) · pas de sauvegardes (BAK-*) · pas d'observabilité (OBS-*).
- Séparation des environnements : dev = compose local, prod = k8s sur push `main` — pas d'environnement de staging (acceptable pour le projet, à mentionner).

## 15. Audit CI/CD

| Attendu | État |
|---|---|
| Install deps / lint / typecheck / tests unitaires / tests intégration | ❌ Absents — la CI ne fait **que** builder les 2 images Docker (`ci.yml`) |
| Build frontend/backend | ✅ via les Dockerfiles (le build TS échoue ⇒ l'image échoue — filet de sécurité implicite minimal) |
| Validation des migrations | ❌ (CICD-005) |
| Build & push images | ✅ multi-arch amd64/arm64, cache GHA `mode=max`, tag = SHA, push sur `main` uniquement |
| Scan vulnérabilités | ❌ (CICD-004) |
| Déploiement k8s | ✅ `cd.yml` : gated sur CI success + branche `main` + event push ; self-hosted runner ; injection images/hosts/secrets ; `kubectl apply -R` |
| Déploiement conditionné aux tests | ❌ mécaniquement impossible (pas de tests) — CICD-002 |
| Rollback | ✅ `kubectl rollout undo` automatique sur timeout de rollout ; stratégie « revert commit » documentée au README |
| Gestion des secrets CI | ✅ GitHub Secrets (KUBECONFIG, tokens Infisical par service, GITHUB_TOKEN pour GHCR) |

## 16. Audit des tests

**Inventaire : 0 test.** Aucun `*.test.*`/`*.spec.*`, aucune dépendance (ni vitest, ni jest, ni supertest, ni playwright, ni cypress) dans les 5 `package.json`. Aucune étape de test en CI.

Conséquence : chaque fonctionnalité listée « terminée » en §6 l'est **sans filet** — la régression DEL-001 en est la démonstration concrète. Le plan de rattrapage complet est en §9.8 (TEST-001…033), priorisé sur : politique de sécurité du domaine (pur, testable immédiatement), use cases auth/grades/absences (cœur métier noté), RBAC par endpoint, et 4 parcours E2E de démo.

## 17. Dette technique et qualité

1. **Code mort / vestiges** : `docker-compose.prod.yml` (INC-08) · `otplib` (TECH-005) · `.git` imbriqué front (TECH-001) · `/api/hello` (TECH-002) · assets Next par défaut (`public/*.svg`) · suppressions stagées non commitées (ancien système d'erreurs + maquette) à finaliser.
2. **Documents** : `WORKFLOW.md` obsolète stagé (DOC-002) ; `CLAUDE.md` 3 affirmations périmées (DOC-001) ; README 2 erreurs factuelles (DOC-003).
3. **Duplication** : résolution note→module dupliquée (2 pages) ; reconstruction des conversations côté client (API-001).
4. **Gros fichiers** : `auth.use-cases.ts` ~500 l., `messagerie/page.tsx` 451 l., `formations/page.tsx` 442 l. — surveiller.
5. **Typage** : excellent (0 `any`) ; unions discriminées systématiques ; TS 6 strict.
6. **TODO/FIXME** : aucun dans le code applicatif (les limitations sont des messages UI assumés — bonne pratique).
7. **Logs de debug** : `console.log` email (assumé dev), `console.error` global — à raccorder à Sentry (OBS-004).
8. **Dépendances** : récentes (Express 5, Next 16, React 19, Drizzle 0.45, TS 6) ; `speakeasy` n'est plus maintenu depuis longtemps — envisager `otplib` (déjà installé !) à l'inverse de TECH-005, **ou** l'assumer : trancher, mais ne pas garder les deux.

## 18. Ordre de réalisation recommandé

### Phase 0 — Correctifs & hygiène (≈ 2-3 jours)
Tâches : K8S-001, DEL-001…005, NOTE-001, TECH-001/002/004/005, DOC-001/002/003, UI-001, SEC-102, SEC-110, commit du refactor stagé.
**Sortie de phase** : plus aucun bug avéré connu ; documents de pilotage cohérents ; CronJob fonctionnel.

### Phase 1 — Filet de sécurité (≈ 1 semaine, parallélisable)
Tâches : TEST-001…004 (outillage), TEST-010…014, TEST-020…022, CICD-001/002/006, SEC-101 (matrice d'autorisations).
**Sortie** : CI rouge si lint/type/test échoue ; RBAC vérifié par des tests ; on peut désormais modifier le backend sans risque de régression silencieuse.

### Phase 2 — Upload de fichiers (≈ 1-1,5 semaine) — le débloqueur métier
Tâches : FILE-001…024 (backend puis infra puis les 6 pages front puis tests).
**Sortie** : justificatifs, documents, supports, rendus et contrats fonctionnels de bout en bout.

### Phase 3 — Traçabilité & identités (≈ 1 semaine, parallélisable avec la fin de la phase 2)
Tâches : AUD-001…010, USR-101…108, API-001/002/003, SEC-108.
**Sortie** : `/superadmin/securite` affiche de vraies données ; noms affichés partout ; messagerie complète pour tous les rôles.

### Phase 4 — Temps réel (≈ 1 semaine)
Tâches : NOTIF-001…012.
**Sortie** : exigence WebSocket du Sujet couverte ; cloche + toasts en démo.

### Phase 5 — Durcissement sécurité & K8s (≈ 1 semaine)
Tâches : SEC-103…107, SEC-109, K8S-002…007, CICD-004/005, TEST-023, TEST-030…033, CICD-003.
**Sortie** : headers/TLS/non-root/NetworkPolicy en place ; E2E en CI ; migrations propres.

### Phase 6 — Observabilité & sauvegardes (≈ 1 semaine)
Tâches : OBS-001…004, BAK-001…004, K8S-003 (si pas déjà fait — prérequis d'OBS-001).
**Sortie** : deux rubriques de la grille passent de 0 à couvert ; restauration testée.

### Phase 7 — Finitions & livraison (≈ 1 semaine)
Tâches : UI-002…005, LEG-001/002, DOC-004/005, PM-001, seed de démo, répétition du scénario de soutenance.
**Sortie** : audit a11y passé, doc de reproduction validée sur machine vierge, livrable `.git` archivable.

> Chaque phase suppose la précédente **pour ses dépendances déclarées uniquement** — les phases 2/3/4 sont largement parallélisables entre membres de l'équipe (la répartition équitable est elle-même notée).

## 19. Checklist finale de conformité

- [ ] **Sujet — Sécurité** : inscription ✅, connexion ✅, mot de passe oublié ✅, réinitialisation ✅, mdp fort ✅, 60 j ✅, blocage ✅, 2FA TOTP ✅ — reste : email SMTP réel (AUTH-001), durcissements SEC-102…110
- [ ] **Sujet — Infrastructure** : Docker ✅, k8s (≡ Swarm accepté) ✅, ≥2 réplicas ✅, registre GHCR ✅, WebSocket ❌ (NOTIF), pare-feu ❌ (K8S-005 + VPS), domaine+SSL ⚠️ (K8S-002), VPS à confirmer
- [ ] **Sujet — Tests** : unitaires ❌, fonctionnels ❌, interface ❌ → phase 1 + 5
- [ ] **Sujet — Observabilité** : santé ❌, erreurs ❌, analytique ❌ → phase 6
- [ ] **Sujet — Sauvegarde 3-2-1** : ❌ → phase 6 ; IaC ✅
- [ ] **Sujet — Gestion de projet** : git ✅, outil de suivi à prouver (PM-001)
- [ ] **Cahier — Métier** : planning ✅, notes ⚠️ (audit), absences ⚠️ (justificatifs), documents ⚠️ (upload), messagerie ⚠️ (noms, admin, temps réel), supports/rendus ⚠️ (upload), administration ✅, audit ❌ (écriture)
- [ ] **Frontend** : 38 pages branchées ✅, garde de rôle ✅, données factices ❌ aucune (1 barre de recherche décorative à retirer), a11y/SEO à faire
- [ ] **Backend** : 273 endpoints ✅, autorisation ⚠️ (revue SEC-101, régression DEL-001), validation d'entrée à renforcer
- [ ] **Base de données** : schéma 47 tables ✅, migrations ✅, sauvegardes ❌, seed démo à créer
- [ ] **Clean Architecture** : direction des dépendances ✅ (vérifiée), ports/adapters ✅, 2 adaptateurs factices à résorber (storage, audit-écriture)
- [ ] **Docker Compose** ✅ / **Kubernetes** ⚠️ (5 correctifs) / **Traefik** ✅ / **Nginx** ⚠️ (doc incohérente) / **Infisical** ✅ / **GHCR** ✅
- [ ] **CI/CD** : build+deploy+rollback ✅, qualité/tests/scan ❌
- [ ] **Documentation** : README riche ⚠️ (2 erreurs), API ❌, CLAUDE.md ⚠️ (3 points périmés), WORKFLOW.md ❌ (obsolète stagé)
- [ ] **Démonstration** : seed métier, scénario, comptes de démo, données réalistes — à préparer en phase 7
- [ ] **Livraison** : archive `.git` avec contributions individuelles visibles (contrainte Sujet), doc de reproduction testée

---

*Document généré par audit statique complet du dépôt le 2026-07-10. À maintenir : cocher les cases au fil de l'eau et re-synchroniser `CLAUDE.md` à chaque jalon.*
