"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type Action = {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed"
  category: string
  created_at: string
  due_date?: string
  progress: number
}

export default function ActionsPage() {
  const { getUserId } = useAuth()
  const [actions, setActions] = useState<Action[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // In a real app, this would be an API call to fetch actions
        // For now, we'll simulate a response
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Simulated actions
        setActions([
          {
            id: "1",
            title: "Practice mindful breathing",
            description: "Take 5 minutes each day to focus on your breath",
            status: "in_progress",
            category: "mindfulness",
            created_at: new Date().toISOString(),
            progress: 60,
          },
          {
            id: "2",
            title: "Write down three things you're grateful for",
            description: "Daily gratitude practice to improve mood",
            status: "completed",
            category: "gratitude",
            created_at: new Date().toISOString(),
            progress: 100,
          },
          {
            id: "3",
            title: "Challenge negative thought patterns",
            description: "Identify and reframe negative thoughts when they arise",
            status: "pending",
            category: "cognitive",
            created_at: new Date().toISOString(),
            progress: 0,
          },
          {
            id: "4",
            title: "Take a nature walk",
            description: "Spend 20 minutes in nature to reduce stress",
            status: "in_progress",
            category: "self-care",
            created_at: new Date().toISOString(),
            progress: 30,
          },
        ])
      } catch (error) {
        console.error("Error fetching actions:", error)
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [getUserId])

  const handleUpdateProgress = (id: string, newProgress: number) => {
    setActions((prev) =>
      prev.map((action) => {
        if (action.id === id) {
          const status = newProgress === 100 ? "completed" : newProgress > 0 ? "in_progress" : "pending"
          return { ...action, progress: newProgress, status }
        }
        return action
      }),
    )
  }

  const filteredActions = filter === "all" ? actions : actions.filter((action) => action.status === filter)

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      mindfulness: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      gratitude: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      cognitive: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      "self-care": "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    }

    return categoryColors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <ArrowRight className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="!text-xl !font-light text-center bg-gradient-to-r from-purple-600 to-blue-400 bg-clip-text text-transparent">
          Actions
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Track your progress on recommended activities</p>
      </div>

      <div className="flex justify-center mb-6 space-x-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="rounded-full"
        >
          All
        </Button>
        <Button
          variant={filter === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in_progress")}
          className="rounded-full"
        >
          In Progress
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
          className="rounded-full"
        >
          Completed
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          className="rounded-full"
        >
          Not Started
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No actions found.</p>
          {filter !== "all" && (
            <Button variant="link" onClick={() => setFilter("all")}>
              View all actions
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <Card key={action.id} className="overflow-hidden">
              <div className="flex items-center p-4 border-b border-border/40">
                <div className="mr-4">{getStatusIcon(action.status)}</div>
                <div className="flex-1">
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Badge className={`ml-2 ${getCategoryColor(action.category)}`}>{action.category}</Badge>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{action.progress}%</span>
                </div>
                <Progress value={action.progress} className="h-2" />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`complete-${action.id}`}
                      checked={action.progress === 100}
                      onCheckedChange={(checked) => handleUpdateProgress(action.id, checked ? 100 : 0)}
                    />
                    <label
                      htmlFor={`complete-${action.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as complete
                    </label>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Update Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
