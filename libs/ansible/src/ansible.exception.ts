export class AnsibleException extends Error {
  constructor(
    message: string,
    public readonly command?: string,
    public readonly exitCode?: number,
    public readonly stderr?: string,
  ) {
    super(message)
    this.name = 'AnsibleException'
  }
}

export class AnsiblePlaybookException extends AnsibleException {
  constructor(
    message: string,
    public readonly playbook: string,
    command?: string,
    exitCode?: number,
    stderr?: string,
  ) {
    super(message, command, exitCode, stderr)
    this.name = 'AnsiblePlaybookException'
  }
}

export class AnsibleInventoryException extends AnsibleException {
  constructor(
    message: string,
    public readonly inventory: string,
    command?: string,
    exitCode?: number,
    stderr?: string,
  ) {
    super(message, command, exitCode, stderr)
    this.name = 'AnsibleInventoryException'
  }
}

export class AnsibleCommandException extends AnsibleException {
  constructor(
    message: string,
    public readonly module: string,
    command?: string,
    exitCode?: number,
    stderr?: string,
  ) {
    super(message, command, exitCode, stderr)
    this.name = 'AnsibleCommandException'
  }
}
