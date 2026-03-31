import express from "express"
import cors from "cors"
import bodyParser from "body-parser"

const app = express()

app.use(cors())
const router = express.Router()
app.use(bodyParser.json())
app.use("/api", router)

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express!" })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})