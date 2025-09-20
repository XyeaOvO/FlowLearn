import { useMemo, useState } from 'react'
import type { Word } from '@common/types'
import { useThrottledState } from '../lib/useMemoryOptimization'

export interface FilterState {
  query: string
  status: 'all' | Word['reviewStatus']
  from: string
  to: string
  domain: string
  requireExample: boolean
  requirePhonetic: boolean
  useRegex: boolean
  regex: string
  showDeleted: boolean
}

export interface FilterActions {
  setSearch: (value: string) => void
  setStatus: (value: 'all' | Word['reviewStatus']) => void
  setFrom: (value: string) => void
  setTo: (value: string) => void
  setDomain: (value: string) => void
  setRequireExample: (value: boolean) => void
  setRequirePhonetic: (value: boolean) => void
  setUseRegex: (value: boolean) => void
  setRegex: (value: string) => void
  setShowDeleted: (value: boolean) => void
}

export const useFilters = () => {
  const [search, setSearch] = useThrottledState('', 200)
  const [statusFilter, setStatusFilter] = useState<'all' | Word['reviewStatus']>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [requireExample, setRequireExample] = useState(false)
  const [requirePhonetic, setRequirePhonetic] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [regexPattern, setRegexPattern] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  const filterState: FilterState = useMemo(() => ({
    query: search,
    status: statusFilter,
    from: filterDateFrom,
    to: filterDateTo,
    domain: domainFilter,
    requireExample,
    requirePhonetic,
    useRegex,
    regex: regexPattern,
    showDeleted,
  }), [
    search,
    statusFilter,
    filterDateFrom,
    filterDateTo,
    domainFilter,
    requireExample,
    requirePhonetic,
    useRegex,
    regexPattern,
    showDeleted,
  ])

  const filterActions: FilterActions = useMemo(() => ({
    setSearch,
    setStatus: setStatusFilter,
    setFrom: setFilterDateFrom,
    setTo: setFilterDateTo,
    setDomain: setDomainFilter,
    setRequireExample,
    setRequirePhonetic,
    setUseRegex,
    setRegex: setRegexPattern,
    setShowDeleted,
  }), [
    setSearch,
    setStatusFilter,
    setFilterDateFrom,
    setFilterDateTo,
    setDomainFilter,
    setRequireExample,
    setRequirePhonetic,
    setUseRegex,
    setRegexPattern,
    setShowDeleted,
  ])

  return { filterState, filterActions }
}
