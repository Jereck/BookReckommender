"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Book, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export type SearchedBook = {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  publishedYear?: string
  description?: string
}

interface BookSearchProps {
  onSelect: (book: SearchedBook) => void
  placeholder?: string
  maxResults?: number
}

export function BookSearch({
  onSelect,
  placeholder = "Search for a book title, author, or ISBN...",
  maxResults = 10,
}: BookSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchedBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchBooks = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setResults(data.books ?? [])
        setShowResults(true)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, ignore
          return
        }

        console.error("Search error:", err)
        setError(err instanceof Error ? err.message : "Failed to search books")
        setResults([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    },
    [maxResults],
  )

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchBooks(query)
    }, 300)

    return () => {
      clearTimeout(delayDebounce)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query, searchBooks])

  const handleSelect = (book: SearchedBook) => {
    onSelect(book)
    setQuery("")
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
      setQuery("")
    }
  }

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10 pr-10"
          aria-label="Search for books"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          role="combobox"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto" role="listbox" aria-label="Search results">
              {results.map((book, i) => (
                <div
                  key={`${book.isbn}-${i}`}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
                  onClick={() => handleSelect(book)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelect(book)
                    }
                  }}
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl || "/placeholder.svg"}
                      alt={`Cover of ${book.title}`}
                      className="w-12 h-16 object-cover rounded border flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded border flex items-center justify-center flex-shrink-0">
                      <Book className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">{book.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">by {book.author}</p>
                        {book.publishedYear && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {book.publishedYear}
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="flex-shrink-0">
                        Add
                      </Button>
                    </div>
                    {book.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{book.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-4 text-center text-muted-foreground">
            <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No books found for "{query}"</p>
            <p className="text-xs mt-1">Try searching with different keywords</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
