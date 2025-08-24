import { spawn } from 'node:child_process'
import { Injectable, Logger } from '@nestjs/common'
import { AnsibleConfig } from './ansible.config'
import {
  AnsibleCommandException,
  AnsibleException,
  AnsibleInventoryException,
  AnsiblePlaybookException,
} from './ansible.exception'
import {
  AdHocOptions,
  AnsibleResult,
  Inventory,
  InventoryGroup,
  InventoryHost,
  PlaybookOptions,
} from './ansible.interface'

@Injectable()
export class AnsibleService {
  private readonly logger = new Logger(AnsibleService.name)

  constructor(private readonly config: AnsibleConfig) {
  }

  /**
   * Execute an Ansible playbook
   */
  async runPlaybook(
    playbookName: string,
    options: PlaybookOptions = {},
  ): Promise<AnsibleResult> {
    const playbookPath = this.resolvePlaybookPath(playbookName)
    const command = this.buildPlaybookCommand(playbookPath, options)

    try {
      const result = await this.executeCommand(command)

      if (!result.success) {
        throw new AnsiblePlaybookException(
          `Playbook execution failed: ${playbookName}`,
          playbookName,
          command.join(' '),
          result.exitCode,
          result.stderr,
        )
      }

      return result
    }
    catch (error) {
      this.logger.error(`Failed to execute playbook ${playbookName}:`, error)
      throw error
    }
  }

  /**
   * Run an ad-hoc Ansible command
   */
  async runCommand(
    hosts: string,
    module: string,
    args?: string,
    options: AdHocOptions = {},
  ): Promise<AnsibleResult> {
    const command = this.buildAdHocCommand(hosts, module, args, options)

    try {
      const result = await this.executeCommand(command)

      if (!result.success) {
        throw new AnsibleCommandException(
          `Ad-hoc command failed: ${module}`,
          module,
          command.join(' '),
          result.exitCode,
          result.stderr,
        )
      }

      return result
    }
    catch (error) {
      this.logger.error(`Failed to execute ad-hoc command ${module}:`, error)
      throw error
    }
  }

  /**
   * Get inventory information
   */
  async getInventory(inventoryPath: string): Promise<Inventory> {
    const invPath = inventoryPath

    const command = ['ansible-inventory', '-i', invPath, '--list']

    try {
      const result = await this.executeCommand(command)

      if (!result.success) {
        throw new AnsibleInventoryException(
          'Failed to get inventory',
          invPath,
          command.join(' '),
          result.exitCode,
          result.stderr,
        )
      }

      return this.parseInventoryOutput(result.stdout)
    }
    catch (error) {
      this.logger.error('Failed to get inventory:', error)
      throw error
    }
  }

  /**
   * Check if a host is reachable
   */
  async ping(hosts: string, options: AdHocOptions = {}): Promise<AnsibleResult> {
    return this.runCommand(hosts, 'ping', undefined, options)
  }

  /**
   * Gather facts from hosts
   */
  async gatherFacts(hosts: string, options: AdHocOptions = {}): Promise<AnsibleResult> {
    return this.runCommand(hosts, 'setup', undefined, options)
  }

  private resolvePlaybookPath(playbookName: string): string {
    return playbookName
  }

  private buildPlaybookCommand(playbookPath: string, options: PlaybookOptions): string[] {
    const command = ['ansible-playbook']

    // Add inventory
    if (options.inventory) {
      command.push('-i', options.inventory)
    }

    // Add limit
    if (options.limit) {
      command.push('--limit', options.limit)
    }

    // Add tags
    if (options.tags && options.tags.length > 0) {
      command.push('--tags', options.tags.join(','))
    }

    // Add skip tags
    if (options.skipTags && options.skipTags.length > 0) {
      command.push('--skip-tags', options.skipTags.join(','))
    }

    // Add extra vars
    if (options.extraVars) {
      command.push('--extra-vars', JSON.stringify(options.extraVars))
    }

    // Add check mode
    if (options.check) {
      command.push('--check')
    }

    // Add diff
    if (options.diff) {
      command.push('--diff')
    }

    // Add become options
    if (options.become) {
      command.push('--become')
      if (options.becomeUser) {
        command.push('--become-user', options.becomeUser)
      }
      if (options.becomeMethod) {
        command.push('--become-method', options.becomeMethod)
      }
      if (options.askBecomePass) {
        command.push('--ask-become-pass')
      }
    }

    // Add verbosity
    if (options.verbose || this.config.verbosity > 0) {
      const verbosity = this.config.verbosity
      if (verbosity > 0) {
        command.push(`-${'v'.repeat(verbosity)}`)
      }
    }

    // Add forks
    if (this.config.forks !== 5) {
      command.push('--forks', this.config.forks.toString())
    }

    // Add playbook path
    command.push(playbookPath)

    return command
  }

