import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  apiUrl?.replace(/\/api$/, "") ||
  "http://localhost:4000";

export function createSocket({ room } = {}) {
  const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    withCredentials: true
  });

  if (room) {
    const joinRoom = () => socket.emit("poll:join", room);
    socket.on("connect", joinRoom);

    if (socket.connected) {
      joinRoom();
    }
  }

  return socket;
}

export function createDebouncedHandler(callback, delay = 180) {
  let timer = 0;

  return {
    handle(value) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(value), delay);
    },
    cancel() {
      window.clearTimeout(timer);
    }
  };
}
