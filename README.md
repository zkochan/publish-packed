# publish-packed

[![npm version](https://img.shields.io/npm/v/publish-packed.svg)](https://www.npmjs.com/package/publish-packed)
[![Status](https://travis-ci.org/zkochan/publish-packed.svg?branch=master)](https://travis-ci.org/zkochan/publish-packed "See test builds")

> Publishes a package together with its dependencies

When publishing a package, dependencies are not bundled with the package.
Although you could use [bundledDependencies](https://docs.npmjs.com/files/package.json#bundleddependencies),
you have to list all the dependencies you want to bundle.

`publish-packed` bundles all dependencies with your package:

1. it installs all your dependencies first
1. it moves the `node_modules` folder from the root of your package to `lib/node_modules`

   When publishing, npm ignores the `node_modules` folder in the root of your package. However,
   it packs all `node_modules` in subfolders.
1. it escapes the `dependencies` field in your package's `package.json`, so during installation
no dependencies of your package will be installed, except optional dependencies.
1. it can prune `node_modules`, removing markdown files, tests, configs and other resources that are not code

Limitations:

1. you can use `publish-packed` only if all your source code is in the `lib/` directory
because all your dependencies are going to be inside `lib/node_modules`.
2. you can use `publish-packed` only if your prod dependencies don't have lifecycle events like `postinstall`
that should be executed during installation

## Installation

```
<npm|pnpm|yarn> add -D publish-packed
```

## Usage

Add `publish-packed` to the `prepublishOnly` and `postpublish` scripts of your `package.json`:

```json
  "scripts": {
    "prepublishOnly": "publish-packed",
    "postpublish": "publish-packed"
  }
```

To publish the package, just run `<npm|pnpm|yarn> publish`.

## License

[MIT](LICENSE) © [Zoltan Kochan](https://www.kochan.io)
