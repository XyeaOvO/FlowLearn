
export type SegmentOption<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  value: T
  options: SegmentOption<T>[]
  onChange: (val: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export default function SegmentedControl<T extends string>({ value, options, onChange, size = 'md', className }: Props<T>) {
  return (
    <div className={`segmented ${size} ${className || ''}`.trim()} role="tablist" aria-orientation="horizontal">
      {options.map(opt => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          className={`segment ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
