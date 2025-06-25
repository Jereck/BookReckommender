"use client"

import { useState, useEffect, useCallback } from "react"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { getRecommendation, getRecommendationCount } from "@/lib/api"
import { BookSearch, type SearchedBook } from "@/components/book-search"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Plus,
  Sparkles,
  Trash2,
  User,
  Hash,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

export default function Home() {
  const [books, setBooks] = useState<Book[]>([{ title: "", author: "", isbn: "", coverUrl: "" }])
  const [recCount, setRecCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    recommendedBook: { title: string; author: string; coverUrl: string }
    explanation: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    getRecommendationCount()
      .then(setRecCount)
      .catch((err) => {
        console.error("Failed to get recommendation count:", err)
        setRecCount(null)
      })
  }, [])

  const validateISBN = useCallback((isbn: string): boolean => {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, "")

    // Check if it's 10 or 13 digits
    if (!/^\d{10}$/.test(cleanISBN) && !/^\d{13}$/.test(cleanISBN)) {
      return false
    }

    return true
  }, [])

  const addBook = () => {
    setBooks([...books, { title: "", author: "", isbn: "", coverUrl: "" }])
  }

  const removeBook = (index: number) => {
    if (books.length > 1) {
      const updated = books.filter((_, i) => i !== index)
      setBooks(updated)

      // Clear validation error for removed book
      const newValidationErrors = { ...validationErrors }
      delete newValidationErrors[index]

      // Adjust indices for remaining errors
      const adjustedErrors: Record<number, string> = {}
      Object.entries(newValidationErrors).forEach(([key, value]) => {
        const idx = Number.parseInt(key)
        if (idx > index) {
          adjustedErrors[idx - 1] = value
        } else if (idx < index) {
          adjustedErrors[idx] = value
        }
      })

      setValidationErrors(adjustedErrors)
    }
  }

  const updateBook = (index: number, field: keyof Book, value: string) => {
    const updated = [...books]
    updated[index][field] = value
    setBooks(updated)

    // Clear validation error when user starts typing
    if (field === "isbn" && validationErrors[index]) {
      const newErrors = { ...validationErrors }
      delete newErrors[index]
      setValidationErrors(newErrors)
    }
  }

  const handleBookSelect = (book: SearchedBook) => {
    // Find first empty slot or add new book
    const emptyIndex = books.findIndex((b) => !b.isbn.trim())

    if (emptyIndex !== -1) {
      updateBook(emptyIndex, "title", book.title)
      updateBook(emptyIndex, "author", book.author)
      updateBook(emptyIndex, "isbn", book.isbn)
      updateBook(emptyIndex, "coverUrl", book.coverUrl || "")
    } else {
      setBooks([...books, book])
    }
  }

  const validateBooks = (): boolean => {
    const errors: Record<number, string> = {}
    let hasValidBooks = false

    books.forEach((book, index) => {
      if (book.isbn.trim()) {
        hasValidBooks = true
        if (!validateISBN(book.isbn)) {
          errors[index] = "Please enter a valid ISBN (10 or 13 digits)"
        }
      }
    })

    setValidationErrors(errors)
    return hasValidBooks && Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateBooks()) {
      setError("Please fix the validation errors before submitting.")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const filtered = books.filter((b) => b.isbn.trim() !== "")
      const response = await getRecommendation(filtered)
      console.log("Response: ", response)
      setResult(response)

      // Refresh recommendation count
      getRecommendationCount()
        .then(setRecCount)
        .catch(() => {})
    } catch (err) {
      console.error("Recommendation error:", err)
      setError(err instanceof Error ? err.message : "Failed to get recommendation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setBooks([{ title: "", author: "", isbn: "", coverUrl: "" }])
    setResult(null)
    setError(null)
    setValidationErrors({})
  }

  const hasValidBooks = books.some((book) => book.isbn.trim() !== "")
  const filledBooksCount = books.filter((book) => book.isbn.trim()).length
  const progressPercentage = Math.min((filledBooksCount / 3) * 100, 100) // Assuming 3 books is optimal

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Book <span className="text-yellow-500">RECK</span>ommender
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover your next favorite book! Add the books you've enjoyed, and our AI will recommend something perfect
            for you.
          </p>
        </div>

        <SignedOut>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5" />
                Welcome to Book Recommender
              </CardTitle>
              <CardDescription>Please sign in to start getting personalized book recommendations</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SignInButton>
                <Button className="w-full">Sign In to Continue</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </SignedOut>

        <SignedIn>
          <div className="space-y-6">
            {/* Usage Progress */}
            {recCount !== null && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Free Recommendations Used</span>
                    <span className="text-sm text-muted-foreground">{recCount}/5</span>
                  </div>
                  <Progress value={(recCount / 5) * 100} className="h-2" />
                  {recCount >= 5 && (
                    <p className="text-sm text-amber-600 mt-2">
                      You've used all your free recommendations. Consider upgrading for unlimited access!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Book Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Find Books to Add
                </CardTitle>
                <CardDescription>Search our database to quickly add books you've enjoyed</CardDescription>
              </CardHeader>
              <CardContent>
                <BookSearch onSelect={handleBookSelect} />
              </CardContent>
            </Card>

            {/* Books Input Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Your Favorite Books
                    </CardTitle>
                    <CardDescription>
                      Add books you've enjoyed. The more books you add, the better our recommendations will be!
                    </CardDescription>
                  </div>
                  {books.length > 1 && (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Progress Indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Recommendation Quality</span>
                    <span className="text-sm text-muted-foreground">
                      {filledBooksCount} book{filledBooksCount !== 1 ? "s" : ""} added
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {filledBooksCount < 2 && "Add at least 2 books for better recommendations"}
                    {filledBooksCount >= 2 && filledBooksCount < 3 && "Great! Add one more for even better results"}
                    {filledBooksCount >= 3 && "Perfect! You have enough books for excellent recommendations"}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {books.map((book, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Book {i + 1}
                      </Badge>
                      {book.isbn.trim() && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {books.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBook(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          className={`pl-10 ${validationErrors[i] ? "border-red-500" : ""}`}
                          placeholder="ISBN (required)"
                          value={book.isbn}
                          onChange={(e) => updateBook(i, "isbn", e.target.value)}
                          aria-invalid={!!validationErrors[i]}
                          aria-describedby={validationErrors[i] ? `isbn-error-${i}` : undefined}
                        />
                        {validationErrors[i] && (
                          <p id={`isbn-error-${i}`} className="text-xs text-red-500 mt-1">
                            {validationErrors[i]}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          className="pl-10"
                          placeholder="Book Title"
                          value={book.title}
                          onChange={(e) => updateBook(i, "title", e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          className="pl-10"
                          placeholder="Author"
                          value={book.author}
                          onChange={(e) => updateBook(i, "author", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={addBook} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Another Book
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !hasValidBooks || (recCount !== null && recCount >= 5)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Get Recommendation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto" />
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">Finding your perfect book...</p>
                        <p className="text-sm text-gray-500">Our AI is analyzing your preferences</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {result && !loading && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Sparkles className="h-5 w-5" />
                    Your Recommended Book
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex gap-6 items-start mb-4">
                      {/* Book Cover */}
                      {result.recommendedBook.coverUrl ? (
                        <img
                          src={result.recommendedBook.coverUrl || "/placeholder.svg"}
                          alt={`Cover of ${result.recommendedBook.title}`}
                          className="w-28 h-40 object-cover rounded border shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-28 h-40 bg-muted rounded border shadow flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.recommendedBook.title}</h3>
                        <p className="text-lg text-gray-600 mb-4">by {result.recommendedBook.author}</p>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`https://www.amazon.com/s?k=${encodeURIComponent(result.recommendedBook.isbn || result.recommendedBook.title)}&tag=bookreckommen-20`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Buy this book on Amazon
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Why this book?</h4>
                      <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SignedIn>
      </div>
    </div>
  )
}
