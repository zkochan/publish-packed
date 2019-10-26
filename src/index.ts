import fs = require('fs-extra')
import path = require('path')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import readPkg = require('read-pkg')
import renameOverwrite = require('rename-overwrite')
import nmPrune = require('nm-prune')

import { run, defaultOptions, Options } from './run-utils'

export default async function (pkgDir: string, opts: Options = defaultOptions) {
  const options = { ...defaultOptions, ...opts }
  const { tag, prune } = options

  const lockfileMap = {
    yarn: '--no-lockfile',
    pnpm: '--no-lockfile',
    npm: '--no-package-lock'
  }

  const runCli = options.run
  const lockfileFlag = lockfileMap[options.npmClient]
  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  await runPrepublishScript(pkgDir, runCli, options)

  try {
    await renameOverwriteIfExists(modules, tmpModules)

    await runCli(
      pkgDir,
      ['install', '--production', '--ignore-scripts', lockfileFlag],
      options
    )

    if (prune) await pruneNodeModules(pkgDir)

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await renameOverwriteIfExists(modules, publishedModules)

    await hideDeps(pkgDir)
    await runCli(
      pkgDir,
      ['publish', '--tag', tag],
      {
        ...options,
        npmClient: 'npm' // ! force using npm for publishing
      }
    )
  } finally {
    await unhideDeps(pkgDir)

    await renameOverwriteIfExists(tmpModules, modules)

    if (publishedModules) await rimraf(publishedModules)
  }
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

async function runPrepublishScript (pkgDir: string, runCli: typeof run, opts: Options) {
  const pkgJson = await readPkg({ cwd: pkgDir })

  if (!pkgJson['scripts']) return

  if (pkgJson['scripts']['prepublish']) {
    await runCli(pkgDir, ['run', 'prepublish'], opts)
  }

  if (pkgJson['scripts']['prepublishOnly']) {
    await runCli(pkgDir, ['run', 'prepublishOnly'], opts)
  }
}

function hideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    dependencies: '__dependencies',
    devDependencies: '__devDependencies',
    optionalDependencies: '__optionalDependencies',
    scripts: {
      prepublish: '__prepublish',
      prepublishOnly: '__prepublishOnly'
    }
  })
}

function unhideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    __dependencies: 'dependencies',
    __devDependencies: 'devDependencies',
    __optionalDependencies: 'optionalDependencies',
    scripts: {
      __prepublish: 'prepublish',
      __prepublishOnly: 'prepublishOnly'
    }
  })
}
