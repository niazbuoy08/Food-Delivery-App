/** The bistro's monogram: a serif L on Bordeaux, like a plate stamp. */
export default function Brandmark({ size = 36, tone = 'brand' }) {
  const background = tone === 'dark' ? 'bg-ink-900' : 'bg-brand-600';

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      className={`grid shrink-0 place-items-center rounded-xl font-display font-bold leading-none text-ink-50 ${background}`}
    >
      L
    </span>
  );
}
