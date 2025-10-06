import CryptoJS from 'crypto-js';


export const encryptData = (data: object, secretKey: string): string => {
  const dataString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(dataString, secretKey).toString();
  return encrypted;
};

export const decryptData = (encryptedData: string, secretKey: string): object | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      throw new Error('Decryption resulted in an empty string.');
    }
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null; 
  }
};