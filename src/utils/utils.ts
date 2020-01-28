
function toRIBNumber(value: string) {
  const numericString = value.split('').map(char => {
    switch(char) {
      case '0': return '0';
      case '1': return '1';
      case '2': return '2';
      case '3': return '3';
      case '4': return '4';
      case '5': return '5';
      case '6': return '6';
      case '7': return '7';
      case '8': return '8';
      case '9': return '9';

      case 'A':
      case 'J':
        return '1';

      case 'B':
      case 'K':
      case 'S':
        return '2';

      case 'C':
      case 'L':
      case 'T':
        return '3';
      
      case 'D':
      case 'M':
      case 'U':
        return '4';

      case 'E':
      case 'N':
      case 'V':
        return '5';
      
      case 'F':
      case 'O':
      case 'W':
        return '6';

      case 'G':
      case 'P':
      case 'X':
        return '7';

      case 'H':
      case 'Q':
      case 'Y':
        return '8';

      case 'I':
      case 'R':
      case 'Z':
        return '9';

      default:
        throw new Error(`Invalid RIB Character : ${char}`);
    }
  }).join('');

  const num = Number.parseInt(numericString);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid RIB Filed : ${value} could not be parsed into a number`);
  }

  return num;
}

function getRIBKey(bankCode: string, counterCode: string, account: string) {
  const numericBankCode = toRIBNumber(bankCode) * 89;
  const numericCounterCode = toRIBNumber(counterCode) * 15;
  const numericAccount = toRIBNumber(account) * 3;

  const sum = (numericBankCode + numericCounterCode + numericAccount) % 97
  return 97 - sum;
}

export function getRIB(bankCode: string, counterCode: string, account: string) {
  const ribKey = getRIBKey(bankCode, counterCode, account);
  return `${bankCode}${counterCode}${account}${ribKey}`;
}