import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Download, Globe, Link2, Lock, Star, Trash2 } from "lucide-react";
import type { PitchRow } from "@/services/community";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { buildShareUrl } from "@/services/community";
import { toast } from "sonner";

interface Props {
  pitch: PitchRow;
  rating?: { avg: number; count: number; mine?: number };
  bookmarked?: boolean;
  onTogglePublic?: (id: string, next: boolean) => void;
  onRate?: (id: string, value: number) => void;
  onBookmark?: (id: string, on: boolean) => void;
  onDelete?: (id: string) => void;
  ownerView?: boolean;
}

const Stars = ({ value, mine, onRate }: { value: number; mine?: number; onRate?: (n: number) => void }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled = onRate ? (mine ?? 0) >= n : value >= n - 0.25;
      return (
        <button
          key={n}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          className={onRate ? "cursor-pointer" : "cursor-default"}
          aria-label={`Rate ${n} stars`}
        >
          <Star className={`h-4 w-4 ${filled ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      );
    })}
  </div>
);

const PitchCard = ({ pitch, rating, bookmarked, onTogglePublic, onRate, onBookmark, onDelete, ownerView }: Props) => {
  const copyShare = async () => {
    if (!pitch.is_public && ownerView && onTogglePublic) {
      onTogglePublic(pitch.id, true);
    }
    await navigator.clipboard.writeText(buildShareUrl(pitch.share_token));
    toast.success("Share link copied");
  };

  return (
    <Card className="flex flex-col gap-3 border-border/60 bg-gradient-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">{pitch.title}</h3>
          <p className="text-xs text-muted-foreground">{pitch.industry} · {new Date(pitch.created_at).toLocaleDateString()}</p>
        </div>
        {ownerView && (
          <span className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {pitch.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {pitch.is_public ? "Public" : "Private"}
          </span>
        )}
      </div>

      <p className="line-clamp-3 text-sm text-foreground/80">{pitch.content?.intro}</p>

      <div className="flex items-center justify-between">
        <Stars value={rating?.avg ?? 0} mine={rating?.mine} onRate={onRate ? (n) => onRate(pitch.id, n) : undefined} />
        <span className="text-xs text-muted-foreground">{rating?.count ?? 0} ratings</span>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="sm" variant="glass" onClick={() => downloadPitchPdf(pitch.content)}><Download className="h-3 w-3" /> PDF</Button>
        <Button size="sm" variant="glass" onClick={copyShare}><Link2 className="h-3 w-3" /> Share</Button>
        {onBookmark && (
          <Button size="sm" variant="glass" onClick={() => onBookmark(pitch.id, !bookmarked)}>
            {bookmarked ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
            {bookmarked ? "Saved" : "Save"}
          </Button>
        )}
        {ownerView && onTogglePublic && (
          <Button size="sm" variant="glass" onClick={() => onTogglePublic(pitch.id, !pitch.is_public)}>
            {pitch.is_public ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {pitch.is_public ? "Make private" : "Publish"}
          </Button>
        )}
        {ownerView && onDelete && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(pitch.id)}><Trash2 className="h-3 w-3" /></Button>
        )}
      </div>
    </Card>
  );
};

export default PitchCard;
