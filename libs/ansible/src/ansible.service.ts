import { execSync } from 'node:child_process'
import { Injectable, Logger } from '@nestjs/common'
import { execa } from 'execa'
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
    this.checkAnsibleInstallation()
  }

  /**
   * Check if Ansible CLI is installed on the system
   */
  private checkAnsibleInstallation(): void {
    if (this.isAnsibleInstalled()) {
      this.logger.debug('Ansible CLI is available')
    }
    else {
      const errorMessage = 'Ansible CLI is not installed. Please run: pnpm install to automatically install it, or install manually with: pip3 install ansible'
      this.logger.error(errorMessage)
      throw new AnsibleException(
        errorMessage,
        'ansible-playbook --version',
      )
    }
  }

  /**
   * Check if Ansible CLI is available without throwing an error
   */
  private isAnsibleInstalled(): boolean {
    try {
      execSync('ansible-playbook --version', { stdio: 'ignore' })
      return true
    }
    catch {
      return false
    }
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
      command.push('--extra-vars', `'${JSON.stringify(options.extraVars)}'`)
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
      const verbosity = Math.max(options.verbose ? 1 : 0, this.config.verbosity)
      if (verbosity > 0) {
        command.push(`-${'v'.repeat(verbosity)}`)
      }
    }

    if (options.connection) {
      command.push('--connection', options.connection)
    }

    if (options.user) {
      command.push('--user', options.user)
    }

    if (options.askPass) {
      command.push('--ask-pass')
    }

    if (options.privateKeyFile) {
      command.push('--private-key', options.privateKeyFile)
    }

    if (options.sshCommonArgs) {
      command.push('--ssh-common-args', options.sshCommonArgs)
    }

    if (options.sshExtraArgs) {
      command.push('--ssh-extra-args', options.sshExtraArgs)
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
      command.push('--extra-vars', `'${JSON.stringify(options.extraVars)}'`)
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

    if (options.connection) {
      command.push('--connection', options.connection)
    }

    if (options.user) {
      command.push('--user', options.user)
    }

    if (options.askPass) {
      command.push('--ask-pass')
    }

    if (options.privateKeyFile) {
      command.push('--private-key', options.privateKeyFile)
    }

    if (options.sshCommonArgs) {
      command.push('--ssh-common-args', options.sshCommonArgs)
    }

    if (options.sshExtraArgs) {
      command.push('--ssh-extra-args', options.sshExtraArgs)
    }

    return command
  }

  private async executeCommand(command: string[]): Promise<AnsibleResult> {
    const commandStr = command.join(' ')

    this.logger.debug(`Executing command: ${commandStr}`)

    const result = await execa(command[0], command.slice(1), {
      timeout: this.config.timeout * 60 * 1000,
      reject: false,
    })

    this.logger.debug({
      result,
    })

    if (result.timedOut) {
      throw new AnsibleException(
        `Command timed out after ${this.config.timeout}ms`,
        commandStr,
      )
    }

    const ansibleResult: AnsibleResult = {
      success: result.exitCode === 0,
      ...result,
    }

    this.logger.debug({
      message: `Command completed in ${result.durationMs}ms with exit code ${result.exitCode}`,
      ...ansibleResult,
    })

    return ansibleResult
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
