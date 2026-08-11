import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

export const sendMagicLink = async (
    email: string,
    token: string
) => {
    const magicLink = `http://localhost:3000/auth/verify?token=${token}`

    await transporter.sendMail({
        from: `"TRELLO(P) <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your login link",

        html: `
      <div>
        <h2>Login to My App</h2>

        <p>Click the button below to continue.</p>

        <a
          href="${magicLink}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#4f46e5;
            color:white;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Login to My App
        </a>

        <p>This link will expire in 15 minutes.</p>

        <p>
          If you didn't request this link, you can safely ignore this email.
        </p>
      </div>
    `
    })
}