import { app } from "./src/app"
import { SEED_ON_START, seedUsers } from "./src/auth/service"
import { initDb } from "./src/db"

const PORT = process.env.PORT || 3001

const startServer = async (): Promise<void> => {
  await initDb()

  try {
    await seedUsers()
  } catch (error) {
    console.error("[seed] Erreur pendant l'initialisation des comptes de test:", error)
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    if (SEED_ON_START) {
      console.log("[seed] Comptes de test activés (SEED_ON_START=true).")
    }
  })
}

startServer().catch((error) => {
  console.error("[db] Impossible d'initialiser la base de données:", error)
  process.exit(1)
})
