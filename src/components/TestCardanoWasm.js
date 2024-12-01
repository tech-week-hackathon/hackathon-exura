// src/components/TestCardanoWasm.js

import React, { useEffect } from 'react';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

const TestCardanoWasm = () => {
  useEffect(() => {
    try {
      const addressHex = 'e0aa8e43bca9475df7cb6e1a013654483962bf4de1f569ae2fc9e20942'; // Example testnet address
      const address = CardanoWasm.Address.from_bytes(hexStringToUint8Array(addressHex));
      const bech32 = address.to_bech32();
      console.log('Bech32 Address:', bech32);
    } catch (error) {
      console.error('Error using CardanoWasm:', error);
    }
  }, []);

  const hexStringToUint8Array = (hexString) => {
    if (hexString.length % 2 !== 0) {
      throw new Error('Invalid hex string'+hexString);
    }
    const arrayBuffer = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < arrayBuffer.length; i++) {
      const byteValue = hexString.substr(i * 2, 2);
      arrayBuffer[i] = parseInt(byteValue, 16);
    }
    return arrayBuffer;
  };

  return <div>Testing Cardano WASM Library</div>;
};

export default TestCardanoWasm;
