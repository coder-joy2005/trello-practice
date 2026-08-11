import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import dotenv from "dotenv";
import path from "path"

dotenv.config({
    path: path.resolve(__dirname, ".env"),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}


console.log("Connection URL:", connectionString);

if (!connectionString) {
    console.log("Failed to fetch the connection string!!!");
    process.exit(1);
}

const adapter = new PrismaPg({
    connectionString,
});

export const prisma = new PrismaClient({
    adapter,
});