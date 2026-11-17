"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { messagesKeyFor } from "@/features/messages/api/messagesApi";

export function useChatSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let retryTimer: number | undefined;

    const connect = () => {
      if (!active) return;
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${scheme}://${window.location.host}/ws`);
      socket.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            conversation_id?: string;
          };
          if (payload.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: messagesKeyFor(payload.conversation_id),
            });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        } catch {
          // Ignore malformed frames; the next query refresh remains available.
        }
      };
      ws.onclose = () => {
        if (active) retryTimer = window.setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket.current?.close();
      socket.current = null;
    };
  }, [enabled, queryClient]);

}
