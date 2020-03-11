

// import { promisify } from 'util';
// import { writeFile } from 'fs';
// import { paymentParty, createPaymentXML } from './payment';

import { quorumProvider, getEventFilter } from '../quorum/quorum';
import { quorum } from '../environment/env';
import { Log } from '@ethersproject/providers';
import { AbiCoder } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber'
import { initTemporaryStorage } from '../storage/storage';
import { checkEbicsProcess, uploadPaymentToEbics } from '../ebics/ebics';
import { paymentParty } from './payment';

// const asyncWrite = promisify(writeFile);

async function main() {

  console.log('storage initialization');
  await initTemporaryStorage();
  console.log('storage ok');

  console.log('process checking');
  await checkEbicsProcess();
  console.log('process ok');

  const provider = quorumProvider(quorum.bankNode, quorum.password);
  const eventFilter = getEventFilter();
  const abiCoder = new AbiCoder();
  console.log('Ready! Awaiting payment events...');
  provider.on(eventFilter, (event: Log) => {
    const movieContract = event.address;
    const [buyer] = abiCoder.decode(['string'], event.data);
    const [_, rawShareOwner, rawPercentage, rawAmount] = event.topics;
    const [shareOwner] = abiCoder.decode(['address'], rawShareOwner);
    const percentage = BigNumber.from(rawPercentage).toNumber() / 1000; // ! divide by 1000 to get back the original number (solidity doesn't handle float)
    const amount = BigNumber.from(rawAmount).toNumber() / 1000;

    const amountToSend = amount / 100 * percentage;

    console.log(`${shareOwner} received a payment from ${buyer} for the movie ${movieContract} : ${percentage}% of $${amount} = ${amountToSend}`);
  
    // create a payment file
    
    // Archipel Account
    const from: paymentParty = { // TODO get from config
      companyName: 'Cascade8',
      bic: 'NSMBFRPPXXX',
      iban: 'FR7630788001000889066000366'
    }

    // TODO convert quorum node's eth address to an org then to a bankAccount
    // const to: paymentParty = {
    //   companyName: 'Pulsar',
    //   bic: 'NSMBFRPPXXX',
    //   iban: 'FR7630788001000889066000463'
    // }

    // const xml = createPaymentXML(from, to, '12.3', 'LOTR');
    // const filePath = 
    // await asyncWrite(filePath, xml);
    // console.log('file written !');

    // await uploadPaymentToEbics(filePath);
    // console.log('payment sent !');

    // FIRESTORE
  });

  // TODO ON EVENT CALCULATE FINAL AMOUNT, GENERATE PAYMENT XML, SEND IT TO BANK
  
  // create a payment file
  
  // const from: paymentParty = {
  //   companyName: 'Cascade8',
  //   bic: 'NSMBFRPPXXX',
  //   iban: 'FR7630788001000889066000366'
  // }
  // const to: paymentParty = {
  //   companyName: 'Pulsar',
  //   bic: 'NSMBFRPPXXX',
  //   iban: 'FR7630788001000889066000463'
  // }
  // const xml = createPaymentXML(from, to, '12.3', 'LOTR'); // sent 28/01/20
  // const xml = createPaymentXML(to, from, '14.0', 'XTRF1654Z'); // sent 30/01/20
  // const xml = createPaymentXML(from, to, '8.3', 'HP84QR562'); // sent 31/01/20
  // const xml = createPaymentXML(from, to, '11.1', '785AZ247E'); // sent 4/01/20
  // const xml = createPaymentXML(from, to, '11.1', 'AQPD8E1Z3'); // sent 4/01/20
  // const xml = createPaymentXML(to, from, '19.95', '1QSDSDF5X'); // TODO send 5/02/20
  // await asyncWrite('./example/payment/sepa_test.xml', xml);
  // console.log('file written !');
}

main();