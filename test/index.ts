import fs = require('fs-extra')
import path = require('path')
import test = require('tape-await')
import pMapSeries from 'p-map-series'

import { prepublishOnly } from '../src/index'
import { getCliPath } from '../src/run-utils'

function cleanupWrapper (fn) {
  return async (...args) => {
    const dbPath = path.join(__dirname, 'registry', 'storage')

    await fs.remove(dbPath)
    await fn(...args)
    await fs.remove(dbPath)
  }
}

process.env.npm_config_registry = 'http://localhost:4873'

test('should work with using `npm` client by default', cleanupWrapper(async (t) => {
  t.plan(1)

  const pkgName = 'package-with-no-bundled-deps'
  const filepath = path.join(__dirname, 'packages', pkgName)

  await prepublishOnly(filepath)
  t.pass('should pass')
}))

test('should fail correctly if pkgDir not found or other errors', cleanupWrapper(async (t) => {
  t.plan(1)

  const filepath = path.join(__dirname, 'foo-bar-not-existing')

  try {
    await prepublishOnly(filepath)
  } catch (err) {
    t.pass('correctly fails')
    return
  }
  t.fail('should not pass')
}))

test('should work with opts.npmClient option', async (t) => {
  const clients = ['yarn', 'pnpm'].filter(npmClient => {
    const cliPath = getCliPath({ npmClient })
    if (!cliPath) {
      return false
    }
    return fs.existsSync(cliPath)
  })

  if (clients.length === 0) {
    return
  }

  t.plan(clients.length)

  await pMapSeries(clients, cleanupWrapper(async (npmClient) => {
    const pkgName = 'package-with-no-bundled-deps'
    const filepath = path.join(__dirname, 'packages', pkgName)

    await prepublishOnly(filepath, { npmClient: npmClient })
    t.pass(`should work with opts.npmClient: ${npmClient} client`)
  }))
})
