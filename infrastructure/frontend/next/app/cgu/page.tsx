import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata = { title: "CGU — MyGES 2.0" };

export default function CguPage() {
    return (
        <LegalPageLayout title="Conditions générales d'utilisation">
            <p>
                Les présentes conditions régissent l&apos;utilisation de MyGES 2.0, plateforme de gestion scolaire
                développée dans le cadre d&apos;un Projet Annuel étudiant (ESGI). En créant un compte ou en
                utilisant la plateforme, vous acceptez les conditions décrites ci-dessous.
            </p>

            <h2>1. Objet de la plateforme</h2>
            <p>
                MyGES 2.0 permet la gestion du planning, des notes, des absences, des documents administratifs et de
                la messagerie entre étudiants, intervenants et administration d&apos;un établissement.
            </p>

            <h2>2. Création de compte et attribution des rôles</h2>
            <p>
                L&apos;inscription (prénom, nom, email, mot de passe) ne donne pas automatiquement accès à la
                plateforme : un compte nouvellement créé reste en attente jusqu&apos;à ce qu&apos;un administrateur
                lui attribue un rôle (étudiant, intervenant ou administration). Un compte peut également être créé
                directement par l&apos;administration, auquel cas l&apos;utilisateur reçoit un lien par email pour
                définir son mot de passe et activer son compte.
            </p>

            <h2>3. Responsabilités de l&apos;utilisateur</h2>
            <ul>
                <li>Fournir des informations exactes lors de l&apos;inscription</li>
                <li>Conserver la confidentialité de son mot de passe et de son accès à la double authentification</li>
                <li>Ne pas tenter d&apos;accéder à des données ou fonctionnalités réservées à d&apos;autres rôles</li>
                <li>Signaler toute utilisation suspecte de son compte</li>
            </ul>

            <h2>4. Disponibilité</h2>
            <p>
                MyGES 2.0 est un projet pédagogique : la plateforme est fournie « en l&apos;état », sans garantie de
                disponibilité continue. Des interruptions de service peuvent survenir, notamment lors de mises à
                jour ou de maintenances.
            </p>

            <h2>5. Données personnelles</h2>
            <p>
                Le traitement des données personnelles est détaillé dans la{" "}
                <a href="/politique-confidentialite" className="text-[#002C6E] underline">
                    politique de confidentialité
                </a>
                .
            </p>

            <h2>6. Modification des conditions</h2>
            <p>
                Ces conditions peuvent évoluer au fil du développement du projet. La version en vigueur est celle
                affichée sur cette page.
            </p>
        </LegalPageLayout>
    );
}
