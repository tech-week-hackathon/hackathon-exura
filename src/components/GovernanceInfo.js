// src/components/GovernanceInfo.js

import React from 'react';
import { Typography } from '@mui/material';

const GovernanceInfo = () => {
  return (
    <div>
      <h2>Governance and Treasury</h2>
      <Typography variant="body1" paragraph>
        Under CIP-1694 and the Conway era, the Cardano governance model allows
        the community to participate in decision-making processes that directly
        impact the treasury. Governance decisions can affect how funds are
        allocated, treasury policies, and overall management of resources.
      </Typography>
      <Typography variant="body1" paragraph>
        Key governance events that impact the treasury include:
      </Typography>
      <ul>
        <li>Approval of funding proposals</li>
        <li>Changes to treasury parameters</li>
        <li>Policy updates</li>
      </ul>
    </div>
  );
};

export default GovernanceInfo;