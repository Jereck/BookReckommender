"use client"

import { useEffect, useState } from "react"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, History, Calendar, Sparkles, ArrowRight } from "lucide-react"

interface Recommendation {
  id: string
  resultBook: {
    title: string
    author: string
  }
  inputBooks: Array<{
    id: string
    title: string
    author: string
  }>
  explanation: string
  createdAt: string
}

export default function HistoryPage() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch history")
        return res.json()
      })
      .then((data) => setRecs(data.recommendations ?? []))
      .catch((err) => setError("Failed to load recommendation history"))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown date"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <History className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Recommendation History
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Review all your past book recommendations and rediscover great suggestions.
          </p>
        </div>

        <SignedOut>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <History className="h-5 w-5" />
                Access Your History
              </CardTitle>
              <CardDescription>Please sign in to view your recommendation history</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SignInButton>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Sign In to Continue
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </SignedOut>

        <SignedIn>
          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto" />
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">Loading your history...</p>
                      <p className="text-sm text-gray-500">Fetching your past recommendations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && recs.length === 0 && (
            <Card className="text-center py-12">
              <CardContent className="space-y-6">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">No recommendations yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Start by getting your first book recommendation! Your history will appear here once you begin using
                    the recommender.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <a href="/">Get Your First Recommendation</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recommendations List */}
          {!loading && !error && recs.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {recs.length} recommendation{recs.length !== 1 ? "s" : ""} found
                </p>
                <Badge variant="outline" className="text-xs">
                  Most recent first
                </Badge>
              </div>

              <div className="space-y-4">
                {recs.map((rec, index) => (
                  <Card key={rec.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            {rec.resultBook.title}
                          </CardTitle>
                          <CardDescription className="text-base">by {rec.resultBook.author}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(rec.createdAt)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Input Books */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Based on your books:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.inputBooks.map((book, bookIndex) => (
                            <div key={book.id} className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                "{book.title}"
                              </Badge>
                              {bookIndex < rec.inputBooks.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Explanation */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Why this recommendation?</h4>
                        <p className="text-gray-600 leading-relaxed text-sm">{rec.explanation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Back to Home CTA */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6 text-center">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">Ready for another recommendation?</h3>
                      <p className="text-sm text-gray-600">
                        Discover more amazing books tailored to your reading preferences.
                      </p>
                    </div>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <a href="/">Get New Recommendation</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  )
}
