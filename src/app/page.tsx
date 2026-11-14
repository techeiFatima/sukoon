"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { Loading } from "@/components/ui";

export default function Entry() {
  const { ready, profile, mode, session } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (profile?.onboarded_at) router.replace("/today");
    else if (mode === "cloud" && session) router.replace("/welcome");
    else router.replace("/welcome");
  }, [ready, profile, mode, session, router]);
  return <Loading label="" />;
}
