import { app } from "./src/app"
import { SEED_ON_START } from "./src/auth/auth.config"
import { seedUsers } from "./src/auth/seed.service"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { db } from "./src/postgres/db"
import path from "path"

const PORT = process.env.BACKEND_PORT

const startServer = async (): Promise<void> => {
  await migrate(db, { migrationsFolder: path.join(__dirname, "drizzle") })

  try {
    await seedUsers()
  } catch (error) {
    console.error("[seed] Failed to seed test accounts:", error)
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    if (SEED_ON_START) {
      console.log("[seed] Test accounts enabled (SEED_ON_START=true).")
    }
  })
}

startServer().catch((error) => {
  console.error("[db] Failed to initialize database:", error)
  process.exit(1)
})
