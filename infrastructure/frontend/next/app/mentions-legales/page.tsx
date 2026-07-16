import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata = { title: "Mentions légales — MyGES 2.0" };

export default function MentionsLegalesPage() {
    return (
        <LegalPageLayout title="Mentions légales">
            <p>
                MyGES 2.0 est un projet réalisé dans le cadre du Projet Annuel de l&apos;ESGI (École Supérieure de
                Génie Informatique), par une équipe d&apos;étudiants en 5e année. Il ne s&apos;agit pas d&apos;un
                service commercial : l&apos;application n&apos;est ni vendue, ni exploitée à des fins lucratives.
            </p>

            <h2>Éditeur</h2>
            <p>
                Le projet est édité par l&apos;équipe étudiante à l&apos;origine de son développement.
                <br />
                <span className="text-gray-400">
                    [Nom(s) et contact de l&apos;équipe à compléter avant diffusion publique]
                </span>
            </p>

            <h2>Hébergement</h2>
            <p>
                L&apos;application est auto-hébergée sur une infrastructure Kubernetes gérée par l&apos;équipe du
                projet (voir la documentation technique du dépôt pour le détail de l&apos;infrastructure).
            </p>

            <h2>Contact</h2>
            <p>
                Pour toute question relative au projet ou à ces mentions légales :{" "}
                <span className="text-gray-400">[adresse de contact à compléter]</span>
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
                Le code source du projet est disponible sur le dépôt Git de l&apos;équipe. Sauf mention contraire,
                les contenus visibles sur cette plateforme (interface, textes) sont la propriété de l&apos;équipe
                projet et ne sont pas destinés à une réutilisation commerciale.
            </p>
        </LegalPageLayout>
    );
}
