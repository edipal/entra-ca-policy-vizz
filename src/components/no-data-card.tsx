"use client"

import type React from "react"
import { useRef, type FC } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Cloud } from "lucide-react"

interface NoDataCardProps {
  onFileUpload: (file: File) => void
  onImportFromEntra: () => void
}

const NoDataCard: FC<NoDataCardProps> = ({ onFileUpload, onImportFromEntra }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
    // Reset the input value to allow re-uploading the same file
    event.target.value = ""
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <CardTitle className="mt-4 text-2xl">No Data Loaded</CardTitle>
        <CardDescription>Upload a CSV export or import directly from Entra ID.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={handleButtonClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV File
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
        <Button variant="secondary" onClick={onImportFromEntra}>
          <Cloud className="mr-2 h-4 w-4" />
          Import from Entra
        </Button>
      </CardContent>
    </Card>
  )
}

export default NoDataCard
