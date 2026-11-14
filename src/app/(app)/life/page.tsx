"use client";

import { useEffect, useState } from "react";
import { Alignment } from "@/components/life/Alignment";
import { Goals } from "@/components/life/Goals";
import { Offline } from "@/components/life/Offline";
import { Values } from "@/components/life/Values";
import { PageHeader, Tabs } from "@/components/ui";

type Tab = "values" | "alignment" | "goals" | "offline";

export default function Life() {
  const [tab, setTab] = useState<Tab>("values");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "alignment" || t === "goals" || t === "offline") setTab(t);
  }, []);
  return (
    <div>
      <PageHeader eyebrow="My Life" title="Live by what you value">
        Translate what matters into how you actually spend your days.
      </PageHeader>
      <Tabs
        tabs={[{ id: "values", label: "Values" }, { id: "alignment", label: "Life alignment" }, { id: "goals", label: "Goals" }, { id: "offline", label: "Offline life" }]}
        value={tab}
        onChange={(t) => { setTab(t); window.history.replaceState(null, "", t === "values" ? "/life" : `/life?tab=${t}`); }}
      />
      {tab === "values" && <Values />}
      {tab === "alignment" && <Alignment />}
      {tab === "goals" && <Goals />}
      {tab === "offline" && <Offline />}
    </div>
  );
}
