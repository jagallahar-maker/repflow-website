"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  getSharedClientMedia,
  type SharedMediaItem,
} from "@/lib/coach-media-client";

type Props = {
  clientId: string;
};

type FilterValue = "all" | "photo" | "video";

export default function CoachSharedMediaSection({ clientId }: Props) {
  const [items, setItems] = useState<SharedMediaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  const loadPage = useCallback(
    async (
      cursorArg: string | null,
      append: boolean,
      filterArg: FilterValue,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const page = await getSharedClientMedia({
          clientId,
          cursor: cursorArg,
          limit: 24,
          ...(filterArg !== "all" ? { mediaType: filterArg } : {}),
        });
        setItems((prev) => (append ? [...prev, ...page.items] : page.items));
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (e) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load media.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    loadPage(null, false, filter);
  }, [loadPage, filter]);

  const openItem = openItemId
    ? items.find((i) => i.id === openItemId) ?? null
    : null;

  const photoCount = items.filter((i) => i.mediaType === "photo").length;
  const videoCount = items.filter((i) => i.mediaType === "video").length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">Shared Media</h2>
        <span className="text-xs text-zinc-500">
          {photoCount} photo{photoCount === 1 ? "" : "s"} · {videoCount} video
          {videoCount === 1 ? "" : "s"}
          {hasMore ? "+" : ""}
        </span>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex gap-2">
        <FilterPill
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterPill
          label="Photos"
          active={filter === "photo"}
          onClick={() => setFilter("photo")}
        />
        <FilterPill
          label="Videos"
          active={filter === "video"}
          onClick={() => setFilter("video")}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-500 py-8 text-center">
          No shared media yet. When this athlete marks photos or videos as
          &ldquo;Share with coach&rdquo; in the app, they&apos;ll show up here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpenItemId(item.id)}
                className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition group"
              >
                <Image
                  src={item.thumbnailSignedUrl}
                  alt={item.poseType ?? "Progress media"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  unoptimized
                />

                {/* Play overlay for videos */}
                {item.mediaType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-6 h-6 ml-0.5"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Duration badge for videos */}
                {item.mediaType === "video" &&
                  typeof item.durationSeconds === "number" && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold">
                      {formatDuration(item.durationSeconds)}
                    </div>
                  )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="flex items-center justify-between text-[10px] text-white">
                    <span className="font-semibold uppercase tracking-wider">
                      {item.poseType ?? item.mediaType}
                    </span>
                    <span>{formatDate(item.takenAt)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => loadPage(cursor, true, filter)}
                disabled={loading}
                className="text-sm text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-full px-5 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {openItem && (
        <Lightbox item={openItem} onClose={() => setOpenItemId(null)} />
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition border ${
        active
          ? "bg-lime-400/15 text-lime-400 border-lime-400/40"
          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
      }`}
    >
      {label}
    </button>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: SharedMediaItem;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-lime-400/15 text-lime-400 border border-lime-400/30">
            {item.poseType ?? item.mediaType}
          </span>
          <span className="text-sm text-zinc-300">
            {formatDate(item.takenAt)}
          </span>
          {item.mediaType === "video" &&
            typeof item.durationSeconds === "number" && (
              <span className="text-xs text-zinc-400">
                {formatDuration(item.durationSeconds)}
              </span>
            )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-300 hover:text-white text-2xl leading-none w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {item.mediaType === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={item.signedUrl}
            poster={item.thumbnailSignedUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.signedUrl}
            alt={item.poseType ?? "Progress photo"}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {item.note && (
        <div
          className="p-4 max-w-3xl mx-auto w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
            {item.note}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}