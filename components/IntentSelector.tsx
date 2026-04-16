export type Intent = "curious" | "lost_money" | "law_enforcement";

interface IntentSelectorProps {
  value: Intent | null;
  onChange: (intent: Intent) => void;
}

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const options: { value: Intent; label: string; description: string }[] = [
    {
      value: "curious",
      label: "I'm just curious about how this works.",
      description: "Perfect for exploring the technology",
    },
    {
      value: "lost_money",
      label: "I've lost money and need to understand where it went.",
      description: "Get the evidence you need to report the theft",
    },
    {
      value: "law_enforcement",
      label: "I'm reporting this to law enforcement and need documentation.",
      description: "Generate court-ready evidence and compliance documents",
    },
  ];

  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        What brings you here today?
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
              value === option.value
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="intent"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mr-3 accent-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-800 text-sm">{option.label}</div>
              <div className="text-xs text-slate-500">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}