-- =====================================================================================
-- Fixtures de dev MyGES 2.0 — jeu de données réaliste pour peupler une base de dev vide.
--
-- Chargement (le conteneur postgres n'a pas ce fichier monté, on le pipe via stdin) :
--   docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < fixtures/dev-fixtures.sql
--
-- Toutes les dates sont relatives à now() (intervalles SQL) pour rester valides quel que
-- soit le jour où ce fichier est chargé.
--
-- Tous les comptes fixtures utilisent le mot de passe : MotDePasse1234$
--   - Admin        : admin.seed@myges.fr
--   - Super admin  : superadmin.seed@myges.fr (2FA obligatoire, secret TOTP ci-dessous)
--   - Étudiants    : voir table users, email en *@myges-etu.fr
--   - Intervenants : voir table users, email en *@myges.fr
--
-- Secret TOTP du super admin (base32) : JZBDIP2HPIRUI6KQKVVV2NDYGAVDEZBRJB6XGKBDNZBWIV2ROITA
-- Générer un code à 6 chiffres valide : node -e "console.log(require('speakeasy').totp({secret:'JZBDIP2HPIRUI6KQKVVV2NDYGAVDEZBRJB6XGKBDNZBWIV2ROITA',encoding:'base32'}))"
-- =====================================================================================

BEGIN;

TRUNCATE TABLE
    "message_read", "message", "conversation_private", "conversation",
    "audit_log",
    "file_assessment_instruction", "file_justification", "file_assessment", "file_course",
    "document_apprenticeship_contract", "document_administrative", "file_document", "file",
    "session_exam_external", "session_exam_instructor", "session_exam_student", "session_exam",
    "absence", "session",
    "grade_session_exam", "grade_manual_notation", "grade_assessment", "grade", "manual_notation",
    "assessment_group_member", "assessment_group", "assessment",
    "course",
    "student_group", "group", "class",
    "student", "instructor", "admin",
    "classroom", "campus",
    "program_module", "module", "bloc", "program",
    "period", "academic_year",
    "password_reset_tokens", "two_factor_sessions", "users",
    "external", "company"
RESTART IDENTITY CASCADE;

-- Mot de passe partagé par tous les comptes fixtures : MotDePasse1234$
-- (hash argon2id précalculé, identique à celui produit par password-hasher.adapter.ts)

-- =====================================================================================
-- Comptes administration
-- =====================================================================================

INSERT INTO "users" ("id", "firstname", "lastname", "email", "password_hash", "failed_attempts", "locked_until", "password_updated_at", "two_factor_enabled", "two_factor_secret", "gdpr_consent_at", "created_at", "last_login_at") VALUES
('fx_user_admin', 'Seed', 'Admin', 'admin.seed@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '10 days', FALSE, NULL, now() - interval '300 days', now() - interval '300 days', now() - interval '1 days');

INSERT INTO "users" ("id", "firstname", "lastname", "email", "password_hash", "failed_attempts", "locked_until", "password_updated_at", "two_factor_enabled", "two_factor_secret", "gdpr_consent_at", "created_at", "last_login_at") VALUES
('fx_user_superadmin', 'Seed', 'SuperAdmin', 'superadmin.seed@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '10 days', TRUE, 'JZBDIP2HPIRUI6KQKVVV2NDYGAVDEZBRJB6XGKBDNZBWIV2ROITA', now() - interval '300 days', now() - interval '300 days', now() - interval '1 days');

-- =====================================================================================
-- Intervenants (4)
-- =====================================================================================

INSERT INTO "users" ("id", "firstname", "lastname", "email", "password_hash", "failed_attempts", "locked_until", "password_updated_at", "two_factor_enabled", "two_factor_secret", "gdpr_consent_at", "created_at", "last_login_at") VALUES
('fx_user_instructor_1', 'Julien', 'Girard', 'julien.girard@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '300 days', now() - interval '300 days', now() - interval '5 days'),
('fx_user_instructor_2', 'Clara', 'Andre', 'clara.andre@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '300 days', now() - interval '300 days', now() - interval '5 days'),
('fx_user_instructor_3', 'Maxime', 'Lefevre', 'maxime.lefevre@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '300 days', now() - interval '300 days', now() - interval '5 days'),
('fx_user_instructor_4', 'Eva', 'Mercier', 'eva.mercier@myges.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '300 days', now() - interval '300 days', now() - interval '5 days');

-- =====================================================================================
-- Étudiants (16 : 8 en Ingénieur Web, 8 en Data Science)
-- =====================================================================================

INSERT INTO "users" ("id", "firstname", "lastname", "email", "password_hash", "failed_attempts", "locked_until", "password_updated_at", "two_factor_enabled", "two_factor_secret", "gdpr_consent_at", "created_at", "last_login_at") VALUES
('fx_user_student_1', 'Lucas', 'Martin', 'lucas.martin@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_2', 'Emma', 'Bernard', 'emma.bernard@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_3', 'Hugo', 'Dubois', 'hugo.dubois@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_4', 'Lea', 'Thomas', 'lea.thomas@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_5', 'Louis', 'Robert', 'louis.robert@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_6', 'Chloe', 'Richard', 'chloe.richard@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_7', 'Gabriel', 'Petit', 'gabriel.petit@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_8', 'Manon', 'Durand', 'manon.durand@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_9', 'Nathan', 'Simon', 'nathan.simon@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_10', 'Sarah', 'Laurent', 'sarah.laurent@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_11', 'Theo', 'Lefebvre', 'theo.lefebvre@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_12', 'Ines', 'Michel', 'ines.michel@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_13', 'Ethan', 'Garcia', 'ethan.garcia@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_14', 'Jade', 'David', 'jade.david@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_15', 'Noah', 'Bertrand', 'noah.bertrand@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days'),
('fx_user_student_16', 'Louise', 'Roux', 'louise.roux@myges-etu.fr', '$argon2id$v=19$m=65536,t=3,p=4$R4x35Hv043YCj+g+x8eL2Q$jiE2kKBjYuIVyRzTy3mUaJu3Mbcrf4FyydxYOX4NXJ4', 0, NULL, now() - interval '30 days', FALSE, NULL, now() - interval '200 days', now() - interval '200 days', now() - interval '2 days');

-- =====================================================================================
-- Année académique et périodes
-- =====================================================================================

INSERT INTO "academic_year" ("id", "start_date", "end_date", "is_current") VALUES
('fx_ay_2025', now() - interval '4 months', now() + interval '8 months', TRUE);

INSERT INTO "period" ("id", "order", "start_date", "end_date", "academic_year_id") VALUES
('fx_period_1', 1, now() - interval '4 months', now() + interval '2 months', 'fx_ay_2025'),
('fx_period_2', 2, now() + interval '2 months', now() + interval '8 months', 'fx_ay_2025');

-- =====================================================================================
-- Filières, blocs, modules
-- =====================================================================================

INSERT INTO "program" ("id", "name", "code", "period_id") VALUES
('fx_prog_iw', 'Ingenieur Web', 'IW', 'fx_period_1'),
('fx_prog_ds', 'Data Science', 'DS', 'fx_period_1');

INSERT INTO "bloc" ("id", "name", "program_id") VALUES
('fx_bloc_iw', 'Bloc Technique', 'fx_prog_iw'),
('fx_bloc_ds', 'Bloc Technique', 'fx_prog_ds');

INSERT INTO "module" ("id", "name", "code") VALUES
('fx_mod_ang', 'Anglais Professionnel', 'ANG'),
('fx_mod_devweb', 'Developpement Web', 'DEVWEB'),
('fx_mod_sec', 'Securite des Systemes', 'SEC'),
('fx_mod_ml', 'Machine Learning', 'ML'),
('fx_mod_stat', 'Statistiques Appliquees', 'STAT'),
('fx_mod_bdd', 'Bases de Donnees', 'BDD');

INSERT INTO "program_module" ("id", "program_id", "module_id", "coefficient", "ects_credits") VALUES
('fx_pm_iw_ang', 'fx_prog_iw', 'fx_mod_ang', 2, 4),
('fx_pm_iw_devweb', 'fx_prog_iw', 'fx_mod_devweb', 3, 6),
('fx_pm_iw_sec', 'fx_prog_iw', 'fx_mod_sec', 2, 4),
('fx_pm_ds_ang', 'fx_prog_ds', 'fx_mod_ang', 2, 4),
('fx_pm_ds_ml', 'fx_prog_ds', 'fx_mod_ml', 3, 6),
('fx_pm_ds_stat', 'fx_prog_ds', 'fx_mod_stat', 3, 5);

-- =====================================================================================
-- Campus et salles
-- =====================================================================================

INSERT INTO "campus" ("id", "name", "address") VALUES
('fx_campus_paris', 'Campus Paris', '12 Rue de la Paix, 75002 Paris');

INSERT INTO "classroom" ("id", "name", "capacity", "campus_id") VALUES
('fx_room_101', 'P101', 30, 'fx_campus_paris'),
('fx_room_102', 'P102', 25, 'fx_campus_paris');

-- =====================================================================================
-- Conversations (une par classe, une par cours, une privée)
-- =====================================================================================

INSERT INTO "conversation" ("id", "created_at") VALUES
('fx_conv_class_iw', now() - interval '60 days'),
('fx_conv_class_ds', now() - interval '60 days'),
('fx_conv_course_1', now() - interval '60 days'),
('fx_conv_course_2', now() - interval '60 days'),
('fx_conv_course_3', now() - interval '60 days'),
('fx_conv_course_4', now() - interval '60 days'),
('fx_conv_course_5', now() - interval '60 days'),
('fx_conv_course_6', now() - interval '60 days'),
('fx_conv_private_1', now() - interval '10 days');

-- =====================================================================================
-- Classes et groupes
-- "General" est un nom réservé : c'est le groupe que la vraie création de classe (POST
-- /classes) crée automatiquement pour représenter l'effectif complet de la classe, et
-- c'est le seul groupe qui donne accès à la conversation de classe (isParticipant dans
-- message.use-cases.ts). On l'utilise ici aussi comme groupe d'enseignement pour rester
-- simple (1 seul groupe par classe).
-- =====================================================================================

INSERT INTO "class" ("id", "number", "program_id", "size", "conversation_id") VALUES
('fx_class_iw', 1, 'fx_prog_iw', 8, 'fx_conv_class_iw'),
('fx_class_ds', 1, 'fx_prog_ds', 8, 'fx_conv_class_ds');

INSERT INTO "group" ("id", "class_id", "name") VALUES
('fx_group_iw', 'fx_class_iw', 'General'),
('fx_group_ds', 'fx_class_ds', 'General');

-- =====================================================================================
-- Profils étudiants + affectation aux groupes
-- =====================================================================================

INSERT INTO "student" ("id", "user_id", "program_id") VALUES
('fx_student_1', 'fx_user_student_1', 'fx_prog_iw'),
('fx_student_2', 'fx_user_student_2', 'fx_prog_iw'),
('fx_student_3', 'fx_user_student_3', 'fx_prog_iw'),
('fx_student_4', 'fx_user_student_4', 'fx_prog_iw'),
('fx_student_5', 'fx_user_student_5', 'fx_prog_iw'),
('fx_student_6', 'fx_user_student_6', 'fx_prog_iw'),
('fx_student_7', 'fx_user_student_7', 'fx_prog_iw'),
('fx_student_8', 'fx_user_student_8', 'fx_prog_iw'),
('fx_student_9', 'fx_user_student_9', 'fx_prog_ds'),
('fx_student_10', 'fx_user_student_10', 'fx_prog_ds'),
('fx_student_11', 'fx_user_student_11', 'fx_prog_ds'),
('fx_student_12', 'fx_user_student_12', 'fx_prog_ds'),
('fx_student_13', 'fx_user_student_13', 'fx_prog_ds'),
('fx_student_14', 'fx_user_student_14', 'fx_prog_ds'),
('fx_student_15', 'fx_user_student_15', 'fx_prog_ds'),
('fx_student_16', 'fx_user_student_16', 'fx_prog_ds');

INSERT INTO "student_group" ("id", "student_id", "group_id") VALUES
('fx_sg_1', 'fx_student_1', 'fx_group_iw'),
('fx_sg_2', 'fx_student_2', 'fx_group_iw'),
('fx_sg_3', 'fx_student_3', 'fx_group_iw'),
('fx_sg_4', 'fx_student_4', 'fx_group_iw'),
('fx_sg_5', 'fx_student_5', 'fx_group_iw'),
('fx_sg_6', 'fx_student_6', 'fx_group_iw'),
('fx_sg_7', 'fx_student_7', 'fx_group_iw'),
('fx_sg_8', 'fx_student_8', 'fx_group_iw'),
('fx_sg_9', 'fx_student_9', 'fx_group_ds'),
('fx_sg_10', 'fx_student_10', 'fx_group_ds'),
('fx_sg_11', 'fx_student_11', 'fx_group_ds'),
('fx_sg_12', 'fx_student_12', 'fx_group_ds'),
('fx_sg_13', 'fx_student_13', 'fx_group_ds'),
('fx_sg_14', 'fx_student_14', 'fx_group_ds'),
('fx_sg_15', 'fx_student_15', 'fx_group_ds'),
('fx_sg_16', 'fx_student_16', 'fx_group_ds');

-- =====================================================================================
-- Profils intervenants et admins
-- =====================================================================================

INSERT INTO "instructor" ("id", "user_id", "contract_type", "specialties") VALUES
('fx_instructor_1', 'fx_user_instructor_1', 'PERMANENT', '["Developpement Web","JavaScript"]'),
('fx_instructor_2', 'fx_user_instructor_2', 'FIXED_TERM', '["Securite","Reseaux"]'),
('fx_instructor_3', 'fx_user_instructor_3', 'FREELANCE', '["Machine Learning","Python"]'),
('fx_instructor_4', 'fx_user_instructor_4', 'PERMANENT', '["Statistiques","Anglais"]');

INSERT INTO "admin" ("id", "user_id", "role") VALUES
('fx_admin_1', 'fx_user_admin', 'ADMIN'),
('fx_admin_2', 'fx_user_superadmin', 'SUPER_ADMIN');

-- =====================================================================================
-- Cours (3 modules x 2 groupes)
-- =====================================================================================

INSERT INTO "course" ("id", "instructor_id", "module_id", "group_id", "bloc_id", "conversation_id") VALUES
('fx_course_1', 'fx_instructor_1', 'fx_mod_devweb', 'fx_group_iw', 'fx_bloc_iw', 'fx_conv_course_1'),
('fx_course_2', 'fx_instructor_2', 'fx_mod_sec', 'fx_group_iw', 'fx_bloc_iw', 'fx_conv_course_2'),
('fx_course_3', 'fx_instructor_4', 'fx_mod_ang', 'fx_group_iw', 'fx_bloc_iw', 'fx_conv_course_3'),
('fx_course_4', 'fx_instructor_3', 'fx_mod_ml', 'fx_group_ds', 'fx_bloc_ds', 'fx_conv_course_4'),
('fx_course_5', 'fx_instructor_4', 'fx_mod_stat', 'fx_group_ds', 'fx_bloc_ds', 'fx_conv_course_5'),
('fx_course_6', 'fx_instructor_1', 'fx_mod_ang', 'fx_group_ds', 'fx_bloc_ds', 'fx_conv_course_6');

-- =====================================================================================
-- Sessions (2 par cours : 1 passée, 1 future)
-- Ancrées sur le lundi de la semaine en cours / prochaine (date_trunc('week', now()) tombe
-- toujours un lundi) plutôt que sur un simple décalage en jours, pour ne jamais retomber sur
-- un week-end et rester visibles dans le planning par défaut (semaine en cours = passé proche,
-- semaine prochaine = futur proche) quel que soit le jour où ce fichier est chargé.
-- =====================================================================================

-- Chaque cours alterne présentiel/distanciel entre sa séance passée et sa séance future
-- (au lieu d'un mode figé par cours) pour que le filtre "Distanciel" du planning ait toujours
-- quelque chose à montrer, quel que soit le cours/groupe consulté.
INSERT INTO "session" ("id", "course_id", "start_time", "end_time", "mode", "classroom_id") VALUES
('fx_session_1a', 'fx_course_1', (date_trunc('week', now()))::date + time '09:00', (date_trunc('week', now()))::date + time '10:30', 'ON_SITE', 'fx_room_101'),
('fx_session_1b', 'fx_course_1', (date_trunc('week', now()) + interval '7 days')::date + time '09:00', (date_trunc('week', now()) + interval '7 days')::date + time '10:30', 'REMOTE', NULL),
('fx_session_2a', 'fx_course_2', (date_trunc('week', now()) + interval '1 days')::date + time '11:00', (date_trunc('week', now()) + interval '1 days')::date + time '12:30', 'REMOTE', NULL),
('fx_session_2b', 'fx_course_2', (date_trunc('week', now()) + interval '8 days')::date + time '11:00', (date_trunc('week', now()) + interval '8 days')::date + time '12:30', 'ON_SITE', 'fx_room_101'),
('fx_session_3a', 'fx_course_3', (date_trunc('week', now()) + interval '2 days')::date + time '14:00', (date_trunc('week', now()) + interval '2 days')::date + time '15:30', 'ON_SITE', 'fx_room_102'),
('fx_session_3b', 'fx_course_3', (date_trunc('week', now()) + interval '9 days')::date + time '14:00', (date_trunc('week', now()) + interval '9 days')::date + time '15:30', 'REMOTE', NULL),
('fx_session_4a', 'fx_course_4', (date_trunc('week', now()) + interval '3 days')::date + time '09:00', (date_trunc('week', now()) + interval '3 days')::date + time '10:30', 'REMOTE', NULL),
('fx_session_4b', 'fx_course_4', (date_trunc('week', now()) + interval '10 days')::date + time '09:00', (date_trunc('week', now()) + interval '10 days')::date + time '10:30', 'ON_SITE', 'fx_room_101'),
('fx_session_5a', 'fx_course_5', (date_trunc('week', now()) + interval '4 days')::date + time '11:00', (date_trunc('week', now()) + interval '4 days')::date + time '12:30', 'ON_SITE', 'fx_room_102'),
('fx_session_5b', 'fx_course_5', (date_trunc('week', now()) + interval '11 days')::date + time '11:00', (date_trunc('week', now()) + interval '11 days')::date + time '12:30', 'REMOTE', NULL),
('fx_session_6a', 'fx_course_6', (date_trunc('week', now()))::date + time '14:00', (date_trunc('week', now()))::date + time '15:30', 'REMOTE', NULL),
('fx_session_6b', 'fx_course_6', (date_trunc('week', now()) + interval '7 days')::date + time '14:00', (date_trunc('week', now()) + interval '7 days')::date + time '15:30', 'ON_SITE', 'fx_room_102');

-- =====================================================================================
-- Évaluations (1 par cours)
-- =====================================================================================

INSERT INTO "assessment" ("id", "course_id", "title", "type", "is_published", "due_date", "max_group_size") VALUES
('fx_assessment_1', 'fx_course_1', 'Projet fil rouge - Developpement Web', 'CONTINUOUS', TRUE, now() + interval '10 days', 3),
('fx_assessment_2', 'fx_course_2', 'Examen final - Securite', 'EXAM', TRUE, now() + interval '20 days', 1),
('fx_assessment_3', 'fx_course_3', 'Oral - Anglais Professionnel', 'CONTINUOUS', TRUE, now() - interval '5 days', 3),
('fx_assessment_4', 'fx_course_4', 'Projet - Machine Learning', 'CONTINUOUS', TRUE, now() + interval '10 days', 3),
('fx_assessment_5', 'fx_course_5', 'Examen final - Statistiques', 'EXAM', FALSE, now() + interval '25 days', 1),
('fx_assessment_6', 'fx_course_6', 'Oral - Anglais Professionnel', 'CONTINUOUS', TRUE, now() + interval '8 days', 3);

-- =====================================================================================
-- Groupes de rendu pour les évaluations en mode continu
-- =====================================================================================

INSERT INTO "assessment_group" ("id", "assessment_id") VALUES
('fx_ag_1', 'fx_assessment_1'),
('fx_ag_3', 'fx_assessment_3'),
('fx_ag_4', 'fx_assessment_4'),
('fx_ag_6', 'fx_assessment_6');

INSERT INTO "assessment_group_member" ("id", "assessment_group_id", "student_id") VALUES
('fx_agm_1_1', 'fx_ag_1', 'fx_student_1'),
('fx_agm_1_2', 'fx_ag_1', 'fx_student_2'),
('fx_agm_1_3', 'fx_ag_1', 'fx_student_3'),
('fx_agm_3_1', 'fx_ag_3', 'fx_student_4'),
('fx_agm_3_2', 'fx_ag_3', 'fx_student_5'),
('fx_agm_4_1', 'fx_ag_4', 'fx_student_9'),
('fx_agm_4_2', 'fx_ag_4', 'fx_student_10'),
('fx_agm_4_3', 'fx_ag_4', 'fx_student_11'),
('fx_agm_6_1', 'fx_ag_6', 'fx_student_12'),
('fx_agm_6_2', 'fx_ag_6', 'fx_student_13');

-- =====================================================================================
-- Notations manuelles + notes (chaque étudiant a une note par module de sa filière)
-- =====================================================================================

INSERT INTO "manual_notation" ("id", "module_id", "name") VALUES
('fx_manual_ang', 'fx_mod_ang', 'Controle continu'),
('fx_manual_devweb', 'fx_mod_devweb', 'Controle continu'),
('fx_manual_sec', 'fx_mod_sec', 'Controle continu'),
('fx_manual_ml', 'fx_mod_ml', 'Controle continu'),
('fx_manual_stat', 'fx_mod_stat', 'Controle continu');

-- Étudiants Ingénieur Web (module Anglais)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_1', 'fx_student_1', 14.5, TRUE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_2', 'fx_student_2', 11.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_3', 'fx_student_3', 16.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_4', 'fx_student_4', 9.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_5', 'fx_student_5', 13.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_6', 'fx_student_6', 17.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_7', 'fx_student_7', 8.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_8', 'fx_student_8', 12.5, FALSE, now() - interval '10 days', 'fx_user_admin');

-- Étudiants Ingénieur Web (module Développement Web)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_9', 'fx_student_1', 15.5, TRUE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_10', 'fx_student_2', 10.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_11', 'fx_student_3', 18.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_12', 'fx_student_4', 12.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_13', 'fx_student_5', 14.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_14', 'fx_student_6', 16.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_15', 'fx_student_7', 9.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_16', 'fx_student_8', 13.5, FALSE, now() - interval '9 days', 'fx_user_admin');

-- Étudiants Ingénieur Web (module Sécurité)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_17', 'fx_student_1', 12.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_18', 'fx_student_2', 8.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_19', 'fx_student_3', 15.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_20', 'fx_student_4', 11.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_21', 'fx_student_5', 17.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_22', 'fx_student_6', 10.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_23', 'fx_student_7', 13.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_24', 'fx_student_8', 9.5, FALSE, now() - interval '8 days', 'fx_user_admin');

-- Étudiants Data Science (module Anglais)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_25', 'fx_student_9', 13.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_26', 'fx_student_10', 15.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_27', 'fx_student_11', 10.0, TRUE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_28', 'fx_student_12', 16.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_29', 'fx_student_13', 12.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_30', 'fx_student_14', 9.0, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_31', 'fx_student_15', 14.5, FALSE, now() - interval '10 days', 'fx_user_admin'),
('fx_grade_32', 'fx_student_16', 17.5, FALSE, now() - interval '10 days', 'fx_user_admin');

-- Étudiants Data Science (module Machine Learning)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_33', 'fx_student_9', 16.5, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_34', 'fx_student_10', 11.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_35', 'fx_student_11', 8.5, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_36', 'fx_student_12', 18.5, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_37', 'fx_student_13', 13.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_38', 'fx_student_14', 10.5, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_39', 'fx_student_15', 15.0, FALSE, now() - interval '9 days', 'fx_user_admin'),
('fx_grade_40', 'fx_student_16', 12.0, FALSE, now() - interval '9 days', 'fx_user_admin');

-- Étudiants Data Science (module Statistiques)
INSERT INTO "grade" ("id", "student_id", "value", "is_locked", "entered_at", "entered_by") VALUES
('fx_grade_41', 'fx_student_9', 11.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_42', 'fx_student_10', 14.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_43', 'fx_student_11', 9.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_44', 'fx_student_12', 17.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_45', 'fx_student_13', 10.0, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_46', 'fx_student_14', 13.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_47', 'fx_student_15', 16.5, FALSE, now() - interval '8 days', 'fx_user_admin'),
('fx_grade_48', 'fx_student_16', 8.0, FALSE, now() - interval '8 days', 'fx_user_admin');

INSERT INTO "grade_manual_notation" ("id", "grade_id", "grade_manual_id") VALUES
('fx_gmn_1', 'fx_grade_1', 'fx_manual_ang'), ('fx_gmn_2', 'fx_grade_2', 'fx_manual_ang'), ('fx_gmn_3', 'fx_grade_3', 'fx_manual_ang'), ('fx_gmn_4', 'fx_grade_4', 'fx_manual_ang'),
('fx_gmn_5', 'fx_grade_5', 'fx_manual_ang'), ('fx_gmn_6', 'fx_grade_6', 'fx_manual_ang'), ('fx_gmn_7', 'fx_grade_7', 'fx_manual_ang'), ('fx_gmn_8', 'fx_grade_8', 'fx_manual_ang'),
('fx_gmn_9', 'fx_grade_9', 'fx_manual_devweb'), ('fx_gmn_10', 'fx_grade_10', 'fx_manual_devweb'), ('fx_gmn_11', 'fx_grade_11', 'fx_manual_devweb'), ('fx_gmn_12', 'fx_grade_12', 'fx_manual_devweb'),
('fx_gmn_13', 'fx_grade_13', 'fx_manual_devweb'), ('fx_gmn_14', 'fx_grade_14', 'fx_manual_devweb'), ('fx_gmn_15', 'fx_grade_15', 'fx_manual_devweb'), ('fx_gmn_16', 'fx_grade_16', 'fx_manual_devweb'),
('fx_gmn_17', 'fx_grade_17', 'fx_manual_sec'), ('fx_gmn_18', 'fx_grade_18', 'fx_manual_sec'), ('fx_gmn_19', 'fx_grade_19', 'fx_manual_sec'), ('fx_gmn_20', 'fx_grade_20', 'fx_manual_sec'),
('fx_gmn_21', 'fx_grade_21', 'fx_manual_sec'), ('fx_gmn_22', 'fx_grade_22', 'fx_manual_sec'), ('fx_gmn_23', 'fx_grade_23', 'fx_manual_sec'), ('fx_gmn_24', 'fx_grade_24', 'fx_manual_sec'),
('fx_gmn_25', 'fx_grade_25', 'fx_manual_ang'), ('fx_gmn_26', 'fx_grade_26', 'fx_manual_ang'), ('fx_gmn_27', 'fx_grade_27', 'fx_manual_ang'), ('fx_gmn_28', 'fx_grade_28', 'fx_manual_ang'),
('fx_gmn_29', 'fx_grade_29', 'fx_manual_ang'), ('fx_gmn_30', 'fx_grade_30', 'fx_manual_ang'), ('fx_gmn_31', 'fx_grade_31', 'fx_manual_ang'), ('fx_gmn_32', 'fx_grade_32', 'fx_manual_ang'),
('fx_gmn_33', 'fx_grade_33', 'fx_manual_ml'), ('fx_gmn_34', 'fx_grade_34', 'fx_manual_ml'), ('fx_gmn_35', 'fx_grade_35', 'fx_manual_ml'), ('fx_gmn_36', 'fx_grade_36', 'fx_manual_ml'),
('fx_gmn_37', 'fx_grade_37', 'fx_manual_ml'), ('fx_gmn_38', 'fx_grade_38', 'fx_manual_ml'), ('fx_gmn_39', 'fx_grade_39', 'fx_manual_ml'), ('fx_gmn_40', 'fx_grade_40', 'fx_manual_ml'),
('fx_gmn_41', 'fx_grade_41', 'fx_manual_stat'), ('fx_gmn_42', 'fx_grade_42', 'fx_manual_stat'), ('fx_gmn_43', 'fx_grade_43', 'fx_manual_stat'), ('fx_gmn_44', 'fx_grade_44', 'fx_manual_stat'),
('fx_gmn_45', 'fx_grade_45', 'fx_manual_stat'), ('fx_gmn_46', 'fx_grade_46', 'fx_manual_stat'), ('fx_gmn_47', 'fx_grade_47', 'fx_manual_stat'), ('fx_gmn_48', 'fx_grade_48', 'fx_manual_stat');

-- =====================================================================================
-- Absences (sur les sessions passées)
-- =====================================================================================

INSERT INTO "absence" ("id", "student_id", "session_id", "reason", "status", "declared_at") VALUES
('fx_absence_1', 'fx_student_2', 'fx_session_1a', 'Maladie', 'VALIDATED', date_trunc('week', now())),
('fx_absence_2', 'fx_student_5', 'fx_session_2a', 'Rendez-vous medical', 'PENDING', date_trunc('week', now()) + interval '1 days'),
('fx_absence_3', 'fx_student_7', 'fx_session_3a', 'Probleme de transport', 'REJECTED', date_trunc('week', now()) + interval '2 days'),
('fx_absence_4', 'fx_student_10', 'fx_session_4a', 'Raison familiale', 'PENDING', date_trunc('week', now()) + interval '3 days'),
('fx_absence_5', 'fx_student_14', 'fx_session_5a', 'Entretien professionnel', 'VALIDATED', date_trunc('week', now()) + interval '4 days');

-- =====================================================================================
-- Entreprises et externes
-- =====================================================================================

INSERT INTO "company" ("id", "name", "siret", "address", "contact_name", "contact_number", "contact_email") VALUES
('fx_company_1', 'TechNova SAS', '12345678900011', '10 Avenue des Champs, 75008 Paris', 'Sophie Lambert', '0601020304', 'contact@technova.fr'),
('fx_company_2', 'DataForge SARL', '23456789000122', '22 Rue du Commerce, 69003 Lyon', 'Karim Benali', '0602030405', 'contact@dataforge.fr'),
('fx_company_3', 'CloudPeak SAS', '34567890100133', '8 Boulevard Voltaire, 75011 Paris', 'Julie Petit', '0603040506', 'contact@cloudpeak.fr');

INSERT INTO "external" ("id", "firstname", "lastname", "email", "type") VALUES
('fx_external_1', 'Alain', 'Petit', 'alain.petit@externe.fr', 'JURY'),
('fx_external_2', 'Denis', 'Blanchard', 'denis.blanchard@externe.fr', 'INVIGILATOR');

-- =====================================================================================
-- Session d'examen (soutenance sur une session future du cours Sécurité)
-- =====================================================================================

INSERT INTO "session_exam" ("id", "session_id", "type", "is_retake", "assessment_id") VALUES
('fx_session_exam_1', 'fx_session_2b', 'DEFENSE', FALSE, 'fx_assessment_2');

INSERT INTO "session_exam_instructor" ("id", "session_exam_id", "instructor_id") VALUES
('fx_sei_1', 'fx_session_exam_1', 'fx_instructor_2');

INSERT INTO "session_exam_student" ("id", "session_exam_id", "student_id") VALUES
('fx_ses_1', 'fx_session_exam_1', 'fx_student_1'),
('fx_ses_2', 'fx_session_exam_1', 'fx_student_2'),
('fx_ses_3', 'fx_session_exam_1', 'fx_student_3');

INSERT INTO "session_exam_external" ("id", "session_exam_id", "external_id") VALUES
('fx_see_1', 'fx_session_exam_1', 'fx_external_1');

-- =====================================================================================
-- Documents administratifs (4 étudiants)
-- =====================================================================================

INSERT INTO "file" ("id", "storage_path", "name", "original_name", "mime_type", "size_bytes", "uploaded_by", "uploaded_at") VALUES
('fx_file_1', 'fixtures/documents/fx_file_1.pdf', 'document_fx_file_1.pdf', 'certificat_scolarite.pdf', 'application/pdf', 182400, 'fx_user_student_1', now() - interval '30 days'),
('fx_file_2', 'fixtures/documents/fx_file_2.pdf', 'document_fx_file_2.pdf', 'attestation_inscription.pdf', 'application/pdf', 210500, 'fx_user_student_2', now() - interval '30 days'),
('fx_file_3', 'fixtures/documents/fx_file_3.pdf', 'document_fx_file_3.pdf', 'certificat_scolarite.pdf', 'application/pdf', 195300, 'fx_user_student_9', now() - interval '30 days'),
('fx_file_4', 'fixtures/documents/fx_file_4.pdf', 'document_fx_file_4.pdf', 'attestation_inscription.pdf', 'application/pdf', 178900, 'fx_user_student_10', now() - interval '30 days');

INSERT INTO "file_document" ("id", "file_id", "student_id", "status") VALUES
('fx_filedoc_1', 'fx_file_1', 'fx_student_1', 'VALID'),
('fx_filedoc_2', 'fx_file_2', 'fx_student_2', 'PENDING'),
('fx_filedoc_3', 'fx_file_3', 'fx_student_9', 'VALID'),
('fx_filedoc_4', 'fx_file_4', 'fx_student_10', 'EXPIRED');

INSERT INTO "document_administrative" ("id", "file_document_id", "type", "expiration") VALUES
('fx_docadmin_1', 'fx_filedoc_1', 'SCHOOL_CERTIFICATE', now() + interval '200 days'),
('fx_docadmin_2', 'fx_filedoc_2', 'ENROLLMENT_CERTIFICATE', now() + interval '200 days'),
('fx_docadmin_3', 'fx_filedoc_3', 'SCHOOL_CERTIFICATE', now() + interval '200 days'),
('fx_docadmin_4', 'fx_filedoc_4', 'ENROLLMENT_CERTIFICATE', now() - interval '15 days');

-- =====================================================================================
-- Contrats d'alternance (2 étudiants)
-- =====================================================================================

INSERT INTO "file" ("id", "storage_path", "name", "original_name", "mime_type", "size_bytes", "uploaded_by", "uploaded_at") VALUES
('fx_file_5', 'fixtures/documents/fx_file_5.pdf', 'contrat_fx_file_5.pdf', 'contrat_alternance.pdf', 'application/pdf', 305200, 'fx_user_student_5', now() - interval '180 days'),
('fx_file_6', 'fixtures/documents/fx_file_6.pdf', 'contrat_fx_file_6.pdf', 'contrat_alternance.pdf', 'application/pdf', 298700, 'fx_user_student_12', now() - interval '180 days');

INSERT INTO "file_document" ("id", "file_id", "student_id", "status") VALUES
('fx_filedoc_5', 'fx_file_5', 'fx_student_5', 'VALID'),
('fx_filedoc_6', 'fx_file_6', 'fx_student_12', 'VALID');

INSERT INTO "document_apprenticeship_contract" ("id", "file_document_id", "company_id", "type", "start_date", "end_date") VALUES
('fx_contract_1', 'fx_filedoc_5', 'fx_company_1', 'APPRENTICESHIP', now() - interval '180 days', now() + interval '20 days'),
('fx_contract_2', 'fx_filedoc_6', 'fx_company_2', 'PROFESSIONALIZATION', now() - interval '180 days', now() + interval '300 days');

-- =====================================================================================
-- Supports de cours (3 premiers cours)
-- =====================================================================================

INSERT INTO "file" ("id", "storage_path", "name", "original_name", "mime_type", "size_bytes", "uploaded_by", "uploaded_at") VALUES
('fx_file_7', 'fixtures/courses/fx_file_7.pdf', 'support_fx_file_7.pdf', 'Support de cours - Chapitre 1.pdf', 'application/pdf', 1540000, 'fx_user_instructor_1', now() - interval '25 days'),
('fx_file_8', 'fixtures/courses/fx_file_8.pdf', 'support_fx_file_8.pdf', 'Support de cours - Chapitre 1.pdf', 'application/pdf', 980000, 'fx_user_instructor_2', now() - interval '25 days'),
('fx_file_9', 'fixtures/courses/fx_file_9.pdf', 'support_fx_file_9.pdf', 'Support de cours - Chapitre 1.pdf', 'application/pdf', 1220000, 'fx_user_instructor_4', now() - interval '25 days');

INSERT INTO "file_course" ("id", "name", "file_id", "course_id") VALUES
('fx_filecourse_1', 'Support de cours - Chapitre 1', 'fx_file_7', 'fx_course_1'),
('fx_filecourse_2', 'Support de cours - Chapitre 1', 'fx_file_8', 'fx_course_2'),
('fx_filecourse_3', 'Support de cours - Chapitre 1', 'fx_file_9', 'fx_course_3');

-- =====================================================================================
-- Conversation privée (administration <-> étudiant) + messages
-- =====================================================================================

INSERT INTO "conversation_private" ("id", "user_a_id", "user_b_id", "conversation_id") VALUES
('fx_convpriv_1', 'fx_user_admin', 'fx_user_student_1', 'fx_conv_private_1');

INSERT INTO "message" ("id", "conversation_id", "sender_id", "content", "created_at") VALUES
('fx_message_1', 'fx_conv_class_iw', 'fx_user_admin', 'Bienvenue dans votre classe ! N''hesitez pas a consulter le planning.', now() - interval '20 days'),
('fx_message_2', 'fx_conv_class_iw', 'fx_user_student_1', 'Merci, bien recu !', now() - interval '19 days'),
('fx_message_3', 'fx_conv_course_1', 'fx_user_instructor_1', 'Le support du prochain cours est disponible, pensez a le consulter avant la session.', now() - interval '10 days'),
('fx_message_4', 'fx_conv_course_1', 'fx_user_student_1', 'Merci pour l''info !', now() - interval '9 days'),
('fx_message_5', 'fx_conv_private_1', 'fx_user_admin', 'Bonjour, votre dossier administratif est presque complet, il manque juste un document.', now() - interval '5 days'),
('fx_message_6', 'fx_conv_private_1', 'fx_user_student_1', 'D''accord, je le depose des que possible, merci !', now() - interval '4 days');

INSERT INTO "message_read" ("id", "message_id", "user_id", "read_at") VALUES
('fx_read_1', 'fx_message_1', 'fx_user_student_1', now() - interval '19 days'),
('fx_read_2', 'fx_message_3', 'fx_user_student_1', now() - interval '9 days'),
('fx_read_3', 'fx_message_5', 'fx_user_student_1', now() - interval '4 days');

-- =====================================================================================
-- Journal d'audit (démo pour /superadmin/securite)
-- =====================================================================================

INSERT INTO "audit_log" ("id", "user_id", "action", "entity_name", "entity_id", "old_value", "new_value", "created_at") VALUES
('fx_audit_1', 'fx_user_admin', 'LOGIN', 'user', 'fx_user_admin', NULL, '{"email":"admin.seed@myges.fr"}', now() - interval '1 days'),
('fx_audit_2', 'fx_user_superadmin', 'LOGIN', 'user', 'fx_user_superadmin', NULL, '{"email":"superadmin.seed@myges.fr"}', now() - interval '1 days'),
('fx_audit_3', 'fx_user_admin', 'VALIDATE', 'absence', 'fx_absence_1', '{"status":"PENDING"}', '{"status":"VALIDATED"}', now() - interval '3 days'),
('fx_audit_4', 'fx_user_admin', 'FREEZE', 'grade', 'fx_grade_1', '{"isLocked":false}', '{"isLocked":true}', now() - interval '2 days'),
('fx_audit_5', 'fx_user_superadmin', 'CREATE', 'company', 'fx_company_1', NULL, '{"name":"TechNova SAS"}', now() - interval '15 days');

COMMIT;
