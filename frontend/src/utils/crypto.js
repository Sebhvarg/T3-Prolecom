import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY ;

export const storage = {
  set: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error encrypting data:', error);
    }
  },

  get: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        // Si hay algo en el storage pero no se puede descifrar, asumimos alteración
        if (encrypted) return 'TAMPERED';
        return null;
      }
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Data tampered or invalid:', key);
      return 'TAMPERED';
    }
  },

  remove: (key) => localStorage.removeItem(key),
  
  clear: () => localStorage.clear(),

  // Descifrar respuestas protegidas del servidor (AES-256-CBC de PHP)
  decryptPayload: (base64Data) => {
    try {
      const keyStr = import.meta.env.VITE_STORAGE_KEY ;
      
      // La clave en PHP se rellenó con \0 hasta 32 bytes (AES-256)
      // En JS lo hacemos con Utf8
      const key = CryptoJS.enc.Utf8.parse(keyStr.padEnd(32, '\0'));
      
      // Decodificar el base64 que viene de PHP
      const rawData = CryptoJS.enc.Base64.parse(base64Data);
      
      // Extraer IV (16 bytes)
      const iv = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4));
      // Extraer CipherText (resto)
      const ciphertext = CryptoJS.lib.WordArray.create(rawData.words.slice(4));
      
      // Descifrar usando AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext },
        key,
        { 
          iv: iv, 
          mode: CryptoJS.mode.CBC, 
          padding: CryptoJS.pad.Pkcs7 
        }
      );
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) throw new Error('Decryption resulted in empty string');
      
      return JSON.parse(result);
    } catch (error) {
      console.error('Error decrypting API payload:', error);
      return null;
    }
  }
};
