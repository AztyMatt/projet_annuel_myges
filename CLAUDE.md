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

À remettre à jour au fil de l'avancement plutôt que de le laisser devenir obsolète. Dernière synchronisation avec le code : **2026-07-10** (audit complet, branche `develop`, commit `b04b18f`).

## Règles de travail (héritées de WORKFLOW.md, toujours en vigueur)

1. Jamais plusieurs fonctionnalités en parallèle : une fonctionnalité = une session de travail = un scope fermé.
2. Avant de commencer, relire ce fichier (et la section correspondante de `PROJECT_AUDIT_AND_ROADMAP.md`) ; demander confirmation de la fonctionnalité à traiter si elle n'a pas été précisée.
3. Ne jamais ajouter une fonctionnalité non listée sans le signaler explicitement et attendre validation.
4. Avancer par petites étapes vérifiables, pas par gros blocs livrés d'un coup.
5. Une fois une fonctionnalité terminée : mettre à jour son statut ici et cocher les tâches correspondantes dans `PROJECT_AUDIT_AND_ROADMAP.md`, renseigner les fichiers clés, proposer un message de commit clair (branche `feature/…` si le scope est isolé).
6. Ne jamais pousser sur Git sans validation explicite.
7. En cas de blocage ou d'ambiguïté du cahier des charges, l'écrire dans la sous-puce de la fonctionnalité concernée plutôt que de deviner.

## Bugs connus à corriger en priorité (détail et IDs dans `PROJECT_AUDIT_AND_ROADMAP.md` §9.0)

- [ ] **Suppression de compte RGPD cassée** — le front appelle `DELETE /users/me` (`parametres/page.tsx`) mais le backend n'expose plus que `DELETE /users/:id` réservé `SUPER_ADMIN` (régression du refactor `e91555b`) → `DEL-001…005`
- [ ] **CronJob 2FA en 404** — `k8s/backend/cleanup-cronjob.yml` appelle l'URL sans le préfixe `/api` (les routeurs sont montés sous `/api`, `app.ts:65`) → `K8S-001`
- [ ] **Journal d'audit jamais alimenté** — l'API `GET /audit-logs` et les pages `/superadmin/*` existent mais aucun code n'écrit dans la table `audit_log` → `AUD-001…010`
- [ ] Dépôt git imbriqué `infrastructure/frontend/next/.git` à supprimer (les fichiers sont bien suivis par le dépôt parent) → `TECH-001`
- [ ] Barre de recherche décorative dans `TopBar.tsx` (placeholder sans action) → `UI-001`

## Stack (rappel, voir `README.md` pour le détail)

Next.js (frontend) · Express.js (backend) · PostgreSQL + Drizzle (ORM) · Docker Compose (dev) / Kubernetes (prod) · Traefik (prod) / Nginx (dev) · Infisical (secrets) · GHCR (registre Docker).

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
  - [ ] Purge des sessions 2FA expirées **en échec silencieux** : le CronJob k8s appelle l'URL sans `/api` → 404 chaque nuit → `K8S-001`
- [ ] Confirmation par SMS (Twilio) en alternative au TOTP — non implémenté (non bloquant : un seul moyen de 2FA suffit)
- [ ] OIDC/OAuth2 (Google, Facebook...) — non implémenté. `cahierDesCharges.md` §5.1 le marque explicitement **"(optionnel)"** → à confirmer à l'oral si un seul mode d'authentification (email/mdp) suffit pour la partie "Authentification Avancée" du sujet
- [ ] Lien magique — non implémenté (idem, marqué optionnel dans le cahier des charges interne)
- [x] Hachage sécurisé des mots de passe — Argon2 (`password-hasher.adapter.ts`)
- [x] Gestion des secrets via variables d'environnement — Infisical (CLI en dev, opérateur Kubernetes en prod)
- [~] Séparation stricte des rôles — depuis le refactor `e91555b`, plus de middleware `requireRole` : l'autorisation se fait par **capacités** (`domain/auth/authorization-policy.ts` → `capabilitiesForRole` → `AuthContext` passé aux use cases, qui retournent `Forbidden`). Le HTTP ne fait que l'authentification (`authed()` dans `auth/middleware.ts`)
  - [ ] Revue systématique des autorisations post-refactor (une régression avérée : suppression de compte, voir bugs connus) → `SEC-101`
