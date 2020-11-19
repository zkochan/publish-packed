#!/usr/bin/env node
import { prepublishOnly, postpublish } from '.'
import getopts = require('getopts')

const opts = getopts(process.argv.slice(2), {
  alias: {
    h: 'help',
    n: ['npmClient', 'npm-client'],
  },
  boolean: [
    'help',
    'prune',
    'verbose',
  ],
  string: ['npmClient', 'npm-client', 'dest'],
  default: {
    dest: 'lib',
    npmClient: 'npm',
    help: false,
    prune: false,
    verbose: false,
    tag: 'latest',
  },
})

if (opts._[0] === 'help' || opts.help) {
  console.log(`
  Usage: publish-packed [flags]

  Options:

    -h, --help          Output usage information

    --prune             Prune unneeded files (.md, .td, etc..) from node_modules folder.
    --verbose           Enable more verbose logging
    -n, --npm-client    Name of package manager (npm, yarn, pnpm), default 'npm'
    --dest <dir>        The destination of the node_modules directory, default 'lib'
  `)
} else {
  (async () => {
    switch (process.env.npm_lifecycle_event) {
      case 'prepublishOnly':
        await prepublishOnly(process.cwd(), opts)
        break
      case 'postpublish':
        await postpublish(process.cwd())
        break
    }
  })().catch(() => {
    process.exit(1)
  })
}
