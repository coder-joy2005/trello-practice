import z from "zod"



export const UserRegisterSchema = z.object({
    email: z.email()
})