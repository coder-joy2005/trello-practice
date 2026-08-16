import { prisma } from "db"
import crypto from "crypto"
import { CreateOrganisationSchema, UpdateOrganisationSchema } from "../types";
import { Router, type Request, type Response } from "express";

const router = Router()

// Create new organisation
router.post("/create", async (req: Request, res: Response) => {
    try {
        // Parse the input body data using zod
        const { data, success, error } = CreateOrganisationSchema.safeParse(req.body)

        // Extract the session token from cookie
        const sessionToken = req.cookies.session

        if (!sessionToken) {
            return res.status(400).json({
                message: "Unauthorized!!!"
            })
        }


        if (!success) {
            return res.status(400).json({
                message: "Invalid Input!!!",
                error
            })
        }


        // Get the user data form session 
        const hashedSessionToken = crypto
            .createHash("sha256")
            .update(sessionToken)
            .digest("hex")

        const session = await prisma.session.findUnique({
            where: {
                tokenHash: hashedSessionToken
            },
        })

        if (!session) return res.status(404).json({
            message: "No existing session found!! Unauthorised!!!"
        })

        // Get the user data from session token
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId
            }
        })

        if (!user) return res.status(404).json({
            message: "No user found!! Does the user exists!!!"
        })


        // Extract from parsed data
        const { title, description } = data

        // Check for organisation with same title
        const existingOrganisation = await prisma.organisation.findUnique({
            where: {
                title
            }
        })

        // Check if existing organization exists
        if (existingOrganisation) return res.status(422).json({
            message: "Organization with same title already exists!!!"
        })


        // Create the organisation 
        const organisation = await prisma.organisation.create({
            data: {
                title,
                description
            }
        })

        // Add entry in the membership table
        await prisma.membership.create({
            data: {
                orgId: organisation.id,
                userId: user.id
            }
        })

        return res.status(200).json({
            message: "Organisation created successfully!!!!",
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error!!!",
        })
    }
})

// Update existing organisation
router.put("/update/:id", async (req: Request, res: Response) => {
    try {
        const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const { data, error, success } = UpdateOrganisationSchema.safeParse(req.body)
    
        if (!success) return res.status(400).json({
            message: "Invalid Input!!",
            error,
        })
    
        // Extract the session token from cookie
        const sessionToken = req.cookies.session
    
        if (!sessionToken) {
            return res.status(400).json({
                message: "Unauthorized!!!"
            })
        }
        if (!orgId) return res.status(404).json({
            message: "Organisation Id not found!!!"
        })
    
        // Get the user data form session 
        const hashedSessionToken = crypto
            .createHash("sha256")
            .update(sessionToken)
            .digest("hex")
    
        const session = await prisma.session.findUnique({
            where: {
                tokenHash: hashedSessionToken
            },
        })
    
        if (!session) return res.status(404).json({
            message: "No existing session found!! Unauthorised!!!"
        })
    
        // Get the user data from session token
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId
            }
        })
    
        if (!user) return res.status(404).json({
            message: "No user found!! Does the user exists!!!"
        })
    
        // Destructre the data
        const { title, description } = data
    
        const membership = await prisma.membership.findFirst({
            where: {
                orgId,
                userId: user.id
            }
        })
    
        if (!membership) return res.status(404).json({
            message: "This organisation may not be created by you!! Check again!!"
        })
    
    
        const newOrganisation = await prisma.organisation.update({
            where: {
                id: orgId
            },
            data: {
                title,
                description
            }
        })
    
    
        if (!newOrganisation) return res.status(400).json({
            message: "Faile to update organisation!!"
        })
    
        return res.status(200).json({
            message: "Updated Organisation Successfully!!!"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error!!!"
        })
    }
})

export default router