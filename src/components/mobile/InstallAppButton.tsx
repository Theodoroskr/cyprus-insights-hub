import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: PromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as PromptEvent;
  });
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** "Install App": native prompt where the browser offers one, otherwise step-by-step help. */
export function InstallAppButton({ onDone, className }: { onDone?: () => void; className?: string }) {
  const [installed, setInstalled] = useState(isStandalone());
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const done = () => setInstalled(true);
    window.addEventListener("appinstalled", done);
    return () => window.removeEventListener("appinstalled", done);
  }, []);

  if (installed) return null;

  const click = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      if (outcome === "accepted") setInstalled(true);
      onDone?.();
      return;
    }
    setHelp(true);
  };

  const ios = isIOS();
  return (
    <>
      <Button size="sm" variant="outline" className={className ?? "w-full"} onClick={click}>
        <Download className="h-4 w-4 mr-2" /> Install App
      </Button>
      <Dialog open={help} onOpenChange={(o) => { setHelp(o); if (!o) onDone?.(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install BusinessHub</DialogTitle>
            <DialogDescription>Add the app to your home screen in a few taps.</DialogDescription>
          </DialogHeader>
          {ios ? (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2"><Share className="h-5 w-5 shrink-0" /> 1. In Safari, tap the <b>Share</b> button.</li>
              <li className="flex gap-2"><PlusSquare className="h-5 w-5 shrink-0" /> 2. Tap <b>Add to Home Screen</b>.</li>
              <li className="flex gap-2"><Download className="h-5 w-5 shrink-0" /> 3. Tap <b>Add</b>.</li>
            </ol>
          ) : (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2"><MoreVertical className="h-5 w-5 shrink-0" /> 1. Open the browser menu (⋮).</li>
              <li className="flex gap-2"><Download className="h-5 w-5 shrink-0" /> 2. Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
