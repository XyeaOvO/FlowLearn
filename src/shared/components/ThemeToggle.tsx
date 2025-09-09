import { useTheme } from '../contexts/ThemeContext'
import { SunIcon, MoonIcon, MonitorIcon } from './Icon'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light' as const, label: '浅色', icon: SunIcon },
    { value: 'dark' as const, label: '深色', icon: MoonIcon },
    { value: 'system' as const, label: '跟随系统', icon: MonitorIcon }
  ]

  return (
    <div className={`theme-toggle ${className}`}>
      {showLabel && (
        <label className="theme-toggle-label">主题</label>
      )}
      <div className="theme-toggle-options">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`theme-option ${theme === value ? 'active' : ''}`}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={`切换到${label}主题`}
          >
            <Icon size={16} />
            {showLabel && <span className="theme-option-text">{label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// 简化版本的主题切换按钮
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon size={20} />
      case 'dark':
        return <MoonIcon size={20} />
      case 'system':
        return <MonitorIcon size={20} />
      default:
        return <SunIcon size={20} />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return '浅色主题'
      case 'dark':
        return '深色主题'
      case 'system':
        return '跟随系统'
      default:
        return '主题'
    }
  }

  return (
    <button
      className={`theme-toggle-button ${className}`}
      onClick={toggleTheme}
      title={`当前: ${getLabel()}，点击切换`}
      aria-label={`切换主题，当前为${getLabel()}`}
    >
      {getIcon()}
    </button>
  )
}