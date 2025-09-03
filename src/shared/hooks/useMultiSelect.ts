import { useState, useCallback } from 'react'

export const useMultiSelect = () => {
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
    setMultiSelectMode(false)
  }, [])

  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectMode(prev => !prev)
    if (multiSelectMode) {
      setSelectedIds([])
    }
  }, [multiSelectMode])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }, [])

  return {
    multiSelectMode,
    selectedIds,
    setMultiSelectMode,
    setSelectedIds,
    clearSelection,
    toggleMultiSelectMode,
    selectAll,
    toggleSelection
  }
}