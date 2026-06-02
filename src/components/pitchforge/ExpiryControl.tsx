import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Infinity as InfinityIcon } from "lucide-react";
import { setPitchExpiry, presetToDate, formatExpiry, type ExpiryPreset } from "@/services/pitches";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  pitchId: string;
  expiresAt: string | null;
  onChange?: (newExpiresAt: string | null) => void;
}

const PRESETS: { label: string; value: ExpiryPreset }[] = [
  { label: "5 days", value: "5d" },
  { label: "15 days", value: "15d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const ExpiryControl = ({ pitchId, expiresAt, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const apply = async (date: Date | null) => {
    try {
      setBusy(true);
      await setPitchExpiry(pitchId, date);
      onChange?.(date ? date.toISOString() : null);
      toast.success(date ? `Expiry updated · ${formatExpiry(date.toISOString())}` : "This pitch will be kept forever");
      setOpen(false);
      setShowCal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update expiry");
    } finally { setBusy(false); }
  };

  const isExpiringSoon = expiresAt && new Date(expiresAt).getTime() - Date.now() < 3 * 86400000;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="glass" className={cn(isExpiringSoon && "text-destructive")}>
          {expiresAt ? <Clock className="h-3 w-3" /> : <InfinityIcon className="h-3 w-3" />}
          {formatExpiry(expiresAt)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[16rem] p-2 pointer-events-auto" align="end">
        {!showCal ? (
          <div className="flex flex-col gap-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">Keep this pitch for…</p>
            {PRESETS.map((p) => (
              <Button key={p.value} variant="ghost" size="sm" className="justify-start" disabled={busy}
                onClick={() => apply(presetToDate(p.value))}>
                <Clock className="h-3 w-3" /> {p.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="justify-start" disabled={busy} onClick={() => setShowCal(true)}>
              Custom date…
            </Button>
            <div className="my-1 h-px bg-border" />
            <Button variant="ghost" size="sm" className="justify-start" disabled={busy} onClick={() => apply(null)}>
              <InfinityIcon className="h-3 w-3" /> Never expire
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <Calendar
              mode="single"
              disabled={(d) => d <= new Date()}
              onSelect={(d) => d && apply(d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setShowCal(false)}>Back</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ExpiryControl;