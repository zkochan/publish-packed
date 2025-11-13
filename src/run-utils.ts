import fs = require('fs')
import which = require('@pnpm/which')

// @ts-ignore
import execa = require('execa')

export type Options = { paths?: string[], dest?: string } & {
  tag?: string,
  npmClient?: string,
  prune?: boolean,
  verbose?: boolean,
}

export const defaultOptions = {
  tag: 'latest',
  npmClient: 'npm',
  prune: false,
  verbose: false,
}

export async function run (cwd: string, args: string[], opts: Options = defaultOptions) {
  const options = { ...defaultOptions, ...opts }
  const { verbose, npmClient } = options

  if (options.npmClient === '') {
    throw new Error(`opts.npmClient cannot be an empty string`)
  }
  let cliPath = getCliPath(options) ?? options.npmClient

  if (verbose) {
    console.log(`Using npmClient "${npmClient}" from ${cliPath}\nWith the following arguments: ${args}`)
  }

  await execa(cliPath, args, {
    cwd,
    stdio: 'inherit',
    preferLocal: false,
    all: true,
  })
}


export function getCliPath (opts: Options) {
  const options = { ...defaultOptions, ...opts }
  const { npmClient } = options

  // Try to find the CLI using @pnpm/which
  try {
    const result = which.sync(npmClient, { pathExt: undefined })
    if (result) {
      return result
    }
  } catch (err) {
    // Command not found
  }

  return undefined
}
