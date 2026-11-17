import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { imageMarkdown, insertAtCursor } from "@/lib/bodyImage";

/** Uploads a picture and puts it into the story text at the cursor of the textarea with id `targetId`. */
export function BodyImageButton({ targetId, value, onChange, label = "Insert picture into text" }: {
  targetId: string; value: string; onChange: (v: string) => void; label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const pick = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `articles/body-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("banner-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const url = supabase.storage.from("banner-images").getPublicUrl(path).data.publicUrl;
      const caption = window.prompt("Picture caption (optional)") ?? "";
      const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
      const r = insertAtCursor(value, el?.selectionStart, imageMarkdown(url, caption));
      onChange(r.text);
      requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(r.cursor, r.cursor); } });
      toast.success("Picture added to the text.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  };
  return (
    <label className="inline-flex items-center gap-1.5 text-xs border rounded-md px-2.5 h-8 cursor-pointer hover:bg-muted mt-1">
      <ImagePlus className="h-3.5 w-3.5" /> {busy ? "Uploading…" : label}
      <input type="file" accept="image/*" className="hidden" disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
    </label>
  );
}
