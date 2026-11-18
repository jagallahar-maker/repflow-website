import RepflowMark from "@/components/brand/RepflowMark";

const SIZES = {
  // Footer, compact headers.
  sm: { mark: "h-5", text: "text-base", gap: "gap-2" },
  // Site header, coach portal top bar.
  md: { mark: "h-7", text: "text-lg", gap: "gap-2.5" },
} as const;

/**
 * The lime R mark with the white "Repflow" wordmark beside it. The mark is
 * decorative here: the wordmark names it. Wrap it in a Link to make it a
 * home link.
 */
export default function RepflowLogo({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <RepflowMark className={`${s.mark} w-auto shrink-0 text-brand`} />
      <span className={`${s.text} font-bold tracking-tight text-white`}>Repflow</span>
    </span>
  );
}
