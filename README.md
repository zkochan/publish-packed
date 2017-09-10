# publish-packed

[![npm version](https://img.shields.io/npm/v/publish-packed.svg)](https://www.npmjs.com/package/publish-packed)
[![Status](https://travis-ci.org/zkochan/publish-packed.svg?branch=master)](https://travis-ci.org/zkochan/publish-packed "See test builds")

> Publishes a package together with its dependencies

When publishing a package, dependencies are not bundled with the package.
Although you could use [bundledDependencies](https://docs.npmjs.com/files/package.json#bundleddependencies),
you have to list all the dependencies you want to bundle.

`publish-packed` bundles all dependencies with your package:

1. it installs all your dependencies first
2. it moves the `node_modules` folder from the root of your package to `lib/node_modules`
   
   When publishing, npm ignores the `node_modules` folder in the root of your package. However,
   it packs all `node_modules` in subfolders.
3. it escapes the `dependencies` field in your package's `package.json`, so during installation
no dependencies of your package will be installed, except optional dependencies.

Limitations:

1. you can use `publish-packed` only if all your source code is in the `lib/` directory
because all you dependencies are going to be inside `lib/node_modules`.
2. you can use `publish-packed` only if your prod dependencies don't have lifecycle events like `postinstall`
that should be executed during installation

## Installation

```
npm install --global publish-packed
```

## Usage

Install [in-publish](https://www.npmjs.com/package/in-publish) as dev dependency

```
npm install --save-dev in-publish
```

Add it to `package.json`:

```json
  "scripts": {
    "prepublish": "in-publish && echo 'You need to use \"publish-packed\" to publish this package' && false || not-in-publish"
  }
```

To publish the package, run `publish-packed`.

## License

[MIT](LICENSE) © [Zoltan Kochan](https://www.kochan.io)
