import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"


const connectionString = `${process.env.DATABASE_URL}`

if (!connectionString) {
    console.log("Failed to fetch the connection string!!!")
    process.exit(1)
}

const adapter = new PrismaPg({ connectionString })

export const primsa = new PrismaClient({ adapter })



