import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  apiUrl?.replace(/\/api$/, "") ||
  "http://localhost:4000";

export function createSocket() {
  return io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: true
  });
}
