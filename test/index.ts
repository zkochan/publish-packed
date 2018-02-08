import path = require('path')
import publishPacked from 'publish-packed'
import test = require('tape')

process.env.npm_config_registry = 'http://localhost:4873/'

test('publishPacked()', async t => {
  await publishPacked(path.join(__dirname, 'packages', 'package-with-no-bundled-deps'))
  t.end()
})
