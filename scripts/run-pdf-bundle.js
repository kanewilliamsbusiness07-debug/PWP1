const fs = require('fs');
const path = require('path');
const React = require('react');
const { pdf } = require('@react-pdf/renderer');

const bundlePath = path.resolve(__dirname, '..', 'tmp', 'pdf-generator.cjs');
if (!fs.existsSync(bundlePath)) {
  console.error('Bundle not found:', bundlePath);
  process.exit(2);
}

const bundle = require(bundlePath);
const PDFReport = bundle.PDFReport || bundle.default || bundle['default'] || bundle;

const output = path.resolve(__dirname, '..', 'tmp', 'sample-report.pdf');

const sampleProps = {
  summary: {
    title: 'Sample Report',
    generatedAt: new Date().toISOString(),
  },
  clientData: {
    id: 'sample-client',
    name: 'Sample Client',
    financials: {
      annualIncome: 120000,
      annualExpenses: 48000,
      monthlySurplus: 6000,
    },
    properties: [],
  },
};

async function run() {
  try {
    const element = React.createElement(PDFReport, sampleProps);
    // Use available APIs for compatibility across @react-pdf versions
    const instance = pdf(element);
    if (typeof instance.toBuffer === 'function') {
      const buf = await instance.toBuffer();
      if (Buffer.isBuffer(buf)) {
        fs.writeFileSync(output, buf);
      } else if (buf && typeof buf.pipe === 'function') {
        // buf is a stream-like object
        await new Promise((res, rej) => {
          const ws = fs.createWriteStream(output);
          buf.pipe(ws);
          ws.on('finish', res);
          ws.on('error', rej);
        });
      } else {
        throw new Error('Unsupported toBuffer return type');
      }
    } else if (typeof instance.toStream === 'function') {
      const stream = await instance.toStream();
      await new Promise((res, rej) => {
        const ws = fs.createWriteStream(output);
        stream.pipe(ws);
        ws.on('finish', res);
        ws.on('error', rej);
      });
    } else if (instance && typeof instance.pipe === 'function') {
      await new Promise((res, rej) => {
        const ws = fs.createWriteStream(output);
        instance.pipe(ws);
        // some implementations need end() called
        if (typeof instance.end === 'function') instance.end();
        ws.on('finish', res);
        ws.on('error', rej);
      });
    } else {
      throw new Error('No compatible pdf output method found');
    }

    const stats = fs.statSync(output);
    console.log('Wrote sample PDF:', output);
    console.log('Size (bytes):', stats.size);
    process.exit(0);
  } catch (err) {
    console.error('PDF generation failed:');
    console.error(err && (err.stack || err));
    process.exit(1);
  }
}

run();
