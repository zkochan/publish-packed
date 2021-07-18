import fs = require('fs')
import path = require('path')
import mod = require('module')

// @ts-ignore
import execa = require('execa')

// @ts-ignore
import allModulePaths = require('all-module-paths')

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
