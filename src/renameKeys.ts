import loadJsonFile = require('load-json-file')
import writeJsonFile = require('write-json-file')
import path = require('path')

export default async (pkgDir: string, keysMap: Object) => {
  const pkgPath = path.join(pkgDir, 'package.json')
  const pkgJSON = await loadJsonFile(pkgPath)

  const newPkgJSON = {}
  const keys = Object.keys(pkgJSON)
  for (let i = 0; i < keys.length; i++) {
    if (keysMap[keys[i]]) {
      newPkgJSON[keysMap[keys[i]]] = pkgJSON[keys[i]]
      continue
    }
    newPkgJSON[keys[i]] = pkgJSON[keys[i]]
  }

  await writeJsonFile(pkgPath, newPkgJSON)
}
