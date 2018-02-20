#!/usr/bin/env node
import publishPacked from '.'
import getopts = require('getopts')

const opts = getopts(process.argv.slice(2), {
  boolean: ['prune'],
  default: {
    prune: false,
    tag: 'latest',
  },
})

publishPacked(process.cwd(), opts)
