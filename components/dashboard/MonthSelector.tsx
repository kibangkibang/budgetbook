'use client';

interface Props {
  value: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ value, onChange }: Props) {
  const shift = (delta: number) => {
    const [y, m] = value.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${yyyy}-${mm}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        aria-label="이전 달"
      >
        ‹
      </button>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-200 px-2 py-1 text-sm"
      />
      <button
        onClick={() => shift(1)}
        className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        aria-label="다음 달"
      >
        ›
      </button>
    </div>
  );
}
