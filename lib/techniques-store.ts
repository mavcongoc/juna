import { create } from "zustand"
import { persist } from "zustand/middleware"
import { therapeuticTechniques } from "./therapeutic-techniques"

type TechniqueProgress = {
  techniqueId: string
  completed: boolean
  stepsCompleted: Record<string, boolean>
  lastPracticed?: string
  notes?: string
}

type TechniquesState = {
  progress: Record<string, TechniqueProgress>
  markTechniqueCompleted: (techniqueId: string, completed: boolean) => void
  markStepCompleted: (techniqueId: string, stepId: string, completed: boolean) => void
  addNote: (techniqueId: string, note: string) => void
  resetProgress: (techniqueId: string) => void
  resetAllProgress: () => void
}

export const useTechniquesStore = create<TechniquesState>()(
  persist(
    (set) => ({
      progress: {},

      markTechniqueCompleted: (techniqueId, completed) =>
        set((state) => {
          const technique = therapeuticTechniques.find((t) => t.id === techniqueId)
          if (!technique) return state

          const currentProgress = state.progress[techniqueId] || {
            techniqueId,
            completed: false,
            stepsCompleted: {},
          }

          // If marking as completed, also mark all steps as completed
          const stepsCompleted = { ...currentProgress.stepsCompleted }
          if (completed && technique.steps) {
            technique.steps.forEach((step) => {
              stepsCompleted[step.id] = true
            })
          }

          return {
            progress: {
              ...state.progress,
              [techniqueId]: {
                ...currentProgress,
                completed,
                stepsCompleted,
                lastPracticed: completed ? new Date().toISOString() : currentProgress.lastPracticed,
              },
            },
          }
        }),

      markStepCompleted: (techniqueId, stepId, completed) =>
        set((state) => {
          const technique = therapeuticTechniques.find((t) => t.id === techniqueId)
          if (!technique) return state

          const currentProgress = state.progress[techniqueId] || {
            techniqueId,
            completed: false,
            stepsCompleted: {},
          }

          const updatedStepsCompleted = {
            ...currentProgress.stepsCompleted,
            [stepId]: completed,
          }

          // Check if all steps are completed
          const allStepsCompleted = technique.steps?.every((step) => updatedStepsCompleted[step.id]) || false

          return {
            progress: {
              ...state.progress,
              [techniqueId]: {
                ...currentProgress,
                completed: allStepsCompleted,
                stepsCompleted: updatedStepsCompleted,
                lastPracticed: new Date().toISOString(),
              },
            },
          }
        }),

      addNote: (techniqueId, note) =>
        set((state) => {
          const currentProgress = state.progress[techniqueId] || {
            techniqueId,
            completed: false,
            stepsCompleted: {},
          }

          return {
            progress: {
              ...state.progress,
              [techniqueId]: {
                ...currentProgress,
                notes: note,
              },
            },
          }
        }),

      resetProgress: (techniqueId) =>
        set((state) => {
          const { [techniqueId]: _, ...rest } = state.progress
          return {
            progress: rest,
          }
        }),

      resetAllProgress: () => set({ progress: {} }),
    }),
    {
      name: "therapeutic-techniques-progress",
    },
  ),
)
