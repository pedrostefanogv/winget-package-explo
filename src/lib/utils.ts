import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Verifica se todas as palavras da query aparecem no texto (em qualquer ordem)
 */
export function matchesMultiWordSearch(text: string, query: string): boolean {
  if (!query.trim()) return true
  if (!text) return false
  
  const normalizedText = normalizeText(text)
  const searchWords = query.trim().split(/\s+/).filter(word => word.length > 0)
  
  return searchWords.every(word => 
    normalizedText.includes(normalizeText(word))
  )
}

/**
 * Retorna as partes do texto com as palavras da query destacadas
 * Retorna um array de objetos { text, highlight }
 */
export interface HighlightPart {
  text: string
  highlight: boolean
}

export function getHighlightedParts(text: string, query: string): HighlightPart[] {
  if (!text) return []
  if (!query.trim()) return [{ text, highlight: false }]
  
  const searchWords = query.trim().split(/\s+/).filter(word => word.length > 0)
  if (searchWords.length === 0) return [{ text, highlight: false }]
  
  // Criar regex para encontrar todas as palavras (case-insensitive)
  const escapedWords = searchWords.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi')
  
  const parts: HighlightPart[] = []
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(text)) !== null) {
    // Adicionar texto antes do match
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        highlight: false
      })
    }
    // Adicionar o match destacado
    parts.push({
      text: match[0],
      highlight: true
    })
    lastIndex = regex.lastIndex
  }
  
  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlight: false
    })
  }
  
  return parts.length > 0 ? parts : [{ text, highlight: false }]
}
