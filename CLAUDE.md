# MyGES 2.0 — Suivi Projet Annuel

> **Fichier unique de suivi.** Il fusionne l'ancien `WORKFLOW.md` (supprimé le 2026-07-10, son contenu était périmé) et le suivi d'avancement historique de ce fichier. Toute instance de Claude Code intervenant sur ce repo doit le lire avant d'agir, et le remettre à jour à chaque fonctionnalité livrée.
>
> **Feuille de route détaillée** : les tâches avec identifiants (`FILE-*`, `AUD-*`, `TEST-*`, `SEC-*`, `K8S-*`…), l'audit complet et le phasage recommandé sont dans **`PROJECT_AUDIT_AND_ROADMAP.md`** (audit du 2026-07-10). Ce fichier-ci reste la vue synthétique par exigence et par page ; l'autre est la liste de travail exécutable. Cocher dans les deux.

Ce fichier centralise l'état d'avancement du projet par rapport aux deux référentiels :
- `Sujet.pdf` — grille de notation générique du Projet Annuel (fournie par l'école)
- `cahierDesCharges.md` — spécification propre à MyGES 2.0 rédigée par l'équipe

Il a été construit en confrontant ces deux documents au **code réel** (backend `infrastructure/backend/express` + `domain`/`application`, frontend `infrastructure/frontend/next`, `docker-compose.yml`, `k8s/`, `.github/workflows/`), pas seulement à ce qui est écrit dans les specs. Légende :

- `[x]` fait et vérifié dans le code
- `[~]` partiellement fait (précisé dans la sous-puce)
- `[ ]` pas fait / pas trouvé dans le repo

À remettre à jour au fil de l'avancement plutôt que de le laisser devenir obsolète. Dernière synchronisation avec le code : **2026-07-15** (branche `develop`, commit `10faff4` + travaux locaux non commités — l'audit complet de référence reste celui du 2026-07-10, `PROJECT_AUDIT_AND_ROADMAP.md`).

## Règles de travail (héritées de WORKFLOW.md, toujours en vigueur)

1. Jamais plusieurs fonctionnalités en parallèle : une fonctionnalité = une session de travail = un scope fermé.
2. Avant de commencer, relire ce fichier (et la section correspondante de `PROJECT_AUDIT_AND_ROADMAP.md`) ; demander confirmation de la fonctionnalité à traiter si elle n'a pas été précisée.
3. Ne jamais ajouter une fonctionnalité non listée sans le signaler explicitement et attendre validation.
4. Avancer par petites étapes vérifiables, pas par gros blocs livrés d'un coup.
5. Une fois une fonctionnalité terminée : mettre à jour son statut ici et cocher les tâches correspondantes dans `PROJECT_AUDIT_AND_ROADMAP.md`, renseigner les fichiers clés, proposer un message de commit clair (branche `feature/…` si le scope est isolé).
6. Ne jamais pousser sur Git sans validation explicite.
7. En cas de blocage ou d'ambiguïté du cahier des charges, l'écrire dans la sous-puce de la fonctionnalité concernée plutôt que de deviner.

## Bugs connus à corriger en priorité (détail et IDs dans `PROJECT_AUDIT_AND_ROADMAP.md` §9.0)

- [x] **Suppression de compte RGPD rétablie (2026-07-12)** — `DELETE /users/me` réintroduit (`auth/routes.ts`), `deleteAccount` autorise l'auto-suppression (`auth.requesterId === userId`) → `DEL-001…005` corrigé
- [x] **CronJob 2FA corrigé (2026-07-12)** — `k8s/backend/cleanup-cronjob.yml` appelle désormais `/api/admin/auth/cleanup-sessions` → `K8S-001`
- [x] **Journal d'audit alimenté (2026-07-15)** — `AuditRecorder` (`application/audit-log/audit-recorder.ts`, écriture non bloquante, échec loggué en console jamais propagé) injecté depuis `container.ts` dans `authUseCases`, `gradeUseCases`, `absenceUseCases`, `fileUseCases`, `adminUseCases`, `studentUseCases`, `instructorUseCases`. Déclenché sur : login réussi/échoué + indicateur de verrouillage et activation 2FA (`auth.use-cases.ts`), reset de mot de passe (`applyPasswordUpdate`, couvre les deux flux credentials/token), suppression de compte par un tiers (jamais pour l'auto-suppression, cf. note ci-dessous) ; notes create/update/lock/unlock/delete (`grade.use-cases.ts`) ; absences validate/reject (`absence.use-cases.ts`) ; documents validate/expire/delete (`file.use-cases.ts`) ; attribution/changement/retrait de rôle admin/étudiant/intervenant. Vérifié de bout en bout par API (`GET /audit-logs`) : login, validation d'absence, validation de document, mise à jour d'un intervenant produisent chacun l'entrée attendue avec `oldValue`/`newValue` corrects. Le format (`action`/`entityName`/`entityId`/`oldValue`/`newValue` en JSON brut) correspond exactement à ce que lisent `/superadmin/securite` et le dashboard `/superadmin` — aucun changement front nécessaire. **Limite assumée** : l'auto-suppression de compte (`DELETE /users/me` par son propriétaire) n'est jamais journalisée — le compte visé n'a par construction aucun audit log préalable (sinon la garde `user_has_audit_logs` bloque déjà la suppression), et la contrainte `audit_log.user_id NOT NULL` (sans cascade) interdit d'insérer une ligne référençant un utilisateur qu'on vient de supprimer ; seule la suppression d'un compte tiers par un `SUPER_ADMIN` est journalisée. Détail complet : `PROJECT_AUDIT_AND_ROADMAP.md` §9.3 (`AUD-001…010`)
- [ ] Dépôt git imbriqué `infrastructure/frontend/next/.git` à supprimer (les fichiers sont bien suivis par le dépôt parent) → `TECH-001`
- [x] **`NOTE-002` corrigé (2026-07-12)** — `/etudiant/notes` plantait pour toute note liée via `manual_notation` : `GET /manual-notations/:id` était réservé admin/intervenant-du-module (`canManageModuleNotations`), l'étudiant se prenait un 403 et ne voyait plus aucune note. `findManualNotationById` (`grade.use-cases.ts`) autorise désormais aussi l'étudiant propriétaire de la note (via `grade-manual-notations` → `canReadGrade`, même pattern que les fixes `findById`/`findAdministrativeByFileDocument` du même jour)
- [ ] **Migration Drizzle `0006_abnormal_nemesis.sql` éditée après application** — son timestamp dans `meta/_journal.json` ne correspond plus à celui enregistré dans `drizzle.__drizzle_migrations` sur les bases déjà migrées, donc le backend **replante au démarrage** dès qu'on `docker compose restart backend` (Drizzle rejoue tout le fichier et échoue sur `CREATE TABLE password_reset_tokens` déjà existante). Corrigé uniquement sur la base locale de cette session (ALTER TABLE manquants rejoués à la main + `created_at` resynchronisé) ; **chaque poste de l'équipe qui a déjà cette migration appliquée percutera le même crash** à son prochain restart tant que ce n'est pas corrigé chez lui de la même façon. Ne plus jamais éditer un fichier de migration déjà appliqué — toujours en générer un nouveau → `TECH-002`

## Stack (rappel, voir `README.md` pour le détail)

Next.js (frontend) · Express.js (backend) · PostgreSQL + Drizzle (ORM) · Docker Compose (dev) / Kubernetes (prod) · Traefik (prod) / Nginx (dev) · Infisical (secrets) · GHCR (registre Docker).

