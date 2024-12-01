import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';

const WalletConnect = ({ onWalletConnected }) => {
  const [connected, setConnected] = useState(false);
  const [CardanoWasm, setCardanoWasm] = useState(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasm = await import('@emurgo/cardano-serialization-lib-browser');
        setCardanoWasm(wasm);
      } catch (err) {
        console.error('Error loading Cardano WASM library:', err);
      }
    };
    loadWasm();
  }, []);

  const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  };

  const connectWallet = async () => {
    try {
      if (!CardanoWasm) {
        alert('Cardano library is still loading. Please try again shortly.');
        return;
      }
      if (window.cardano && window.cardano.nami) {
        const api = await window.cardano.nami.enable();
        const stakeAddressHexArray = await api.getRewardAddresses();
        const stakeAddressHex = stakeAddressHexArray[0];
        const stakeAddress = stakeAddressHex;

        if (stakeAddress) {
          setConnected(true);

          // Fetch and pass the stakeAddress and drep to the parent component
          try {
            const response = await fetch('http://10.0.0.3:5000/user_address', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ address: stakeAddress }),
            });

            if (response.ok) {
              const json = await response.json();
              const drep = json.drep_id; // Assuming `drep` is part of the response JSON
              onWalletConnected(stakeAddress, drep);
            } else {
              const errorText = await response.text();
              console.error('Error fetching drep:', response.status, errorText);
            }
          } catch (error) {
            console.error('Network error when fetching drep:', error);
          }
        } else {
          alert('Failed to convert stake address.');
        }
      } else {
        alert('Please install Nami Wallet');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={connectWallet}>
      {connected ? 'Wallet Connected' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnect;