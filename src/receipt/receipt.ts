import { getRIB } from "../utils/utils";

interface Balance {
  account: string; // iban
  amount: number;
  date: Date;
}

interface Credit {
  from: string; // iban
  amount: number;
  date: Date;
  ref: string;
}

interface Debit {
  to: string; // iban
  amount: number;
  date: Date;
  ref: string;
}

export interface BankAccount {
  account: string // iban
  balance: number;
  lastUpdate: Date;
  credits: Credit[];
  debits: Debit[];
}

/**
 * Parse a string date in the DDMMYY format into a Date object
 * This function will also **assert** that the given string is a **valid date** and will **throw** if not.
 * @param dateDDMMYY : a string representing a date in the DDMMYY format, ex: `'270120'`
 * @example const date = parseDate('270120'); // Date 2020-01-27T00:00:00.000Z
 */
function parseDate(dateDDMMYY: string) {

  // assert parameter length
  if (dateDDMMYY.length !== 6) {
    throw new Error('Invalid date : date must be in the format DDMMYY and composed only of 6 numbers!');
  }

  // split string into date parts
  const decade = dateDDMMYY.substr(4); // ! the CFONB format only support the current decade
  const month = dateDDMMYY.substr(2, 2);
  const day = dateDDMMYY.substr(0, 2);

  // ! Because the CFONB format doesn't support the full year, we will assume that the date is from the current century,
  // ! i.e. if the value is '19' we will assume it means '2019'
  const now = new Date();
  const century = now.getFullYear().toString().substr(0, 2); // 2019 -> '20'

  // construct final date string
  const timestamp = Date.parse(`${century}${decade}-${month}-${day}`);

  // assert that the date is valid
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid date : 20${decade}-${month}-${day} cannot be converted into a valid date!`);
  }

  // build an return date object
  return new Date(`20${decade}-${month}-${day}`);
}

/**
 * Parse a string representing an amount in the CFONB format into a number.
 * This function will also **assert** that the string is correctly formated and will **throw** if not.
 * @param rawAmount : a string representing an amount in the CFONB format, ex: `'1234Q'`
 * @param numberOfDecimalDigits : a string representing the number of decimal digits of the `rawAmount` parameter
 * @example const amount = parseAmount('1234Q', '2'); // -123.48
 */
function parseAmount(rawAmount: string, numberOfDecimalDigits:string) {

  // assert numberOfDecimalDigits parameter
  const decimals = Number.parseInt(numberOfDecimalDigits);
  if (Number.isNaN(decimals)) {
    throw new Error(`Invalid number of decimals : ${numberOfDecimalDigits} cannot be parsed into a number!`);
  }

  // split rawAmount between integer part and decimal part
  const integerPartLength = 14 - decimals; // 14 is the amount's length as defined in the CFONB specification
  const integerPart = rawAmount.substr(0, integerPartLength);
  const decimalPart = rawAmount.substr(integerPartLength);

  // assert integer part
  const integerCheck = Number.parseInt(integerPart);
  if (Number.isNaN(integerCheck)) {
    throw new Error(`Invalid Amount : Integer part of the amount (${integerPart}) cannot be parsed into a number!`);
  }

  // split decimal part between digits and decimal code
  const decimalNumbers = decimalPart.substr(0, decimalPart.length - 1);
  const decimalCode = decimalPart.substr(decimalPart.length - 1);

  // assert decimal digits
  const decimalNumbersCheck = Number.parseInt(decimalNumbers);
  if (Number.isNaN(decimalNumbersCheck)) {
    throw new Error(`Invalid Amount : Decimals part of the amount (${decimalPart}) cannot be parsed into a number!`);
  }

  // parse decimal code
  let lastDecimal = 0;
  let isPositive = true;
  switch (decimalCode) {
    case '{': isPositive = true; lastDecimal = 0; break;
    case 'A': isPositive = true; lastDecimal = 1; break;
    case 'B': isPositive = true; lastDecimal = 2; break;
    case 'C': isPositive = true; lastDecimal = 3; break;
    case 'D': isPositive = true; lastDecimal = 4; break;
    case 'E': isPositive = true; lastDecimal = 5; break;
    case 'F': isPositive = true; lastDecimal = 6; break;
    case 'G': isPositive = true; lastDecimal = 7; break;
    case 'H': isPositive = true; lastDecimal = 8; break;
    case 'I': isPositive = true; lastDecimal = 9; break;

    case '}': isPositive = false; lastDecimal = 0; break;
    case 'J': isPositive = false; lastDecimal = 1; break;
    case 'K': isPositive = false; lastDecimal = 2; break;
    case 'L': isPositive = false; lastDecimal = 3; break;
    case 'M': isPositive = false; lastDecimal = 4; break;
    case 'N': isPositive = false; lastDecimal = 5; break;
    case 'O': isPositive = false; lastDecimal = 6; break;
    case 'P': isPositive = false; lastDecimal = 7; break;
    case 'Q': isPositive = false; lastDecimal = 8; break;
    case 'R': isPositive = false; lastDecimal = 9; break;

    default:
      throw new Error(`Invalid Decimal Code : ${decimalCode} is not a known decimal code, it must be in the range "A"-"R", or "{" or "}"!`);
  }

  // construct the final amount as a string
  const amount = `${isPositive ? '' : '-'}${integerPart}.${decimalNumbers}${lastDecimal}`;
  const numberAmount = Number.parseFloat(amount); // parse the string into a float

  // final assert
  if(Number.isNaN(numberAmount)) {
    throw new Error(`Invalid Amount : ${amount} could not be parsed into a number!`);
  }

  return numberAmount;
}



function parseBalanceRecord(line: string): Balance {
  const bankCode = line.substr(2, 5);
  const reservedArea0 = line.substr(7, 4);
  const counterCode = line.substr(11, 5);
  const currencyCode = line.substr(16, 3);
  const numberOfDecimalDigits = line.substr(19, 1);
  const reservedArea1 = line.substr(20, 1);
  const account = line.substr(21, 11);
  const reservedArea2 = line.substr(32, 2);
  const date = parseDate(line.substr(34, 6));
  const reservedArea3 = line.substr(40, 50);
  const rawAmount = line.substr(90, 14);
  const reservedArea4 = line.substr(104, 16);

  const amount = parseAmount(rawAmount, numberOfDecimalDigits);
  const rib = getRIB(bankCode, counterCode, account)

  return {
    account: rib,
    date,
    amount,
  }
}

function parseMovementRecord(line: string) {
  const bankCode = line.substr(2, 5);
  const internalOperationCode = line.substr(7, 4);
  const counterCode = line.substr(11, 5);
  const currency = line.substr(16, 3);
  const numberOfDecimalDigits = line.substr(19, 1);
  const reservedArea0 = line.substr(20, 1);
  const account = line.substr(21, 11);
  const interBankOperationCode = line.substr(32, 2);
  const dateOfAccounting = parseDate(line.substr(34, 6));
  const rejectionCode = line.substr(40, 2);
  const dateOfValue = parseDate(line.substr(42, 6));
  const label = line.substr(48, 31);
  const reservedArea1 = line.substr(79, 2);
  const operationNumber = line.substr(81, 7);
  const exonerationIndex = line.substr(88, 1);
  const unavailabilityIndex = line.substr(89, 1);
  const rawAmount = line.substr(90, 14);
  const reservedArea2 = line.substr(104, 16);

  console.log(
    bankCode,
    internalOperationCode,
    counterCode,
    currency,
    numberOfDecimalDigits,
    account,
    interBankOperationCode,
    dateOfAccounting,
    rejectionCode,
    dateOfValue,
    label,
    operationNumber,
    exonerationIndex,
    unavailabilityIndex,
    rawAmount
  );
}

function parseComplementaryMovementRecord(line: string) {

  // * SAME AS MOVEMENT RECORD
  // const bankCode = line.substr(2, 5);
  // const internalOperationCode = line.substr(7, 4);
  // const counterCode = line.substr(11, 5);
  // const currency = line.substr(16, 3);
  // const numberOfDecimalDigits = line.substr(19, 1);
  // const reservedArea0 = line.substr(20, 1);
  // const account = line.substr(21, 11);
  // const interBankOperationCode = line.substr(32, 2);
  // const dateOfAccountingDDMMYY = line.substr(34, 6);
  // const reservedArea1 = line.substr(40, 5);
  // * SAME AS MOVEMENT RECORD

  const complementaryCode = line.substr(46, 3);
  const complementaryInfo = line.substr(48, 70);
  const reservedArea2 = line.substr(118, 2);

  console.log(complementaryCode, complementaryInfo);
}

function parseRecord(line: string): Balance | Credit | Debit {
  const recordCode = line.substr(0, 2);

  switch(recordCode) {
    case '01':
      return parseBalanceRecord(line);
    case '04':
      return parseMovementRecord(line);
    case '05':
      return parseComplementaryMovementRecord(line);
    case '07':
      return parseBalanceRecord(line);
    default:
      throw new Error(`Invalid Record Code : ${recordCode}`);
  }
}

export function parseBankReceipt(receipt: string): BankAccount {
  const rawLines = receipt.split('\n');
  const lines = rawLines.filter(line => line.length !== 120);

  const balances: Balance[] = [];
  const credits: Credit[] = [];
  const debits: Debit[] = [];
  lines.map(line => {
    const record = parseRecord(line);
    if ('account' in record) {
      balances.push(record);
    } else if ('from' in record) {
      credits.push(record);
    } else {
      debits.push(record);
    }
  });

  if (balances.length !== 2) {
    throw new Error('Invalid Receipt : The bank receipt must have exactly one old balance and one new balance!');
  }
  if (balances[0].account !== balances[1].account) {
    throw new Error('Invalid Receipt : The old balance record and the new balance record must refer to the same account!');
  }

  let oldBalance = balances[1].amount;

  const bankAccount: BankAccount = {
    account: balances[0].account,
    balance: balances[0].amount,
    lastUpdate: balances[0].date,
    credits,
    debits
  }

  if (bankAccount.lastUpdate < balances[1].date) {
    oldBalance = balances[0].amount;
    bankAccount.lastUpdate = balances[1].date;
    bankAccount.balance = balances[1].amount;
  }

  bankAccount.credits.forEach(credit => oldBalance += credit.amount);
  bankAccount.credits.forEach(debit => oldBalance -= debit.amount);

  if (oldBalance !== bankAccount.balance) {
    throw new Error('Invalid Receipt : (oldBalance + credits - debits) is not equal to the new balance!');
  }

  return bankAccount;
}