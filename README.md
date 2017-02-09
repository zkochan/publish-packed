# publish-packed

> Publishes a package together with its dependencies

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
