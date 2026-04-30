import express from "express"
import cors from "cors"
import { authRouter } from "./auth/routes"

export const app = express()

app.use(cors())
app.use(express.json())
app.use("/api", authRouter)

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Express!" })
})
