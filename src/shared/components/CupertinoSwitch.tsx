
type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export default function CupertinoSwitch({ checked, onChange, disabled, label, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`cupertino-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`.trim()}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="cupertino-switch-knob" />
    </button>
  )
}
