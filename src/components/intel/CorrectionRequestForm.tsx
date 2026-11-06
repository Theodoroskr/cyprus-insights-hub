import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  requester_name: z.string().trim().min(2, "Please enter your name").max(120),
  requester_email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(5, "Please describe the correction").max(3000),
});

export function CorrectionRequestForm({ personId }: { personId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ requester_name: "", requester_email: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSending(true);
    const { error } = await supabase.from("correction_requests").insert({ ...parsed.data, person_id: personId } as any);
    setSending(false);
    if (error) return toast.error("Could not send your request. Please try again.");
    toast.success("Thank you — our editors will review your request.");
    setForm({ requester_name: "", requester_email: "", message: "" });
    setOpen(false);
  };

  if (!open) {
    return (
      <p className="text-sm text-muted-foreground">
        Is something on this profile wrong or out of date?{" "}
        <button onClick={() => setOpen(true)} className="text-secondary hover:underline">Request a correction or removal</button>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-border rounded-xl p-5 bg-card">
      <h3 className="font-serif font-bold text-foreground">Request a correction</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Your name" value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} />
        <Input type="email" placeholder="Your email" value={form.requester_email} onChange={(e) => setForm({ ...form, requester_email: e.target.value })} />
      </div>
      <Textarea placeholder="What should be corrected or removed?" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <div className="flex gap-2">
        <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send request"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
