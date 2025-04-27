"use client"

import { useState, useEffect } from "react"

export type Task = {
  id: string
  name: string
  description: string
  completed: boolean
  priority: "low" | "medium" | "high"
}

export function useTaskProgress(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Try to load tasks from localStorage if available
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("ai-integration-tasks")
      return savedTasks ? JSON.parse(savedTasks) : initialTasks
    }
    return initialTasks
  })

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-integration-tasks", JSON.stringify(tasks))
    }
  }, [tasks])

  const addTask = (task: Omit<Task, "id" | "completed">) => {
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        id: Math.random().toString(36).substring(2, 9),
        completed: false,
      },
    ])
  }

  const completeTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: true } : task)))
  }

  const resetTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: false } : task)))
  }

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0
    const completedCount = tasks.filter((task) => task.completed).length
    return Math.round((completedCount / tasks.length) * 100)
  }

  const getRemainingTasks = () => {
    return tasks.filter((task) => !task.completed)
  }

  return {
    tasks,
    addTask,
    completeTask,
    resetTask,
    removeTask,
    getCompletionPercentage,
    getRemainingTasks,
  }
}
