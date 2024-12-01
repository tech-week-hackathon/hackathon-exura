// src/components/ProposalList.js

import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import { parseProposals } from '../utils/parseProposals';

const ProposalList = ({ onSelectProposal }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      // Replace with actual API call or import your JSON data directly
      const response = await fetch('http://10.0.0.3:5000/treasury_proposals'); // Mock endpoint
      const data = await response.json();

      // Parse the proposals
      const parsedProposals = parseProposals(data);
      setProposals(parsedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography variant="h4">Active Proposals</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {proposals.map((proposal) => (
            <ListItem
              button
              key={proposal.id}
              onClick={() => onSelectProposal(proposal)}
            >
              <ListItemText
                primary={proposal.title}
                secondary={`Requested Amount: ${(
                  proposal.withdrawalAmount / 1_000_000
                ).toLocaleString()} ADA`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default ProposalList;
