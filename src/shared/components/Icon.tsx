import React from 'react'

interface IconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

const icons = {
  // Navigation & UI
  search: (
    <path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
  ),
  settings: (
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  robot: (
    <>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="m2 14 2 2 4-4" />
      <path d="m20 14-2 2-4-4" />
      <path d="M8 14v.01" />
      <path d="M16 14v.01" />
    </>
  ),
  volume: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    </>
  ),
  
  // Actions
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  check: (
    <path d="M20 6 9 17l-5-5" />
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  
  // Status & Feedback
  warning: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="m12 17.02.01 0" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 16-4-4 4-4" />
      <path d="M16 12H8" />
    </>
  ),
  
  // Media & Communication
  send: (
    <path d="m22 2-7 20-4-9-9-4Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </>
  ),
  
  // Navigation
  arrowLeft: (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  chevronDown: (
    <path d="m6 9 6 6 6-6" />
  ),
  
  // Learning & Progress
  book: (
    <>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </>
  ),
  
  // File & Data
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </>
  ),
  
  // Theme
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  moon: (
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  ),
  monitor: (
    <>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </>
  )
}

export default function Icon({ name, size = 20, className = '', color = 'currentColor' }: IconProps) {
  const iconPath = icons[name as keyof typeof icons]
  
  if (!iconPath) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPath}
    </svg>
  )
}

// Export individual icon components for better tree-shaking
export const SearchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />
export const SettingsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />
export const TargetIcon = (props: Omit<IconProps, 'name'>) => <Icon name="target" {...props} />
export const RobotIcon = (props: Omit<IconProps, 'name'>) => <Icon name="robot" {...props} />
export const VolumeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="volume" {...props} />
export const DatabaseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="database" {...props} />
export const TrashIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trash" {...props} />
export const RefreshIcon = (props: Omit<IconProps, 'name'>) => <Icon name="refresh" {...props} />
export const CheckIcon = (props: Omit<IconProps, 'name'>) => <Icon name="check" {...props} />
export const XIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />
export const CloseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />
export const PlusIcon = (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />
export const EditIcon = (props: Omit<IconProps, 'name'>) => <Icon name="edit" {...props} />
export const WarningIcon = (props: Omit<IconProps, 'name'>) => <Icon name="warning" {...props} />
export const InfoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="info" {...props} />
export const SendIcon = (props: Omit<IconProps, 'name'>) => <Icon name="send" {...props} />
export const ClockIcon = (props: Omit<IconProps, 'name'>) => <Icon name="clock" {...props} />
export const ArrowLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name="arrowLeft" {...props} />
export const ArrowRightIcon = (props: Omit<IconProps, 'name'>) => <Icon name="arrowRight" {...props} />
export const ChevronDownIcon = (props: Omit<IconProps, 'name'>) => <Icon name="chevronDown" {...props} />
export const BookIcon = (props: Omit<IconProps, 'name'>) => <Icon name="book" {...props} />
export const BrainIcon = (props: Omit<IconProps, 'name'>) => <Icon name="brain" {...props} />
export const DownloadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="download" {...props} />
export const UploadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="upload" {...props} />
export const SunIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sun" {...props} />
export const MoonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="moon" {...props} />
export const MonitorIcon = (props: Omit<IconProps, 'name'>) => <Icon name="monitor" {...props} />