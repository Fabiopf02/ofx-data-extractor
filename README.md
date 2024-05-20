# [ofx-data-extractor](https://www.npmjs.com/package/ofx-data-extractor)

[![npm version](https://badge.fury.io/js/ofx-data-extractor.svg)](https://badge.fury.io/js/ofx-data-extractor) [![MIT License][license-image]][license-url]
[![codecov](https://codecov.io/gh/Fabiopf02/ofx-data-extractor/branch/main/graph/badge.svg?token=L4A7E4H8IN)](https://codecov.io/gh/Fabiopf02/ofx-data-extractor)
[![Release Package](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml/badge.svg)](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml)

## Ofx Data Extractor and Formatter
This is a `Node.js` and `Browser` module written in `TypeScript` that provides a utility for extracting data from an `OFX` file. The module can also format some of the data and retrieve specific parts of the file if requested.

### Installation
You can install this module using the Node Package Manager (`NPM`) with the following command:

**npm**
```bash
npm install ofx-data-extractor
```
**yarn**
```bash
yarn add ofx-data-extractor
```

### Methods
The `Ofx` class provides the following methods:

- `fromBuffer(data: Buffer)`: Used to read files on the node. Returns the methods
- `fromBlob(data: Blob)`: Used to read files in the browser. Returns the methods below.
- `config(options: OfxConfig)`: Used for formatting the generated json.`
- `getHeaders(): OFXMetaData`: Returns the metadata section of the OFX file as an object.
- `getBankTransferList(): Pick<BankTransferList, 'STRTTRN'>`: Returns a list of bank transfer transactions as an object.
- `getCreditCardTransferList(): Pick<BankTransferList, 'STRTTRN'>`: Returns a list of credit card transactions as an object.
- `getTransactionsSummary()`: Object: Returns a summary of transactions for a bank statement as an object.
- `getContent(): OfxStructure`: Returns the OFX file content as an object.
- `toJson(): OfxResponse`: Returns the entire OFX file content as a JSON object.

### Usage
The module provides a class called Ofx that can be used to extract and format data from an `OFX` file. Here's an example of how to use it:

```typescript
import { Ofx } from 'ofx-data-extractor'

const data = 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n...'
const ofx = new Ofx(data) // works in node.js and browser

const headers = ofx.getHeaders()
console.log(headers)

const transactionsSummary = ofx.getTransactionsSummary()
console.log(transactionsSummary)

const bankTransferList = ofx.getBankTransferList()
console.log(bankTransferList)

const ofxResponse = ofx.toJson()
console.log(ofxResponse)
```
### Constructor
The `Ofx` class constructor takes in two arguments:

`data`: The `OFX` file content as a string or a Buffer.
`config`: Optional configuration options for formatting the OFX data.

### Read data - static methods (`Node.js`)
```typescript
import { Ofx } from 'ofx-data-extractor'
import fs from 'fs'

const file = await fs.readFile('/path/to/file')
const ofx = await Ofx.fromBuffer(file)

const ofxResponse = ofx.toJson()
console.log(ofxResponse)
```

### Read data - static methods (`Browser`)
```typescript
import { Ofx } from 'ofx-data-extractor'

function handleFile(event) {
    const ofx = Ofx.fromBlob(event.target.files[0])
    const ofxResponse = ofx.toJson()
    console.log(ofxResponse)
}

// tsx/jsx/html
<input type="file" onChange={handleFile} />
```


### Configuration
The `Ofx` (`constructor` and `config` method) class can be configured with the following options:

- `formatDate`: A function that takes in a date string and returns a formatted date string.
- `fitId`: A string that determines how the financial institution transaction ID is handled. Possible values are "separated" (the default) or "included".
- `nativeTypes`: A boolean value that determines whether numeric fields should be represented as numbers or strings in the resulting JSON object.

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
