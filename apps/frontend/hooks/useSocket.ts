"use client";

import { useEffect } from "react";
import { mutate } from "swr";
import { getSocket } from "@/lib/socket";
import { useAppStore } from "@/store/useAppStore";

export function useSocket() {
  const user = useAppStore((state) => state.user);
  const setSocketConnected = useAppStore((state) => state.setSocketConnected);
  const setAIState = useAppStore((state) => state.setAIState);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);
    socket.connect();

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("email:new", () => mutate("/emails"));
    socket.on("email:replied", () => mutate("/emails"));
    socket.on("client:status_changed", () => mutate("/clients"));
    const revalidateFollowups = () =>
      mutate((key) => typeof key === "string" && key.includes("/followups"), undefined, { revalidate: true });
    socket.on("followup:scheduled", revalidateFollowups);
    socket.on("followup:sent", revalidateFollowups);
    socket.on("ai:intent_detected", (payload) => {
      setAIState({ detectedIntent: payload.intent });
      mutate("/emails");
    });
    socket.on("ai:reply_ready", (payload) => {
      setAIState({ aiReply: payload.reply, isAILoading: false });
      mutate("/emails");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user?.id, setSocketConnected, setAIState]);
}
