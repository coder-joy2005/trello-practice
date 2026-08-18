import crypto from "crypto"
import { prisma } from "db"

export default async function getUserDataFromSessionToken(sessionToken: string) {
    const hashedSessionToken = crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex")

    const session = await prisma.session.findUnique({
        where: {
            tokenHash: hashedSessionToken
        }
    })


    const user = await prisma.user.findUnique({
        where: {
            id: session?.userId
        }
    })

    return user

}