import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SessionUser {
  _id: string;
  name: string;
  studentId: string;
  role: "student" | "staff" | "admin";
  department?: string;
}

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/5 bg-[#09090b] p-5 shadow-2xl">
      <div className="mb-5 flex flex-col gap-3 border-b border-white/5 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ActionButton({
  children,
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      {...props}
      className={classNames(
        "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer disabled:bg-purple-600/50 disabled:shadow-none",
        variant === "secondary" && "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
        variant === "danger" && "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full bg-[#141415] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium",
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "w-full bg-[#141415] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium",
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "w-full bg-[#141415] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium",
        props.className,
      )}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-[#09090b] px-6 py-10 text-center shadow-lg">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "warning" | "success" | "danger";
}) {
  return (
    <span
      className={classNames(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-white/10 bg-white/5 text-zinc-300",
        tone === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-200",
        tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        tone === "danger" && "border-red-500/30 bg-red-500/10 text-red-200",
      )}
    >
      {children}
    </span>
  );
}
