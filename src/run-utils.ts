import fs = require('fs')
import path = require('path')
import mod = require('module')

// @ts-ignore
import execa = require('execa')

// @ts-ignore
import allModulePaths = require('all-module-paths')

export type Options = { paths?: string[] } & {
  tag?: string,
  run?: typeof run,
  npmClient?: string,
  prune?: boolean,
  verbose?: boolean,
}

export const defaultOptions = {
  tag: 'latest',
  run: run,
  npmClient: 'npm',
  prune: false,
  verbose: false,
}

// export interface defaultOptions {
//   tag?: string | 'latest',
//   run?: typeof run | run,
//   npmClient?: string | 'npm',
//   prune?: boolean | false,
//   verbose?: boolean | false,
// }
// export type Options = typeof defaultOptions & { paths?: string[] }

export async function run (cwd: string, args: string[], opts: Options = defaultOptions) {
  const options = { ...defaultOptions, ...opts }
  const { verbose, npmClient } = options

  let cliPath: string | undefined = getCliPath(options)

  if (!cliPath) {
    throw new Error(`Cannot find cli for "${npmClient}" package manager`)
  }

  verbose && console.log('Using npmClient "%s" from', npmClient, cliPath)
  verbose && console.log('With the following arguments:', args)

  await execa(cliPath, args, {
    cwd,
    stdio: 'inherit',
    preferLocal: false,
    all: true,
  })
}


export function getCliPath (opts: Options) {
  // We need, strictly, the `process.cwd()` here
  // @ts-ignore
  const modPaths = mod._nodeModulePaths(process.cwd())

  const options = { ...defaultOptions, ...opts }
  const { globalModules: { binaries } } = allModulePaths({
    paths: options.paths || modPaths
  })

  return binaries
    .reverse()
    .map((fp: string) => path.join(fp, options.npmClient))
    .find((fp: string) => fs.existsSync(fp))
}
