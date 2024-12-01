// src/components/treasuryDashboard.js

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CircularProgress, Typography } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TreasuryDashboard = () => {
  const [epochData, setEpochData] = useState([]);
  const [treasuryAmounts, setTreasuryAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        const response = await fetch('http://10.0.0.3:5000/treasury_epochs');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Process the data
        const epochs = [];
        const amounts = [];

        // Sort epochs in ascending order
        const sortedEpochs = Object.keys(data).sort((a, b) => Number(a) - Number(b));

        for (const epoch of sortedEpochs) {
          epochs.push(epoch);
          // Convert lovelaces to ADA by dividing by 1,000,000
          const amountInADA = Number(data[epoch]) / 1_000_000;
          amounts.push(amountInADA);
        }

        setEpochData(epochs);
        setTreasuryAmounts(amounts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuryData();
  }, []);

  // Chart.js Data
  const chartData = {
    labels: epochData,
    datasets: [
      {
        label: 'Treasury Amount (ADA)',
        data: treasuryAmounts,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  // Chart.js Options
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Cardano Treasury Amount per Epoch' },
    },
    scales: {
      x: { title: { display: true, text: 'Epoch' } },
      y: { title: { display: true, text: 'Treasury Amount (ADA)' } },
    },
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Treasury Dashboard
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default TreasuryDashboard;