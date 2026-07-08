# MyGES 2.0 — Suivi Projet Annuel

Ce fichier centralise l'état d'avancement du projet par rapport aux deux référentiels :
- `Sujet.pdf` — grille de notation générique du Projet Annuel (fournie par l'école)
- `cahierDesCharges.md` — spécification propre à MyGES 2.0 rédigée par l'équipe

Il a été construit en confrontant ces deux documents au **code réel** (backend `infrastructure/backend/express` + `domain`/`application`, frontend `infrastructure/frontend/next`, `docker-compose.yml`, `k8s/`, `.github/workflows/`), pas seulement à ce qui est écrit dans les specs. Légende :

- `[x]` fait et vérifié dans le code
- `[~]` partiellement fait (précisé dans la sous-puce)
- `[ ]` pas fait / pas trouvé dans le repo

À remettre à jour au fil de l'avancement plutôt que de le laisser devenir obsolète.

## Stack (rappel, voir `README.md` pour le détail)

Next.js (frontend) · Express.js (backend) · PostgreSQL + Drizzle (ORM) · Docker Compose (dev) / Kubernetes (prod) · Traefik (prod) / Nginx (dev) · Infisical (secrets) · GHCR (registre Docker).

---

## 1. Sécurité (obligatoire — `cahierDesCharges.md` §5, `Sujet.pdf` "Sécurité")

- [x] Inscription — `POST /auth/signup`, front `/signup` branché
- [x] Connexion — `POST /auth/login` (+ étape 2FA `POST /auth/login/2fa`), front `/login` branché
- [ ] **Mot de passe oublié** (vrai flux par email, sans connaître l'ancien mot de passe) — **aucun endpoint backend, aucune page front**
  - [ ] Backend : générer un token à usage unique + expiration, endpoint d'envoi d'email, endpoint de confirmation
  - [ ] Front : page `/forgot-password` (saisie email) + page de confirmation (`/reset-password?token=...`)
- [~] Réinitialisation de mot de passe — existe uniquement en mode "renouvellement forcé tous les 60 jours" (`POST /auth/password/reset-with-credentials`, nécessite email + ancien mdp + nouveau mdp)
  - [ ] Ce n'est pas un "mot de passe oublié" : il faut déjà connaître l'ancien mot de passe. À bien distinguer les deux usages sur `/reset-password`
- [x] Mot de passe fort (12 caractères min., maj./min./chiffre/symbole) — `domain/auth/security-policy.ts` (`isStrongPassword`)
- [x] Renouvellement obligatoire tous les 60 jours — `PASSWORD_MAX_AGE_DAYS = 60`, vérifié à chaque login (`needsPasswordReset`)
- [x] Blocage après tentatives infructueuses — 5 tentatives (`MAX_FAILED_ATTEMPTS`) → verrouillage 15 min (`LOCK_DURATION_MS`), déverrouillage automatique après délai (pas d'action admin nécessaire)
- [x] Authentification à deux facteurs (TOTP) — fonctionne à l'inscription (`enable2FA`), au login (`totp-provider.adapter.ts`) et à l'activation sur compte existant (`POST /auth/2fa/enable`), **obligatoire pour `SUPER_ADMIN`**
  - [x] Endpoint pour activer la 2FA sur un compte déjà existant — `POST /auth/2fa/enable` + page `/2fa/setup`
- [ ] Confirmation par SMS (Twilio) en alternative au TOTP — non implémenté (non bloquant : un seul moyen de 2FA suffit)
- [ ] OIDC/OAuth2 (Google, Facebook...) — non implémenté. `cahierDesCharges.md` §5.1 le marque explicitement **"(optionnel)"** → à confirmer à l'oral si un seul mode d'authentification (email/mdp) suffit pour la partie "Authentification Avancée" du sujet
- [ ] Lien magique — non implémenté (idem, marqué optionnel dans le cahier des charges interne)
- [x] Hachage sécurisé des mots de passe — Argon2 (`password-hasher.adapter.ts`)
- [x] Gestion des secrets via variables d'environnement — Infisical (CLI en dev, opérateur Kubernetes en prod)
- [x] Séparation stricte des rôles — middleware `requireRole` appliqué sur toutes les routes sensibles (vérifié sur absence/document/grade/instructor/student/conversation/audit-log/admin)
- [~] Conformité RGPD/CNIL
  - [x] Consentement RGPD stocké à l'inscription (`gdprConsentAt`)
  - [x] Export des données personnelles — `GET /gdpr/export`
  - [x] Suppression de compte — `DELETE /users/me`
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
- [ ] **Stockage réel des fichiers uploadés** (justificatifs, documents administratifs, supports de cours, rendus d'évaluation, contrats) — le module `file` ne stocke que des **métadonnées** (`storagePath`, `mimeType`, `sizeBytes`...) ; **aucun upload multipart, aucun volume/bucket dédié** dans `docker-compose.yml` ni dans `k8s/`. Bloquant pour toutes les pages de dépôt de fichiers listées en section 11

## 3. Réponse métier et architecture

- [x] Domaine métier riche et cohérent — 26 modules backend (`domain/`, `infrastructure/backend/express/src/`) couvrant la quasi-totalité du cahier des charges (planning, notes, absences, documents, entreprises, messagerie, audit)
- [x] Architecture en couches claire — `domain/` (entités, règles), `application/` (cas d'usage), `infrastructure/` (adapters Express/Postgres/Next) — pas de Clean Architecture stricte mais lisible, conforme à ce qui est demandé
- [ ] Frontend connecté au backend — en cours, voir détail page par page section 11 plus bas

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

- [ ] Endpoint mot de passe oublié par email (token à usage unique)
- [x] Endpoint d'activation de la 2FA sur un compte existant (`POST /auth/2fa/enable`)
- [ ] Upload réel de fichiers (multipart + stockage disque/S3), au-delà de la simple création de métadonnées `POST /files`
- [ ] Mécanisme de notifications temps réel (WebSocket) pour planning/notes/documents
- [ ] Un moyen de lister les comptes en attente d'attribution de rôle (`pending_role_assignment`) — aujourd'hui `GET /admin/security/users` retourne tous les comptes mais ne distingue pas explicitement "sans rôle" des autres

---

## 11. Frontend — pages à construire (détail)

Contexte : `infrastructure/frontend/next` est le vrai front. Le dossier `infrastructure/frontend/MyGes refonte/` (fichiers `.jsx` statiques, `localStorage`) est **uniquement une référence de design/interactions**, ne doit plus servir de base de code.

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

- [ ] **`/forgot-password`** — 🆕, dépend d'un endpoint backend à créer (section 10)
  - Contenu : un seul champ email + bouton "Envoyer le lien de réinitialisation" · message de confirmation neutre après envoi (ne jamais indiquer si l'email existe en base, c'est une fuite d'information)

- [~] **`/reset-password`** — branché sur `POST /auth/password/reset-with-credentials`
  - Contenu actuel (à conserver) : champs email (pré-rempli si redirigé depuis `/login`), ancien mot de passe, nouveau mot de passe + confirmation, indicateur de force
  - À ajouter : si la page est ouverte avec un paramètre `?token=...` (lien reçu par email via `/forgot-password`), afficher un **second formulaire** sans champ "ancien mot de passe" (juste nouveau mot de passe + confirmation) — les deux usages ("renouvellement expiré" et "mot de passe oublié") ne doivent pas être confondus dans le même formulaire

- [x] **`/2fa/setup`** — QR code + secret TOTP + confirmation par code à 6 chiffres

### 11.2 Commun à tous les rôles connectés

- [~] **`/parametres`** — page statique existante, à reconnecter
  - Section "Profil" : prénom, nom, email (lecture seule tant qu'aucun `PATCH /users/me` n'existe côté backend), badge de rôle
  - Section "Sécurité" : formulaire changer le mot de passe (ancien + nouveau) → `POST /auth/password/reset` · statut 2FA (activée/non) avec bouton d'activation si non → `/2fa/setup` · jours restants avant expiration du mot de passe (`passwordExpiresInDays` de `GET /users/me`), alerte visuelle si < 7 jours
  - Section "RGPD" : bouton "Exporter mes données" (télécharge le JSON de `GET /gdpr/export`) · bouton "Supprimer mon compte" avec modal de confirmation → `DELETE /users/me` puis déconnexion
  - Ne pas ajouter de section "Notifications" tant que le WebSocket (section 10) n'existe pas — éviter des toggles qui ne feraient rien

- [~] **`/messagerie`** — page statique existante, à reconnecter
  - Colonne gauche : liste des conversations (par classe via `class.conversationId`, par module/cours avec l'intervenant via `course.conversationId`, privées admin↔étudiant via `conversation-private`) avec dernier message + horodatage
  - Colonne droite : fil de la conversation sélectionnée (expéditeur, contenu, heure) + champ de saisie et envoi → `POST /messages`
  - Marquage automatique "lu" à l'ouverture d'une conversation → `POST /message-reads`
  - Uniquement pour `ADMIN`/`SUPER_ADMIN` : bouton "Nouvelle conversation" pour démarrer une conversation privée avec un étudiant → `POST /conversation-privates` (les conversations de classe/module, elles, sont créées automatiquement à la création de la classe/du cours, pas par l'utilisateur)
  - Endpoints : `GET/POST /messages`, `GET /messages/conversation/:id`, `POST /message-reads`, `GET/POST /conversation-privates`

- [ ] Notifications temps réel (bandeau/cloche globale, pas une page à part) — dépend du WebSocket backend (section 10), requis par §3.1/§3.5

### 11.3 Étudiant (`/etudiant`)

- [~] **`/etudiant`** — dashboard
  - Contenu : carte "Prochain cours" (module, horaire, mode, salle ou lien) · carte "Dernières notes" (3-5 dernières, module + valeur/20) · carte "Absences en attente" (nombre + lien vers `/etudiant/absences`) · carte "Documents manquants" (liste des types de documents manquants/expirés + lien vers `/etudiant/documents`)
  - Rester sur des chiffres/liens de raccourci, pas de graphique complexe

- [~] **`/etudiant/planning`** — emploi du temps §3.1
  - Contenu : vue calendrier semaine (bascule jour/semaine) · chaque créneau affiche module, horaire début/fin, mode (couleur distincte présentiel/distanciel/entreprise), salle si `ON_SITE` · navigation semaine précédente/suivante
  - Endpoints : `GET /courses/mine`, `GET /courses/:id/sessions`, `GET /academic-years/current`

- [~] **`/etudiant/notes`** — notes et moyennes §3.2
  - Contenu : liste des modules avec moyenne calculée, coefficient (`program-module`), mention · détail par module (accordéon) listant chaque note individuelle (type d'évaluation, date, valeur/20) · badge "Gelée" si `isLocked = true` (informatif seulement, pas de contestation depuis cette page — ça passe par la messagerie/l'admin) · distinction visuelle notes académiques vs notes entreprise si l'étudiant est alternant
  - Endpoints : `GET /grades/mine`, `GET /grade-assessments/*`, `GET /grade-session-exams/*`, `GET /manual-notations/module/:id`

- [~] **`/etudiant/absences`** — déclaration + suivi §3.3
  - Contenu : formulaire de déclaration (sélection de la session concernée, motif en texte libre, dépôt de justificatif optionnel dès la déclaration) · tableau historique (session/date, motif, statut `PENDING`/`VALIDATED`/`REJECTED` en badge coloré, lien de téléchargement du justificatif s'il existe) · action "Ajouter un justificatif" sur une absence `PENDING` qui n'en a pas encore
  - Endpoints : `POST /absences`, `GET /absences/mine`, `POST /file-justifications` (dépend de l'upload réel de fichiers, section 10)

- [~] **`/etudiant/documents`** — dossier centralisé §3.4
  - Contenu : section "Documents officiels" (types `SCHOOL_CERTIFICATE`, `ENROLLMENT_CERTIFICATE`, `TRANSCRIPTS`, `OFFICIAL_DOCUMENTS_ISSUED_BY_THE_SCHOOL` — lecture + téléchargement) · section "Mes contrats" si alternant (contrat d'apprentissage/convention : entreprise, type, dates de début/fin, avenants) · section "Documents à fournir" (alerte par document manquant ou `FileDocument.status` en `PENDING`/`EXPIRED`, bouton "Déposer")
  - Pas de gestion d'entreprise ici (juste affichage) — la gestion entreprise appartient à l'admin
  - Endpoints : `GET /file-documents/student/:id`, `GET /document-administratives/*`, `POST /file-documents`, `POST /files`

- [ ] **`/etudiant/cours`** — 🆕 bibliothèque de supports §3.6
  - Contenu : liste des modules suivis (via ses cours) · pour chaque module, liste des fichiers déposés par l'intervenant (`FileCourse` : nom, type, date, bouton télécharger)
  - Lecture seule — pas de dépôt ici, c'est le rôle de l'intervenant
  - Endpoint : `GET /file-courses/course/:courseId`

- [ ] **`/etudiant/evaluations`** — 🆕 évaluations et rendus §3.6
  - Contenu : liste des évaluations publiées (`isPublished = true`) de ses cours (titre, module, type continu/examen, date limite, statut à rendre/rendu/en retard) · si `maxGroupSize > 1`, formation/visualisation du groupe (`assessment-group` + `assessment-group-member`) · dépôt de fichier avant la date limite avec remplacement possible tant que non dépassée
  - Ne pas afficher les notes ici (déjà sur `/etudiant/notes`, éviter la duplication)
  - Endpoints : `GET /courses/:id/assessments`, `POST /assessment-groups`, `POST /assessment-group-members`, `POST /file-assessments`

### 11.4 Intervenant (`/intervenant`)

- [~] **`/intervenant`** — dashboard
  - Contenu : carte "Cours du jour" (horaire, module, salle) · carte "Notes à saisir" (évaluations dont la saisie n'est pas terminée) · carte "Rendus en attente de correction" (nombre de `FileAssessment` non encore notés)

- [~] **`/intervenant/planning`** — mon planning §3.1
  - Contenu : calendrier de ses sessions (via ses cours) · clic sur une session → détail avec liste des étudiants du groupe et case à cocher présent/absent (déclenche `POST /absences` côté intervenant) · lien rapide vers le dépôt de support pour ce cours
  - Endpoints : `GET /courses/mine`, `GET /courses/:id/sessions`, `GET /sessions/:sessionId/absences`

- [ ] **`/intervenant/notes`** — 🆕 **régression à corriger en priorité** (existait dans la maquette, disparue du `Sidebar` Next.js) — saisie des notes §3.2
  - Contenu : sélecteur de module/cours en haut · tableau des étudiants du groupe avec saisie de note par évaluation (valeur/20, mention calculée automatiquement, commentaire optionnel) · bouton "Geler les notes" une fois la saisie terminée (désactive l'édition) · export CSV
  - Endpoints : `POST/PATCH /grades`, `POST /grade-assessments`

- [~] **`/intervenant/supports`** — dépôt de supports
  - Contenu : liste des fichiers déjà déposés par cours (`FileCourse` : nom, type, taille, date) avec suppression possible · zone de dépôt (titre + sélection du cours concerné)
  - Endpoints : `GET/POST/DELETE /file-courses`

- [ ] **`/intervenant/evaluations`** — 🆕 création et suivi des évaluations §3.6
  - Contenu : liste des évaluations créées par cours (statut publié/brouillon, date limite, nombre de rendus reçus / attendus) · formulaire de création/édition (titre, cours concerné, type continu/examen, date limite, taille max de groupe, case "publier") · vue des rendus par groupe/étudiant avec lien de téléchargement et lien direct vers `/intervenant/notes` pour noter
  - Endpoints : `POST/PATCH /assessments`, `GET /assessment-groups/*`, `GET /file-assessments/assessment/:id`

### 11.5 Administration — `ADMIN` + `SUPER_ADMIN` (`/scolarite`)

Zone la moins couverte aujourd'hui. Fusionne les responsabilités "Scolarité / Pédagogique / Relations Entreprises" du cahier des charges puisque le backend n'a qu'un seul rôle `ADMIN`.

- [~] **`/scolarite`** — dashboard
  - Contenu : KPI "Absences en attente de validation" (nombre + lien) · KPI "Documents manquants/expirés" (nombre + lien) · KPI "Contrats d'alternance expirant sous 30 jours" (nombre + lien) · liste courte des 5 prochains examens/jurys

- [ ] **`/scolarite/etudiants`** — 🆕 **lien déjà présent dans le `Sidebar`, page inexistante (lien mort)** — dossiers étudiants
  - Contenu : tableau liste (nom, prénom, email, filière, classe/groupe, statut initial/alternant déduit de la présence d'un contrat actif), recherche/filtre par filière-classe · fiche détail au clic (infos, programme, groupe(s), lien vers historique notes filtré, historique absences, documents/contrats)
  - Endpoints : `GET /students`, `GET /students/:id`, `PATCH /students/:id`

- [ ] **`/scolarite/absences`** — 🆕 validation des absences §3.3
  - Contenu : tableau filtrable par statut (`PENDING` par défaut), classe, période (étudiant, session/module, date, motif, justificatif en lien, statut) · actions ligne par ligne Valider/Rejeter (avec commentaire optionnel) · filtre "motif entreprise" pour les absences liées à l'alternance
  - Endpoints : `GET /sessions/:id/absences`, `PATCH /absences/:id`, `GET /file-justifications/absence/:id`

- [ ] **`/scolarite/documents`** — 🆕 suivi documentaire global §3.4
  - Contenu : tableau des documents en attente de validation (`FileDocument.status = PENDING` : étudiant, type, date de dépôt, bouton visualiser + Valider/Rejeter) · section "Expirés/manquants" (étudiants avec `DocumentAdministrative.expiration` dépassée ou type obligatoire manquant)
  - Endpoints : `GET /document-administratives`, `PATCH /file-documents/:id`

- [~] **`/scolarite/notes`** — supervision des notes
  - Contenu : sélecteur filière/classe/module · tableau des notes du module (moyenne de classe, répartition des mentions) · bouton geler/dégeler les notes du module (bascule `isLocked` en masse) · section "Notations manuelles" (`ManualNotation` par module, ajout/édition)
  - Endpoints : `PATCH /grades/:id` (lock), `GET/POST /manual-notations`

- [ ] **`/scolarite/planning`** — 🆕 gestion des sessions §3.1, §4
  - Contenu : vue calendrier globale par classe/salle · formulaire création/édition de session (cours concerné, date/heure début-fin, mode, salle si présentiel) · gestion des situations exceptionnelles : déplacer une session (date/salle), l'annuler, motif en texte libre tracé (grève, jour férié déplacé) — à défaut de champ dédié dans l'entité `Session`, prévoir un champ note/motif ou s'appuyer sur l'audit-log pour tracer le changement
  - Endpoint : `POST/PATCH /sessions`

- [ ] **`/scolarite/examens`** — 🆕 sessions d'examen §3.7
  - Contenu : liste des sessions d'examen par période (module, type écrit/soutenance, rattrapage oui/non, date via la session liée) · formulaire de création (rattacher à une session existante, type, `Assessment` optionnelle, case "rattrapage") · affectation des étudiants concernés, des intervenants surveillants/jury, et des externes (choisis parmi `/scolarite/externes`)
  - Endpoints : `POST/PATCH /session-exams`, `POST /session-exam-{students,instructors,externals}`

- [ ] **`/scolarite/formations`** — 🆕 filières et modules §3.7
  - Contenu : liste des filières (`Program` : nom, code, période) · détail filière : blocs de compétences (`Bloc`), modules rattachés (`program-module`) avec coefficient et crédits ECTS, formulaire d'ajout/retrait de module
  - Endpoints : `POST/PATCH /programs`, `/blocs`, `/modules`, `/program-modules`

- [ ] **`/scolarite/classes`** — 🆕 classes et groupes §3.7, §4
  - Contenu : liste des classes par filière (numéro, effectif déclaré, lien vers ses groupes) · détail classe : groupes (`Group`), étudiants affectés, formulaire d'affectation/retrait d'étudiant à un groupe (`student-group`)
  - Gestion du sous-effectif (§4) : décrite comme un déplacement manuel des étudiants d'une classe vers une autre puis suppression de l'ancienne — pas une fusion automatique
  - Endpoints : `POST/PATCH /classes`, `/groups`, `POST /student-groups`

- [ ] **`/scolarite/cours`** — 🆕 affectation intervenant/module/groupe §3.7
  - Contenu : liste des cours (module, groupe, bloc, intervenant affecté) · formulaire création/édition (sélection module + groupe + bloc + intervenant, avec les spécialités de chaque intervenant affichées comme aide à la décision — pas de suggestion automatique) · réaffectation rapide d'un intervenant en cas d'indisponibilité (§4)
  - Endpoint : `POST/PATCH /courses`

- [ ] **`/scolarite/intervenants`** — 🆕 gestion des intervenants §3.7, §4
  - Contenu : liste (nom, type de contrat, spécialités, nombre de cours affectés) · fiche détail (ses cours) · formulaire création/édition (`contractType`, `specialties` en tags)
  - Endpoint : `POST/PATCH /instructors`

- [ ] **`/scolarite/entreprises`** — 🆕 entreprises et contrats d'alternance
  - Contenu : liste des entreprises (nom, SIRET, contact) · détail entreprise : contrats d'alternance rattachés, étudiants concernés, dates début/fin avec alerte proche échéance · formulaire création/édition entreprise
  - Endpoints : `POST/PATCH /companies`, `/document-apprenticeship-contracts`

- [ ] **`/scolarite/campus`** — 🆕 campus et salles
  - Contenu : liste des campus (nom, adresse) avec leurs salles rattachées · détail campus : salles (nom, capacité), formulaire d'ajout de salle
  - Endpoints : `POST/PATCH /campuses`, `/classrooms`

- [ ] **`/scolarite/externes`** — 🆕 jurys et surveillants externes
  - Contenu : liste (nom, prénom, email, type jury/surveillant/autre), formulaire création/édition — utilisés ensuite dans `/scolarite/examens`
  - Endpoint : `POST/PATCH /externals`

- [ ] **`/scolarite/annee-academique`** — 🆕 années académiques et périodes (prérequis pour créer une filière)
  - Contenu : liste des années académiques (dates début/fin, laquelle est "en cours") · détail : périodes rattachées (ordre, dates), formulaire d'ajout de période · action "Définir comme année en cours"
  - Endpoints : `POST/PATCH /academic-years`, `/periods`

### 11.6 Super Administrateur uniquement (`/superadmin`)

- [~] **`/superadmin`** — dashboard global
  - Contenu : KPI "Comptes en attente d'attribution de rôle" (nombre + lien) · KPI "Comptes verrouillés" · KPI "Mots de passe expirés" · 5-10 derniers événements d'audit-log significatifs (lien vers `/superadmin/securite`)

- [~] **`/superadmin/gestion`** — gestion des comptes
  - Contenu : tableau de tous les comptes (nom, email, statut verrouillé avec date de déblocage, 2FA activée oui/non, mot de passe expiré oui/non) · filtre "en attente de rôle" (à croiser côté front avec `/students`, `/instructors`, `/admins` puisque le backend ne l'expose pas explicitement — cf. gap section 10)
  - **Point critique à ajouter** : action "Attribuer un rôle" sur un compte en attente, avec choix Étudiant (+ sélection du programme) / Intervenant (+ type de contrat) / Admin (+ `ADMIN` ou `SUPER_ADMIN`)
  - Action sur un compte admin existant : modifier son rôle (`ADMIN` ↔ `SUPER_ADMIN`), le supprimer (sans supprimer le compte `user` sous-jacent)
  - Endpoints : `GET /admin/security/users`, `POST /students`, `POST /instructors`, `POST/PATCH/DELETE /admins`

- [ ] **`/superadmin/securite`** — 🆕 référencée dans le `Sidebar`, aucune page réelle aujourd'hui — audit et traçabilité §3.8
  - Contenu : tableau paginé de l'audit-log (date, utilisateur, action `CREATE`/`UPDATE`/`DELETE`/`VALIDATE`/`REJECT`/`FREEZE`/`LOGIN`/`OTHER`, entité concernée, ancienne/nouvelle valeur en diff simplifié) · filtres par utilisateur, entité, action, plage de dates
  - Consultation seule, pas d'action d'écriture sur cette page
  - Endpoint : `GET /audit-logs` (+ filtres)

### 11.7 Points d'architecture transverses à traiter en même temps que les pages

- [x] Client API centralisé (`lib/api.ts`) : `api.get/post/patch/delete` normalisent les erreurs (`ApiError`) et redirigent vers `/login` sur 401. Le header `Authorization` n'a plus besoin d'être posé par les pages : le cookie httpOnly suffit, le middleware l'attache lui-même en le relayant vers le backend. Pas encore utilisé par les pages existantes (elles seront migrées au fil de l'étape 2 de l'ordre de construction)
- [x] Garde de route par rôle — cookie `httpOnly` (`myges_token`) posé par `app/api/auth/login/route.ts` et `app/api/auth/login/2fa/route.ts`, vérifié par `middleware.ts` via `lib/auth.ts` (`jose`, vérification de signature, pas juste un décodage) ; déconnexion via `POST /api/auth/logout` (`Sidebar.tsx`)
  - [ ] À vérifier avant déploiement prod : `JWT_SECRET` doit être accessible au pod frontend k8s (les deux `InfisicalSecret` CRD `backend`/`frontend` pointent déjà sur le même `secretsPath: "/"`, donc a priori déjà synchronisé — à confirmer dans Infisical)
- [ ] Composants à mutualiser avant de dupliquer page par page : table triable/filtrable générique, modal de confirmation, dropzone d'upload de fichier, switch/toggle, toast succès/erreur, badge de statut (vert validé, rouge manquant/rejeté, orange en attente)

### Ordre de construction conseillé (frontend)

1. ~~Client API + garde de route (base commune)~~ ✅ fait — `lib/api.ts`, `lib/auth.ts`, `middleware.ts`, `app/api/auth/{login,login/2fa,logout}`
2. Reconnecter les pages `[~]` existantes (dashboards, planning, notes, absences, documents, messagerie, paramètres)
3. `/intervenant/notes` (régression à corriger, fonctionnalité cœur du métier)
4. Zone Administration (`/scolarite/*`) dans l'ordre : année académique → campus → formations/modules → classes/groupes → cours (affectation intervenant) → planning/sessions → examens → étudiants → absences/documents → entreprises
5. `/etudiant/cours` + `/etudiant/evaluations` + `/intervenant/evaluations` (boucle supports/rendus complète)
6. `/superadmin/gestion` (attribution de rôle) + `/superadmin/securite`
7. `/forgot-password` + `/2fa/setup` une fois les endpoints back correspondants ajoutés (section 10)
