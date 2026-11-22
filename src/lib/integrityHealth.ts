export const SOURCE_STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ok: { label: "Working", variant: "default" },
  empty: { label: "No items found", variant: "secondary" },
  blocked: { label: "Blocked", variant: "destructive" },
  unreachable: { label: "Not reachable", variant: "destructive" },
  timeout: { label: "Timed out", variant: "destructive" },
  error: { label: "Failing", variant: "destructive" },
  manual: { label: "Manual check", variant: "outline" },
  unknown: { label: "Not checked yet", variant: "outline" },
};
