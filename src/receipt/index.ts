
import { promisify } from 'util';
import { readFile } from 'fs';

import { parseBankFile, parseBankReceipt, BankAccount, splitBankAccounts, mergeBankAccounts, ExpectedPayment, matchPayment } from './receipt';
import { initTemporaryStorage } from '../storage/storage';
// import { checkFirestoreConnection } from '../firestore/firestore';
import { checkEbicsProcess, downloadReceiptsFromEbics } from '../ebics/ebics';
import { quorum } from '../environment/env';
import { sendPaymentToQuorum } from '../quorum/quorum';

const asyncRead = promisify(readFile);

async function main() {

  console.log('storage initialization');
  await initTemporaryStorage();
  console.log('storage ok');

  console.log('process checking');
  await checkEbicsProcess();
  console.log('process ok');

  console.log('firestore connection checking');
  // await checkFirestoreConnection(); // TODO auth & firestore rules ?
  console.log('firestore connection ok');

  console.log('retrieving expected payments from firestore')
  // TODO DOWNLOAD FROM FIRESTORE INSTEAD OF HARD CODING
  const expectedPayments: ExpectedPayment[] = [
    {
      fromParty: 'CASCADE 8',
      toAccount: '08890660004',
      amount: 11.1,
      ref: '785AZ247E',
      contractAddress: '0xdFF8135c35C9762eAeBD88c99FeC29aCc8C84C79',
      stakeholdersPrivateFor: [quorum.pulsarlNode.privateFor]
    },
  ];

  if (expectedPayments.length > 0) {
    console.log(`got ${expectedPayments.length} expected payments`);
    expectedPayments.forEach(expectedPayment => console.log(expectedPayment));
  }

  console.log('downloading receipt from ebics')
  // const fileName = await downloadReceiptsFromEbics(); // ! PROD uncomment for prod as prod receipt can only been downloaded once per day
  // console.log(fileName, 'downloaded'); // ! PROD uncomment for prod

  console.log('parsing receipts');
  // this line is only for test as prod receipt can only been downloaded once per day
  const data = await asyncRead('./example/receipt/0_test_fdl', 'utf8');
  // const data = await asyncRead(fileName, 'utf8'); // ! PROD use this line in prod
  const receipts = parseBankFile(data);

  const bankAccounts: BankAccount[] = []
  receipts.forEach(receipt => {
    bankAccounts.push(parseBankReceipt(receipt));
  });
  const splitedAccounts = splitBankAccounts(bankAccounts);
  const retrievedAccounts = Object.keys(splitedAccounts)
    .map(key => splitedAccounts[key])
    .map(bankAccount => mergeBankAccounts(bankAccount))
  ;
  
  const processing = retrievedAccounts.map(async account => {
    console.log(`Bank account ${account.account} :`);
    const incomingPayments = account.movements.filter(movement => movement.isCredit);
    const accountExpectedPayments = expectedPayments.filter(expectedPayment => account.account.includes(expectedPayment.toAccount));
    
    for (let incomingIndex = 0 ; incomingIndex < incomingPayments.length ; incomingIndex++) {
      let expectedIndex = 0
      let matched = false;
      for (; expectedIndex < accountExpectedPayments.length ; expectedIndex++) {
        if (matchPayment(expectedPayments[expectedIndex], incomingPayments[incomingIndex])) {

          matched = true;
          const {
            fromParty,
            amount,
            ref,
            contractAddress,
            stakeholdersPrivateFor
          } = accountExpectedPayments[expectedIndex];
          console.log('payment match !');
          console.log(`#${ref} : $${amount} from ${fromParty}`);
          console.log(`sending corresponding transaction to Quorum @ ${contractAddress} `);

          // ! Quorum (solidity) can only handle integers, so we multiply amount by 1000
          // ! DO NOT FORGET to divide by 1000 on the other side
          const txReceipt = await sendPaymentToQuorum(contractAddress, stakeholdersPrivateFor, fromParty, Math.floor(amount * 1000));
          console.log(txReceipt);

          // TODO mark payment as received on firestore

          break;
        }
      }
      if (!matched) {
        // TODO
        console.log('The following incoming payments doesn\'t correspond to any expected payments!');
        console.log(accountExpectedPayments[expectedIndex]);
        console.log('Escalating to administrator');
      }
    }
  });
  await Promise.all(processing);
  
  console.log('cleaning storage');
  // clearTemporaryStorage();
  console.log('cleaning ok');

  console.log('end of process');
}

main();