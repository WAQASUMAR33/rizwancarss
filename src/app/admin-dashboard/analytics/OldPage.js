'use client'
import React from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { FaPlane, FaPassport, FaMoneyCheckAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

// Card Component
const Card = ({ title, value, icon }) => {
  const Icon = icon;
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-gray-500 text-sm">{title}</h4>
        <Icon className="text-gray-400 text-xl" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
};

// Bar Chart for Revenue by Service
const RevenueByService = () => {
  const data = {
    labels: ["Ticket Booking", "Visa Booking", "Payable", "Receivable"],
    datasets: [
      {
        label: "Revenue (USD)",
        data: [80000, 50000, 30000, 70000],
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: "top" } },
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="text-gray-500 text-sm mb-4">Revenue by Service</h4>
      <Bar data={data} options={options} />
      <MonthlyRevenue />
    </div>
  );
};

// Doughnut Chart for Booking Status
const BookingStatus = () => {
  const data = {
    labels: ["Completed", "Pending", "Cancelled"],
    datasets: [
      {
        label: "Bookings",
        data: [65, 25, 10],
        backgroundColor: ["#10B981", "#3B82F6", "#EF4444"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="text-gray-500 text-sm mb-4">Booking Status Distribution</h4>
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Line Chart for Monthly Revenue
const MonthlyRevenue = () => {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (USD)",
        data: [60000, 65000, 70000, 75000, 80000, 85000],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { beginAtZero: true } },
    },
  };

  return (
    <div className="bg-white rounded-lg">
      <h4 className="text-gray-500 text-sm mb-4">Monthly Revenue</h4>
      <Line data={data} options={options} />
    </div>
  );
};

// Analytics Page Component
const TravelAnalyticsPage = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Total Revenue" value="$300,000" icon={FaMoneyCheckAlt} />
        <Card title="Total Ticket Bookings" value="1,500" icon={FaPlane} />
        <Card title="Total Visa Applications" value="800" icon={FaPassport} />
        <Card title="Total Payable" value="$90,000" icon={FaArrowDown} />
        <Card title="Total Receivable" value="$120,000" icon={FaArrowUp} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevenueByService />
        <BookingStatus />
      </div>
    </div>
  );
};

export default TravelAnalyticsPage;
