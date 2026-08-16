import { WebSocketServer, WebSocket } from "ws"

const wss = new WebSocketServer({ port: 8080 })

// Create a global USERS object
const USERS: Record<string, { userId: string, socket: WebSocket }[]> = {}

wss.on("connection", (socket) => {
    console.log("Client connected!!")
    socket.on("message", (data) => {
        const parsedData = JSON.parse(data)

        if (parsedData.type === "join") {
            const boardId = parsedData.boardId

            // Check if its the first user thats joining
            if (!USERS[boardId]) {
                USERS[boardId] = []
            }

            const newUserId = Math.random().toString()
            USERS[boardId].push({userId: newUserId, socket: socket})

            for(let i = 0; i < USERS[boardId].length; i++){
                socket.send(JSON.stringify({
                    type: "join",
                    userId: newUserId
                }))
            }
        }
    })
})