import express from "express"
import cors from "cors"
import { authRouter } from "@express/src/auth/routes"

export const app = express()

app.use(cors())
app.use(express.json())
app.use("/api", authRouter)

app.get("/api/hello", (_request, response) => {
  response.json({ message: "Hello from Express!" })
})
