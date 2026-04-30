import { app } from "./src/app"
import { SEED_ON_START, seedUsers } from "./src/auth/service"

const PORT = process.env.PORT || 3001
seedUsers()
  .catch((error) => {
    console.error("[seed] Erreur pendant l'initialisation des comptes de test:", error)
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      if (SEED_ON_START) {
        console.log("[seed] Comptes de test activés (SEED_ON_START=true).")
      }
    })
  })