- [~] Conformité RGPD/CNIL
  - [x] Consentement RGPD stocké à l'inscription (`gdprConsentAt`)
  - [x] Export des données personnelles — `GET /gdpr/export`
  - [ ] Suppression de compte — **cassée** : le front appelle `DELETE /users/me` mais seul `DELETE /users/:id` existe, réservé `SUPER_ADMIN` (`auth.use-cases.ts` `deleteAccount`) → `DEL-001…005`
  - [ ] Pages légales (CGU/CGV/politique de cookies) — bonus, voir section 9
- [x] **Garde des routes front par rôle** — le token est désormais un cookie `httpOnly` posé par `app/api/auth/login/route.ts` / `login/2fa/route.ts` (jamais exposé au JS) ; `middleware.ts` vérifie sa signature (`jose`) et bloque/redirige avant le rendu de toute page sous `/etudiant`, `/intervenant`, `/scolarite`, `/superadmin`, `/parametres`, `/messagerie` si absent ou si le rôle ne correspond pas

## 2. Infrastructure (obligatoire — `cahierDesCharges.md` §6, `Sujet.pdf` "Infrastructure")

- [x] Conteneurs Docker — `docker-compose.yml` (dev), Dockerfiles multi-stage (`docker/backend`, `docker/frontend`)
- [ ] Serveur VPS — non vérifiable depuis le repo (dépend de l'hébergement réel) → à confirmer avec l'équipe
- [x] Serveur Web — Next.js (frontend) + Express (backend)
- [ ] WebSocket (notifications temps réel) — requis par `cahierDesCharges.md` §3.1/§3.5 ("Notifications automatiques", "Notifications en temps réel") — **aucune implémentation trouvée**, ni côté backend ni côté front
- [ ] WebRTC — non mentionné dans `cahierDesCharges.md` (uniquement une option générique du sujet type), aucun besoin métier identifié (pas de visio dans le projet) → à ignorer sauf décision contraire de l'équipe
- [x] Registre Docker — GHCR (`ghcr.io/<owner>/<repo>-<service>`), push automatique en CI/CD sur `main`
- [x] Clients Web — Next.js
- [ ] Pare-feu avec protection des ports non utilisés — **aucune trace dans le repo** (à mettre en place sur le VPS : `ufw`/`iptables`, ou `NetworkPolicy` k8s), non versionné actuellement
- [~] Nom de domaine public + certificat SSL valide
  - [x] `IngressRoute` Traefik en HTTPS configuré (`secretName: myges-tls`) avec redirection HTTP → HTTPS
  - [ ] **Aucun `Issuer`/`ClusterIssuer` cert-manager trouvé dans `k8s/`** → vérifier comment le secret `myges-tls` est réellement généré et renouvelé (Let's Encrypt via cert-manager ? génération manuelle ?)
- [x] Pas de solution clé en main (Vercel/CloudFront) — auto-hébergé sur Kubernetes, conforme
- [~] Ingress Controller — le cahier des charges interne mentionne "Nginx" mais l'implémentation réelle utilise **Traefik** (choix différent mais valide techniquement) → documenter/justifier ce choix si demandé à l'oral
- [x] Au moins 2 réplicas par service (hors base de données) — backend : 2, frontend : 3, postgres : 1 (normal pour une base de données)
- [x] PostgreSQL avec volumes persistants — PVC 5Gi (`k8s/postgres/pvc.yml`)
- [ ] **Stockage réel des fichiers uploadés** (justificatifs, documents administratifs, supports de cours, rendus d'évaluation, contrats) — le module `file` ne stocke que des **métadonnées** (`storagePath`, `mimeType`, `sizeBytes`...) ; **aucun upload multipart, aucun volume/bucket dédié** dans `docker-compose.yml` ni dans `k8s/`. Un port `StorageService` existe (`application/file/storage.service.ts`) mais son adaptateur est un **stub no-op** (`src/storage/storage.adapter.ts` : `delete()` au corps vide). Bloquant pour toutes les pages de dépôt de fichiers listées en section 11 → `FILE-001…024`

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

- [ ] Tests unitaires — **aucun test trouvé dans le repo**, aucune dépendance de test installée (pas de vitest/jest dans `package.json`)
- [ ] Tests fonctionnels (API) — aucun
- [ ] Tests d'interface (E2E) — aucun (pas de Playwright/Cypress)
- [ ] Intégration dans la CI — `ci.yml` ne fait que builder les images Docker, **aucune étape de test ni de lint n'est exécutée**

## 6. Observabilité

- [ ] État de santé des conteneurs (Uptime Kuma / Prometheus / Grafana) — aucun déployé
- [ ] Signalement des erreurs (Sentry / GlitchTip) — aucun intégré
- [ ] Analytique respectueuse du RGPD (Matomo / Plausible) — aucun intégré
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
- [x] Endpoint de dégel des notes — `POST /grades/:id/unlock` existe désormais (`grade/routes.ts`) ; **reste à exposer côté front** sur `/scolarite/notes` → `NOTE-001`
- [ ] Rétablir l'auto-suppression de compte (`DELETE /users/me` ou équivalent, sans exiger `SUPER_ADMIN`) → `DEL-002/003`
- [ ] **Écriture des journaux d'audit** — la table, l'API de lecture et les pages existent, mais aucun use case n'écrit jamais d'entrée : brancher un `audit-recorder` sur les actions sensibles (login, notes lock/unlock, absences validate/reject, documents, attributions de rôle) → `AUD-001…010`
- [ ] Upload réel de fichiers (multipart + stockage disque/S3), au-delà de la simple création de métadonnées `POST /files` → `FILE-*`
- [ ] Mécanisme de notifications temps réel (WebSocket) pour planning/notes/documents → `NOTIF-*`
- [ ] Endpoint agrégé `GET /conversations/mine` (la messagerie reconstruit tout côté client en N appels) → `API-001`
- [ ] Permettre à un `ADMIN` simple de retrouver son `adminId` (`GET /admins/me` ou ouverture de `GET /admins/user/:userId` à l'intéressé) — débloque la messagerie ciblée pour les admins → `API-002`
- [ ] Un moyen de lister les comptes en attente d'attribution de rôle (`pending_role_assignment`) — aujourd'hui `GET /admin/security/users` retourne tous les comptes mais ne distingue pas explicitement "sans rôle" des autres
- [ ] **Résolution nom/prénom à partir d'un `userId`** — vérifié dans le code (`student.adapter.ts`, `instructor.adapter.ts`, `course.use-cases.ts`, `message.use-cases.ts`) : `GET /students`, `/students/:id`, `/instructors/:id`, `/courses/*`, les messages, etc. ne renvoient que des IDs bruts, jamais de nom joint. Seuls `/users/me`, `/students/me`, `/instructors/me` (soi-même) et `/admin/security/users` (`SUPER_ADMIN` uniquement, tous les comptes) exposent un nom. Bloque l'affichage de "qui" sur `/messagerie`, les dashboards (nom de l'intervenant), `/scolarite/etudiants`, la gestion des intervenants, etc. — à corriger en joignant `firstname`/`lastname` dans les réponses `students`/`instructors`/`courses` concernées, ou via un endpoint restreint `GET /users/:id` (nom uniquement, pas de données sensibles). **Décision d'équipe : en attendant, le front affiche des libellés génériques ("Intervenant", "Administration") ou l'ID plutôt que de bloquer les pages.**

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
  - Liste des conversations reconstruite côté client (pas d'endpoint agrégé) : classe (étudiant → groupe → classe → `conversationId`), cours (groupe → cours → `conversationId`), privées (`conversation-private`)
  - Fil de messages, envoi (`POST /messages`), marquage lu best-effort (`POST /message-reads`)
  - "Nouvelle conversation" (ADMIN/SUPER_ADMIN) fonctionnelle mais dégradée : pas de nom d'étudiant à afficher (gap section 10), sélection par ID tronqué
  - **Limitation connue** : `ADMIN` (non `SUPER_ADMIN`) ne peut pas utiliser la messagerie ciblée — `GET /admins/user/:userId` est réservé à `SUPER_ADMIN`, un simple admin ne peut donc pas retrouver son propre `adminId`. Affiché comme "fonctionnalité limitée pour votre rôle" plutôt que planté

- [ ] Notifications temps réel (bandeau/cloche globale, pas une page à part) — dépend du WebSocket backend (section 10), requis par §3.1/§3.5

### 11.3 Étudiant (`/etudiant`)

- [x] **`/etudiant`** — dashboard reconnecté
  - Carte "Prochain cours" (calcul du plus proche créneau futur), carte "Absences en attente", carte "Documents à régulariser", carte "Nouvelles notes" · listes "Prochain cours" et "Dernières notes" détaillées
  - Pas d'ECTS/graphique de progression (aucune notion de validation d'ECTS dans le backend, aurait été inventé)

- [x] **`/etudiant/planning`** — emploi du temps §3.1, reconnecté
  - Chaîne réelle : `students/me` → `student-groups` → `groups/:id/courses` → `courses/:id/sessions`, grille semaine avec navigation
  - Seuls deux modes existent réellement côté backend (`ON_SITE`/`REMOTE`) — pas de mode "entreprise" dédié dans `SessionMode`, retiré du filtre/légende (une journée entreprise = simplement l'absence de session)

- [x] **`/etudiant/notes`** — notes et moyennes §3.2, reconnecté
  - Chaque note (`Grade`) n'est liée à un module qu'indirectement (`grade-assessment` / `grade-session-exam` / `grade-manual-notation` → remonter jusqu'au module) — logique de résolution écrite dans la page
  - Badge "Gelée" (`isLocked`), moyenne pondérée par coefficient (`program-modules`)
  - Distinction notes académiques/entreprise **retirée** : aucun champ de ce type n'existe sur `Grade`/`Assessment`, l'inventer aurait été trompeur

- [x] **`/etudiant/absences`** — déclaration + suivi §3.3, reconnecté
  - Déclaration (session + motif) fonctionnelle → `POST /absences` · historique avec statut réel
  - Dépôt de justificatif **désactivé avec message explicite** : dépend de l'upload réel de fichiers (section 2/10), pas encore implémenté

- [x] **`/etudiant/documents`** — dossier centralisé §3.4, reconnecté
  - `file-documents/student/:id` réparti en 3 sections via `document-administratives/file-document/:id` et `document-apprenticeship-contracts/file-document/:id` (déterminent si un `FileDocument` est un document officiel, un contrat, ou un document personnel)
  - Dépôt/téléchargement **désactivés avec message explicite** : même gap upload/stockage réel

- [x] **`/etudiant/cours`** — bibliothèque de supports §3.6, construite
  - Liste des modules suivis résolue via `students/me` → `student-groups` → `groups/:id/courses` → `modules/:id`, fichiers `FileCourse` par module (`file-courses/course/:id`, nom/taille/date)
  - Lecture seule (pas de dépôt, ni de téléchargement réel) : cohérent avec le rôle de l'intervenant côté dépôt, et bloqué par le même gap d'upload/stockage réel (section 2/10) pour le téléchargement

- [x] **`/etudiant/evaluations`** — évaluations et rendus §3.6, construite
  - Liste des évaluations publiées de ses cours (titre, module, type continu/examen, échéance), statut calculé "Rendu"/"En retard"/"À rendre" (`file-assessments/group/:id`)
  - "Former mon groupe" **fonctionnel** quand `maxGroupSize > 1` (`POST /assessment-groups` puis `POST /assessment-group-members`)
  - Dépôt de fichier **désactivé avec message explicite** : bloqué par le gap d'upload réel (section 2/10), `POST /file-assessments` exige un `fileId` déjà existant
  - Pas d'affichage des notes ici (déjà sur `/etudiant/notes`, évite la duplication)

### 11.4 Intervenant (`/intervenant`)

- [x] **`/intervenant`** — dashboard reconnecté
  - Carte "Cours aujourd'hui", "Modules actifs", "Étudiants", "Rendus reçus" (calculé, pas "en attente de correction" : `FileAssessment` n'a pas de champ "noté", donc affiché comme un compte brut plutôt que d'inventer un statut) · liste "Cours du jour" + "Prochaines échéances" (assessments publiés à venir)

- [x] **`/intervenant/planning`** — mon planning §3.1, reconnecté (`courses/mine` → `courses/:id/sessions`, avec nom de groupe et effectif réels)
  - Non fait : détail session avec présence/absent en un clic (nécessite `/intervenant/notes`-like UI, laissé pour une prochaine itération)

- [x] **`/intervenant/notes`** — régression corrigée, reconnectée
  - Sélecteur cours (`courses/mine`) → évaluation (`courses/:id/assessments`) → roster du groupe (`groups/:id/students`), notes résolues via `grade-assessments/assessment/:id` + `grades/:id`
  - Saisie inline (création `POST /grades` + `POST /grade-assessments`, ou `PATCH /grades/:id` si déjà notée), mention calculée, export CSV
  - Lien de navigation ajouté dans `Sidebar.tsx` (existait pour la page, mais l'entrée de menu manquait)
  - Pas de champ "commentaire" (n'existe pas sur `Grade`) ni de bouton "Geler" : `POST /grades/:id/lock` est réservé à `ADMIN`/`SUPER_ADMIN` côté backend, un intervenant ne peut pas geler lui-même (le gel se fait depuis `/scolarite/notes`)

- [x] **`/intervenant/supports`** — reconnecté
  - Liste réelle (`file-courses/course/:id` par cours, taille/date via `files/:id`), suppression fonctionnelle
  - Dépôt de nouveau fichier **retiré avec message explicite** (même gap upload réel) ; les onglets/statuts publié-brouillon/compteur de téléchargements de la maquette retirés : `FileCourse` n'a ni statut de publication ni compteur de téléchargements

- [x] **`/intervenant/evaluations`** — création et suivi des évaluations §3.6, construite
  - Liste par cours (`courses/mine`) avec statut publié/brouillon, échéance, nombre de groupes formés et de rendus déposés (`assessment-groups/assessment/:id`, `file-assessments/assessment/:id`)
  - Création/édition (`POST`/`PATCH /assessments` avec `isPublished`) + bouton "Publier" séparé (`POST /assessments/:id/publish`) pour les brouillons déjà créés, suppression (`DELETE /assessments/:id`)
  - Détail dépliable par groupe : membres (libellés génériques, gap section 10) et statut de rendu (`file-assessments/group/:id`), lien direct vers `/intervenant/notes` pour noter
  - Pas de lien de téléchargement du rendu : bloqué par le gap d'upload/stockage réel (section 2/10), aucun fichier réel n'est actuellement soumis

### 11.5 Administration — `ADMIN` + `SUPER_ADMIN` (`/scolarite`)

Fusionne les responsabilités "Scolarité / Pédagogique / Relations Entreprises" du cahier des charges puisque le backend n'a qu'un seul rôle `ADMIN`. Les 13 pages existent désormais — voir les limitations spécifiques à chacune ci-dessous (essentiellement : pas de nom d'utilisateur affichable, section 10, et pas de création de fichiers, section 2).

- [x] **`/scolarite`** — dashboard reconnecté
  - 3 KPI réels (absences en attente, documents manquants/expirés, contrats expirant sous 30 jours) + tableau fonctionnel des absences en attente avec Valider/Rejeter en un clic (`POST /absences/:id/validate|reject`)
  - Pas de liste "5 prochains examens/jurys" (dépend de `/scolarite/examens`, pas encore construit) ni d'onglet "dossiers incomplets"/"activité récente" (auraient nécessité les mêmes noms d'étudiants indisponibles, section 10)

- [x] **`/scolarite/etudiants`** — dossiers étudiants, construite (le lien mort du `Sidebar` pointe maintenant vers une vraie page)
  - Filtre par filière, fiche détail dépliable (groupe(s), absences en attente, documents à régulariser)
  - Sans nom d'étudiant (gap section 10) ; statut initial/alternant **non affiché dans la liste** (aurait demandé un aller-retour fichier/contrat par étudiant, trop coûteux pour une liste — resterait à faire dans la fiche détail individuelle)

- [x] **`/scolarite/absences`** — validation des absences §3.3, construite
  - Tableau filtrable par statut (`PENDING` par défaut), Valider/Rejeter en un clic, indicateur de justificatif déposé
  - Pas de filtre classe/période ni "motif entreprise" (nécessiteraient de résoudre classe/groupe par étudiant en plus)

- [x] **`/scolarite/documents`** — suivi documentaire global §3.4, construite
  - Tableau des `FileDocument` en attente (`Valider` → `POST /file-documents/:id/validate`, ou suppression) + section documents administratifs expirés
  - Pas de "Rejeter" à proprement parler : le backend n'a que `validate`/`expire`/`delete`, pas de statut rejeté dédié

- [x] **`/scolarite/notes`** — supervision des notes, reconnectée
  - Sélecteur de filière (`GET /programs`), tableau par module (moyenne/min/max/notes saisies) construit en résolvant chaque `Grade` jusqu'à son module (même logique que `/etudiant/notes`, appliquée à `GET /grades` — toutes les notes du système)
  - "Geler ce module" fonctionnel : appelle `POST /grades/:id/lock` sur chaque note du module (pas d'endpoint de gel en masse côté backend)
  - [ ] "Dégeler" : l'endpoint `POST /grades/:id/unlock` **existe désormais côté backend** mais n'est pas exposé dans la page → `NOTE-001`
  - Section "Notations manuelles" pas encore ajoutée

- [x] **`/scolarite/planning`** — gestion des sessions §3.1, §4, construite
  - Sélection d'un cours → liste/création/édition/suppression de ses sessions (date, heure, mode, salle)
  - Pas de champ motif dédié pour tracer une annulation/déplacement exceptionnel (n'existe pas sur `Session` — modifier ou supprimer la session est le seul levier actuel, noté explicitement dans la page)

- [x] **`/scolarite/examens`** — sessions d'examen §3.7, construite
  - Création (session existante, type écrit/soutenance, case rattrapage, évaluation liée optionnelle), affectation étudiants/intervenants/externes avec retrait
  - Externes affichés avec leur vrai nom (seule entité du projet avec un nom qui n'est pas un `userId` caché)

- [x] **`/scolarite/formations`** — filières, blocs, modules §3.7, construite
  - Catalogue de modules globaux + liste des filières avec blocs de compétences et modules rattachés (coefficient/ECTS), rattachement/retrait

- [x] **`/scolarite/classes`** — classes et groupes §3.7, §4, construite
  - Filtre par filière, classes → groupes → étudiants affectés (affectation/retrait)
  - Sous-effectif (§4) : décrit dans la page comme un déplacement manuel puis suppression de l'ancienne classe, pas de fusion automatisée

- [x] **`/scolarite/cours`** — affectation intervenant/module/groupe §3.7, construite
  - Création/édition avec sélection module + groupe + bloc + intervenant ; spécialités de l'intervenant affichées comme aide à la décision, pas de suggestion automatique

- [x] **`/scolarite/intervenants`** — construite, en lecture/édition seule
  - Liste + modification (type de contrat, spécialités) + nombre de cours affectés
  - **Pas de création** : nécessiterait un `userId` d'un compte "en attente de rôle", information que seul `SUPER_ADMIN` peut voir (`/admin/security/users`) — la création d'un profil intervenant reste le rôle de `/superadmin/gestion`

- [x] **`/scolarite/entreprises`** — construite
  - Liste + création d'entreprise, détail dépliable listant les contrats existants avec alerte "expire bientôt" (± 30 jours)
  - **Pas de création de contrat** : `DocumentApprenticeshipContract` exige un `fileDocumentId` déjà existant, donc un fichier déjà uploadé — bloqué par le même gap d'upload réel (section 2/10)

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

- [x] **`/superadmin/securite`** — audit et traçabilité §3.8, construite — ⚠️ **affiche une liste vide en permanence** tant que l'écriture des audit-logs n'est pas branchée (section 10, `AUD-*`) : rien n'alimente la table `audit_log` aujourd'hui
  - Tableau paginé côté client (20/page) de `GET /audit-logs` (pas de pagination serveur) : date, utilisateur (libellé générique, gap section 10), action (badge coloré par type), entité + id tronqué
  - Filtres client : utilisateur (id), entité (nom), action, plage de dates (du/au) — combinables, bouton réinitialiser
  - Ligne dépliable : diff simplifié avant/après (`oldValue`/`newValue` en JSON brut, pas de diff champ-par-champ)
  - Consultation seule, aucune action d'écriture

### 11.7 Points d'architecture transverses à traiter en même temps que les pages

- [x] Client API centralisé (`lib/api.ts`) : `api.get/post/patch/delete` normalisent les erreurs (`ApiError`) et redirigent vers `/login` sur 401. Le header `Authorization` n'a plus besoin d'être posé par les pages : le cookie httpOnly suffit, le middleware l'attache lui-même en le relayant vers le backend. **Utilisé par toutes les pages reconnectées de la section 11** (auth mise à part, qui passe par ses propres route handlers)
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

- **Recherche globale** — la barre "Rechercher..." de `TopBar.tsx` n'a aucune portée fonctionnelle définie (cible : étudiants ? cours ? documents ?). En attendant : la retirer (`UI-001`).
- **Internationalisation (i18n)** — aucune exigence multilingue dans les documents ; aucune infrastructure de traduction. À ignorer sauf décision contraire.
- **Rate limiting réseau/IP** — non demandé par les documents (seul le blocage par compte l'est, et il est fait) ; recommandé néanmoins par l'audit → `SEC-103`.
- **Confirmation SMS (Twilio)** — alternative au TOTP citée par le Sujet, non requise puisqu'un moyen de 2FA suffit.
- **WebRTC** — aucun besoin métier (pas de visio au cahier des charges).
- **Distinction notes académiques / appréciations entreprise** (cahier §3.2) — écartée volontairement (aucun champ sur `Grade`/`Assessment`, l'inventer aurait été trompeur) ; à assumer à l'oral ou à modéliser un jour.
- **Changement de statut initial ↔ alternance** (cahier §4) — non modélisé : le statut se déduit de l'existence d'un contrat d'alternance ; le "changement" = créer/clore un contrat. À documenter pour la soutenance.
