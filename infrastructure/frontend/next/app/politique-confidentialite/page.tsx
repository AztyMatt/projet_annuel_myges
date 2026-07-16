import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata = { title: "Confidentialité & cookies — MyGES 2.0" };

export default function PolitiqueConfidentialitePage() {
    return (
        <LegalPageLayout title="Politique de confidentialité & cookies">
            <p>
                Cette page décrit concrètement quelles données MyGES 2.0 collecte, pourquoi, et comment les
                consulter ou les supprimer — conformément au RGPD.
            </p>

            <h2>Données collectées</h2>
            <p>À l&apos;inscription : prénom, nom, adresse email et mot de passe (jamais stocké en clair, haché avec Argon2).</p>
            <p>
                Selon votre usage de la plateforme : notes, absences, documents déposés, messages échangés — ces
                données sont nécessaires au fonctionnement du service et ne sont visibles que par les personnes
                autorisées (vous-même, l&apos;administration, les intervenants concernés).
            </p>

            <h2>Base légale</h2>
            <p>
                Le traitement repose sur votre consentement explicite, recueilli lors de l&apos;inscription (ou lors
                de l&apos;activation du compte si celui-ci a été créé par l&apos;administration) via une case à
                cocher dédiée, horodatée.
            </p>

            <h2>Cookies</h2>
            <p>
                Un seul cookie est déposé par la plateforme : un cookie de session (<code>myges_token</code>),
                technique et strictement nécessaire à la connexion. Il est <strong>httpOnly</strong> (inaccessible en
                JavaScript) et expire automatiquement après 8 heures. Il ne sert ni au suivi publicitaire, ni au
                profilage.
            </p>

            <h2>Analytique</h2>
            <p>
                MyGES 2.0 utilise Umami, un outil d&apos;analyse d&apos;audience auto-hébergé qui{" "}
                <strong>ne dépose aucun cookie</strong> et n&apos;identifie pas individuellement les visiteurs — les
                statistiques collectées sont agrégées et anonymes.
            </p>

            <h2>Vos droits</h2>
            <p>Conformément au RGPD, vous pouvez à tout moment, depuis la page « Paramètres » de votre compte :</p>
            <ul>
                <li>Exporter l&apos;ensemble de vos données personnelles au format JSON</li>
                <li>Supprimer votre compte, sous réserve qu&apos;aucune donnée ne dépende encore de celui-ci (fichiers déposés, messages envoyés, rôle actif)</li>
            </ul>

            <h2>Conservation</h2>
            <p>
                Vos données sont conservées tant que votre compte est actif. Les journaux d&apos;audit liés à des
                actions sensibles (validation d&apos;absence, modification de note, etc.) sont conservés à des fins
                de traçabilité, conformément à l&apos;article 3.8 du cahier des charges du projet.
            </p>
        </LegalPageLayout>
    );
}
