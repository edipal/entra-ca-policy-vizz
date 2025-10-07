"use client"
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface EntraImportModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (cfg: { clientId: string; tenantId: string }) => void
}

export default function EntraImportModal({ visible, onClose, onConfirm }: EntraImportModalProps) {
  const [clientId, setClientId] = useState("")
  const [tenantId, setTenantId] = useState("")
  if (!visible) return null
  const canImport = clientId.length > 0 && tenantId.length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Import from Entra ID</CardTitle>
          <CardDescription>Provide your app registration details to fetch Conditional Access policies via Microsoft Graph. Delegated admin consent required.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client (Application) ID</label>
            <input value={clientId} onChange={e=>setClientId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="w-full border rounded px-2 py-1 bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tenant ID</label>
            <input value={tenantId} onChange={e=>setTenantId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="w-full border rounded px-2 py-1 bg-background" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={!canImport} onClick={()=> onConfirm({ clientId, tenantId })}>Import</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
