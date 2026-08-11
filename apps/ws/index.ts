import { WebSocketServer } from "ws"

const wss = new WebSocketServer({ port: 8080 })

wss.on("connection", (socket) => {
    console.log("Client connected!!")
    // Do the necessary action after connection!!!
})