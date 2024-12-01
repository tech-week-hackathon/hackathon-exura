// src/utils/parseProposals.js

export const parseProposals = (data) => {
  return data.map((item, index) => {
    const { proposal, proposal_metadata, proposal_target } = item;

    // Extract basic proposal info
    const txHash = proposal.tx_hash || 'N/A';
	const formattedTxHash = txHash && txHash.length >= 7 ? `${txHash.slice(0, 4)}...${txHash.slice(-3)}`: txHash;
    const governanceType = proposal.governance_type || 'N/A';

    // Extract proposal metadata
    let title = 'Untitled Proposal';
    let motivation = 'No motivation provided.';
    let abstract = 'No abstract provided.';
    let rationale = 'No rationale provided.';
    let status = 'Pending'; // You can determine status based on your criteria

    if (proposal_metadata && proposal_metadata.body) {
      const body = proposal_metadata.body;

      
       // Prepare formatted txHash
    
      // Handle possible variations in the structure
      title = body.title || body.givenName?.['@value'] || formattedTxHash;
      motivation = body.motivation || body.motivations?.['@value'] || motivation;
      abstract = body.abstract || abstract;
      rationale = body.rationale || rationale;
    }

    // Extract proposal target info
    const amountRequested = proposal_target.reduce((sum, target) => {
      return sum + parseInt(target.amount, 10);
    }, 0);

    const stakeAddress = proposal_target[0]?.stake_address || 'N/A';

    return {
      id: index,
      txHash,
      governanceType,
      title,
      motivation,
      abstract,
      rationale,
      amountRequested,
      stakeAddress,
      status,
    };
  });
};
