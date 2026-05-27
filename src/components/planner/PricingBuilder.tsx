import { Trash2, Plus } from "lucide-react";
import type { PricingTier } from "@/lib/forecast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  tiers: PricingTier[];
  onChange: (t: PricingTier[]) => void;
};

export function PricingBuilder({ tiers, onChange }: Props) {
  const update = (id: string, patch: Partial<PricingTier>) =>
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id: string) => onChange(tiers.filter((t) => t.id !== id));
  const add = () =>
    onChange([
      ...tiers,
      {
        id: crypto.randomUUID(),
        name: "New tier",
        type: "subscription",
        price: 49,
        mixPct: 10,
      },
    ]);

  const paidMix = tiers
    .filter((t) => t.type !== "free")
    .reduce((s, t) => s + t.mixPct, 0);

  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <div
          key={t.id}
          className="grid grid-cols-12 gap-2 items-end rounded-lg border border-border bg-secondary/40 p-3"
        >
          <div className="col-span-12 sm:col-span-4">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={t.name}
              onChange={(e) => update(t.id, { name: e.target.value })}
            />
          </div>
          <div className="col-span-6 sm:col-span-3">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={t.type}
              onValueChange={(v: PricingTier["type"]) => update(t.id, { type: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="one_time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Price $</Label>
            <Input
              type="number"
              className="num"
              value={t.price}
              disabled={t.type === "free"}
              onChange={(e) => update(t.id, { price: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Mix %</Label>
            <Input
              type="number"
              className="num"
              value={t.mixPct}
              disabled={t.type === "free"}
              onChange={(e) => update(t.id, { mixPct: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          Paid mix total: <span className={paidMix === 100 ? "text-success num" : "text-warning num"}>{paidMix}%</span>{" "}
          {paidMix !== 100 && "(normalized automatically)"}
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add tier
        </Button>
      </div>
    </div>
  );
}
