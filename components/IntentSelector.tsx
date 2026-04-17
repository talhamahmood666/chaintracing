export type Intent = "curious" | "lost_money" | "law_enforcement";

interface IntentSelectorProps {
  value: Intent | null;
  onChange: (intent: Intent) => void;
}

const ICONS: Record<Intent, string> = {
  curious: '🔍',
  lost_money: '💸',
  law_enforcement: '⚖️',
};

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const options: { value: Intent; label: string; description: string }[] = [
    { value: "curious",          label: "Just exploring",             description: "Research how blockchain forensics works" },
    { value: "lost_money",       label: "I've lost funds",            description: "Trace where stolen crypto went" },
    { value: "law_enforcement",  label: "Law enforcement report",     description: "Court-ready evidence & compliance docs" },
  ];

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
        Purpose
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: value === option.value ? 'rgba(0,217,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${value === option.value ? 'rgba(0,217,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <input
              type="radio"
              name="intent"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="text-lg mr-3">{ICONS[option.value]}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: value === option.value ? '#00D9FF' : 'var(--text-primary)' }}>
                {option.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{option.description}</div>
            </div>
            {value === option.value && (
              <div className="w-2 h-2 rounded-full ml-2 flex-shrink-0" style={{ background: '#00D9FF' }} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
