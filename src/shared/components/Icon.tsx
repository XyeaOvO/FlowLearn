import React from 'react'
import {
  Check,
  X,
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  FunnelSimple,
  DotsThreeOutline,
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CaretUp,
  Info,
  Warning,
  XCircle,
  CheckCircle,
  CircleNotch,
  Book,
  Target,
  Gear,
  ArrowCounterClockwise,
  PaperPlaneTilt,
  Robot,
  Clock,
  SpeakerHigh,
  Database,
  List,
  Brain,
  DownloadSimple,
  UploadSimple,
  Sun,
  Moon,
  Monitor,
  FileText
} from '@phosphor-icons/react'

interface IconProps {
  size?: number
  color?: string
  className?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  mirrored?: boolean
}

// 使用 Phosphor Icons 的现代彩色图标库
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981', weight = 'bold', className, mirrored }) => (
  <Check size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'bold', className, mirrored }) => (
  <X size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const XIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'bold', className, mirrored }) => (
  <X size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6', weight = 'bold', className, mirrored }) => (
  <Plus size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const EditIcon: React.FC<IconProps> = ({ size = 24, color = '#0891B2', weight = 'duotone', className, mirrored }) => (
  <PencilSimple size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'duotone', className, mirrored }) => (
  <Trash size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const DeleteIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'duotone', className, mirrored }) => (
  <Trash size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'regular', className, mirrored }) => (
  <MagnifyingGlass size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const FilterIcon: React.FC<IconProps> = ({ size = 24, color = '#059669', weight = 'duotone', className, mirrored }) => (
  <FunnelSimple size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SortIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'regular', className, mirrored }) => (
  <List size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const MoreIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <DotsThreeOutline size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <ArrowLeft size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <ArrowRight size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <CaretDown size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <CaretUp size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const InfoIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6', weight = 'duotone', className, mirrored }) => (
  <Info size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const WarningIcon: React.FC<IconProps> = ({ size = 24, color = '#EA580C', weight = 'duotone', className, mirrored }) => (
  <Warning size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ErrorIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'duotone', className, mirrored }) => (
  <XCircle size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SuccessIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981', weight = 'duotone', className, mirrored }) => (
  <CheckCircle size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const LoadingIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'bold', className, mirrored }) => (
  <CircleNotch size={size} color={color} weight={weight} mirrored={mirrored} className={`animate-spin ${className}`} />
)

// 应用特定图标
export const BookIcon: React.FC<IconProps> = ({ size = 24, color = '#F97316', weight = 'duotone', className, mirrored }) => (
  <Book size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const TargetIcon: React.FC<IconProps> = ({ size = 24, color = '#EF4444', weight = 'duotone', className, mirrored }) => (
  <Target size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'duotone', className, mirrored }) => (
  <Gear size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6', weight = 'bold', className, mirrored }) => (
  <ArrowCounterClockwise size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981', weight = 'duotone', className, mirrored }) => (
  <PaperPlaneTilt size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const RobotIcon: React.FC<IconProps> = ({ size = 24, color = '#7C3AED', weight = 'duotone', className, mirrored }) => (
  <Robot size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = '#DC2626', weight = 'duotone', className, mirrored }) => (
  <Clock size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const VolumeIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981', weight = 'duotone', className, mirrored }) => (
  <SpeakerHigh size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const DatabaseIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6', weight = 'duotone', className, mirrored }) => (
  <Database size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const BrainIcon: React.FC<IconProps> = ({ size = 24, color = '#EC4899', weight = 'duotone', className, mirrored }) => (
  <Brain size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const DownloadIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981', weight = 'duotone', className, mirrored }) => (
  <DownloadSimple size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const UploadIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6', weight = 'duotone', className, mirrored }) => (
  <UploadSimple size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const SunIcon: React.FC<IconProps> = ({ size = 24, color = '#F59E0B', weight = 'duotone', className, mirrored }) => (
  <Sun size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const MoonIcon: React.FC<IconProps> = ({ size = 24, color = '#4338CA', weight = 'duotone', className, mirrored }) => (
  <Moon size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const MonitorIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280', weight = 'duotone', className, mirrored }) => (
  <Monitor size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)

export const FileTextIcon: React.FC<IconProps> = ({ size = 24, color = '#4F46E5', weight = 'duotone', className, mirrored }) => (
  <FileText size={size} color={color} weight={weight} mirrored={mirrored} className={className} />
)