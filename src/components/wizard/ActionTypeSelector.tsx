"use client";

import * as React from "react";
import Fuse from "fuse.js";
import clsx from "clsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from '@/firebase';
import { collection, getDocs } from "firebase/firestore";
import { ACTION_TYPES_SEED, type ActionType, type ImpactDomain } from "@/lib/action-types";
import { NewActionTypeDialog } from "./NewActionTypeDialog";

type Props = {
  actionId: string; // /actions/{actionId} para autosave
  initialValue?: { id: string; name: string; baseScore: number; domain: ImpactDomain } | null;
  onSelect?: (v: { id: string; name: string; baseScore: number; domain: ImpactDomain }) => void;
  className?: string;
};

const DOMAIN_LABEL: Record<ImpactDomain, string> = {
  ecological: "Ecológico",
  social: "Social",
  digital: "Digital / Sistêmico",
  individual: "Individual / Interior",
};

export function ActionTypeSelector({ actionId, initialValue, onSelect, className }: Props) {
  const firestore = useFirestore();
  const [allTypes, setAllTypes] = React.useState<ActionType[]>(ACTION_TYPES_SEED);
  const [query, setQuery] = React.useState("");
  const [activeDomain, setActiveDomain] = React.useState<ImpactDomain>((initialValue?.domain ?? "ecological"));
  const [openNew, setOpenNew] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState(initialValue ?? null);

  // fetch remoto (uma única vez)
  React.useEffect(() => {
    if (!firestore) return;
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "actionTypes"));
        if (!snap.empty) {
          const list: ActionType[] = [];
          snap.forEach((d) => list.push(d.data() as ActionType));
          const merged = mergeById(ACTION_TYPES_SEED, list);
          setAllTypes(merged);
        }
      } catch {
        // fica no seed
      }
    })();
  }, [firestore]);

  const fuse = React.useMemo(() => {
    return new Fuse(allTypes, {
      keys: ["name", "tags", "description", "group"],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [allTypes]);

  const filtered = React.useMemo(() => {
    const byDomain = allTypes.filter((t) => t.domain === activeDomain);
    if (!query.trim()) return groupBy(byDomain, (t) => t.group);
    const res = fuse.search(query).map(r => r.item).filter(t => t.domain === activeDomain);
    return groupBy(res, (t) => t.group);
  }, [allTypes, activeDomain, query, fuse]);

  const saveSelection = React.useMemo(() => debounce(async (v: { id: string; name: string; baseScore: number; domain: ImpactDomain }) => {
    setSaving(true);
    try {
      if(!firestore) return;
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const ref = doc(firestore, "actions", actionId);
      const payload = {
        actionTypeId: v.id,
        actionTypeName: v.name,
        baseScore: v.baseScore,
        domain: v.domain,
        updatedAt: serverTimestamp(),
        status: "draft",
      };
      await setDoc(ref, payload, { merge: true });
      localStorage.setItem(`action:${actionId}:type`, JSON.stringify(payload));
    } finally {
      setSaving(false);
    }
  }, 700), [actionId, firestore]);

  const handleSelect = (t: ActionType) => {
    const v = { id: t.id, name: t.name, baseScore: t.baseScore, domain: t.domain };
    setSelected(v);
    onSelect?.(v);
    // saveSelection(v); // Autosave is disabled for now.
  };

  return (
    <div className={clsx("w-full", className)}>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        Tipo de ação <span className="text-neutral-400">(busque ou selecione)</span>
      </label>
      <div role="combobox" aria-expanded="true" aria-owns="actiontype-listbox" className="relative">
        <Input
          placeholder={selected ? `${selected.id.startsWith("custom:") ? "Custom: " : ""}${selected.name}` : "Ex.: horta, plantio, oficina, app..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="pr-28"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
          {saving ? "Salvando..." : ""}
        </div>

        <div className="mt-2 rounded-lg border bg-background shadow-lg">
          <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as ImpactDomain)}>
            <TabsList className="grid w-full grid-cols-2 h-auto sm:grid-cols-4 gap-1 p-1">
              <TabsTrigger value="ecological">🌿 {DOMAIN_LABEL.ecological}</TabsTrigger>
              <TabsTrigger value="social">🤝 {DOMAIN_LABEL.social}</TabsTrigger>
              <TabsTrigger value="digital">💻 {DOMAIN_LABEL.digital}</TabsTrigger>
              <TabsTrigger value="individual">🧘‍♀️ {DOMAIN_LABEL.individual}</TabsTrigger>
            </TabsList>

            {(Object.keys(filtered).length === 0 && query.trim()) && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{query}".
                <Button variant="link" className="ml-1" onClick={() => setOpenNew(true)}>
                  Adicionar um novo tipo?
                </Button>
              </div>
            )}

            {(["ecological","social","digital","individual"] as ImpactDomain[]).map((dom) => (
              <TabsContent key={dom} value={dom} className="max-h-80 overflow-y-auto p-1">
                {Object.entries(filtered).map(([group, items]) => (
                  <div key={group} className="mb-3">
                    <div className="sticky top-0 z-10 bg-background/80 px-2 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                      {group}
                    </div>
                    <ul id="actiontype-listbox" role="listbox" className="space-y-1">
                      {items.map((t) => (
                        <li
                          key={t.id}
                          role="option"
                          aria-selected={selected?.id === t.id}
                          className={clsx(
                            "flex cursor-pointer items-start justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-secondary",
                            selected?.id === t.id && "bg-primary/10 hover:bg-primary/20"
                          )}
                          onClick={() => handleSelect(t)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{t.emoji ?? "•"}</span>
                              <span className="truncate font-medium text-sm text-foreground">{highlight(t.name, query)}</span>
                            </div>
                            {t.description && (
                              <div className="pl-7 text-xs text-muted-foreground">{highlight(t.description, query)}</div>
                            )}
                          </div>
                          <div className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">+{t.baseScore} pts</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                 <div className="p-2 border-t mt-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpenNew(true)}>
                    ➕ Não encontrou? Adicione um novo tipo de ação
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <NewActionTypeDialog
        open={openNew}
        onOpenChange={setOpenNew}
        defaultDomain={activeDomain}
        onCreate={(t) => handleSelect(t)}
      />
    </div>
  );
}


function groupBy<T, K extends string | number>(arr: T[], by: (x: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = by(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function mergeById(seed: ActionType[], remote: ActionType[]): ActionType[] {
  const map = new Map<string, ActionType>();
  seed.forEach((s) => map.set(s.id, s));
  remote.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

function debounce<F extends (...args: any[]) => void>(fn: F, ms = 500) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function highlight(text: string | undefined, q: string) {
  if (!text || !q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  const before = text.slice(0, i);
  const match = text.slice(i, i + q.length);
  const after = text.slice(i + q.length);
  return (
    <>
      {before}<mark className="rounded bg-yellow-100 px-0.5 text-black">{match}</mark>{after}
    </>
  );
}
