import execa = require('execa')
import resolveFrom = require('resolve-from')
import fs = require('fs-extra')
import path = require('path')

const npmPackageJsonLocation = resolveFrom(__dirname, 'npm/package.json')
const npmPackageRoot = path.dirname(npmPackageJsonLocation)
const npmPackageJson = JSON.parse(fs.readFileSync(npmPackageJsonLocation, 'utf8'))
const npmCliRel = typeof npmPackageJson.bin === 'string' ? npmPackageJson.bin : npmPackageJson.bin.npm
const npmCli = path.join(npmPackageRoot, npmCliRel)

export default async function (args: string[], cwd: string) {
  await execa('node', [npmCli].concat(args), {cwd, stdio: 'inherit'})
}
