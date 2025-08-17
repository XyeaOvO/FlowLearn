import { useState, useEffect } from 'react'

interface WordConfirmationModalProps {
  isOpen: boolean
  words: string[]
  onConfirm: (words: string[]) => void
  onCancel: () => void
}

export default function WordConfirmationModal({ 
  isOpen, 
  words, 
  onConfirm, 
  onCancel 
}: WordConfirmationModalProps) {
  const [editableWords, setEditableWords] = useState<string[]>([])
  const [newWord, setNewWord] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEditableWords([...words])
      setNewWord('')
    }
  }, [isOpen, words])

  const handleAddWord = () => {
    const trimmed = newWord.trim()
    if (trimmed && !editableWords.includes(trimmed)) {
      setEditableWords([...editableWords, trimmed])
      setNewWord('')
    }
  }

  const handleRemoveWord = (index: number) => {
    setEditableWords(editableWords.filter((_, i) => i !== index))
  }

  const handleEditWord = (index: number, newValue: string) => {
    const newWords = [...editableWords]
    newWords[index] = newValue
    setEditableWords(newWords)
  }

  const handleConfirm = () => {
    const filteredWords = editableWords.filter(word => word.trim() !== '')
    onConfirm(filteredWords)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord()
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* 标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 16
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#007bff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold'
          }}>
            {editableWords.length}
          </div>
          <h2 style={{ margin: 0, color: '#333', fontSize: 20, fontWeight: 600 }}>
            确认要处理的词汇
          </h2>
        </div>

        {/* 添加新词汇 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 8 
          }}>
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入新词汇..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            <button
              onClick={handleAddWord}
              disabled={!newWord.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: newWord.trim() ? 'pointer' : 'not-allowed',
                opacity: newWord.trim() ? 1 : 0.6
              }}
            >
              添加
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            按回车键快速添加词汇
          </div>
        </div>

        {/* 词汇列表 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: 20,
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 16
        }}>
          {editableWords.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              padding: '40px 20px',
              fontSize: 14
            }}>
              暂无词汇，请添加要处理的词汇
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editableWords.map((word, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 6,
                  border: '1px solid #e9ecef'
                }}>
                  <span style={{ 
                    fontSize: 12, 
                    color: '#666', 
                    minWidth: 30 
                  }}>
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => handleEditWord(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 14,
                      backgroundColor: 'white'
                    }}
                  />
                  <button
                    onClick={() => handleRemoveWord(index)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          justifyContent: 'flex-end',
          borderTop: '1px solid #e0e0e0',
          paddingTop: 16
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={editableWords.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: editableWords.length > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: editableWords.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: 14,
              opacity: editableWords.length > 0 ? 1 : 0.6
            }}
          >
            确认处理 ({editableWords.length} 个词汇)
          </button>
        </div>
      </div>
    </div>
  )
}
