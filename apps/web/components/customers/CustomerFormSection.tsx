import type { ReactNode, ComponentType, SVGProps } from "react";

type CustomerFormSectionProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export default function CustomerFormSection({
  icon: Icon,
  title,
  description,
  children,
  action
}: CustomerFormSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
