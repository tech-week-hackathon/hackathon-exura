// src/components/TreasuryTransactions.js

import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';

const TreasuryTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const blockfrostApiKey = 'previewEuPyNl3UQdxfOE1QCX5g2rYjUkPCuyKy';

  useEffect(() => {
    const fetchTreasuryTransactions = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch the latest blocks
        const blocksResponse = await fetch(
          'https://cardano-preview.blockfrost.io/api/v0/blocks',
          {
            headers: {
              project_id: blockfrostApiKey,
            },
          }
        );

        if (!blocksResponse.ok) {
          const errorText = await blocksResponse.text();
          throw new Error(
            `Error fetching blocks: ${blocksResponse.status} ${blocksResponse.statusText} - ${errorText}`
          );
        }

        const blocks = await blocksResponse.json();

        // Step 2: Collect transactions from the latest blocks
        let allTransactions = [];
        for (let block of blocks.slice(0, 5)) {
          const txsResponse = await fetch(
            `https://cardano-preview.blockfrost.io/api/v0/blocks/${block.hash}/txs`,
            {
              headers: {
                project_id: blockfrostApiKey,
              },
            }
          );

          if (!txsResponse.ok) {
            const errorText = await txsResponse.text();
            throw new Error(
              `Error fetching transactions for block ${block.hash}: ${txsResponse.status} ${txsResponse.statusText} - ${errorText}`
            );
          }

          const txs = await txsResponse.json();
          allTransactions = allTransactions.concat(txs);
        }

        // Step 3: Check each transaction for treasury withdrawals
        let treasuryTxs = [];
        for (let txHash of allTransactions) {
          const txResponse = await fetch(
            `https://cardano-preview.blockfrost.io/api/v0/txs/${txHash}`,
            {
              headers: {
                project_id: blockfrostApiKey,
              },
            }
          );

          if (!txResponse.ok) {
            const errorText = await txResponse.text();
            throw new Error(
              `Error fetching transaction ${txHash}: ${txResponse.status} ${txResponse.statusText} - ${errorText}`
            );
          }

          const txDetails = await txResponse.json();

          // Check if the transaction includes a treasury withdrawal
          if (txDetails.withdrawals && txDetails.withdrawals.length > 0) {
            // Treasury withdrawals have a specific format
            const treasuryWithdrawals = txDetails.withdrawals.filter(
              (withdrawal) => withdrawal.address === 'treasury'
            );

            if (treasuryWithdrawals.length > 0) {
              treasuryTxs.push({
                id: txHash,
                tx_hash: txHash,
                amount: treasuryWithdrawals.reduce(
                  (acc, w) => acc + parseInt(w.amount),
                  0
                ),
                time: new Date(txDetails.block_time * 1000).toLocaleString(),
              });
            }
          }
        }

        setTransactions(treasuryTxs);
      } catch (err) {
        console.error('Error in fetchTreasuryTransactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuryTransactions();
  }, []);

  const columns = [
    { field: 'tx_hash', headerName: 'Transaction Hash', width: 300 },
    { field: 'amount', headerName: 'Amount (Lovelace)', width: 200 },
    { field: 'time', headerName: 'Timestamp', width: 200 },
  ];

  return (
    <div style={{ height: 500, width: '100%' }}>
      <h2>Treasury Transactions</h2>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <DataGrid rows={transactions} columns={columns} pageSize={5} />
      ) : (
        <p>No treasury transactions found in the latest blocks.</p>
      )}
    </div>
  );
};

export default TreasuryTransactions;
