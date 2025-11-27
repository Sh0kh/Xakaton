import { io } from "socket.io-client";

const socket = io(`https://dev.ithubs.uz`, {
    path: "/hackathon/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 20000, // 20s
});

export default socket;
