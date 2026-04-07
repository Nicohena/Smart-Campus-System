export function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#111111] p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {subtitle ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}
