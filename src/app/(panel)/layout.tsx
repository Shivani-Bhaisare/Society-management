import { ReactNode } from 'react'
import PanelShell from '@/Components/PanelShell'

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}