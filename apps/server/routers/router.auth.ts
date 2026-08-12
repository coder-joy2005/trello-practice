import { prisma } from "db";
import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { UserRegisterSchema } from "../types/auth.types";
import { sendMagicLink } from "../services/email";


const router = Router()

// Route to send the magic link to email for register
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

// Route to verify the login
router.get("/verify", async (req: Request, res: Response) => {
    try {
        // Get the token from query link
        const { token } = req.query;

        if (typeof token !== "string") {
            return res.status(400).json({
                message: "Invalid Token"
            })
        }

        // Hash token received from URL
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        // Find token
        const verificationToken =
            await prisma.verificationToken.findUnique({
                where: {
                    tokenHash
                },
                include: {
                    user: true
                }
            })

        if (!verificationToken) {
            return res.status(400).send(
                "Invalid or expired login link"
            )
        }

        // Check expiry
        if (verificationToken.expiresIn < new Date()) {
            await prisma.verificationToken.delete({
                where: {
                    id: verificationToken.id
                }
            })
        }


        const user = verificationToken.user;

        // Verify email
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                isVerifed: true,
            }
        })

        // Token is now used
        await prisma.verificationToken.delete({
            where: {
                id: verificationToken.id
            }
        })

        // Create session
        const sessionToken = crypto.randomBytes(32).toString("hex")

        const sessionTokenHash = 
        crypto
            .createHash("sha256")
            .update(sessionToken)
            .digest("hex")

            await prisma.session.create({
                data: {
                    tokenHash: sessionTokenHash,
                    userId: user.id,
                    expiresAt: new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                    ),
                }
            })

        // Set cookie
        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        // return res.redirect(
        //     "http://localhost:3000/api/v1/dashboard"
        // )

        return res.status(200).json({
            message: "Login Successful!!"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong!!!"
        })
    }
})


export default router