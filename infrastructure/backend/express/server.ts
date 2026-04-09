import express from "express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())
const router = express.Router()
app.use("/api", router)

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express!" })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})