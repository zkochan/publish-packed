import fs = require('mz/fs')
import path = require('path')
import execa = require('execa')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'
import readPkg = require('read-pkg')

export default async function (pkgDir: string, opts?: {tag?: string}) {
  opts = opts || {}
  const tag = opts.tag || 'latest'

  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')
  let publishedModules: string | null = null

  await runPrepublishScript(pkgDir)

  try {
    await renameIfExists(modules, tmpModules)

    await execa('npm', ['install', '--production', '--ignore-scripts'], {cwd: pkgDir, stdio: 'inherit'})

    publishedModules = path.join(pkgDir, 'lib', 'node_modules')
    await fs.rename(modules, publishedModules)

    await hideDeps(pkgDir)

    await execa('npm', ['publish', '--tag', tag], {cwd: pkgDir, stdio: 'inherit'})
  } finally {
    await unhideDeps(pkgDir)

    await renameIfExists(tmpModules, modules)

    if (publishedModules) await rimraf(publishedModules)
  }
}

async function runPrepublishScript (pkgDir: string) {
  const pkgJson = await readPkg(pkgDir)

  if (!pkgJson['scripts'] || !pkgJson['scripts']['prepublish']) return

  await execa('npm', ['run', 'prepublish'], {cwd: pkgDir, stdio: 'inherit'})  
}

async function renameIfExists (name: string, newName: string) {
  try {
    await fs.rename(name, newName)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
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
