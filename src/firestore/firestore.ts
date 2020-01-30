
import { initializeApp } from 'firebase';
import { firebaseCredentials } from '../environment/env';

function getFirestore() {
  const app = initializeApp(firebaseCredentials);
  return app.firestore();
}

export async function checkFirestoreConnection() {
  const db = getFirestore();

  const timestamp = Date.now();
  await db.collection('_META').doc('_BANK').set({lastConnection: timestamp});
  
  const metaBankRef = await db.collection('_META').doc('_BANK').get();
  if (!metaBankRef.exists) {
    throw new Error('Something went wrong!');
  } else {
    const data = metaBankRef.data();
    if (data!.lastConnection === timestamp) {
      return true;
    } else {
      throw new Error('Something went wrong!');
    }
  }
}