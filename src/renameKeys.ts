import readPkg = require('read-pkg')
import writePkg = require('write-pkg')
import path = require('path')

export default async (pkgDir: string, keysMap: Object) => {
  const pkgJSON = await readPkg(pkgDir, {normalize: false})

  const newPkgJSON = {}
  const keys = Object.keys(pkgJSON)
  for (let i = 0; i < keys.length; i++) {
    if (keysMap[keys[i]]) {
      newPkgJSON[keysMap[keys[i]]] = pkgJSON[keys[i]]
      continue
    }
    newPkgJSON[keys[i]] = pkgJSON[keys[i]]
  }

  await writePkg(pkgDir, newPkgJSON)
}
