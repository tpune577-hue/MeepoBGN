import { MeepoTemplate, MeepoTemplateId, MEEPO_TEMPLATES } from "@/lib/meepo-templates";

function TemplateSilhouette({ template, active }: { template: MeepoTemplate; active: boolean }) {
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${template.maskSrc})`,
    maskImage: `url(${template.maskSrc})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    backgroundColor: active ? "var(--bgn-primary-hover)" : "var(--bgn-primary-soft)",
  };

  return (
    <div className="relative w-20 h-16 mx-auto" aria-hidden>
      <div className="absolute inset-0" style={maskStyle} />
      <img
        src={template.frameSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
    </div>
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
    <div className="bg-bgn-surface rounded-3xl p-4 shadow-md">
      <p className="text-sm font-extrabold text-bgn-ink text-center mb-3">
        เลือกแบบหัว Meepo
      </p>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(t.id)}
              className={`rounded-2xl py-3 px-2 border-2 transition-all text-center
                ${active
                  ? "border-bgn-primary-hover bg-bgn-primary-soft"
                  : "border-bgn-border bg-white hover:border-bgn-primary/50"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <TemplateSilhouette template={t} active={active} />
              <div className={`text-base font-extrabold mt-1.5 ${active ? "text-bgn-primary-hover" : "text-bgn-ink"}`}>
                {t.label}
              </div>
              <div className="text-xs text-bgn-muted font-semibold mt-0.5">{t.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
