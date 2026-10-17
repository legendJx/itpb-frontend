"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

// Connects the shared socket and tracks its status.
//   const { status, request } = useSocket();
export function useSocket() {
  const [status, setStatus] = useState(socket.status);

  useEffect(() => {
    socket.connect();
    setStatus(socket.status);
    return socket.on("status", setStatus);
  }, []);

  return {
    status,
    request: socket.request.bind(socket),
    send: socket.send.bind(socket),
  };
}

// Subscribes to a server-pushed event for the lifetime of the component.
//   useSocketEvent("draftPick", (pick) => ...);
export function useSocketEvent(type, handler) {
  useEffect(() => socket.on(type, handler), [type, handler]);
}