**Fixtures de dev** : `fixtures/dev-fixtures.sql` — jeu de données réaliste (16 étudiants, 4 intervenants, 2 filières, notes, absences, examens...) à charger via `docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < fixtures/dev-fixtures.sql` (voir l'en-tête du fichier pour les identifiants de test). Les sessions sont ancrées sur `date_trunc('week', now())` (lundi de la semaine en cours/prochaine) plutôt que sur un décalage fixe en jours — corrigé le 2026-07-12 après qu'un décalage fixe soit tombé un dimanche, rendant `/etudiant/planning` vide par défaut (aucun bug applicatif, juste des données de test mal calées). Chaque cours alterne présentiel/distanciel entre sa séance passée et sa séance future (6 `ON_SITE` / 6 `REMOTE` au total) plutôt qu'un mode figé par cours, pour que le filtre "Distanciel" ait toujours quelque chose à montrer.

**Messages API en français (2026-07-12)** : tous les messages renvoyés par le backend (`error`/`reason`/`message` dans les 27 fichiers `routes.ts`, plus les constantes centrales `FORBIDDEN_MESSAGE`/`UNAUTHORIZED_MESSAGE`/`FORBIDDEN_OWNERSHIP_MESSAGE` dans `http/responses.ts`, le message générique de `http/validate.ts`, `auth/middleware.ts`, et le handler d'erreur Postgres dans `app.ts`) sont désormais en français — plus aucun texte anglais brut ne doit remonter à l'écran (cf. les bugs `NOTE-002`/documents/messagerie trouvés plus tôt qui affichaient du texte anglais tel quel). Les messages de validation générés automatiquement par **Zod** (ex. champ manquant/type invalide) sont aussi en français via `z.config(fr())` (locale intégrée `zod/locales`, configuré au tout début de `server.ts`, avant tout import de schéma). Les tags internes (`not_found`, `grade_created`, `type: "Creation"/"Deletion"/"Operation"`, etc.) restent en anglais — ce sont des identifiants techniques, jamais affichés tels quels.

---

## 1. Sécurité (obligatoire — `cahierDesCharges.md` §5, `Sujet.pdf` "Sécurité")

- [x] Inscription — `POST /auth/signup`, front `/signup` branché
- [x] Connexion — `POST /auth/login` (+ étape 2FA `POST /auth/login/2fa`), front `/login` branché
- [x] **Mot de passe oublié** (vrai flux par email, sans connaître l'ancien mot de passe)
  - [x] Backend : token à usage unique + expiration (`POST /auth/password/forgot`, `POST /auth/password/reset-with-token`), envoi d'email (log console en dev via `email-sender.adapter.ts`)
  - [x] Front : page `/forgot-password` + confirmation via `/reset-password?token=...`
- [x] Réinitialisation de mot de passe — deux usages distincts sur `/reset-password` : renouvellement forcé (email + ancien mdp) via `POST /auth/password/reset-with-credentials` · mot de passe oublié (token email, sans ancien mdp) via `POST /auth/password/reset-with-token`
- [x] Mot de passe fort (12 caractères min., maj./min./chiffre/symbole) — `domain/auth/security-policy.ts` (`isStrongPassword`)
- [x] Renouvellement obligatoire tous les 60 jours — `PASSWORD_MAX_AGE_DAYS = 60`, vérifié à chaque login (`needsPasswordReset`)
- [x] Blocage après tentatives infructueuses — 5 tentatives (`MAX_FAILED_ATTEMPTS`) → verrouillage 15 min (`LOCK_DURATION_MS`), déverrouillage automatique après délai (pas d'action admin nécessaire)
- [x] Authentification à deux facteurs (TOTP) — fonctionne à l'inscription (`enable2FA`), au login (`totp-provider.adapter.ts`) et à l'activation sur compte existant (`POST /auth/2fa/enable`), **obligatoire pour `SUPER_ADMIN`**
  - [x] Endpoint pour activer la 2FA sur un compte déjà existant — `POST /auth/2fa/enable` + page `/2fa/setup`
  - [x] Purge des sessions 2FA expirées — CronJob k8s corrigé (`K8S-001`, 2026-07-12)
- [ ] Confirmation par SMS (Twilio) en alternative au TOTP — non implémenté (non bloquant : un seul moyen de 2FA suffit)
- [ ] OIDC/OAuth2 (Google, Facebook...) — non implémenté. `cahierDesCharges.md` §5.1 le marque explicitement **"(optionnel)"** → à confirmer à l'oral si un seul mode d'authentification (email/mdp) suffit pour la partie "Authentification Avancée" du sujet
- [ ] Lien magique — non implémenté (idem, marqué optionnel dans le cahier des charges interne)
- [x] Hachage sécurisé des mots de passe — Argon2 (`password-hasher.adapter.ts`)
- [x] Gestion des secrets via variables d'environnement — Infisical (CLI en dev, opérateur Kubernetes en prod)
- [~] Séparation stricte des rôles — depuis le refactor `e91555b`, plus de middleware `requireRole` : l'autorisation se fait par **capacités** (`domain/auth/authorization-policy.ts` → `capabilitiesForRole` → `AuthContext` passé aux use cases, qui retournent `Forbidden`). Le HTTP ne fait que l'authentification (`authed()` dans `auth/middleware.ts`)
  - [ ] Revue systématique des autorisations post-refactor → `SEC-101` (la régression suppression de compte est corrigée, 2026-07-12)
- [~] Conformité RGPD/CNIL
  - [x] Consentement RGPD stocké à l'inscription (`gdprConsentAt`)
  - [x] Export des données personnelles — `GET /gdpr/export`
  - [x] Suppression de compte — `DELETE /users/me` réintroduit, auto-suppression autorisée (`DEL-001…005`, 2026-07-12)
  - [ ] Pages légales (CGU/CGV/politique de cookies) — bonus, voir section 9
- [x] **Garde des routes front par rôle** — le token est désormais un cookie `httpOnly` posé par `app/api/auth/login/route.ts` / `login/2fa/route.ts` (jamais exposé au JS) ; `middleware.ts` vérifie sa signature (`jose`) et bloque/redirige avant le rendu de toute page sous `/etudiant`, `/intervenant`, `/scolarite`, `/superadmin`, `/parametres`, `/messagerie` si absent ou si le rôle ne correspond pas

## 2. Infrastructure (obligatoire — `cahierDesCharges.md` §6, `Sujet.pdf` "Infrastructure")

- [x] Conteneurs Docker — `docker-compose.yml` (dev), Dockerfiles multi-stage (`docker/backend`, `docker/frontend`)
- [ ] Serveur VPS — non vérifiable depuis le repo (dépend de l'hébergement réel) → à confirmer avec l'équipe
- [x] Serveur Web — Next.js (frontend) + Express (backend)
- [~] WebSocket (notifications temps réel) — requis par `cahierDesCharges.md` §3.1/§3.5 ("Notifications automatiques", "Notifications en temps réel"). **Décision d'équipe (2026-07-12)** : implémenté en polling (30s) plutôt qu'en WebSocket, pour éviter le chantier d'infra temps réel (auth sur connexion persistante, scalabilité avec 2 réplicas backend). Couvre l'exigence fonctionnelle ("être notifié") mais pas la lettre exacte ("temps réel") — à assumer à l'oral si demandé. Voir section 10 pour le détail
- [ ] WebRTC — non mentionné dans `cahierDesCharges.md` (uniquement une option générique du sujet type), aucun besoin métier identifié (pas de visio dans le projet) → à ignorer sauf décision contraire de l'équipe
- [x] Registre Docker — GHCR (`ghcr.io/<owner>/<repo>-<service>`), push automatique en CI/CD sur `main`
- [x] Clients Web — Next.js
- [ ] Pare-feu avec protection des ports non utilisés — **aucune trace dans le repo** (à mettre en place sur le VPS : `ufw`/`iptables`, ou `NetworkPolicy` k8s), non versionné actuellement
- [x] Nom de domaine public + certificat SSL valide
  - [x] `IngressRoute` Traefik en HTTPS configuré (`secretName: myges-tls`) avec redirection HTTP → HTTPS (+ redirection www, 2026-07-12)
  - [x] **cert-manager versionné (2026-07-12)** — `k8s/cert-manager/cluster-issuer.yml` (`ClusterIssuer` `letsencrypt-prod`, HTTP-01 via Traefik) + un `certificate.yml` par service (backend, frontend, umami, uptime-kuma) → `myges-tls` émis et renouvelé automatiquement par Let's Encrypt. Documenté au README (§TLS). cert-manager lui-même est un prérequis cluster installé hors repo → `K8S-002` fait
- [x] Pas de solution clé en main (Vercel/CloudFront) — auto-hébergé sur Kubernetes, conforme
- [~] Ingress Controller — le cahier des charges interne mentionne "Nginx" mais l'implémentation réelle utilise **Traefik** (choix différent mais valide techniquement) → documenter/justifier ce choix si demandé à l'oral
- [x] Au moins 2 réplicas par service (hors base de données) — backend : 2, frontend : 3, postgres : 1 (normal pour une base de données)
- [x] PostgreSQL avec volumes persistants — PVC 5Gi (`k8s/postgres/pvc.yml`)
- [x] **Stockage réel des fichiers uploadés (terminé, 2026-07-15)** — `StorageService` (`application/file/storage.service.ts`) implémenté en dev (`save`/`read`/`delete` sur disque, `infrastructure/backend/express/src/storage/storage.adapter.ts`, volume dédié `uploads_data:/app/uploads` dans `docker-compose.yml`) ; endpoints `POST /files/upload` (multipart via `multer`) et `GET /files/:id/download` fonctionnels et vérifiés (round-trip réel testé) → `FILE-002…006` faits. Les 6 usages métier sont câblés sur du réel : `/etudiant/documents` (dépôt + téléchargement), `/etudiant/cours` (téléchargement), `/intervenant/supports` (dépôt + téléchargement), `/etudiant/evaluations` (dépôt de rendu), `/intervenant/evaluations` (téléchargement du rendu), `/scolarite/documents` + `/etudiant/cours` (liens de téléchargement) → `FILE-014…017`/`019` faits. **`/etudiant/absences` (justificatif) déjà fait avant l'audit du 2026-07-15** (trouvé fonctionnel lors de la vérification, `FILE-013`). **`/scolarite/entreprises` (création de contrat) fait le 2026-07-15** (`FILE-018`) : bouton "Nouveau contrat" par entreprise → upload PDF puis `POST /file-documents` (`{fileId, studentId}`) puis `POST /document-apprenticeship-contracts` (`{fileDocumentId, companyId, type, startDate, endDate}`) — un contrat a besoin d'un `fileDocumentId`, pas juste d'un `fileId` brut, contrairement au justificatif. Plus aucun message "dépôt désactivé"/"pas encore implémenté" sur aucune des 38 pages (vérifié par grep exhaustif). **PVC prod fait (2026-07-13)** : `k8s/backend/pvc.yml` (`backend-uploads`, 30Gi, `local-path`, monté sur `/data/uploads` via `UPLOADS_DIR`) → `FILE-010` fait — ⚠️ en **RWO avec 2 réplicas** backend : fonctionne car cluster mono-nœud (`local-path` = RWO à l'échelle du nœud), casserait en multi-nœuds — limitation assumée, à mentionner à l'oral. **Reste à faire** : sauvegarde du volume (`FILE-011`), tests (`FILE-020…024`).

## 3. Réponse métier et architecture

- [x] Domaine métier riche et cohérent — 26 modules backend (`domain/`, `infrastructure/backend/express/src/`) couvrant la quasi-totalité du cahier des charges (planning, notes, absences, documents, entreprises, messagerie, audit)
- [x] Architecture en couches claire — `domain/` (entités, règles), `application/` (cas d'usage), `infrastructure/` (adapters Express/Postgres/Next) — pas de Clean Architecture stricte mais lisible, conforme à ce qui est demandé
- [x] Frontend connecté au backend — les 38 pages sont branchées sur le vrai backend (vérifié à l'audit du 2026-07-10 : plus aucune donnée métier statique), voir détail page par page section 11 ; restent les limitations transverses de la section 10 (upload, noms, temps réel)

## 4. Design et accessibilité

- [ ] Audit accessibilité (a11y) — non fait, pas d'outil configuré (axe, Lighthouse CI...)
- [ ] SEO de base (meta, sitemap, robots.txt) — non vérifié
- [ ] Cohérence UI — dépend de la conversion maquette statique → vrai front (voir section 11)
- [ ] Responsive / mobile web — à vérifier une fois les pages reconnectées

## 5. Tests

- [x] **Tests unitaires (2026-07-15)** — Vitest, 71 tests : `domain/auth/{security-policy,authorization-policy}.test.ts` (règles pures) + `application/{auth,grade,absence}/*.use-cases.test.ts` (doubles en mémoire, voir `*.use-cases.fakes.ts` et `test/fakes/not-implemented.ts` pour le pattern de stub réutilisable). `npm test` à la racine (nécessite `docker compose up -d postgres`, config dans `.env.test.local`).
- [x] **Tests fonctionnels API (2026-07-15)** — Supertest contre `app` réelle + base Postgres dédiée `myges_test` (créée/migrée automatiquement, jamais la base dev), 27 tests dans `infrastructure/backend/express/test/api/` : parcours auth complet (dont 2FA SUPER_ADMIN avec un vrai TOTP), RBAC sur 6 endpoints sensibles, contraintes 409 (doublon/référence), fil rouge métier complet (filière → session → absence → validation) via la vraie API HTTP.
- [~] **Tests d'interface E2E (2026-07-15)** — Playwright, 5 tests dans `infrastructure/frontend/next/e2e/` (`npm run test:e2e`, nécessite la stack dev démarrée) : connexion (erreur + succès), garde de route par rôle dans un vrai navigateur, saisie d'une note par un intervenant relue par l'étudiant dans une session isolée. **Pas encore branché en CI** (`CICD-003`, décision assumée — voir roadmap §9.9).
- [x] **Intégration CI (2026-07-15)** — `.github/workflows/ci.yml` : job `quality` (typecheck backend+frontend, lint frontend) + job `test` (Vitest avec service Postgres) exécutés **avant** le build Docker, qui ne se déclenche plus si l'un des deux échoue (`needs: [quality, test]`). `prettier --check` volontairement laissé hors CI : 166 fichiers préexistants jamais formatés y échoueraient pour un motif sans rapport avec le code en cours — décision d'équipe à prendre avant de l'activer. Lint backend et Playwright en CI restent à faire.

## 6. Observabilité

- [x] **État de santé des conteneurs — Uptime Kuma auto-hébergé (2026-07-14)** : `k8s/observability/uptime-kuma/` (namespace `observability`, PVC, IngressRoute HTTPS + Certificate). La configuration des sondes se fait dans son UI (non versionnée) → penser à créer les moniteurs backend/frontend et à pouvoir les montrer en soutenance → `OBS-001` fait
- [ ] Signalement des erreurs (Sentry / GlitchTip) — aucun intégré → `OBS-002`, **hors périmètre / facultatif (décision utilisateur du 2026-07-15)** : le Sujet ne l'exige pas explicitement (observabilité "raisonnable", pas exhaustive), ne pas l'implémenter sauf changement d'avis
- [x] **Analytique RGPD — Umami auto-hébergé et branché (2026-07-15)** : `k8s/observability/umami/` (deployment + postgres dédié avec PVC, secrets via `INFISICAL_TOKEN_ROOT` injecté par le CD, IngressRoute + Certificate) + script de tracking injecté dans `app/layout.tsx` (`next/script`, `strategy="afterInteractive"`, pointant sur `https://analytics.newges.fr/script.js` avec le `data-website-id` de l'instance) → `OBS-003` fait. Reste : bandeau cookies si jugé nécessaire (`LEG-002` — Umami ne pose pas de cookie de tracking, à documenter/assumer à l'oral plutôt qu'un vrai bloquant).
- [x] Health checks basiques — `docker-compose.yml` a un `healthcheck` Postgres ; k8s a des probes readiness/liveness (README) mais ce n'est pas de l'observabilité au sens du cahier des charges (pas de dashboard/alerting)

## 7. Gestion de projet

- [ ] Méthodologie Agile / sprints documentés — non vérifiable depuis le repo (à confirmer avec l'équipe)
- [ ] Outil de suivi (GitHub Projects / Trello) — non vérifiable depuis le repo (aucune référence dans `.github/`)
- [ ] Répartition équitable des tâches — dépend de l'équipe, à suivre en séance
- [x] Historique Git — commits récents clairs avec PR (`Merge pull request #53...`), bon signal

## 8. Politique de recouvrement (sauvegarde)

- [ ] Stratégie 3-2-1 — **aucune sauvegarde configurée**
- [ ] Sauvegarde de la base de données — aucune (pas de cron `pg_dump`, pas de snapshot)
- [ ] Sauvegarde des fichiers utilisateurs — aucune (et le stockage des fichiers lui-même n'existe pas encore, voir Infrastructure)
- [ ] Sauvegarde externe (fournisseur différent) — aucune
- [x] IaC — Dockerfiles + manifests k8s versionnés (suffisant selon le cahier des charges, qui accepte "Dockerfile" comme forme d'IaC)

## 9. Bonus (optionnel, non prioritaire tant que l'obligatoire n'est pas fait)

- [ ] Auto-hébergement matériel + Proxmox + cluster répliqué — dépend de l'infra physique réelle, non vérifiable depuis le repo
- [ ] Analytique et visualisation avancée — non fait
- [ ] Pages légales RGPD (CGU, CGV, Contact, politique de cookies) — aucune page trouvée
- [ ] Application mobile (Capacitor/React Native/Flutter/Kotlin/Swift) — non démarré
- [ ] OAuth2/OIDC et Lien magique — cf. section 1, marqués optionnels dans `cahierDesCharges.md`

---

## 10. Récapitulatif des actions backend bloquantes pour le front

Ces gaps backend conditionnent des pages listées en section 11 — à traiter en parallèle du travail front, pas après :

- [x] Endpoint mot de passe oublié par email (token à usage unique)
- [x] Endpoint d'activation de la 2FA sur un compte existant (`POST /auth/2fa/enable`)
- [x] Endpoint de dégel des notes — `POST /grades/:id/unlock` exposé côté front sur `/scolarite/notes` (bouton "Dégeler") → `NOTE-001` fait
- [x] Rétablir l'auto-suppression de compte (`DELETE /users/me`) → `DEL-002/003` (2026-07-12)
- [x] **Écriture des journaux d'audit (2026-07-15)** — `audit-recorder` branché sur les actions sensibles (login, notes lock/unlock, absences validate/reject, documents, attributions de rôle) → `AUD-001…010`, détail section 1
- [x] Upload réel de fichiers (multipart + stockage disque en dev) fait le 2026-07-12 → voir section 2 ; reste le câblage des pages restantes et l'infra prod (`FILE-*`)
- [x] **Notifications (2026-07-12)** — version simplifiée **sans WebSocket** (choix assumé : décision d'équipe, cf. section 11.2) : nouvelle table `notification` (`domain/notification`, `application/notification`, `infrastructure/backend/express/src/notification`), déclenchée sur 4 évènements (`GRADE_PUBLISHED` à la création d'une note, `ABSENCE_VALIDATED`/`ABSENCE_REJECTED`, `NEW_MESSAGE` à l'envoi d'un message — résout tous les destinataires réels d'une conversation privée/cours/classe —, `DOCUMENT_VALIDATED`). Routes `GET /notifications/mine`, `GET /notifications/mine/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`. Front : `components/layout/NotificationBell.tsx`, polling toutes les 30s, remplace l'ancienne cloche décorative (point rouge codé en dur) de `TopBar.tsx`. **Non couvert par ce premier passage** : aucun déclencheur sur évaluation publiée/support de cours déposé/contrat expirant — à étendre au fil de l'eau via `notificationUseCases.notify(...)` (même pattern que les 4 déclencheurs existants) → reste de `NOTIF-*`
- [x] **Invitation d'un étudiant par l'administration (décision d'équipe du 2026-07-15, fait le jour même — vérifié de bout en bout par API + rendu des 2 pages)** — un `ADMIN`/`SUPER_ADMIN` crée le compte étudiant via `POST /users/invite` (prénom, nom, email, filière — bouton "Inviter un étudiant" sur `/scolarite/etudiants`) ; l'étudiant reçoit un email (console.log en dev, cherchez `[email] Invitation for` dans `docker compose logs backend`) avec un lien `/reset-password?token=…&invitation=1` (TTL **72 h**, usage unique) pour **définir son mot de passe et donner son consentement RGPD** (l'admin ne peut pas consentir à sa place : `users.gdpr_consent_at` est désormais nullable, le consentement est exigé et daté à l'activation via `resetWithToken`). Connexion impossible avant activation (hash aléatoire jamais communiqué). Le compte invité a directement son rôle `STUDENT` + sa filière (pas d'étape "en attente de rôle" sur ce parcours). Fichiers clés : `application/auth/auth.use-cases.ts` (`inviteStudent`, `resetWithToken`), `domain/auth/password-reset-token.entity.ts` (`purpose: reset|invitation`), migration `0008_first_owl.sql` (2 ALTER additifs), `src/auth/routes.ts`, `app/(app)/scolarite/etudiants/page.tsx`, `app/reset-password/page.tsx`. Non exigé par les documents source (accroche : cahier §2.1 "Gestion des comptes") — restent les tests `INV-010…012` (dépendent de l'outillage `TEST-*`)
- [~] **Endpoint agrégé `GET /planning/mine` créé mais non consommé** — nouveau module `application/planning/planning.use-cases.ts` + `src/planning/routes.ts` (résolution serveur des modules/groupes/salles, fenêtre `from`/`to` ou découpage par semaines). Les 3 pages planning du front font **toujours** la chaîne d'appels côté client → soit migrer les pages vers cet endpoint, soit le retirer (ne pas laisser un endpoint mort)
- [x] **Endpoint agrégé `GET /conversations/mine` (2026-07-15)** → `API-001` fait. `ConversationUseCases.listMine` résout en une seule requête : conversations de classe/cours pour un étudiant, conversations de cours pour un intervenant, conversations privées pour tout rôle (nom du second participant résolu, remplace le placeholder "Administration" y compris côté étudiant) — chaque entrée porte aussi le dernier message et le nombre de non-lus (via `message`/`message-read`), trié par activité récente. Détail section 11.2 (`/messagerie`)
- [x] Permettre à un `ADMIN` simple de retrouver son profil admin — `GET /admins/me` (`admin/routes.ts`, `resolveOwnAdmin`) débloque la messagerie ciblée → `API-002` (2026-07-12)
- [ ] Un moyen de lister les comptes en attente d'attribution de rôle (`pending_role_assignment`) — aujourd'hui `GET /admin/security/users` retourne tous les comptes mais ne distingue pas explicitement "sans rôle" des autres
- [x] **Résolution nom/prénom à partir d'un `userId` (2026-07-15, terminé)** — `GET /users/:id` existe depuis le 2026-07-12. Un helper partagé `lib/user-names.ts` (`resolveUserName`/`buildNameMap` pour les entités `{id, userId}`, `resolveStudentName`/`buildStudentNameMap`/`formatStudentName` pour résoudre par `student.id`, cache module-level partagé entre pages) a émergé au fil des sessions et est désormais le pattern de référence. Appliqué sur `/intervenant/notes`, `/intervenant/evaluations`, `/messagerie` (expéditeur, conversations privées, sélecteur "Nouvelle conversation"), `/scolarite/etudiants`, `/scolarite/intervenants`, `/scolarite/absences`, `/scolarite/documents`, `/scolarite/examens`, `/superadmin/securite` (colonne "Utilisateur"). **Derniers gaps comblés le 2026-07-15** : `/scolarite/cours` (nom d'intervenant en tableau + modale de création/édition) et `/scolarite/classes` (roster d'étudiants par groupe + modale "Affecter un étudiant", suppression du texte obsolète "noms pas encore disponibles côté backend"). Vérifié par audit exhaustif du code (plus aucune occurrence de `Étudiant #`/`Intervenant #`/`Utilisateur #` hors des fallbacks d'erreur du helper partagé) puis par navigateur réel (Playwright). Reste volontairement non traité : la colonne "Entité" de `/superadmin/securite` (`grade #fx_grade…`) reste un id technique, pas un nom de personne — chaque type d'entité aurait un chemin de résolution différent, jugé hors scope (`USR-108` reste ouvert : test API garantissant qu'un étudiant ne peut pas lister les noms de tous les étudiants hors de ses groupes).

---

## 11. Frontend — pages à construire (détail)

Contexte : `infrastructure/frontend/next` est le vrai front. L'ancienne maquette statique `infrastructure/frontend/MyGes refonte/` a été **supprimée** (suppression stagée le 2026-07-10) — ne plus s'y référer.

Chaque page ci-dessous liste un **"Contenu"** : ce qu'elle doit afficher/permettre, concrètement, à partir des entités réelles du backend (`domain/*.entity.ts`). Volontairement limité à ce que le cahier des charges demande — ne pas ajouter de sections/fonctionnalités non listées ici sans raison métier.

### Rôles réels (backend, `domain/auth/user.enums.ts`)

Seulement 4 rôles (pas les 6-7 décrits dans `cahierDesCharges.md` §2, l'admin est unifié côté backend) :

| Rôle | Constante | Route racine front |
|---|---|---|
| Étudiant | `STUDENT` | `/etudiant` |
| Intervenant | `INSTRUCTOR` | `/intervenant` |
| Administration (scolarité + pédagogique + relations entreprises fusionnées) | `ADMIN` | `/scolarite` |
| Super Administrateur | `SUPER_ADMIN` | `/superadmin` |

- Un compte n'a pas de rôle par défaut à l'inscription (`signup` ne crée qu'une ligne `users`). Tant qu'aucun enregistrement `student`/`instructor`/`admin` n'existe, le login renvoie `pending_role_assignment`. C'est un `SUPER_ADMIN` qui attribue le rôle après coup.
- `ADMIN` et `SUPER_ADMIN` ont quasiment les mêmes droits métier ; seule la gestion des comptes admin eux-mêmes (`/admins`) et la liste de sécurité globale (`/admin/security/users`) sont réservées à `SUPER_ADMIN`.

### Conventions déjà en place à respecter

- Next.js 16 App Router, React 19, TailwindCSS 4, `shadcn`/`radix-ui`, icônes `lucide-react`
- Charte : bleu marine `#001944`/`#002C6E`, `Inter` (texte) + `Manrope` (titres)
- `middleware.ts` réécrit `/api/*` vers le backend Express — toujours appeler `fetch("/api/...")`, jamais l'URL backend en dur
- Layout `(app)/layout.tsx` = `Sidebar` + `TopBar` + `<main>` ; toute nouvelle page authentifiée va dans le groupe de routes `(app)`
- Un seul `Sidebar.tsx` avec un `navConfig` par rôle — à étendre à chaque nouvelle page plutôt que dupliquer
- Composants UI déjà présents dans `components/ui/` (button, card, badge, input, label) — en ajouter d'autres via `shadcn` (table, select, dialog, tabs, toast, switch, dropdown, dropzone) plutôt que du CSS inline comme dans la maquette

### 11.1 Public / Authentification

- [x] **`/login`** — connexion email/mdp + étape TOTP
  - Contenu : formulaire email + mot de passe · lien "Créer un compte" → `/signup` · lien "Mot de passe oublié ?" → `/forgot-password` (à ajouter) · champ code TOTP à 6 chiffres affiché uniquement si `twoFactorRequired`
  - États d'erreur à distinguer clairement (pas un message générique unique) : identifiants invalides · compte verrouillé (afficher `lockedUntil` formaté, ex. "réessayez dans 12 min") · mot de passe expiré (redirige déjà vers `/reset-password?email=...`, conservé) · compte en attente d'attribution de rôle (`pending_role_assignment`, message dédié "compte en attente de validation", pas une erreur) · 2FA obligatoire non configurée pour un `SUPER_ADMIN` (`super_admin_2fa_required`, doit rediriger vers `/2fa/setup`, aujourd'hui non géré)
  - Endpoints : `POST /auth/login`, `POST /auth/login/2fa`

- [x] **`/signup`** — inscription
  - Contenu : champs prénom, nom, email, mot de passe (avec indicateur de force en direct : longueur/majuscule/minuscule/chiffre/symbole) · case à cocher **obligatoire** consentement RGPD (`gdprConsent`) · case à cocher **optionnelle** "Activer la double authentification maintenant" (`enable2FA`)
  - Si `enable2FA` coché : après création, afficher le QR code (`totpProvisioningUri`) et le secret en clair (`totpSecret`) à scanner, avec un bouton "J'ai terminé" avant de renvoyer vers `/login`
  - Message de succès explicite : "Compte créé. Un administrateur doit vous attribuer un rôle avant que vous puissiez vous connecter."
  - À retirer : le sélecteur de rôle actuel (le champ envoyé n'est lu par aucun endpoit backend)
  - Endpoint : `POST /auth/signup`

- [x] **`/forgot-password`** — saisie email + message de confirmation neutre après envoi
- [x] **`/reset-password`** — deux formulaires selon le contexte : renouvellement expiré (email + ancien + nouveau mdp) · lien email `?token=...` (nouveau mdp + confirmation, sans ancien mdp)

- [x] **`/2fa/setup`** — QR code + secret TOTP + confirmation par code à 6 chiffres

### 11.2 Commun à tous les rôles connectés

- [x] **`/parametres`** — reconnectée
  - Section "Profil" : prénom, nom, email en lecture seule (`GET /users/me`, pas de `PATCH /users/me` côté backend), badge de rôle
  - Section "Sécurité" : changer le mot de passe (ancien + nouveau) → `POST /auth/password/reset` · statut 2FA réel avec lien vers `/2fa/setup` si non activée · alerte si `passwordExpiresInDays < 7`
  - Section "Confidentialité" : export RGPD (télécharge le JSON de `GET /gdpr/export`) · suppression de compte avec modal de confirmation → `DELETE /users/me` + déconnexion
  - Sections "Notifications" et "Sessions actives" de la maquette retirées (pas de backend derrière, auraient été des toggles qui ne font rien)

- [x] **`/messagerie`** — reconnectée
  - **Liste des conversations via l'agrégat serveur `GET /conversations/mine` (2026-07-15, `API-001`)** — remplace l'ancienne reconstruction côté client (classe → groupe → classe, cours → module, privées → résolution du nom un par un). Chaque entrée porte désormais aussi le dernier message et le nombre de non-lus, et la liste est repollée toutes les 30s (même pattern que le fil de messages) pour que la sidebar se mette à jour toute seule — comble la limitation "pas de badge nouveau message" notée précédemment. Le nom du participant privé est résolu pour **tous** les rôles (étudiant compris — remplace l'ancien placeholder générique "Administration").
  - Fil de messages, envoi (`POST /messages`), marquage lu best-effort (`POST /message-reads`)
  - **Nom de l'expéditeur affiché sur chaque message (2026-07-12)** : `Message.senderId` est directement un `userId` (posé par le backend depuis `req.auth.userId`, pas un id d'entité métier) — résolution directe via `GET /users/:id`, mise en cache par `senderId` le temps de la session de page. Dans une conversation de classe/cours à plusieurs participants, chaque bulle reçue affiche `Prénom Nom` au-dessus.
  - "Nouvelle conversation" (ADMIN/SUPER_ADMIN) fonctionnelle : envoie `{ userAId, userBId }` via `POST /conversation-privates` (corrigé `MSG-001`, 2026-07-12), noms d'étudiants résolus via `GET /users/:id`, `GET /admins/me` pour débloquer les admins simples (`API-002`) ; à la création, rafraîchit la liste via l'agrégat au lieu d'un `window.location.reload()` complet.
  - **Polling sur la conversation active** — même décision d'équipe que les notifications (pas de WebSocket, cf. section 10) : `GET /messages/conversation/:id` est réinterrogé toutes les 30s (`POLL_INTERVAL_MS`) tant qu'une conversation est ouverte, avec diff côté client (`messagesRef`) pour ne marquer "lu"/résoudre les noms d'expéditeur que sur les messages réellement nouveaux, pas sur tout le fil à chaque tick. Auto-scroll vers le bas quand de nouveaux messages arrivent. Les échecs de poll (silencieux, `opts.silent`) n'effacent pas le fil déjà affiché, contrairement à l'échec du chargement initial.

- [x] Notifications (cloche globale, pas une page à part) — fait le 2026-07-12 en version polling (30s), pas de WebSocket ; voir section 10 pour le détail et les évènements couverts

### 11.3 Étudiant (`/etudiant`)

- [x] **`/etudiant`** — dashboard reconnecté
  - Carte "Prochain cours" (calcul du plus proche créneau futur), carte "Absences en attente", carte "Documents à régulariser", carte "Nouvelles notes" · listes "Prochain cours" et "Dernières notes" détaillées
  - Pas d'ECTS/graphique de progression (aucune notion de validation d'ECTS dans le backend, aurait été inventé)
  - **Bug corrigé (smoke test du 2026-07-10)** : la carte "Documents à régulariser" appelait `GET /file-documents/student/:studentId` (avec son propre `studentId`), un endpoint réservé aux admins côté backend (`if (!auth.isAdmin) return NotFound`) → tout étudiant se prenait un "File documents not found" affiché tel quel au lieu du dashboard. Corrigé en utilisant `GET /file-documents/mine` (self-service, déjà prévu pour ce cas)

- [x] **`/etudiant/planning`** — emploi du temps §3.1, reconnecté
  - Chaîne réelle : `students/me` → `student-groups` → `groups/:id/courses` → `courses/:id/sessions`, grille semaine avec navigation
  - Seuls deux modes existent réellement côté backend (`ON_SITE`/`REMOTE`) — pas de mode "entreprise" dédié dans `SessionMode`, retiré du filtre/légende (une journée entreprise = simplement l'absence de session)
  - **Bug corrigé (2026-07-12)** : le lieu affiché n'était que le nom court de la salle (ex. `P101`), sans le campus — impossible de savoir où se rendre si l'école a plusieurs campus. Résolution de `classroom.campusId` → `campus.name` ajoutée, affichage désormais `Campus Paris — P101` (+ `title` avec le nom complet du module en cas de troncature)

- [x] **`/etudiant/notes`** — notes et moyennes §3.2, reconnecté
  - Chaque note (`Grade`) n'est liée à un module qu'indirectement (`grade-assessment` / `grade-session-exam` / `grade-manual-notation` → remonter jusqu'au module) — logique de résolution écrite dans la page
  - Badge "Gelée" (`isLocked`), moyenne pondérée par coefficient (`program-modules`)
  - Distinction notes académiques/entreprise **retirée** : aucun champ de ce type n'existe sur `Grade`/`Assessment`, l'inventer aurait été trompeur

- [x] **`/etudiant/absences`** — suivi §3.3, reconnecté
  - **Décision métier : la déclaration d'absence (`POST /absences`) est réservée à l'INSTRUCTEUR du cours ou à un ADMIN/SUPER_ADMIN, pas à l'étudiant lui-même.** Côté `/etudiant`, la page est donc en **consultation seule** (historique avec statut réel) ; la déclaration se fait côté `/intervenant`/`/scolarite`. Le backend vérifie en plus que le `studentId` visé appartient bien au groupe du cours de la session (sinon 404 `student_not_in_course`).
  - Dépôt de justificatif **réel et fonctionnel** (`FILE-013`) : modale "Déposer un justificatif" (PDF/JPG/PNG, 25 Mo max) → `POST /files/upload` puis `POST /file-justifications`, lien de téléchargement une fois déposé

- [x] **`/etudiant/documents`** — dossier centralisé §3.4, reconnecté
  - `file-documents/mine` (self-service ; corrigé le 2026-07-10, appelait auparavant `file-documents/student/:id` réservé admin, cf. bug ci-dessus sur `/etudiant`) réparti en 3 sections via `document-administratives/file-document/:id` et `document-apprenticeship-contracts/file-document/:id` (déterminent si un `FileDocument` est un document officiel, un contrat, ou un document personnel)
  - Dépôt et téléchargement **réels et fonctionnels** depuis le 2026-07-12 : modal "Déposer un document" avec **sélection obligatoire d'un type** (`DocumentType`) → `POST /files/upload` puis `POST /file-documents` puis `POST /document-administratives`. Sans type, un document reste bloqué en `PENDING` à vie (`validateDocument` renvoie `file_document_has_no_doc_type` si aucun `document_administrative`/contrat n'est lié, non rattrapable depuis l'UI ensuite)
  - **Bug corrigé (2026-07-12)** : `findAdministrativeByFileDocument` et `findApprenticeshipContractByFileDocument` (`application/document/document.use-cases.ts`) étaient réservés admin (`if (!auth.isAdmin) return NotFound`), alors qu'un helper `canReadOwnFileDocument` existant dans la même classe et déjà utilisé ailleurs faisait exactement ce qu'il fallait — jamais branché sur ces deux méthodes. Conséquence concrète : **même un document correctement typé retombait toujours dans "Mes documents personnels"** pour l'étudiant (les 2 probes de classification 404 systématiquement pour un non-admin), y compris les documents de fixtures. Appliqué le même helper aux deux méthodes — aucune régression possible côté admin (`canReadOwnFileDocument` retourne `true` immédiatement si `auth.isAdmin`)

- [x] **`/etudiant/cours`** — bibliothèque de supports §3.6, construite
  - Liste des modules suivis résolue via `students/me` → `student-groups` → `groups/:id/courses` → `modules/:id`, fichiers `FileCourse` par module (`file-courses/course/:id`, nom/taille/date)
  - Téléchargement réel fonctionnel depuis le 2026-07-12. Toujours lecture seule côté dépôt (cohérent avec le rôle de l'intervenant)

- [x] **`/etudiant/evaluations`** — évaluations et rendus §3.6, construite
  - Liste des évaluations publiées de ses cours (titre, module, type continu/examen, échéance), statut calculé "Rendu"/"En retard"/"À rendre" (`file-assessments/group/:id`)
  - "Former mon groupe" **fonctionnel** quand `maxGroupSize > 1` (`POST /assessment-groups` puis `POST /assessment-group-members`)
  - **Dépôt de rendu réel et fonctionnel (2026-07-12)** : bouton "Déposer un rendu" par évaluation (visible tant que non déjà rendu et avant échéance) → `POST /files/upload` puis `POST /file-assessments`. Le backend (`submitForAssessment` dans `application/file/file.use-cases.ts`) gérait déjà toute la logique métier (appartenance au groupe, publication, échéance, limite de 5 fichiers/groupe, anti-doublon) — seul le câblage frontend manquait. Cas particulier géré : pour une évaluation individuelle (`maxGroupSize === 1`), aucun groupe n'est jamais formé explicitement par l'étudiant (le bouton "Former mon groupe" n'apparaît que si `maxGroupSize > 1`) ; le dépôt crée donc silencieusement un groupe solo (`POST /assessment-groups` avec le seul `assessmentId`, déjà supporté côté backend) juste avant l'upload si `myGroupId` est encore `null`
  - Pas d'affichage des notes ici (déjà sur `/etudiant/notes`, évite la duplication)

### 11.4 Intervenant (`/intervenant`)

- [x] **`/intervenant`** — dashboard reconnecté
  - Carte "Cours aujourd'hui", "Modules actifs", "Étudiants", "Rendus reçus" (calculé, pas "en attente de correction" : `FileAssessment` n'a pas de champ "noté", donc affiché comme un compte brut plutôt que d'inventer un statut) · liste "Cours du jour" + "Prochaines échéances" (assessments publiés à venir)

- [x] **`/intervenant/planning`** — mon planning §3.1, reconnecté (`courses/mine` → `courses/:id/sessions`, avec nom de groupe et effectif réels)
  - Non fait : détail session avec présence/absent en un clic (nécessite `/intervenant/notes`-like UI, laissé pour une prochaine itération)
  - **Bug corrigé (2026-07-12)** : même gap de lieu que `/etudiant/planning` (campus manquant) ; en plus, le lieu ne s'affichait que si la carte dépassait 90px de haut (~1h36 de cours), donc quasiment jamais visible pour une séance standard de 1h30. Seuil abaissé à 40px (même règle que côté étudiant) et lieu affiché avant le groupe/effectif

- [x] **`/intervenant/notes`** — régression corrigée, reconnectée
  - Sélecteur cours (`courses/mine`) → évaluation (`courses/:id/assessments`) → roster du groupe (`groups/:id/students`), notes résolues via `grade-assessments/assessment/:id` + `grades/:id`
  - Saisie inline (création `POST /grades` + `POST /grade-assessments`, ou `PATCH /grades/:id` si déjà notée), mention calculée, export CSV
  - Lien de navigation ajouté dans `Sidebar.tsx` (existait pour la page, mais l'entrée de menu manquait)
  - Pas de champ "commentaire" (n'existe pas sur `Grade`) ni de bouton "Geler" : `POST /grades/:id/lock` est réservé à `ADMIN`/`SUPER_ADMIN` côté backend, un intervenant ne peut pas geler lui-même (le gel se fait depuis `/scolarite/notes`)
  - **Noms d'étudiants réels affichés (2026-07-12)** : la ligne d'étudiant affiche désormais `Prénom Nom` au lieu d'un libellé générique. Ajout d'un endpoint `GET /users/:id` (`findPublicProfile` dans `auth.use-cases.ts` — ne renvoie que `id`/`firstname`/`lastname`, aucune donnée sensible), et élargissement de `StudentUseCases.findById` (`application/student/student.use-cases.ts`), auparavant réservé `ADMIN`, pour autoriser aussi l'étudiant lui-même et un intervenant enseignant un cours dont le groupe contient cet étudiant (`isInstructorOfStudent`, même pattern additif que les autres corrections d'autorisation de cette session). Le front chaîne `GET /students/:id` → `GET /users/:userId`, avec repli sur `Étudiant #{id}` en cas d'erreur. **Le même gap (libellés génériques) reste présent sur les ~15 autres pages listées en section 10 — pas encore traité, à faire au cas par cas si demandé**

- [x] **`/intervenant/supports`** — reconnecté
  - Liste réelle (`file-courses/course/:id` par cours, taille/date via `files/:id`), suppression fonctionnelle
  - Dépôt et téléchargement **réels et fonctionnels** depuis le 2026-07-12 (`FILE-016` fait) : modal "Ajouter un support" (sélection du cours + fichier → `POST /files/upload` puis `POST /file-courses`), lien de téléchargement par ligne. Les onglets/statuts publié-brouillon/compteur de téléchargements de la maquette restent retirés : `FileCourse` n'a ni statut de publication ni compteur de téléchargements

- [x] **`/intervenant/evaluations`** — création et suivi des évaluations §3.6, construite
  - Liste par cours (`courses/mine`) avec statut publié/brouillon, échéance, nombre de groupes formés et de rendus déposés (`assessment-groups/assessment/:id`, `file-assessments/assessment/:id`)
  - Création/édition (`POST`/`PATCH /assessments` avec `isPublished`) + bouton "Publier" séparé (`POST /assessments/:id/publish`) pour les brouillons déjà créés, suppression (`DELETE /assessments/:id`)
  - Détail dépliable par groupe : membres et statut de rendu (`file-assessments/group/:id`), lien direct vers `/intervenant/notes` pour noter
  - **Téléchargement réel du rendu (2026-07-12)** : chaque fichier soumis par un groupe a désormais un lien `/api/files/:id/download` direct dans le détail dépliable. Nécessitait d'élargir `FileUseCases.findById` (`application/file/file.use-cases.ts`) — auparavant, un fichier lié via `file_assessment` n'était accessible qu'à son uploadeur (l'étudiant) ou à un admin ; ajout d'une branche autorisant aussi l'intervenant du cours concerné et les autres membres du même groupe d'évaluation (même pattern additif que les autres corrections d'autorisation de cette session, ex. `file_course`)
  - **Noms d'étudiants réels dans le détail par groupe (2026-07-12)** : même bug de collision que sur `/intervenant/notes` (`Étudiant #fx_stude` identique pour tous les membres, préfixe d'ID de fixtures partagé) — corrigé avec le même chaînage `GET /students/:id` → `GET /users/:id` (déjà ouvert à l'intervenant du cours concerné, cf. `findById` dans `application/student/student.use-cases.ts`), mis en cache par `studentId` le temps de la session de page pour éviter les doublons de requêtes entre groupes

### 11.5 Administration — `ADMIN` + `SUPER_ADMIN` (`/scolarite`)

Fusionne les responsabilités "Scolarité / Pédagogique / Relations Entreprises" du cahier des charges puisque le backend n'a qu'un seul rôle `ADMIN`. Les 13 pages existent désormais — voir les limitations spécifiques à chacune ci-dessous (essentiellement : pas de nom d'utilisateur affichable, section 10, et pas de création de fichiers, section 2).

- [x] **`/scolarite`** — dashboard reconnecté
  - 3 KPI réels (absences en attente, documents manquants/expirés, contrats expirant sous 30 jours) + tableau fonctionnel des absences en attente avec Valider/Rejeter en un clic (`POST /absences/:id/validate|reject`)
  - Pas de liste "5 prochains examens/jurys" (dépend de `/scolarite/examens`, pas encore construit) ni d'onglet "dossiers incomplets"/"activité récente" (auraient nécessité les mêmes noms d'étudiants indisponibles, section 10)

- [x] **`/scolarite/etudiants`** — dossiers étudiants, construite (le lien mort du `Sidebar` pointe maintenant vers une vraie page)
  - Filtre par filière, fiche détail dépliable (groupe(s), absences en attente, documents à régulariser)
  - Noms affichés via chaînage `GET /students` → `GET /users/:userId` (2026-07-12) ; statut initial/alternant **non affiché dans la liste** (aurait demandé un aller-retour fichier/contrat par étudiant, trop coûteux pour une liste — resterait à faire dans la fiche détail individuelle)

- [x] **`/scolarite/absences`** — validation des absences §3.3, construite
  - Tableau filtrable par statut (`PENDING` par défaut), Valider/Rejeter en un clic, indicateur de justificatif déposé
  - **Lien "Vérifier" ajouté (2026-07-15)** : même gap que `/scolarite/documents` — l'indicateur "Déposé" ne donnait aucun moyen d'ouvrir le justificatif avant de valider/rejeter. Bouton "Vérifier" (`/api/files/:id/download`, nouvel onglet) ajouté dans la colonne Actions, affiché uniquement quand un justificatif existe. `GET /file-justifications/absence/:id` était déjà appelé pour savoir *si* un justificatif existait ; il fallait juste garder le `fileId` au lieu de ne retenir qu'un booléen.
  - Pas de filtre classe/période ni "motif entreprise" (nécessiteraient de résoudre classe/groupe par étudiant en plus)

- [x] **`/scolarite/documents`** — suivi documentaire global §3.4, construite
  - Tableau des `FileDocument` en attente (`Valider` → `POST /file-documents/:id/validate`, ou suppression) + section documents administratifs expirés
  - **Lien "Vérifier" ajouté (2026-07-15)** : signalé que l'admin ne pouvait valider/supprimer un document que sur la foi de son nom de fichier, sans jamais pouvoir l'ouvrir. Chaque ligne pointe désormais vers `/api/files/:id/download` (nouvel onglet) — `auth.isAdmin` a déjà accès à n'importe quel fichier côté backend (`FileUseCases.findById`), c'était un pur manque côté front. Vérifié : un fichier réellement uploadé s'ouvre (200, bon `Content-Type`) ; une ligne de fixture ancienne sans octet réel sur disque renvoie proprement `404 "Contenu du fichier introuvable dans le stockage"` (pas un bug, juste une donnée de fixture antérieure au vrai stockage).
  - Pas de "Rejeter" à proprement parler : le backend n'a que `validate`/`expire`/`delete`, pas de statut rejeté dédié (`DocumentStatus.REJECTED` existe dans l'enum mais n'est jamais assigné par aucun use case — code mort, pas un endpoint manquant côté front)

- [x] **`/scolarite/notes`** — supervision des notes, reconnectée
  - Sélecteur de filière (`GET /programs`), tableau par module (moyenne/min/max/notes saisies) construit en résolvant chaque `Grade` jusqu'à son module (même logique que `/etudiant/notes`, appliquée à `GET /grades` — toutes les notes du système)
  - "Geler ce module" / "Dégeler ce module" fonctionnels : appellent `POST /grades/:id/lock` / `POST /grades/:id/unlock` sur chaque note du module (pas d'endpoint de gel/dégel en masse côté backend) → `NOTE-001` fait
  - Section "Notations manuelles" pas encore ajoutée

- [x] **`/scolarite/planning`** — gestion des sessions §3.1, §4, construite
  - Pas de champ motif dédié pour tracer une annulation/déplacement exceptionnel (n'existe pas sur `Session` — modifier ou supprimer la session est le seul levier actuel, noté explicitement dans la page)
  - **Refonte (2026-07-12)** : l'ancienne version listait un cours à la fois dans un tableau texte brut (dates `06/07/2026 11:00`, pas de vue d'ensemble). Remplacée par la même grille calendrier hebdomadaire que `/etudiant/planning`/`/intervenant/planning`, mais avec **tous les cours/groupes affichés simultanément** (pas de sélecteur de cours global) : clic sur une session pour l'éditer, icône corbeille au survol pour la supprimer directement, `GET /sessions` (admin, liste tout le système) au lieu d'un fetch par cours. La modale "Nouvelle session" embarque désormais le sélecteur de cours (`PATCH /sessions/:id` ne permet pas de changer le cours d'une session existante, donc verrouillé en édition). Vérifié en vrai : création, édition, suppression, navigation semaine précédente/suivante, filtres présentiel/distanciel
  - **Bug corrigé (2026-07-12)** : une session de 30 min ne mesurait que 24px de haut sur la grille — insuffisant pour même afficher le nom du module sans le tronquer verticalement (padding + texte dépassaient la hauteur disponible). Même souci sur `/etudiant/planning` et `/intervenant/planning`. Corrigé sur les 3 pages : hauteur minimale de bloc (28px) + mise en page compacte sur une seule ligne (module + mode, tronqués proprement) en dessous d'un certain seuil, au lieu d'empiler plusieurs lignes qui débordaient

- [x] **`/scolarite/examens`** — sessions d'examen §3.7, construite
  - Création (session existante, type écrit/soutenance, case rattrapage, évaluation liée optionnelle), affectation étudiants/intervenants/externes avec retrait
  - Externes affichés avec leur vrai nom (seule entité du projet avec un nom qui n'est pas un `userId` caché)

- [x] **`/scolarite/formations`** — filières, blocs, modules §3.7, construite
  - Catalogue de modules globaux + liste des filières avec blocs de compétences et modules rattachés (coefficient/ECTS), rattachement/retrait

- [x] **`/scolarite/classes`** — classes et groupes §3.7, §4, construite
  - Filtre par filière, classes → groupes → étudiants affectés (affectation/retrait)
  - Sous-effectif (§4) : décrit dans la page comme un déplacement manuel puis suppression de l'ancienne classe, pas de fusion automatisée
  - **Noms d'étudiants réels affichés (2026-07-15)** : roster de groupe et modale "Affecter un étudiant" résolvaient auparavant `Étudiant #{id}` (le message "noms pas encore disponibles côté backend" était resté alors que `GET /users/:id` existait déjà) — corrigé via `lib/user-names.ts` (`buildStudentNameMap`/`formatStudentName`)

- [x] **`/scolarite/cours`** — affectation intervenant/module/groupe §3.7, construite
  - Création/édition avec sélection module + groupe + bloc + intervenant ; spécialités de l'intervenant affichées comme aide à la décision, pas de suggestion automatique
  - **Noms d'intervenants réels affichés (2026-07-15)** : tableau et select de la modale affichaient `Intervenant #{id}` — corrigé via `lib/user-names.ts` (`buildNameMap`)
  - ⚠️ **Changement de contrat `POST /courses`** : le body attend désormais `classId` (**obligatoire**) et `groupId` (**optionnel**). Si `groupId` est fourni, le backend vérifie qu'il appartient à la classe (409 `group_not_in_class` sinon) ; s'il est omis, le cours est rattaché automatiquement au groupe **General** de la classe (regles.txt l.139). Côté front, remplacer la sélection « groupe seul » par « classe (obligatoire) + groupe optionnel » ; ne plus envoyer un `groupId` sans `classId`. `PATCH /courses/:id` reste inchangé (toujours par `groupId`).

- [x] **`/scolarite/intervenants`** — construite, en lecture/édition seule
  - Liste + modification (type de contrat, spécialités) + nombre de cours affectés
  - **Pas de création** : nécessiterait un `userId` d'un compte "en attente de rôle", information que seul `SUPER_ADMIN` peut voir (`/admin/security/users`) — la création d'un profil intervenant reste le rôle de `/superadmin/gestion`
  - **Noms d'intervenants réels affichés (2026-07-12)** : même bug de collision que sur `/intervenant/notes`/`/intervenant/evaluations` (`Intervenant #fx_inst` identique pour tous, préfixe d'ID de fixtures partagé). Plus simple à corriger ici : `GET /instructors` renvoie déjà `userId` par ligne, donc résolution directe via `GET /users/:userId` sans étape intermédiaire (pas besoin d'élargir d'autorisation, `/scolarite` est déjà `ADMIN`)

- [x] **`/scolarite/entreprises`** — construite
  - Liste + création d'entreprise, détail dépliable listant les contrats existants avec alerte "expire bientôt" (± 30 jours)
  - **Création de contrat réelle et fonctionnelle (2026-07-15, `FILE-018`)** : bouton "Nouveau contrat" par entreprise → modale (étudiant, type apprentissage/professionnalisation, dates, fichier PDF) → `POST /files/upload` puis `POST /file-documents` (`{fileId, studentId}`, car `DocumentApprenticeshipContract` exige un `fileDocumentId`, pas un `fileId` brut) puis `POST /document-apprenticeship-contracts`. Étudiants résolus par nom (`lib/user-names.ts`, même pattern que `USR-106`)

- [x] **`/scolarite/campus`** — construite : campus + salles, création des deux, capacité affichée

- [x] **`/scolarite/externes`** — construite : liste + création/édition (nom, email, type jury/surveillant/autre), utilisés dans `/scolarite/examens`

- [x] **`/scolarite/annee-academique`** — construite : années académiques + périodes, action "Définir comme actuelle" (dé-sélectionne les autres années côté client puisque le backend ne l'impose pas lui-même)

### 11.6 Super Administrateur uniquement (`/superadmin`)

- [x] **`/superadmin`** — dashboard reconnecté
  - 3 KPI réels (comptes en attente de rôle, verrouillés, mots de passe expirés) + 8 derniers événements `GET /audit-logs` (nom d'utilisateur non affiché, gap section 10 — affiche l'action et l'entité) — ⚠️ liste vide tant que `AUD-*` n'est pas fait (rien n'écrit dans `audit_log`)

- [x] **`/superadmin/gestion`** — **point critique fait** : attribution de rôle fonctionnelle
  - Le rôle de chaque compte est déterminé en croisant `GET /admin/security/users` avec `GET /students`/`/instructors`/`/admins` (par `userId`) puisque le backend ne l'expose pas directement
  - Modal "Attribuer un rôle" sur un compte en attente : Étudiant (+ filière), Intervenant (+ type de contrat), Admin (+ `ADMIN`/`SUPER_ADMIN`) → `POST /students`, `/instructors`, `/admins`
  - Sur un compte admin existant : changer son niveau (`PATCH /admins/:id`) ou le retirer (`DELETE /admins/:id`, ne supprime pas le compte `user`)

- [x] **`/superadmin/securite`** — audit et traçabilité §3.8, construite et alimentée (2026-07-15, cf. section 10)
  - Tableau paginé côté client (20/page) de `GET /audit-logs` (pas de pagination serveur) : date, utilisateur (nom résolu depuis 2026-07-15), action (badge coloré par type), entité + id tronqué
  - Filtres client : utilisateur (id), entité (nom), action, plage de dates (du/au) — combinables, bouton réinitialiser
  - Ligne dépliable : diff simplifié avant/après (`oldValue`/`newValue` en JSON brut, pas de diff champ-par-champ)
  - Consultation seule, aucune action d'écriture

### 11.7 Points d'architecture transverses à traiter en même temps que les pages

- [x] Client API centralisé (`lib/api.ts`) : `api.get/post/patch/delete` normalisent les erreurs (`ApiError`) et redirigent vers `/login` sur 401. Le header `Authorization` n'a plus besoin d'être posé par les pages : le cookie httpOnly suffit, le middleware l'attache lui-même en le relayant vers le backend. **Utilisé par toutes les pages reconnectées de la section 11** (auth mise à part, qui passe par ses propres route handlers). Depuis le 2026-07-12 : `api.upload(path, file)` (multipart `FormData`, pas de `Content-Type` manuel) pour `POST /files/upload` ; le téléchargement se fait par lien direct `<a href="/api/files/:id/download">` (cookie httpOnly transmis automatiquement, pas besoin de passer par le client JS)
- [x] Garde de route par rôle — cookie `httpOnly` (`myges_token`) posé par `app/api/auth/login/route.ts` et `app/api/auth/login/2fa/route.ts`, vérifié par `middleware.ts` via `lib/auth.ts` (`jose`, vérification de signature, pas juste un décodage) ; déconnexion via `POST /api/auth/logout` (`Sidebar.tsx`)
  - [ ] À vérifier avant déploiement prod : `JWT_SECRET` doit être accessible au pod frontend k8s (les deux `InfisicalSecret` CRD `backend`/`frontend` pointent déjà sur le même `secretsPath: "/"`, donc a priori déjà synchronisé — à confirmer dans Infisical)
- [~] Composants mutualisés — `components/ui/status-badge.tsx` (`StatusBadge`, tons vert/rouge/orange/bleu/violet/gris), `components/ui/confirm-dialog.tsx` (`ConfirmDialog`), `components/ui/toast.tsx` (`ToastProvider`/`useToast`, monté dans `(app)/layout.tsx`)
  - `ConfirmDialog` + toast branchés sur toutes les suppressions réelles d'entité : `intervenant/evaluations` (assessment), `intervenant/supports` (support), `parametres` (compte, remplace l'ancienne modale ad hoc), `superadmin/gestion` (retrait du rôle admin), `scolarite/documents` (document), `scolarite/planning` (session)
  - Simple toast (sans confirmation) sur les retraits de relation réversibles (`scolarite/classes`, `scolarite/examens`, `scolarite/formations`) — retirer un étudiant d'un groupe/une affectation n'est pas jugé assez destructeur pour justifier une modale
  - `StatusBadge` déployé sur toutes les pages qui avaient un `statusConfig`/badge de statut dupliqué : `etudiant/absences`, `etudiant/documents`, `etudiant/evaluations`, `scolarite/absences`, `scolarite/documents`, `intervenant/evaluations`, `superadmin/securite`
  - [ ] Reste à faire : table triable/filtrable générique, dropzone d'upload de fichier, switch/toggle générique — pas encore extraits
- [x] **Bug corrigé** : `Sidebar.tsx` et `TopBar.tsx` déduisaient le rôle affiché (menu de navigation + badge) uniquement du préfixe d'URL (`/etudiant`, `/scolarite`...). Sur les pages communes sans préfixe (`/parametres`, `/messagerie`), ça retombait systématiquement sur le menu "étudiant" par défaut, quel que soit le rôle réel de l'utilisateur connecté. Corrigé via `lib/use-current-user.ts` (hook partagé `GET /users/me`) : le chemin reste utilisé comme raccourci rapide sur les pages préfixées, le vrai rôle de l'utilisateur prend le relais sur les pages communes

### Ordre de construction conseillé (frontend)

1. ~~Client API + garde de route (base commune)~~ ✅ fait — `lib/api.ts`, `lib/auth.ts`, `middleware.ts`, `app/api/auth/{login,login/2fa,logout}`
2. ~~Reconnecter les pages `[~]` existantes~~ ✅ fait — les 13 pages (dashboards ×4, planning ×2, notes ×2, absences, documents, supports, messagerie, paramètres) sont branchées sur le vrai backend. `/superadmin/gestion` inclut déjà l'attribution de rôle (initialement prévue à l'étape 6)
3. ~~`/intervenant/notes` (régression à corriger, fonctionnalité cœur du métier)~~ ✅ fait — au passage, `Sidebar.tsx` affichait un nom/rôle **en dur** ("Lucas Martin", "Sophie Bernard"...) au lieu de l'utilisateur réellement connecté (`GET /users/me`) : corrigé en même temps, avec l'entrée de menu manquante
4. ~~Zone Administration (`/scolarite/*`)~~ ✅ fait — les 13 pages (année académique, campus, formations, classes, intervenants, cours, planning, étudiants, absences, documents, entreprises, externes, examens) sont construites. `Sidebar.tsx` mis à jour avec les 13 entrées de menu correspondantes
5. ~~`/etudiant/cours` + `/etudiant/evaluations` + `/intervenant/evaluations` (boucle supports/rendus complète)~~ ✅ fait — `Sidebar.tsx`/`TopBar.tsx` mis à jour avec les 3 entrées de menu/titres correspondants
6. ~~`/superadmin/securite` (audit-log détaillé, filtres)~~ ✅ fait
7. ~~`/forgot-password` + `/2fa/setup`~~ ✅ fait
8. ~~Composants à mutualiser (modal de confirmation, toast, badge de statut)~~ ✅ fait — `StatusBadge`/`ConfirmDialog`/`useToast`, déployés sur les suppressions d'entité et les badges de statut dupliqués (détail section 11.7). Table générique et dropzone d'upload restent à faire

---

## 12. Hors périmètre / à trancher (hérité de WORKFLOW.md, toujours d'actualité)

Constats qui ne correspondent à aucune exigence des documents source — chacun nécessite une décision d'équipe explicite avant d'entrer au périmètre :

- **Recherche globale** — la barre "Rechercher..." de `TopBar.tsx` n'avait aucune portée fonctionnelle définie (cible : étudiants ? cours ? documents ?) → retirée le 2026-07-12 (`UI-001` fait). À réintroduire uniquement si une portée précise est définie.
- **Internationalisation (i18n)** — aucune exigence multilingue dans les documents ; aucune infrastructure de traduction. À ignorer sauf décision contraire.
- **Rate limiting réseau/IP** — non demandé par les documents (seul le blocage par compte l'est, et il est fait) ; recommandé néanmoins par l'audit → `SEC-103`.
- **Confirmation SMS (Twilio)** — alternative au TOTP citée par le Sujet, non requise puisqu'un moyen de 2FA suffit.
- **WebRTC** — aucun besoin métier (pas de visio au cahier des charges).
- **Distinction notes académiques / appréciations entreprise** (cahier §3.2) — écartée volontairement (aucun champ sur `Grade`/`Assessment`, l'inventer aurait été trompeur) ; à assumer à l'oral ou à modéliser un jour.
- **Changement de statut initial ↔ alternance** (cahier §4) — non modélisé : le statut se déduit de l'existence d'un contrat d'alternance ; le "changement" = créer/clore un contrat. À documenter pour la soutenance.
