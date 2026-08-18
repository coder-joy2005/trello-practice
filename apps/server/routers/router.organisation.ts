import { prisma } from "db"
import crypto from "crypto"
import { Router, type Request, type Response } from "express";
import getUserDataFromSessionToken from "../services/getUserData";
import { CreateOrganisationSchema, UpdateOrganisationSchema } from "../types";

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
        // Get the organisation id from url params
        const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

        if (!orgId) return res.status(404).json({
            message: "Organisation Id not found!!!"
        })

        // Extract the session token from cookie
        const sessionToken = req.cookies.session

        if (!sessionToken) {
            return res.status(400).json({
                message: "Unauthorized!!!"
            })
        }

        // Get user data from session token of cookie
        const user = await getUserDataFromSessionToken(sessionToken);

        if (!user) return res.status(404).json({
            message: "Unauthorized or User not found!!!!"
        })

        // Parse the req body properly 
        const { data, error, success } = UpdateOrganisationSchema.safeParse(req.body)

        if (!success) return res.status(400).json({
            message: "Invalid Input!!",
            error,
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

// Route to delete an organisation
router.delete("/delete/:id", async (req: Request, res: Response) => {
    try {
        // Get the org id from url params
        const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

        if (!orgId) return res.status(404).json({
            message: "No orgId found!!!"
        })

        // Get the session token from cookie and fetch user data
        const sessionToken = req.cookies.session

        const user = await getUserDataFromSessionToken(sessionToken)

        if (!user) return res.status(404).json({
            message: "Unauthorized!! No user found!!"
        })

        const membership = await prisma.membership.findFirst({
            where: {
                orgId,
                userId: user.id
            }
        })

        if (!membership) return res.status(400).json({
            message: "Unauthorized!!! Cannot delete this organisation!!"
        })

        // Delete the memberships first
        await prisma.membership.deleteMany({
            where: {
                orgId
            }
        })
        
        const deletedOrganisation = await prisma.organisation.delete({
            where: {
                id: orgId
            }
        })

        return res.status(200).json({
            message: "Organisation deleted successfully!!!",
            deletedOrganisation
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error!!!",
            error
        })
    }
})

// Get all organisation
router.get("/all", async (req: Request, res: Response) => {
    try {
        // Get the session token and user data form cookie
        const sessionToken = req.cookies.session

        if (!sessionToken) return res.status(404).json({
            message: "Session token not found!!!"
        })

        // Get the user 
        const user = await getUserDataFromSessionToken(sessionToken)

        if (!user) return res.status(404).json({
            message: "Unauthorized!! No such user found!!!"
        })


        // Get all the memberships for that user
        const memberships = await prisma.membership.findMany({
            where: {
                userId: user.id
            },
            include: {
                organisation: true
            }
        })


        // Get all the organisation
        const organisations = memberships.map(membership => membership.organisation)

        return res.status(200).json({
            message: "Organisation Fetched!!",
            organisations
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error!!!"
        })
    }
})

// Get the details of a specific orgnisation
router.get("/:id", async (req: Request, res: Response) => {
    try {
        // Get the id from the urls params
        const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

        // Get session token from cookie
        const sessionToken = req.cookies.session

        if (!sessionToken) return res.status(400).json({
            message: "Unauthorized!!!"
        })

        // Get user from seesion token
        const user = await getUserDataFromSessionToken(sessionToken)

        if (!user) return res.status(404).json({
            message: "Unauthorized!!! No user found!!!"
        })


        // Check membership for that user
        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
            },
            include: {
                organisation: true
            }
        })

        if (!membership) return res.status(404).json({
            message: "No such organisation found!!!"
        })


        return res.status(200).json({
            message: "Organisation retrieved successfully!!!",
            organisation: membership.organisation
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error!!!!"
        })
    }
})

export default router