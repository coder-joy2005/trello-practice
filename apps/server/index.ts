import cors from "cors"
import authRouter from "./routers/router.auth"
import express, { type Request, type Response } from "express";

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/v1/auth", authRouter)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})