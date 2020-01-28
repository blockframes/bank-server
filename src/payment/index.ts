

import { promisify } from 'util';
import { writeFile } from 'fs';
import { paymentParty, createPaymentXML } from './payment';

const asyncWrite = promisify(writeFile);

async function main() {

  // TODO LISTEN FOR QUORUM EVENT

  // TODO ON EVENT CALCULATE FINAL AMOUNT, GENERATE PAYMENT XML, SEND IT TO BANK
  
  // create a payment file
  
  const from: paymentParty = {
    companyName: 'Cascade8',
    bic: 'NSMBFRPPXXX',
    iban: 'FR7630788001000889066000366'
  }
  const to: paymentParty = {
    companyName: 'Pulsar',
    bic: 'NSMBFRPPXXX',
    iban: 'FR7630788001000889066000463'
  }
  // const xml = createPaymentXML(from, to, '12.3', 'LOTR'); // sent 28/01/20
  const xml = createPaymentXML(to, from, '14.0', 'XTRF1654Z'); // TODO send 29/01/20
  // const xml = createPaymentXML(from, to, '8.3', 'HP84QR562'); // TODO send 30/01/20
  // const xml = createPaymentXML(from, to, '11.1', '785AZ247E'); // TODO send 31/01/20
  // const xml = createPaymentXML(from, to, '11.1', 'AQPD8E1Z3'); // TODO send 31/01/20
  // const xml = createPaymentXML(to, from, '19.95', '1QSDSDF5X'); // TODO send 4/02/20
  await asyncWrite('./example/payment/sepa_test.xml', xml);
  console.log('file written !');

}

main();