"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setIsOffline(!navigator.onLine));

    function goOnline() {
      setIsOffline(false);
    }
    function goOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="border-b border-border/80 bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-foreground">
      You&apos;re offline — showing what&apos;s already been loaded. New saves need a connection.
    </div>
  );
}
