import fs = require('mz/fs')
import path = require('path')
import execa = require('execa')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import readPkg = require('read-pkg')
import renameOverwrite = require('rename-overwrite')

export default async function (pkgDir: string, opts?: {tag?: string}) {
  opts = opts || {}
  const tag = opts.tag || 'latest'

  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  await runPrepublishScript(pkgDir)

  try {
    await renameOverwrite(modules, tmpModules)

    await execa('npm', ['install', '--production', '--ignore-scripts', '--no-package-lock'], {cwd: pkgDir, stdio: 'inherit'})

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await renameOverwrite(modules, publishedModules)

    await hideDeps(pkgDir)

    await execa('npm', ['publish', '--tag', tag], {cwd: pkgDir, stdio: 'inherit'})
  } finally {
    await unhideDeps(pkgDir)

    await renameOverwrite(tmpModules, modules)

    if (publishedModules) await rimraf(publishedModules)
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
    scripts: '__scripts'
  })
}

function unhideDeps (pkgDir: string) {
  return renameKeys(pkgDir, {
    __dependencies: 'dependencies',
    __scripts: 'scripts'
  })
}
