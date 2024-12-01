import React, { useState } from 'react';
import { Container, Typography, AppBar, Toolbar, Button } from '@mui/material';
import WalletConnect from './components/WalletConnect';
import TreasuryDashboard from './components/TreasuryDashboard';
import ProposalFunding from './components/ProposalFunding';
import GovernanceInfo from './components/GovernanceInfo';
import TreasuryImpactChart from './components/TreasuryImpactChart';
import DRepVotes from './components/DRepVotes';
import { Buffer } from 'buffer';
import { bech32 } from 'bech32';


function App() {
  const [stakeAddress, setStakeAddress] = useState('');
  const [drep, setDrep] = useState('');
  const [selectedDRep, setSelectedDRep] = useState(null);

  const handleWalletConnected = (address, drepValue) => {
    setStakeAddress(address);
    setDrep(drepValue);
  };

  const handleDRepClick = () => {
    setSelectedDRep(drep);
  };

  const handleCloseDRepVotes = () => {
    setSelectedDRep(null);
  };
   const convertHexToBech32 = (hex) => {
    try {
      const data = Buffer.from(hex, 'hex');
      const words = bech32.toWords(data);
      return bech32.encode('stake_test', words); // Replace 'stake_test' with your desired prefix
    } catch (error) {
      console.error('Conversion error:', error);
      return 'Invalid hex address';
    }
  };
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cardano Governance dApp
          </Typography>
          <WalletConnect onWalletConnected={handleWalletConnected} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" style={{ marginTop: '16px' }}>
	
        {stakeAddress && (
          <Typography variant="body1" gutterBottom>
            Stake Address: {convertHexToBech32(stakeAddress)}
          </Typography>
        )}
        {drep && (
          <Button variant="outlined" color="primary" onClick={handleDRepClick}>
            View Votes for DRep: {drep}
          </Button>
        )}
        {selectedDRep && (
          <DRepVotes drepId={selectedDRep} onClose={handleCloseDRepVotes} />
        )}
        {!selectedDRep && (
          <>
            <TreasuryImpactChart />
            <TreasuryDashboard />
            <ProposalFunding />
            <GovernanceInfo />
          </>
        )}
      </Container>
    </div>
  );
}

export default App;