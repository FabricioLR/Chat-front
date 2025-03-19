import { io } from "socket.io-client";

export const socket = io(process.env.VITE_API_URL, {
    autoConnect: false
})

