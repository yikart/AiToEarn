export interface PlaybookOptions {
  inventory?: string
  limit?: string
  tags?: string[]
  skipTags?: string[]
  extraVars?: Record<string, unknown>
  check?: boolean
  diff?: boolean
  verbose?: boolean
  become?: boolean
  becomeUser?: string
  becomeMethod?: string
  askBecomePass?: boolean
}

export interface AdHocOptions {
  module?: string
  args?: string
  inventory?: string
  limit?: string
  extraVars?: Record<string, unknown>
  become?: boolean
  becomeUser?: string
  forks?: number
  timeout?: number
}

export interface AnsibleResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  duration: number
  command: string
}

export interface InventoryHost {
  name: string
  groups: string[]
  variables: Record<string, unknown>
}

export interface InventoryGroup {
  name: string
  hosts: string[]
  children: string[]
  variables: Record<string, unknown>
}

export interface Inventory {
  hosts: InventoryHost[]
  groups: InventoryGroup[]
}

export interface PlaybookTask {
  name: string
  module: string
  args: Record<string, unknown>
  when?: string
  tags?: string[]
  become?: boolean
}

export interface PlaybookPlay {
  name: string
  hosts: string
  vars?: Record<string, unknown>
  tasks: PlaybookTask[]
  handlers?: PlaybookTask[]
}

export interface Playbook {
  plays: PlaybookPlay[]
}
