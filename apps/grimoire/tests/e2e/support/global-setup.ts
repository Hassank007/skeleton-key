import fs from 'node:fs'
import type { FullConfig } from '@playwright/test'
import { axeEvidenceDir } from './axe'

/** Empties `evidence/axe/` once per run, so scans from deleted or renamed tests do not linger as evidence. */
export default function globalSetup(config: FullConfig): void {
  const dir = axeEvidenceDir(config.configFile)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}
