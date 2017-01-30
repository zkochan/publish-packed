import fs = require('mz/fs')
import path = require('path')
import execa = require('execa')
import rimraf = require('rimraf-then')
import renameKeys from './renameKeys'

export default async function (pkgDir: string) {
  const modules = path.join(pkgDir, 'node_modules')
  const tmpModules = path.join(pkgDir, 'tmp_node_modules')

  await renameIfExists(modules, tmpModules)

  await execa('npm', ['install', '--production', '--ignore-scripts'], {cwd: pkgDir})
  
  const publishedModules = path.join(pkgDir, 'lib', 'node_modules')
  await fs.rename(modules, publishedModules)

  await hideDeps(pkgDir)

  await execa('npm', ['publish'], {cwd: pkgDir})

  await unhideDeps(pkgDir)

  await renameIfExists(tmpModules, modules)

  await rimraf(publishedModules)
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
