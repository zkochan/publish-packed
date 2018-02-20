import fs = require('fs-extra')
import path = require('path')
import execa = require('execa')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import readPkg = require('read-pkg')
import renameOverwrite = require('rename-overwrite')
import nmPrune = require('nm-prune')

export default async function (pkgDir: string, opts?: {tag?: string}) {
  opts = opts || {}
  const tag = opts.tag || 'latest'

  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  await runPrepublishScript(pkgDir)

  try {
    await renameOverwriteIfExists(modules, tmpModules)

    await execa('npm', ['install', '--production', '--ignore-scripts', '--no-package-lock'], {cwd: pkgDir, stdio: 'inherit'})
    await pruneNodeModules(pkgDir)

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await renameOverwrite(modules, publishedModules)

    await hideDeps(pkgDir)

    await execa('npm', ['publish', '--tag', tag], {cwd: pkgDir, stdio: 'inherit'})
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
    await execa('npm', ['run', 'prepublish'], {cwd: pkgDir, stdio: 'inherit'})
  }

  if (pkgJson['scripts']['prepublishOnly']) {
    await execa('npm', ['run', 'prepublishOnly'], {cwd: pkgDir, stdio: 'inherit'})
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
