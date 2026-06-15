import { Trash2, Plus } from "lucide-react";
import { type PricingTier, type TierType, type BillingPeriod, tierTypeMeta } from "@/lib/forecast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Term } from "./Term";


type Props = {
  tiers: PricingTier[];
  onChange: (t: PricingTier[]) => void;
};

const typeBadgeColor: Record<TierType, string> = {
  free:         "bg-muted text-muted-foreground",
  subscription: "bg-primary/15 text-primary",
  one_time:     "bg-chart-2/15 text-chart-2",
  physical:     "bg-chart-3/20 text-chart-3",
  consumable:   "bg-chart-5/15 text-chart-5",
};

export function PricingBuilder({ tiers, onChange }: Props) {
  const update = (id: string, patch: Partial<PricingTier>) =>
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id: string) => onChange(tiers.filter((t) => t.id !== id));
  const add = () =>
    onChange([
      ...tiers,
      { id: crypto.randomUUID(), name: "New tier", type: "subscription", price: 49, mixPct: 10 },
    ]);

  const paidMix = tiers.filter((t) => t.type !== "free").reduce((s, t) => s + t.mixPct, 0);

  return (
    <div className="space-y-3">
      {tiers.map((t) => {
        const showCogs = t.type === "physical" || t.type === "consumable";
        const showRepurchase = t.type === "consumable";
        const priceSuffix =
          t.type === "subscription" ? "/mo"
          : t.type === "consumable" ? "/unit"
          : t.type === "free" ? ""
          : " once";
        return (
          <div key={t.id} className="rounded-lg border border-border bg-secondary/40 p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="mt-5 shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-6">
                <Label className="text-xs text-muted-foreground">
                  <Term term="tier-type">Type</Term>
                </Label>
                <Select
                  value={t.type}
                  onValueChange={(v: TierType) => update(t.id, { type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(tierTypeMeta) as TierType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex flex-col items-start">
                          <span>{tierTypeMeta[k].label}</span>
                          <span className="text-[10px] text-muted-foreground">{tierTypeMeta[k].hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">Price ${priceSuffix}</Label>
                <Input
                  type="number" className="num"
                  value={t.price}
                  disabled={t.type === "free"}
                  onChange={(e) => update(t.id, { price: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">
                  <Term term="mix">Mix %</Term>
                </Label>
                <Input
                  type="number" className="num"
                  value={t.mixPct}
                  disabled={t.type === "free"}
                  onChange={(e) => update(t.id, { mixPct: Number(e.target.value) })}
                />
              </div>

              {showCogs && (
                <div className="col-span-6">
                  <Label className="text-xs text-muted-foreground">
                    <Term term="cogs">Unit cost (COGS) $</Term>
                  </Label>
                  <Input
                    type="number" className="num"
                    value={t.cogs ?? 0}
                    onChange={(e) => update(t.id, { cogs: Number(e.target.value) })}
                  />
                </div>
              )}
              {showRepurchase && (
                <div className="col-span-6">
                  <Label className="text-xs text-muted-foreground">
                    <Term term="repurchase-rate">Reorders / mo</Term>
                  </Label>
                  <Input
                    type="number" step="0.1" className="num"
                    value={t.repurchasesPerMonth ?? 0}
                    onChange={(e) => update(t.id, { repurchasesPerMonth: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${typeBadgeColor[t.type]}`}>
              {tierTypeMeta[t.type].label}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          Paid mix total:{" "}
          <span className={paidMix === 100 ? "text-success num" : "text-warning num"}>{paidMix}%</span>{" "}
          {paidMix !== 100 && "(normalized automatically)"}
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add tier
        </Button>
      </div>
    </div>
  );
}
