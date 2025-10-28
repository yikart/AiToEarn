# @yikart/ansible

A TypeScript library for interacting with Ansible automation platform.

## Features

- Execute Ansible playbooks
- Manage inventory
- Run ad-hoc commands
- Type-safe interfaces
- NestJS integration

## Installation

```bash
npm install @yikart/ansible
```

## Usage

```typescript
import { AnsibleService } from './src'

const ansibleService = new AnsibleService({
  inventoryPath: '/path/to/inventory',
  playbookPath: '/path/to/playbooks'
})

// Execute a playbook
await ansibleService.runPlaybook('site.yml', {
  limit: 'webservers',
  extraVars: { version: '1.0.0' }
})

// Run ad-hoc command
await ansibleService.runCommand('all', 'uptime')
```

## Configuration

The library supports various configuration options for customizing Ansible execution.

## License

MIT
