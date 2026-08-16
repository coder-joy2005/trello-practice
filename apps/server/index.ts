import cors from "cors"
import authRouter from "./routers/router.auth"
import organisationRouter from "./routers/router.organisation" 
import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors({
    credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/api/v1/auth", authRouter)
app.use("/api/v1/organisation", organisationRouter)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})