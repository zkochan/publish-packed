import fs = require('fs-extra')
import path = require('path')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import renameOverwrite = require('rename-overwrite')
import nmPrune = require('nm-prune')

import { defaultOptions, run, Options } from './run-utils'

export async function prepublishOnly (pkgDir: string, opts: Options = defaultOptions) {
  const options = { ...defaultOptions, ...opts }
  const { prune } = options

  const lockfileMap = {
    yarn: '--no-lockfile',
    pnpm: '--no-lockfile',
    npm: '--no-package-lock'
  }

  const lockfileFlag = lockfileMap[options.npmClient]
  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  try {
    await renameOverwriteIfExists(modules, tmpModules)

    await run(
      pkgDir,
      ['install', '--production', '--ignore-scripts', lockfileFlag],
      options
    )

    if (prune) await pruneNodeModules(pkgDir)

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await renameOverwriteIfExists(modules, publishedModules)

    await hideDeps(pkgDir)
  } catch (err) {
    await postpublish(pkgDir)
    throw err
  }
}

export async function postpublish (pkgDir: string) {
  await unhideDeps(pkgDir)
  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')

  await renameOverwriteIfExists(tmpModules, modules)

  const publishedModules = path.join(pkgDir, 'lib', 'node_modules')
  await rimraf(publishedModules)
}

async function pruneNodeModules (pkgDir: string) {
  const info = await nmPrune.prep(pkgDir, {pruneLicense: false}) as {files: string[], dirs: string[]}
  await Promise.all(info.files.map(fullPath => fs.remove(fullPath)))
  await Promise.all(info.dirs.map(fullPath => fs.remove(fullPath)));
}

async function renameOverwriteIfExists (oldPath: string, newPath: string | null) {
  try {
    await renameOverwrite(oldPath, newPath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

function hideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    dependencies: '__dependencies',
    devDependencies: '__devDependencies',
    optionalDependencies: '__optionalDependencies',
  })
}

function unhideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    __dependencies: 'dependencies',
    __devDependencies: 'devDependencies',
    __optionalDependencies: 'optionalDependencies',
  })
}
