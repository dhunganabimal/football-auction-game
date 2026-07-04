import { io } from 'socket.io-client'

// Same-origin connection; Vite proxies /socket.io to the backend in dev,
// and in production the client is served from the same host as the server.
export const socket = io('/', {
  autoConnect: true,
  transports: ['websocket', 'polling'],
})

// Promise wrapper around emit-with-acknowledgement.
export function emit(event, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res) => resolve(res || { ok: false, error: 'No response' }))
  })
}
