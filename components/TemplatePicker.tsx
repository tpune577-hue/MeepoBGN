import { MeepoTemplate, MeepoTemplateId, MEEPO_TEMPLATES } from "@/lib/meepo-templates";

function TemplateSilhouette({ template, active }: { template: MeepoTemplate; active: boolean }) {
  return (
    <svg
      viewBox={template.viewBox}
      className="w-14 h-[4.25rem] mx-auto"
      aria-hidden
    >
      <path
        d={template.outlinePath}
        fill={active ? "var(--bgn-primary-hover)" : "var(--bgn-primary-soft)"}
        stroke={active ? "white" : "var(--bgn-border)"}
        strokeWidth="2"
      />
    </svg>
  );
}

type TemplatePickerProps = {
  value: MeepoTemplateId;
  onChange: (id: MeepoTemplateId) => void;
  disabled?: boolean;
};

export function TemplatePicker({ value, onChange, disabled }: TemplatePickerProps) {
  const templates = Object.values(MEEPO_TEMPLATES);

  return (
    <div className="bg-bgn-surface rounded-2xl p-3 shadow-sm border border-bgn-border">
      <p className="text-[11px] font-extrabold text-bgn-muted text-center mb-2 tracking-wide">
        เลือกแบบหัว Meepo
      </p>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(t.id)}
              className={`rounded-xl py-2.5 px-2 border-2 transition-all text-center
                ${active
                  ? "border-bgn-primary-hover bg-bgn-primary-soft shadow-sm"
                  : "border-bgn-border bg-white hover:border-bgn-primary/50"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <TemplateSilhouette template={t} active={active} />
              <div className={`text-[13px] font-extrabold mt-1 ${active ? "text-bgn-primary-hover" : "text-bgn-ink"}`}>
                {t.label}
              </div>
              <div className="text-[10px] text-bgn-muted font-semibold">{t.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
