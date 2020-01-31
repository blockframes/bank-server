
import { promisify } from 'util';
import { readFile } from 'fs';

import { parseBankReceipt } from './receipt';
import { checkFtpsProcess, checkFtpsConnection, getReceipts } from '../ftps/ftps';
import { initTemporaryStorage, clearTemporaryStorage } from '../storage/storage';
import { checkFirestoreConnection } from '../firestore/firestore';

const asyncRead = promisify(readFile);

async function main() {

  // console.log('storage initialization');
  // await initTemporaryStorage();
  // console.log('storage ok');

  // console.log('process checking');
  // await checkFtpsProcess();
  // console.log('process ok');

  // console.log('ftps connection checking');
  // await checkFtpsConnection();
  // console.log('ftps connection ok');

  // console.log('firestore connection checking');
  // await checkFirestoreConnection(); // TODO auth & firestore rules ?
  // console.log('firestore connection ok');

  // console.log('downloading receipt')
  // const fileNames = await getReceipts();
  // console.log(`${fileNames.length} receipt retrieved`);
  // console.log(fileNames);

  console.log('parsing receipt');
  // read a receipt file
  const data = await asyncRead('./example/receipt/no_mov_account_2', 'utf8');
  const bankAccount = parseBankReceipt(data);
  console.log(bankAccount);
/*
  if (false) {
    console.log(`${2} payment(s) received`);
    console.log('retrieving expected payment on firestore');
    // FOR EACH PAYMENT
    if (false) {
      console.log('expected payment match : Harry Potter 5 10k€');
      console.log('sending Quorum transaction');
      console.log('Quorum transaction sent !');
      console.log('mark payment as received in firestore');
    } else {
      console.log('could not match received payment with any expected payment, escalating to a human operator')
    }
  } else {
    console.log('no payment received');
  }

  // TODO CHECK FIREBASE FOR CORRESPONDING 'EXPECTED PAYMENT'

  // TODO SEND QUORUM TX

  console.log('cleaning storage');
  // clearTemporaryStorage();
  console.log('cleaning ok');

  console.log('end of process');
  */
}

main();