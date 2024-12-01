import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, List, ListItem, ListItemText } from '@mui/material';

const DRepVotes = ({ drepId, onClose }) => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://cardano-preview.blockfrost.io/api/v0/governance/dreps/${drepId}/votes`,
          {
            headers: {
              project_id: 'previewEuPyNl3UQdxfOE1QCX5g2rYjUkPCuyKy',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching votes: ${response.status}`);
        }

        const data = await response.json();
        setVotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [drepId]);

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Votes for DRep: {drepId}
      </Typography>
      {loading && <CircularProgress />}
      {error && (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      )}
      {!loading && !error && (
        <List>
          {votes.map((vote, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`Vote ID: ${vote.vote_id}`}
                secondary={`Vote: ${vote.vote}, Proposal: ${vote.proposal_id}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Button variant="contained" color="primary" onClick={onClose} style={{ marginTop: '16px' }}>
        Close
      </Button>
    </div>
  );
};

export default DRepVotes;