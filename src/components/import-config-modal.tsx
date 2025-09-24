"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEFAULT_CSV_DELIMITER } from "@/utils/CSVHelper"
import { DEFAULT_COLUMN_MAP, type ColumnMap } from "@/builders/PolicyBuilder"

export interface ImportSettings {
  csvDelimiter: string
  collectionSplitChar: string
  columnMap: ColumnMap
}

interface ImportConfigModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (settings: ImportSettings) => void
  initialSettings?: Partial<ImportSettings>
}

const commonDelimiters = [",", ";", "\t", "|"]

export default function ImportConfigModal({ visible, onClose, onConfirm, initialSettings }: ImportConfigModalProps) {
  const [csvDelimiter, setCsvDelimiter] = useState(initialSettings?.csvDelimiter ?? DEFAULT_CSV_DELIMITER)
  const [collectionSplitChar, setCollectionSplitChar] = useState(initialSettings?.collectionSplitChar ?? ",")
  const [columnMap, setColumnMap] = useState<ColumnMap>(initialSettings?.columnMap ?? DEFAULT_COLUMN_MAP)

  useEffect(() => {
    if (!visible) return
    setCsvDelimiter(initialSettings?.csvDelimiter ?? DEFAULT_CSV_DELIMITER)
    setCollectionSplitChar(initialSettings?.collectionSplitChar ?? ",")
    setColumnMap(initialSettings?.columnMap ?? DEFAULT_COLUMN_MAP)
  }, [visible, initialSettings?.csvDelimiter, initialSettings?.collectionSplitChar, initialSettings?.columnMap])

  const delimiterLabel = (d: string) => (d === "\t" ? "Tab (\\t)" : d === ";" ? "Semicolon (;)" : d === "," ? "Comma (,)" : d === "|" ? "Pipe (|)" : d)

  const handleChangeColumn = (logicalKey: keyof ColumnMap, newValue: string) => {
    setColumnMap((prev) => ({ ...prev, [logicalKey]: newValue }))
  }

  const logicalKeys = useMemo(() => Object.keys(DEFAULT_COLUMN_MAP) as Array<keyof ColumnMap>, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle>Import configuration</CardTitle>
          <CardDescription>Adjust settings to match your CSV export format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 overflow-hidden flex-1 flex flex-col">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            <div>
              <h3 className="font-semibold mb-2">CSV delimiter</h3>
              <div className="flex items-center gap-2">
                <Select value={csvDelimiter} onValueChange={setCsvDelimiter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select delimiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDelimiters.map((d) => (
                      <SelectItem key={d} value={d}>
                        {delimiterLabel(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  className="border rounded px-2 py-1 w-24"
                  value={csvDelimiter}
                  onChange={(e) => setCsvDelimiter(e.target.value)}
                  placeholder="," aria-label="CSV delimiter"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Examples: semicolon (;), comma (,), tab (\t), pipe (|)</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Collection split character</h3>
              <div className="flex items-center gap-2">
                <Select value={collectionSplitChar} onValueChange={setCollectionSplitChar}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select split char" />
                  </SelectTrigger>
                  <SelectContent>
                    {[",", ";", "|"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  className="border rounded px-2 py-1 w-24"
                  value={collectionSplitChar}
                  onChange={(e) => setCollectionSplitChar(e.target.value)}
                  placeholder="," aria-label="Collection split char"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Used to split list-like fields inside cells.</p>
            </div>
          </section>

          <section className="min-h-0 flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">Column map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adjust the CSV column names for each logical field. Leave blank to ignore.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto pr-2 flex-1 min-h-0">
              {logicalKeys.map((key) => (
                <div key={String(key)} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{String(key)}</label>
                  <input
                    className="border rounded px-2 py-1"
                    value={columnMap[key] ?? ""}
                    onChange={(e) => handleChangeColumn(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2 shrink-0">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirm({ csvDelimiter, collectionSplitChar, columnMap })}>
              Close and continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
