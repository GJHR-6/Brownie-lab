"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function NotificacionesButton() {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "denied">("idle");

  async function handleSubscribe() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Tu navegador no soporta notificaciones push.");
      return;
    }

    setState("loading");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) { setState("subscribed"); return; }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic).buffer as ArrayBuffer,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  if (state === "subscribed") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
        <Bell className="w-4 h-4" />
        Notificaciones activas
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={state === "loading" || state === "denied"}
      className="flex items-center gap-2 text-sm text-stone-500 hover:text-amber-600 transition-colors disabled:opacity-50"
      title={state === "denied" ? "Permiso denegado en tu navegador" : "Activar notificaciones"}
    >
      {state === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === "denied" ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {state === "denied" ? "Bloqueadas" : "Notificaciones"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
