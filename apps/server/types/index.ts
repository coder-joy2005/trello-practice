import z from "zod"



export const UserRegisterSchema = z.object({
    email: z.email()
})

export const CreateOrganisationSchema = z.object({
    title: z.string().min(3).max(10),
    description: z.string().min(5).max(30)
})

export const UpdateOrganisationSchema = z.object({
    title: z.string().min(3).max(10).optional(),
    description: z.string().min(5).max(30).optional()
})