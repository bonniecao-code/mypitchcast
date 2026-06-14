import { createFileRoute } from "@tanstack/react-router";
import { TermSheetDecoder } from "@/components/planner/TermSheetDecoder";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Term Sheet Decoder — Pitchcast" },
      { name: "description", content: "Decode fundraising term sheet jargon in plain English. Understand liquidation preference, anti-dilution, vesting, drag-along, and more." },
    ],
  }),
  component: TermSheetDecoder,
});
