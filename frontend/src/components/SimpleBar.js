import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatDollars = (value) => Number(value).toLocaleString("en-US");

// Compact tick labels (e.g. 13.5M) keep the y-axis readable on small screens.
const formatCompact = (value) => {
  const n = Number(value);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export default function InvestmentBar({ data }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="chart-wrapper" style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} stroke="#8884d8" tick={{ fontSize: 12 }} label={{ value: 'Group', position: 'insideBottomRight', offset: -5 }} />
          <YAxis tickFormatter={formatCompact} width={55} />
          <Tooltip formatter={(value) => [formatDollars(value), 'dollars']} labelFormatter={(label) => `Group ${label}`} />
          <Legend />
          <Bar dataKey="dollars" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
