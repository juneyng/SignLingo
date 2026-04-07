import { create } from 'zustand'

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentLesson: null,
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

  progress: {
    completedSigns: [],
    lessonProgress: {},
    streak: 0,
    totalPoints: 0,
    achievements: [],
  },
  setProgress: (progress) => set({ progress }),

  isTracking: false,
  setIsTracking: (isTracking) => set({ isTracking }),

  currentScore: 0,
  setCurrentScore: (score) => set({ currentScore: score }),
}))

export default useStore
