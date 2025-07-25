import { resolve } from 'node:path'
import { program } from 'commander'
import {
  fileLoader,
  selectConfig as nestSelectConfig,
  TypedConfigModule,
} from 'nest-typed-config'
import { z } from 'zod/v4'
import { ZodDto } from './zod-dto.util'
import { zodValidate } from './zod-validate.util'

export function selectConfig<TOutput = unknown, TInput = TOutput>(
  config: ZodDto<TOutput, TInput>,
): TOutput {
  const module = TypedConfigModule.forRoot({
    schema: config,
    validate(value) {
      return zodValidate(value, config, (error) => {
        return new Error(
          `Configuration is not valid:\n${z.prettifyError(error)}\n`,
        )
      }) as Record<string, unknown>
    },
    load: fileLoader({
      absolutePath: resolve(
        process.cwd(),
        program
          .requiredOption('-c --config <config>', 'config path')
          .parse(process.argv)
          .opts()['config'],
      ),
    }),
  })
  return nestSelectConfig(module, config)
}
