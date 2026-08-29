import { describe, it, expect } from 'vitest'
import { normalizeText, matchesMultiWordSearch, getHighlightedParts, cn } from '../utils'

describe('normalizeText', () => {
    it('should lowercase text', () => {
        expect(normalizeText('Hello World')).toBe('hello world')
    })

    it('should remove accents', () => {
        expect(normalizeText('café')).toBe('cafe')
        expect(normalizeText('João')).toBe('joao')
        expect(normalizeText('São Paulo')).toBe('sao paulo')
    })

    it('should handle empty string', () => {
        expect(normalizeText('')).toBe('')
    })
})

describe('matchesMultiWordSearch', () => {
    it('should return true for empty query', () => {
        expect(matchesMultiWordSearch('any text', '')).toBe(true)
        expect(matchesMultiWordSearch('any text', '   ')).toBe(true)
    })

    it('should return false for empty text', () => {
        expect(matchesMultiWordSearch('', 'query')).toBe(false)
    })

    it('should match single word', () => {
        expect(matchesMultiWordSearch('Visual Studio Code', 'studio')).toBe(true)
        expect(matchesMultiWordSearch('Visual Studio Code', 'python')).toBe(false)
    })

    it('should match multiple words in any order', () => {
        expect(matchesMultiWordSearch('Visual Studio Code editor', 'studio code')).toBe(true)
        expect(matchesMultiWordSearch('Visual Studio Code editor', 'code studio')).toBe(true)
    })

    it('should be case-insensitive and accent-insensitive', () => {
        expect(matchesMultiWordSearch('VISUAL STUDIO', 'visual')).toBe(true)
        expect(matchesMultiWordSearch('café com leite', 'cafe')).toBe(true)
    })

    it('should require ALL words to match', () => {
        expect(matchesMultiWordSearch('Visual Studio Code', 'studio python')).toBe(false)
    })

    it('should match package IDs', () => {
        expect(matchesMultiWordSearch('Microsoft.VisualStudioCode editor', 'visual studio code')).toBe(true)
    })
})

describe('getHighlightedParts', () => {
    it('should return single unhighlighted part for empty query', () => {
        const result = getHighlightedParts('Hello World', '')
        expect(result).toEqual([{ text: 'Hello World', highlight: false }])
    })

    it('should return empty array for empty text', () => {
        const result = getHighlightedParts('', 'query')
        expect(result).toEqual([])
    })

    it('should highlight single matching word', () => {
        const result = getHighlightedParts('Visual Studio Code', 'studio')
        expect(result).toHaveLength(3)
        expect(result[0]).toEqual({ text: 'Visual ', highlight: false })
        expect(result[1]).toEqual({ text: 'Studio', highlight: true })
        expect(result[2]).toEqual({ text: ' Code', highlight: false })
    })

    it('should highlight multiple matching words', () => {
        const result = getHighlightedParts('Visual Studio Code', 'studio code')
        const highlighted = result.filter(p => p.highlight)
        expect(highlighted.length).toBeGreaterThanOrEqual(2)
    })

    it('should be case-insensitive', () => {
        const result = getHighlightedParts('Hello WORLD', 'world')
        expect(result.some(p => p.highlight && p.text === 'WORLD')).toBe(true)
    })

    it('should return single unhighlighted part when no matches', () => {
        const result = getHighlightedParts('Visual Studio Code', 'python')
        expect(result).toEqual([{ text: 'Visual Studio Code', highlight: false }])
    })
})

describe('cn', () => {
    it('should merge class names', () => {
        expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('should handle conflicting tailwind classes', () => {
        expect(cn('px-4', 'px-2')).toBe('px-2')
    })

    it('should handle falsy values', () => {
        expect(cn('px-4', false, undefined, null, 'py-2')).toBe('px-4 py-2')
    })
})