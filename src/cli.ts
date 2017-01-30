#!/usr/bin/env node
import publishPacked from '.'

publishPacked(process.cwd(), {tag: process.argv[2]})
