
import { promisify } from 'util';
import { exec } from 'child_process';
import { default as FTPS} from 'ftps';
import { receiptFolder } from '../storage/storage';
import { ftpsCredentials } from '../environment/env';

const asyncExec = promisify(exec);

export async function checkFtpsProcess() {
  try {
    await asyncExec('lftp -v');
  } catch(error) {
    throw new Error('\n\nlftp is not available! Please install it in order to use this program!\n\n\tsudo apt-get install lftp\n\n');
  }
  return true;
}

function getFtps() {
  return new FTPS(ftpsCredentials)
}

export async function checkFtpsConnection() {
  const ftps = getFtps();
  return new Promise<boolean>((resolve, reject) => {
    ftps.ls().exec((error, result) => {
      if (!!error) {
        reject(error);
      } else {
        if (!!result.error) {
          reject(result.error);
        }
        resolve(true);
      }
    });
  });
}

interface LsResult {
  isFile: boolean;
  name: string;
}
function parseLsResult(result: string): LsResult[] {
  const lines = result.split('\n');
  const columns: string[][] = [];
  lines.forEach(line => {
    if (line !== '') {
      const dirtyColumns = line.split(' ');
      columns.push(dirtyColumns.filter(column => column !== ''));
    }
  });

  columns.forEach(line => {
    if (line.length !== 9) {
      throw new Error(`LS Parse : the following data could not be parsed as an LS result:\n${result}`);
    }
  })

  return columns.map(column => {
    const permissions = column[0];
    let isFile = permissions.startsWith('-');
    const name = column[8];
    return {isFile, name};
  });
}

export async function getReceipts() {
  const ftps = getFtps();

  const remoteFolder = './releves/RDC'; // TODO get folder from config
  // const remoteFolder = './historique-remises/VDESJ3'; // TODO get folder from config
  const localFolder = receiptFolder;

  const fileNames = await new Promise<string[]>((resolve, reject) => {
    ftps.cd(remoteFolder).ls().exec((error, result) => { 
      if (!!error) {
        reject(error);
      } else {
        if (!!result.error) {
          reject(result.error);
        }
        if (!result.data) {
          resolve([]);
        } else {
          const list = parseLsResult(result.data);
          resolve(list.filter(result => result.isFile).map(file => file.name));
        }
      }
    });
  });

  const downloadedFileNames = await Promise.all(fileNames.map(fileName => {
    return new Promise<string>(resolve => {
      ftps.get(`${remoteFolder}/${fileName}`, `${localFolder}/${fileName}`).exec((error, result) => {
        if (!!error || !!result.error) {
          console.warn(`An error as prevent ${fileName} to be correctly downloaded!`);
          console.warn(error, result.error);
          resolve(''); // something went wrong : the file wasn't downloaded, but we still want the other files
        } else {
          resolve(fileName);
        }
      });
    });
  }));

  return downloadedFileNames.filter(fileName => fileName !== '');
}