interface PointsBadgeProps {
  points: number | null;
  maxPoints?: number;
}

export default function PointsBadge({ points, maxPoints = 3 }: PointsBadgeProps) {
  if (points === null || points === undefined) {
    return (
      <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full bg-slate-600 text-slate-300 text-xs font-semibold">
        –
      </span>
    );
  }

  let colorClass = "";
  let label = `${points} Pt${points !== 1 ? "s" : ""}`;

  if (points === maxPoints) {
    // Exact score — bright green
    colorClass = "bg-emerald-500 text-white";
    label = `${points} Pts ✓`;
  } else if (points === maxPoints - 1) {
    // Exact diff — amber/yellow
    colorClass = "bg-amber-400 text-slate-900";
    label = `${points} Pts`;
  } else if (points > 0) {
    // Tendency only — orange
    colorClass = "bg-orange-500 text-white";
    label = `${points} Pt`;
  } else {
    // Wrong — red
    colorClass = "bg-red-600 text-white";
    label = "0 Pts";
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded-full text-xs font-bold ${colorClass}`}
    >
      {label}
    </span>
  );
}
