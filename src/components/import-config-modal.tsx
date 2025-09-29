"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEFAULT_CSV_DELIMITER } from "@/utils/CSVHelper"
import { DEFAULT_COLUMN_MAP, type ColumnMap } from "@/builders/PolicyBuilder"
import Papa from "papaparse"

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
  csvText: string // raw CSV content to inspect headers
}

const commonDelimiters = [",", ";", "\t", "|"]
const IGNORE_VALUE = "__IGNORE__"

export default function ImportConfigModal({ visible, onClose, onConfirm, initialSettings, csvText }: ImportConfigModalProps) {
  // Step 1 settings
  const [csvDelimiter, setCsvDelimiter] = useState(initialSettings?.csvDelimiter ?? DEFAULT_CSV_DELIMITER)
  const [collectionSplitChar, setCollectionSplitChar] = useState(initialSettings?.collectionSplitChar ?? ",")
  // Step control (1 = delimiter/split selection, 2 = mapping)
  const [step, setStep] = useState<1 | 2>(1)
  // Parsed CSV columns (after choosing delimiter)
  const [csvColumns, setCsvColumns] = useState<string[]>([])
  // Column map selections
  const [columnMap, setColumnMap] = useState<ColumnMap>(initialSettings?.columnMap ?? DEFAULT_COLUMN_MAP)
  const [autoMatched, setAutoMatched] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (!visible) return
    setCsvDelimiter(initialSettings?.csvDelimiter ?? DEFAULT_CSV_DELIMITER)
    setCollectionSplitChar(initialSettings?.collectionSplitChar ?? ",")
    setColumnMap(initialSettings?.columnMap ?? DEFAULT_COLUMN_MAP)
    setStep(1)
    setCsvColumns([])
    setAutoMatched(false)
  }, [visible, initialSettings?.csvDelimiter, initialSettings?.collectionSplitChar, initialSettings?.columnMap])

  const delimiterLabel = (d: string) => (d === "\t" ? "Tab (\\t)" : d === ";" ? "Semicolon (;)" : d === "," ? "Comma (,)" : d === "|" ? "Pipe (|)" : d)

  const handleChangeColumn = (logicalKey: keyof ColumnMap, newValue: string) => {
    setColumnMap((prev) => ({ ...prev, [logicalKey]: newValue }))
  }

  const loadColumns = useCallback(() => {
    // Parse only the header row using Papa
    const result = Papa.parse<string[]>(csvText, {
      delimiter: csvDelimiter || DEFAULT_CSV_DELIMITER,
      preview: 1, // only first row
      skipEmptyLines: true,
    })
    let firstRow: string[] = []
    if (result.data && result.data.length > 0) {
      firstRow = Array.isArray(result.data[0]) ? (result.data[0] as string[]).map((h) => (h ?? "").trim()) : []
    }
    // If the CSV includes headers on first line (expected), firstRow is header list
    // Remove duplicates & blanks preserving order
    const seen = new Set<string>()
    const unique = firstRow.filter((h) => {
      const key = h.toLowerCase()
      if (!h || seen.has(key)) return false
      seen.add(key)
      return true
    })
    setCsvColumns(unique)
    // Initialize mapping with auto-matching if not already done
    const logicalKeysOrdered = Object.keys(DEFAULT_COLUMN_MAP) as Array<keyof ColumnMap>
    const newMap = { ...columnMap }
    const used = new Set<string>()
    logicalKeysOrdered.forEach((lk) => {
      // Only overwrite if not manually modified yet (auto-match only once per open)
      const defaultCol = DEFAULT_COLUMN_MAP[lk]
      if (!autoMatched || !newMap[lk]) {
        const found = unique.find((c) => c.toLowerCase() === defaultCol.toLowerCase())
        if (found && !used.has(found)) {
          newMap[lk] = found
          used.add(found)
        } else if (!newMap[lk]) {
          // set empty if no match and value was unchanged (equal to default original)
          newMap[lk] = newMap[lk] === DEFAULT_COLUMN_MAP[lk] ? "" : newMap[lk]
        }
      }
    })
    setColumnMap(newMap)
    setAutoMatched(true)
    setStep(2)
  }, [csvText, csvDelimiter, columnMap, autoMatched])

  const goBackToStep1 = () => setStep(1)

  const logicalKeys = useMemo(() => Object.keys(DEFAULT_COLUMN_MAP) as Array<keyof ColumnMap>, [])

  // Track used columns for uniqueness (exclude current row's assigned value when computing options)
  const usedColumns = useMemo(() => new Set(Object.values(columnMap).filter((v) => !!v)), [columnMap])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle>Import configuration</CardTitle>
          {step === 1 && <CardDescription>Step 1: Choose how to read your CSV.</CardDescription>}
          {step === 2 && <CardDescription>Step 2: Map logical policy fields to CSV columns.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6 p-6 overflow-hidden flex-1 flex flex-col">
          {step === 1 && (
            <section className="space-y-8 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="text-xs text-muted-foreground mt-1">Examples: ; , \t |</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Splits multi-value cells (e.g. app IDs).</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Click &quot;Load columns&quot; to read the header row and continue to field mapping.</p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="min-h-0 flex-1 flex flex-col">
              <div className="mb-2">
                <h3 className="font-semibold">Column mapping</h3>
                <p className="text-xs text-muted-foreground">Select exactly one CSV column for each logical field you want to import. (Ignore) leaves the field blank. Each CSV column can only be used once.</p>
              </div>
              <div className="border rounded overflow-hidden flex-1 min-h-0 flex flex-col">
                <div className="grid grid-cols-[minmax(260px,1fr)_minmax(200px,1fr)] gap-px bg-muted text-xs font-medium">
                  <div className="p-2 bg-muted/50">Logical field</div>
                  <div className="p-2 bg-muted/50">CSV column</div>
                </div>
                <div className="overflow-auto flex-1">
                  {logicalKeys.map((key) => {
                    const currentRaw = columnMap[key] || ""
                    const selectValue = currentRaw ? currentRaw : IGNORE_VALUE
                    const availableColumns = csvColumns.filter((c) => c === currentRaw || !usedColumns.has(c))
                    return (
                      <div key={String(key)} className="grid grid-cols-[minmax(260px,1fr)_minmax(200px,1fr)] gap-px border-b last:border-b-0 text-sm">
                        <div className="p-2 bg-background break-all">
                          <span className="font-mono text-[11px] md:text-xs">{String(key)}</span>
                        </div>
                        <div className="p-1 bg-background">
                          <Select value={selectValue} onValueChange={(val) => handleChangeColumn(key, val === IGNORE_VALUE ? "" : val)}>
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="(Ignore)" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value={IGNORE_VALUE}>(Ignore)</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {csvColumns.length <= 1 && (
                  <div className="p-2 text-xs text-amber-600 border-t bg-amber-50 dark:bg-amber-950/30">
                    Only one column detected. This often means the delimiter is incorrect. Try a different delimiter in Step 1.
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex justify-between gap-4 pt-2 shrink-0">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              {step === 2 && (
                <Button variant="secondary" onClick={goBackToStep1}>Back</Button>
              )}
            </div>
            <div className="flex gap-2">
              {step === 1 && (
                <Button onClick={loadColumns} disabled={!csvText}>Load columns</Button>
              )}
              {step === 2 && (
                <Button onClick={() => onConfirm({ csvDelimiter, collectionSplitChar, columnMap })}>
                  Confirm import
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
