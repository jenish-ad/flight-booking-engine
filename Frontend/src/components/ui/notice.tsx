import type { ReactNode } from "react";

const tones = {
  info: "border-line bg-mist text-ink",
  warning: "border-[#e5cf9f] bg-warn-soft text-[#6b4a12]",
  error: "border-[#e3b8ac] bg-danger-soft text-danger",
  success: "border-[#bcd2c4] bg-ok-soft text-forest-dark",
};

export default function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between ${tones[tone]}`}
    >
      <div className="grid gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed whitespace-pre-line">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
