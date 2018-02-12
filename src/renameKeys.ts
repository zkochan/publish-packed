import readPkg = require('read-pkg')
import writePkg = require('write-pkg')
import path = require('path')

export default async (pkgDir: string, keysMap: Object) => {
  const pkgJSON = await readPkg(pkgDir, {normalize: false})

  const newPkgJSON = renameKeys(pkgJSON, keysMap);

  await writePkg(pkgDir, newPkgJSON)
}

function renameKeys(target: Object, keysMap: Object): Object {
  const copy = {}
  for (let key of Object.keys(target)) {
    if (typeof keysMap[key] === 'string') {
      copy[keysMap[key]] = target[key]
    } else if (typeof keysMap[key] === 'object') {
      copy[key] = renameKeys(target[key], keysMap[key])
    } else {
      copy[key] = target[key]
    }
  }

  return copy
}