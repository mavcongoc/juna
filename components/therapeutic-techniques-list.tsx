"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { therapeuticTechniques, type TechniqueCategory, type Technique } from "@/lib/therapeutic-techniques"
import { useTechniquesStore } from "@/lib/techniques-store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Brain,
  Heart,
  Activity,
  Users,
  Sparkles,
  Leaf,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  BookOpen,
} from "lucide-react"

const categoryIcons: Record<TechniqueCategory, React.ReactNode> = {
  cognitive: <Brain className="h-4 w-4" />,
  emotional: <Heart className="h-4 w-4" />,
  behavioral: <Activity className="h-4 w-4" />,
  relational: <Users className="h-4 w-4" />,
  growth: <Sparkles className="h-4 w-4" />,
  mindfulness: <Leaf className="h-4 w-4" />,
}

const categoryLabels: Record<TechniqueCategory, string> = {
  cognitive: "Cognitive",
  emotional: "Emotional",
  behavioral: "Behavioral",
  relational: "Relational",
  growth: "Growth",
  mindfulness: "Mindfulness",
}

export default function TherapeuticTechniquesList() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { progress, markTechniqueCompleted, markStepCompleted, addNote, resetProgress } = useTechniquesStore()

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set<TechniqueCategory>()
    therapeuticTechniques.forEach((technique) => {
      uniqueCategories.add(technique.category)
    })
    return Array.from(uniqueCategories)
  }, [])

  // Filter techniques based on active tab and search query
  const filteredTechniques = useMemo(() => {
    return therapeuticTechniques.filter((technique) => {
      // Filter by category
      if (activeTab !== "all" && technique.category !== activeTab) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return technique.name.toLowerCase().includes(query) || technique.description.toLowerCase().includes(query)
      }

      return true
    })
  }, [activeTab, searchQuery])

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalTechniques = therapeuticTechniques.length
    const completedTechniques = Object.values(progress).filter((p) => p.completed).length
    return totalTechniques > 0 ? (completedTechniques / totalTechniques) * 100 : 0
  }, [progress])

  // Calculate progress by category
  const categoryProgress = useMemo(() => {
    const result: Record<string, { total: number; completed: number }> = {
      all: { total: therapeuticTechniques.length, completed: 0 },
    }

    categories.forEach((category) => {
      result[category] = { total: 0, completed: 0 }
    })

    therapeuticTechniques.forEach((technique) => {
      result[technique.category].total += 1
      result.all.completed += progress[technique.id]?.completed ? 1 : 0
      result[technique.category].completed += progress[technique.id]?.completed ? 1 : 0
    })

    return result
  }, [categories, progress])

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Therapeutic Techniques</h1>
        <p className="text-muted-foreground">Track your progress with these evidence-based therapeutic techniques</p>
      </div>

      {/* Overall progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Progress value={overallProgress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {Object.values(progress).filter((p) => p.completed).length} of {therapeuticTechniques.length} techniques
            completed
          </p>
        </CardContent>
      </Card>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search techniques..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setSearchQuery("")} disabled={!searchQuery}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Category tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">All</span>
            <Badge variant="outline" className="ml-1">
              {categoryProgress.all.completed}/{categoryProgress.all.total}
            </Badge>
          </TabsTrigger>

          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-1">
              {categoryIcons[category]}
              <span className="hidden md:inline">{categoryLabels[category]}</span>
              <Badge variant="outline" className="ml-1">
                {categoryProgress[category].completed}/{categoryProgress[category].total}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Techniques list - shared across all tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTechniques.length > 0 ? (
            filteredTechniques.map((technique) => (
              <TechniqueCard
                key={technique.id}
                technique={technique}
                progress={progress[technique.id]}
                onMarkCompleted={(completed) => markTechniqueCompleted(technique.id, completed)}
                onMarkStepCompleted={(stepId, completed) => markStepCompleted(technique.id, stepId, completed)}
                onAddNote={(note) => addNote(technique.id, note)}
                onReset={() => resetProgress(technique.id)}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground">No techniques found matching your criteria</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}

interface TechniqueCardProps {
  technique: Technique
  progress?: {
    completed: boolean
    stepsCompleted: Record<string, boolean>
    lastPracticed?: string
    notes?: string
  }
  onMarkCompleted: (completed: boolean) => void
  onMarkStepCompleted: (stepId: string, completed: boolean) => void
  onAddNote: (note: string) => void
  onReset: () => void
}

function TechniqueCard({
  technique,
  progress,
  onMarkCompleted,
  onMarkStepCompleted,
  onAddNote,
  onReset,
}: TechniqueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [note, setNote] = useState(progress?.notes || "")

  const stepsProgress = useMemo(() => {
    if (!technique.steps) return 100

    const totalSteps = technique.steps.length
    const completedSteps = technique.steps.filter((step) => progress?.stepsCompleted?.[step.id]).length

    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  }, [technique.steps, progress])

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value)
  }

  const handleNoteSave = () => {
    onAddNote(note)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card
      className={`transition-all ${progress?.completed ? "border-green-200 bg-green-50/30 dark:bg-green-900/5" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-start gap-2">
            <Checkbox
              id={`technique-${technique.id}`}
              checked={progress?.completed || false}
              onCheckedChange={(checked) => onMarkCompleted(!!checked)}
              className="mt-1"
            />
            <div>
              <CardTitle className="text-lg">{technique.name}</CardTitle>
              <CardDescription className="mt-1">{technique.description}</CardDescription>
            </div>
          </div>
          <Badge className="ml-2">{categoryLabels[technique.category]}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {technique.steps && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-xs">{Math.round(stepsProgress)}%</span>
            </div>
            <Progress value={stepsProgress} className="h-2" />
          </div>
        )}

        {progress?.lastPracticed && (
          <div className="flex items-center text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3 mr-1" />
            Last practiced: {formatDate(progress.lastPracticed)}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="w-full">
          {isExpanded ? "Hide Details" : "Show Details"}
        </Button>
      </CardContent>

      {isExpanded && (
        <>
          {technique.steps && (
            <CardContent className="pt-0">
              <h4 className="text-sm font-medium mb-2">Steps:</h4>
              <div className="space-y-2">
                {technique.steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`step-${technique.id}-${step.id}`}
                      checked={progress?.stepsCompleted?.[step.id] || false}
                      onCheckedChange={(checked) => onMarkStepCompleted(step.id, !!checked)}
                      className="mt-0.5"
                    />
                    <label htmlFor={`step-${technique.id}-${step.id}`} className="text-sm">
                      {step.description}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          <CardContent className="pt-0">
            <h4 className="text-sm font-medium mb-2">Notes:</h4>
            <Textarea
              placeholder="Add your notes about this technique..."
              value={note}
              onChange={handleNoteChange}
              className="min-h-[100px] mb-2"
            />
            <Button size="sm" onClick={handleNoteSave}>
              Save Notes
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Reset Progress
            </Button>

            <Button
              variant={progress?.completed ? "outline" : "default"}
              size="sm"
              onClick={() => onMarkCompleted(!progress?.completed)}
              className={progress?.completed ? "" : "bg-green-600 hover:bg-green-700"}
            >
              {progress?.completed ? (
                <span className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                </span>
              ) : (
                "Mark Complete"
              )}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
