import { z } from 'zod'

export const ansibleConfigSchema = z.object({
  inventoryPath: z.string().optional(),
  playbookPath: z.string().optional(),
  configFile: z.string().optional(),
  privateKeyFile: z.string().optional(),
  vaultPasswordFile: z.string().optional(),
  timeout: z.number().positive().optional().default(300),
  forks: z.number().positive().optional().default(5),
  verbosity: z.number().min(0).max(4).optional().default(0),
})

export type AnsibleConfigType = z.infer<typeof ansibleConfigSchema>

export const defaultAnsibleConfig: AnsibleConfigType = {
  timeout: 300,
  forks: 5,
  verbosity: 0,
}
