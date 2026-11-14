"use client";

import { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import { AttentionCheckin } from "@/components/mind/AttentionCheckin";
import { Boundaries } from "@/components/mind/Boundaries";
import { InformationDiet } from "@/components/mind/InformationDiet";
import { ReturnToPresent } from "@/components/mind/ReturnToPresent";
import { Button, PageHeader, Tabs } from "@/components/ui";

type Tab = "attention" | "diet" | "boundaries";

export default function Mind() {
  const [tab, setTab] = useState<Tab>("attention");
  const [reset, setReset] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("reset") === "1") setReset(true);
    const t = p.get("tab");
    if (t === "diet" || t === "boundaries") setTab(t);
  }, []);

  return (
    <div>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <PageHeader eyebrow="Mind" title="Reclaim your attention">
          Your attention is the substance of your life. Notice where it goes, decide where it belongs, and practise returning.
        </PageHeader>
        <Button variant="secondary" size="lg" className="mb-10 shrink-0 md:mb-14" onClick={() => setReset(true)}>
          <Wind size={16} /> Return to the present
        </Button>
      </div>

      <Tabs
        tabs={[
          { id: "attention", label: "Attention check-in" },
          { id: "diet", label: "Information diet" },
          { id: "boundaries", label: "Digital boundaries" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "attention" && <AttentionCheckin />}
      {tab === "diet" && <InformationDiet />}
      {tab === "boundaries" && <Boundaries />}

      <ReturnToPresent
        open={reset}
        onClose={() => {
          setReset(false);
          if (window.location.search) window.history.replaceState(null, "", "/mind");
        }}
      />
    </div>
  );
}
