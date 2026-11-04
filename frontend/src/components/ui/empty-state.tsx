import type { ReactNode } from "react";

export default function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel grid justify-items-start gap-3 border-dashed border-line-dashed px-6 py-10 sm:px-10">
      <h2 className="font-serif text-2xl">{title}</h2>
      {children && <div className="max-w-prose text-sm leading-relaxed text-slate">{children}</div>}
      {action}
    </div>
  );
}
