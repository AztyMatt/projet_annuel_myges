import path from "node:path";
import dotenv from "dotenv";

// Exécuté dans chaque worker de test, avant l'import des fichiers de test — contrairement à
// globalSetup (qui tourne une seule fois hors des workers), c'est ici qu'il faut charger les
// variables d'environnement pour qu'elles soient visibles par le code applicatif importé
// ensuite (ex: postgres/db.ts, token-provider.adapter.ts lisent process.env au chargement).
dotenv.config({ path: path.resolve(__dirname, "../.env.test.local") });
