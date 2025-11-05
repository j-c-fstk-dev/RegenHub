"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import slugify from "slugify";
import type { ActionType, ImpactDomain } from "@/lib/action-types";
import { Loader2 } from "lucide-react";

export function NewActionTypeDialog({
  open,
  onOpenChange,
  defaultDomain,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDomain: ImpactDomain;
  onCreate: (t: ActionType) => void;
}) {
  const firestore = useFirestore();
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState<ImpactDomain>(defaultDomain);
  const [group, setGroup] = React.useState("");
  const [baseScore, setBaseScore] = React.useState(15);
  const [tags, setTags] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { if (open) setDomain(defaultDomain); }, [open, defaultDomain]);

  const canSave = name.trim().length >= 3 && group.trim().length >= 2 && baseScore >= 5 && baseScore <= 60;

  async function handleSave() {
    if (!canSave || !firestore) return;
    setSaving(true);
    const id = `custom:${slugify(name, { lower: true, strict: true })}`;
    const doc: ActionType = {
      id,
      name: name.trim(),
      domain,
      group: group.trim(),
      baseScore,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      isCommunity: true, // Mark as user-proposed
    };

    try {
      // Tries to save to the official collection (may be denied by rules)
      await addDoc(collection(firestore, "actionTypes"), doc);
    } catch (e) {
      console.warn("Could not save new action type to shared collection (permission rules may apply). Proceeding with custom type for this action.", e);
    } finally {
      setSaving(false);
      onCreate(doc); // Returns the new type to the selector to be used immediately
      onOpenChange(false);
      // Reset form
      setName("");
      setGroup("");
      setTags("");
      setBaseScore(15);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Tipo de Ação</DialogTitle>
          <DialogDescription>
            Sua sugestão poderá ser adicionada à lista oficial no futuro.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nome da Ação</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Limpeza de área urbana" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="domain">Domínio</Label>
                <Select value={domain} onValueChange={(v) => setDomain(v as ImpactDomain)}>
                <SelectTrigger id="domain"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ecological">Ecológico</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="digital">Digital / Sistêmico</SelectItem>
                    <SelectItem value="individual">Individual / Interior</SelectItem>
                </SelectContent>
                </Select>
            </div>
             <div className="grid gap-1.5">
                <Label htmlFor="group">Subgrupo</Label>
                <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Ex.: Restauração" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="baseScore">Pontuação base (5 a 60)</Label>
            <Input
              id="baseScore"
              type="number"
              min={5}
              max={60}
              step={5}
              value={baseScore}
              onChange={(e) => setBaseScore(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex.: limpeza, resíduos, mutirão" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
