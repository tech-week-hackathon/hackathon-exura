// src/components/ProposalFunding.js

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import { parseProposals } from '../utils/parseProposals';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';



const ProposalFunding = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search parameters
  const [searchTitle, setSearchTitle] = useState('');
  const [searchMotivation, setSearchMotivation] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
  });

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/proposals.json');
        const data = await response.json();
        const parsedProposals = parseProposals(data);
        setProposals(parsedProposals);
      } catch (err) {
        console.error('Error fetching proposals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  // Fetch protocol parameters dynamically
  const fetchProtocolParameters = async () => {
    try {
      const response = await fetch('https://cardano-preview.blockfrost.io/api/v0/epochs/latest/parameters', {
        headers: { project_id: 'previewEuPyNl3UQdxfOE1QCX5g2rYjUkPCuyKy' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch protocol parameters: ${response.status} ${response.statusText}`);
      }
      const params = await response.json();
      return {
        minFeeA: params.min_fee_a,
        minFeeB: params.min_fee_b,
        minUTxOValue: params.min_utxo,
        poolDeposit: params.pool_deposit,
        keyDeposit: params.key_deposit,
        maxValueSize: params.max_value_size,
        maxTxSize: params.max_tx_size,
      };
    } catch (error) {
      console.error('Error fetching protocol parameters:', error);
      throw error;
    }
  };

  // Filtering logic
  const filteredProposals = proposals.filter((proposal) => {
    const titleMatch = proposal.title.toLowerCase().includes(searchTitle.toLowerCase());
    const motivationMatch = proposal.motivation
      .toLowerCase()
      .includes(searchMotivation.toLowerCase());
    const amountMatch =
      searchAmount === '' ||
      proposal.amountRequested / 1_000_000 === parseFloat(searchAmount);
    const statusMatch =
      searchStatus === '' || proposal.status.toLowerCase() === searchStatus.toLowerCase();

    return titleMatch && motivationMatch && amountMatch && statusMatch;
  });

  // Helper functions
const hexStringToUint8Array = (hexString) => {


    return new Uint8Array(
        hexString.match(/.{1,2}/g).map(byte => {
            const value = parseInt(byte, 16);
            if (isNaN(value)) {
                throw new Error(`Invalid hex byte: ${byte}`);
            }
            return value;
        })
    );
};

  const arrayBufferToHex = (arrayBuffer) => {
    return Array.from(new Uint8Array(arrayBuffer))
      .map((byte) => ('00' + byte.toString(16)).slice(-2))
      .join('');
  };

  // Handle support button click
  const handleSupport = async (proposalId) => {
    try {
      if (!CardanoWasm) {
        setSnackbar({
          open: true,
          message: 'Cardano library is not loaded. Please try again shortly.',
          severity: 'error',
        });
        return;
      }

      if (window.cardano && window.cardano.nami) {
        const api = await window.cardano.nami.enable();

        // Fetch protocol parameters
        const protocolParams = await fetchProtocolParameters();

        // Get the user's address
        const addresses = await api.getUsedAddresses();
        if (addresses.length === 0) {
          setSnackbar({
            open: true,
            message: 'No address found in wallet.',
            severity: 'warning',
          });
          return;
        }
		
		
        const addressHex = addresses[0];
        const address = CardanoWasm.Address.from_bytes(hexStringToUint8Array(addressHex));

        // Get UTXOs
        const utxosHex = await api.getUtxos();
        if (utxosHex.length === 0) {
          setSnackbar({
            open: true,
            message: 'No UTXOs available.',
            severity: 'warning',
          });
          return;
        }
        const utxos = utxosHex.map((utxoHex) =>
          CardanoWasm.TransactionUnspentOutput.from_bytes(hexStringToUint8Array(utxoHex))
        );

        // Initialize transaction builder with dynamic protocol parameters
        const txBuilder = CardanoWasm.TransactionBuilder.new(
          CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str(protocolParams.minFeeA.toString()),
            CardanoWasm.BigNum.from_str(protocolParams.minFeeB.toString())
          ),
          CardanoWasm.BigNum.from_str(protocolParams.minUTxOValue.toString()),
          CardanoWasm.BigNum.from_str(protocolParams.poolDeposit.toString()),
          CardanoWasm.BigNum.from_str(protocolParams.keyDeposit.toString()),
          protocolParams.maxValueSize,
          protocolParams.maxTxSize
        );

        // Add UTXOs as inputs
        for (const utxo of utxos) {
          txBuilder.add_input(
            address,
            utxo.input(),
            utxo.output().amount()
          );
        }

        // Add output back to self with minimal ADA
        const outputAmount = CardanoWasm.Value.new(
          CardanoWasm.BigNum.from_str('1000000') // minimal ADA amount
        );
        txBuilder.add_output(
          CardanoWasm.TransactionOutput.new(
            address,
            outputAmount
          )
        );

        // Add metadata
        const metadata = CardanoWasm.GeneralTransactionMetadata.new();
        metadata.insert(
          CardanoWasm.BigNum.from_str('721'), // Metadata label
          CardanoWasm.encode_json_str_to_metadatum(
            JSON.stringify({ proposalId: proposalId.toString(), support: true }),
            0 // Indicate that the JSON is an object
          )
        );
        const auxData = CardanoWasm.AuxiliaryData.new();
        auxData.set_metadata(metadata);
        txBuilder.set_auxiliary_data(auxData);

        // Calculate fee and set change address
        txBuilder.add_change_if_needed(address);

        // Build transaction body
        const txBody = txBuilder.build();

        // Create transaction
        const tx = CardanoWasm.Transaction.new(
          txBody,
          CardanoWasm.TransactionWitnessSet.new(),
          auxData
        );

        const txCbor = arrayBufferToHex(tx.to_bytes());

        // Sign the transaction
        const witnessSetHex = await api.signTx(txCbor, true);
        const witnesses = CardanoWasm.TransactionWitnessSet.from_bytes(hexStringToUint8Array(witnessSetHex));

        // Assemble the signed transaction
        const signedTx = CardanoWasm.Transaction.new(
          txBody,
          witnesses,
          auxData
        );

        const signedTxCbor = arrayBufferToHex(signedTx.to_bytes());

        // Submit the transaction
        const txHash = await api.submitTx(signedTxCbor);

        setSnackbar({
          open: true,
          message: `Transaction submitted with hash: ${txHash}`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Please install Nami Wallet',
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('Error supporting proposal:', error);
      setSnackbar({
        open: true,
        message: `Error supporting proposal: ${error.message}`,
        severity: 'error',
      });
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Funding Proposals
      </Typography>
      {/* Search Inputs */}
      <Grid container spacing={2} style={{ marginBottom: '16px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Title"
            variant="outlined"
            fullWidth
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Motivation"
            variant="outlined"
            fullWidth
            value={searchMotivation}
            onChange={(e) => setSearchMotivation(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Amount Requested"
            variant="outlined"
            fullWidth
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {/* Proposals List */}
      {loading ? (
        <CircularProgress />
      ) : filteredProposals.length > 0 ? (
        <Grid container spacing={2} alignItems="stretch">
          {filteredProposals.map((proposal) => (
            <Grid item xs={12} sm={6} md={4} key={proposal.id}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent style={{ flexGrow: 1 }}>
                  <Typography variant="h5" style={{ display: 'flex', alignItems: 'center' }}>
                    <Payment style={{ marginRight: 8 }} />
                    {proposal.title}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Amount Requested: {(proposal.amountRequested / 1_000_000).toLocaleString()} ADA
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {proposal.status}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Motivation: {proposal.motivation}
                  </Typography>
                </CardContent>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSupport(proposal.id)}
                  style={{ margin: '8px' }}
                >
                  Support Proposal Vote
                </Button>
				<Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSupport(proposal.id)}
                  style={{ margin: '8px', backgroundColor: 'red'}}
                >
                  Reject Proposal Vote
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1">No proposals found.</Typography>
      )}
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProposalFunding;