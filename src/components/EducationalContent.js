// src/components/EducationalContent.js

import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';

const EducationalContent = () => {
  return (
    <div>
      <h2>Educational Content</h2>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography>What is the Cardano Treasury?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            The Cardano Treasury is a decentralized fund used to support the development and maintenance of the Cardano ecosystem...
          </Typography>
        </AccordionDetails>
      </Accordion>
      {/* Add more Accordions as needed */}
    </div>
  );
};

export default EducationalContent;