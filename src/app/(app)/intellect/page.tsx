"use client";

import { useEffect, useState } from "react";
import { Garden } from "@/components/intellect/Garden";
import { Journeys } from "@/components/intellect/Journeys";
import { Library } from "@/components/intellect/Library";
import { PageHeader, Tabs } from "@/components/ui";

type Tab = "journeys" | "garden" | "library";

export default function Intellect() {
  const [tab, setTab] = useState<Tab>("journeys");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "garden" || t === "library") setTab(t);
  }, []);
  return (
    <div>
      <PageHeader eyebrow="Intellect" title="Your personal library">
        Learn fewer things, more deeply. Follow a subject over time, connect what you understand, and keep what is worth returning to.
      </PageHeader>
      <Tabs
        tabs={[{ id: "journeys", label: "Learning journeys" }, { id: "garden", label: "Knowledge garden" }, { id: "library", label: "Reading library" }]}
        value={tab}
        onChange={(t) => { setTab(t); window.history.replaceState(null, "", t === "journeys" ? "/intellect" : `/intellect?tab=${t}`); }}
      />
      {tab === "journeys" && <Journeys />}
      {tab === "garden" && <Garden />}
      {tab === "library" && <Library />}
    </div>
  );
}
