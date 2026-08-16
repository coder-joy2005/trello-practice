import { prisma } from "db"

const ADMIN_NAME = "JOY"
const ADMIN_EMAIL = "coder.joy2005@gmail.com"

const seedAdmin = async () => {
    try {
        // check if existing user/admin with email
        const existingUser = await prisma.user.findUnique({
            where: {
                email: ADMIN_EMAIL
            }
        })


        if(!existingUser) {
            const user = await prisma.user.create({
                data: {
                    email: ADMIN_EMAIL,
                    name: ADMIN_NAME,
                    role: "ADMIN",
                    isVerifed: true,
                }
            })
            
            if(user) {
                console.log("ADMIN data seeded successfully!!!!")
            }
        }
    } catch (error) {
        console.error("Something went wrong while seeding the admin!!!")
    }
}

seedAdmin()