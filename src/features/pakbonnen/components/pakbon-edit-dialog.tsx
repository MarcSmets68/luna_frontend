"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePakbon, type PakbonItem, type UpdatePakbonPayload } from "@/lib/api-client";
import { confirmDiscardChanges, useUnsavedChanges } from "@/lib/unsaved-changes";

const fields = [
  ["uRef", "Uw referentie"], ["opm", "Opmerking"], ["lnaam", "Levernaam"],
  ["ladres", "Leveradres"], ["lpostnr", "Leverpostnr"], ["lstad", "Leverstad"],
  ["verzending", "Verzending"], ["tracknr", "Tracknr"],
] as const;

export function PakbonEditDialog({ pakbon, onClose, onSaved }: {
  pakbon: PakbonItem; onClose: () => void; onSaved: (item: PakbonItem) => void;
}) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, pakbon[key]])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = fields.some(([key]) => form[key] !== pakbon[key]);
  const markSaved = useUnsavedChanges(dirty);

  function close() {
    if (saving || !confirmDiscardChanges(dirty)) return;
    markSaved();
    onClose();
  }

  async function save() {
    const payload: UpdatePakbonPayload = {};
    for (const [key] of fields) if (form[key] !== pakbon[key]) payload[key] = form[key];
    setSaving(true);
    setError(null);
    try {
      const updated = await updatePakbon(pakbon.paknr, payload);
      markSaved();
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan van de pakbon mislukt.");
    } finally { setSaving(false); }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Pakbon bewerken</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map(([key, label]) => <label key={key} className="text-sm font-medium">{label}
          <Input value={form[key]} disabled={saving} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} />
        </label>)}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" disabled={saving} onClick={close}>Annuleren</Button>
        <Button disabled={saving || !dirty} onClick={save}>{saving ? "Bezig..." : "Opslaan"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
