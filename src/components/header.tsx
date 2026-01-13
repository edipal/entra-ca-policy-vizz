"use client"

import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface HeaderProps {
  fileName: string | null
  policyCount: number | null
  toggleSidebar: () => void
}

const Header: FC<HeaderProps> = ({ fileName, policyCount, toggleSidebar }) => {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-950">
      <div className="flex items-center gap-4">
        {/* Toggle button for sidebar, now always visible with proper color */}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-6 w-6 text-gray-800 dark:text-gray-200" /> {/* Added text color classes */}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Entra CA Policy Vizz
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Analyze and visualize Entra ID Conditional Access policies
          </p>
        </div>
      </div>
      {fileName && policyCount !== null && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{fileName}</span> ({policyCount} policies)
        </div>
      )}
    </header>
  )
}

export default Header
