import * as React from "react"
// Remove unused import
// import { useToast as useToastHook } from "./toast"

export { useToast } from "./toast"

// Create a non-hook function instead of calling hook directly
// This is a mock implementation for the static toast function
export const toast = ({ title, description }: {
  title?: string
  description?: React.ReactNode
  variant?: "default" | "destructive"
}) => {
  // Log the toast instead of calling the hook
  console.log(`Toast: ${title} - ${description}`)
  // Return empty to maintain interface
  return {}
} 