  private buildAdHocCommand(
    hosts: string,
    module: string,
    args?: string,
    options: AdHocOptions = {},
  ): string[] {
    const command = ['ansible']

    // Add hosts pattern
    command.push(hosts)

    // Add inventory
    if (options.inventory) {
      command.push('-i', options.inventory)
    }

    // Add module
    command.push('-m', options.module || module)

    // Add module arguments
    if (args || options.args) {
      command.push('-a', args || options.args!)
    }

    // Add limit
    if (options.limit) {
      command.push('--limit', options.limit)
    }

    // Add extra vars
    if (options.extraVars) {
      command.push('--extra-vars', JSON.stringify(options.extraVars))
    }

    // Add become options
    if (options.become) {
      command.push('--become')
      if (options.becomeUser) {
        command.push('--become-user', options.becomeUser)
      }
    }

    // Add forks
    if (options.forks) {
      command.push('--forks', options.forks.toString())
    }

    // Add timeout
    if (options.timeout) {
      command.push('--timeout', options.timeout.toString())
    }

    return command
  }

  private async executeCommand(command: string[]): Promise<AnsibleResult> {
    const startTime = Date.now()
    const commandStr = command.join(' ')

    this.logger.debug(`Executing command: ${commandStr}`)

    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })

      let stdout = ''
      let stderr = ''

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      childProcess.on('close', (code: number | null) => {
        const duration = Date.now() - startTime
        const result: AnsibleResult = {
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          duration,
          command: commandStr,
        }

        this.logger.debug(`Command completed in ${duration}ms with exit code ${code}`)
        resolve(result)
      })

      childProcess.on('error', (error: Error) => {
        this.logger.error(`Command failed: ${error.message}`)
        reject(new AnsibleException(
          `Failed to execute command: ${error.message}`,
          commandStr,
        ))
      })

      // Set timeout
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGTERM')
          reject(new AnsibleException(
            `Command timed out after ${this.config.timeout}ms`,
            commandStr,
          ))
        }
      }, this.config.timeout)
    })
  }

  private parseInventoryOutput(output: string): Inventory {
    try {
      const data = JSON.parse(output) as Record<string, unknown>
      const hosts: InventoryHost[] = []
      const groups: InventoryGroup[] = []

      // Parse groups
      for (const [groupName, groupData] of Object.entries(data)) {
        if (groupName === '_meta')
          continue

        const groupDataObj = groupData as Record<string, unknown>
        const group: InventoryGroup = {
          name: groupName,
          hosts: (groupDataObj['hosts'] as string[]) || [],
          children: (groupDataObj['children'] as string[]) || [],
          variables: (groupDataObj['vars'] as Record<string, unknown>) || {},
        }
        groups.push(group)
      }

      // Parse hosts from _meta.hostvars
      const meta = data['_meta'] as Record<string, unknown>
      if (meta && meta['hostvars']) {
        const hostvars = meta['hostvars'] as Record<string, unknown>
        for (const [hostName, hostVars] of Object.entries(hostvars)) {
          const hostGroups = groups
            .filter(group => group.hosts.includes(hostName))
            .map(group => group.name)

          const host: InventoryHost = {
            name: hostName,
            groups: hostGroups,
            variables: hostVars as Record<string, unknown>,
          }
          hosts.push(host)
        }
      }

      return { hosts, groups }
    }
    catch (error) {
      throw new AnsibleInventoryException(
        `Failed to parse inventory output: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
      )
    }
  }
}
