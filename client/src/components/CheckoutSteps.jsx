import { Check } from 'lucide-react';

const STEPS = ['Cart', 'Address', 'Payment', 'Done'];

/** `current` is 0-indexed against STEPS. */
export default function CheckoutSteps({ current }) {
  return (
    <ol className="mx-auto mb-8 flex max-w-lg items-center">
      {STEPS.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isActive
                      ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                      : 'bg-ink-100 text-ink-400'
                }`}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-medium ${isActive ? 'text-ink-900' : 'text-ink-400'}`}
              >
                {label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="mx-2 mb-5 h-0.5 flex-1 rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
