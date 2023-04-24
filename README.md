# ofx-ts
## Ofx Data Extractor and Formatter
This is a Node.js module written in TypeScript that provides a utility for extracting data from an OFX file. The module can also format some of the data and retrieve specific parts of the file if requested.

### Installation
You can install this module using the Node Package Manager (NPM) with the following command:

```bash
npm install ofx-ts
```
Usage
The module provides a class called Ofx that can be used to extract and format data from an OFX file. Here's an example of how to use it:

```typescript
import { Ofx } from 'ofx-data-extractor';

const data = 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n...';
const ofx = new Ofx(data);

const headers = ofx.getHeaders();
console.log(headers);

const transactionsSummary = ofx.getTransactionsSummary();
console.log(transactionsSummary);

const bankTransferList = ofx.getBankTransferList();
console.log(bankTransferList);

const ofxResponse = ofx.toJson();
console.log(ofxResponse);
```
### Constructor
The `Ofx` class constructor takes in two arguments:

`data`: The OFX file content as a string or a Buffer.
`config`: Optional configuration options for formatting the OFX data.
### Methods
The `Ofx` class provides the following methods:

`getHeaders()`: OFXMetaData: Returns the metadata section of the OFX file as an object.
`getBankTransferList(): Pick<BankTransferList, 'STRTTRN'>`: Returns a list of bank transfer transactions as an object.
`getTransactionsSummary()`: Object: Returns a summary of transactions for a bank statement as an object.
`getContent(): OfxStructure`: Returns the OFX file content as an object.
`toJson()`: OfxResponse: Returns the entire OFX file content as a JSON object.

### Configuration
The `Ofx` class can be configured with the following options:

`formatDate`: A function that takes in a date string and returns a formatted date string.
`fitId`: A string that determines how the financial institution transaction ID is handled. Possible values are "separated" (the default) or "included".
`nativeTypes`: A boolean value that determines whether numeric fields should be represented as numbers or strings in the resulting JSON object.
