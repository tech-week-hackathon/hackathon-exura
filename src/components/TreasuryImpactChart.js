// src/components/TreasuryImpactChart.js

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { CircularProgress } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TreasuryImpactChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data fetching
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulated data
        const proposals = [
          { id: 1, title: 'Proposal A', amountWithdrawn: 5000000000 },
          { id: 2, title: 'Proposal B', amountWithdrawn: 3000000000 },
          { id: 3, title: 'Proposal C', amountWithdrawn: 7000000000 },
          { id: 4, title: 'Proposal D', amountWithdrawn: 2000000000 },
          { id: 5, title: 'Proposal E', amountWithdrawn: 8000000000 },
        ];

        const labels = proposals.map((proposal) => proposal.title);
        const dataValues = proposals.map((proposal) => proposal.amountWithdrawn / 1_000_000);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Amount Withdrawn (ADA)',
              data: dataValues,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <div>
      <h2>Treasury Impact by Proposals</h2>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Treasury Withdrawals per Proposal' },
          },
          scales: {
            x: { title: { display: true, text: 'Proposals' } },
            y: { title: { display: true, text: 'Amount Withdrawn (ADA)' } },
          },
        }}
      />
    </div>
  );
};

export default TreasuryImpactChart;