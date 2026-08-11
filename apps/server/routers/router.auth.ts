import { prisma } from "db";
import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { UserRegisterSchema } from "../types/auth.types";
import { sendMagicLink } from "../services/email";


const router = Router()

router.post("/register", async (req: Request, res: Response) => {
    try {
        // Get the email and name from body
        const { data, error } = UserRegisterSchema.safeParse(req.body)

        if (error) {
            return res.status(500).json({
                message: "Some error occured!!!!"
            })
        }


        const { email } = data;

        // Find existing user
        let user = await prisma.user.findUnique({
            where: {
                email
            }
        })


        // Create user if they don't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email
                },
            });
        }


        // Generate random token
        const token = crypto.randomBytes(32).toString("hex")

        // Hash token
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        // Expires in 15 minutes
        const expiresIn = new Date(
            Date.now() + 15 * 60 * 1000
        )


        // Store hashed token
        await prisma.verificationToken.create({
            data: {
                tokenHash,
                userId: user.id,
                expiresIn
            }
        })

        // Send email
        await sendMagicLink(email, token)

        return res.status(200).json({
            message: "Magic link sent",
        });
    } catch (error) {
        console.log("Error: ", error)
        return res.status(500).json({
            message: "Something went wrong",
            error
        })
    }
})


export default router