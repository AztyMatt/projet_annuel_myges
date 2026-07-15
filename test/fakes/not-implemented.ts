/**
 * Stubs génériques pour les dépendances d'un use case que le test en cours n'exerce pas.
 * Beaucoup de use cases ont 10+ dépendances (repositories croisés) mais un seul test ne
 * traverse jamais tous les chemins — plutôt que ré-écrire chaque méthode de chaque interface
 * pour ne jamais les appeler, on renvoie une fonction/un objet dont *tout* appel échoue
 * bruyamment : si un test finit par emprunter un chemin non prévu, l'erreur pointe directement
 * vers la méthode manquante au lieu d'un `undefined is not a function` opaque.
 */
export function notImplementedMethod(label: string, method: string): () => never {
    return () => {
        throw new Error(`fake "${label}" non branché sur la méthode "${method}" — ce test ne devrait pas l'appeler`);
    };
}

/** Stub d'une interface entière — pour les dépendances qu'un test ne touche jamais du tout. */
export function notImplementedRepository<T extends object>(label: string): T {
    return new Proxy(
        {},
        {
            get(_target, prop) {
                return notImplementedMethod(label, String(prop));
            },
        },
    ) as T;
}
