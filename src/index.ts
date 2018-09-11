import fs = require('fs-extra')
import path = require('path')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import readPkg = require('read-pkg')
import renameOverwrite = require('rename-overwrite')
import nmPrune = require('nm-prune')
import runNpm from './runNpm'

export default async function (
  pkgDir: string,
  opts?: {
    tag?: string,
    prune?: boolean,
  },
) {
  opts = opts || {}
  const tag = opts.tag || 'latest'
  const prune = opts.prune || false

  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  await runPrepublishScript(pkgDir)

  try {
    await renameOverwriteIfExists(modules, tmpModules)

    await runNpm(['install', '--production', '--ignore-scripts', '--no-package-lock'], pkgDir)

    if (prune) await pruneNodeModules(pkgDir)

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await renameOverwrite(modules, publishedModules)

    await hideDeps(pkgDir)

    await runNpm(['publish', '--tag', tag], pkgDir)
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

async function renameOverwriteIfExists (oldPath: string, newPath: string) {
  try {
    await renameOverwrite(oldPath, newPath)
  } catch (err) {
    if (err['code'] !== 'ENOENT') throw err
  }
}

async function runPrepublishScript (pkgDir: string) {
  const pkgJson = await readPkg(pkgDir)

  if (!pkgJson['scripts']) return

  if (pkgJson['scripts']['prepublish']) {
    await runNpm(['run', 'prepublish'], pkgDir)
  }

  if (pkgJson['scripts']['prepublishOnly']) {
    await runNpm(['run', 'prepublishOnly'], pkgDir)
  }
}

function hideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    dependencies: '__dependencies',
    scripts: {
      prepublish: '__prepublish',
      prepublishOnly: '__prepublishOnly'
    }
  })
}

function unhideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    __dependencies: 'dependencies',
    scripts: {
      __prepublish: 'prepublish',
      __prepublishOnly: 'prepublishOnly'
    }
  })
}
