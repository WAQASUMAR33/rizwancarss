'use client';

import React, { useEffect, useState } from 'react';
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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Paper 
} from '@mui/material';
import { 
  Flight as FaPlane, 
  CardTravel as FaPassport, 
  ArrowDownward as FaArrowDown,
  ArrowUpward as FaArrowUp 
} from '@mui/icons-material';

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
const AnalyticsCard = ({ title, value, icon: Icon }) => {
  return (
    <Card sx={{ minWidth: 200 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Icon sx={{ fontSize: 24, color: 'grey.500' }} />
        </Box>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Fetch Data Hook (remains the same)
const useAnalyticsData = () => {
  const [data, setData] = useState({
    flightBookingPending: 0,
    flightBookingApproved: 0,
    groupflightBookingPending: 0,
    groupflightBookingApproved: 0,
    hotelBookingPending: 0,
    hotelBookingApproved: 0,
    paymentPending: 0,
    paymentApproved: 0,
  });

  const fetchData = async () => {
    try {
      const [flightPending, flightApproved, hotelPending, hotelApproved, paymentPending, paymentApproved] = await Promise.all([
        fetch('/api/Analytics/FlightBooking/Pending').then((res) => res.json()),
        fetch('/api/Analytics/FlightBooking/Approved').then((res) => res.json()),
        fetch('/api/Analytics/HotelBooking/Pending').then((res) => res.json()),
        fetch('/api/Analytics/HotelBooking/Approved').then((res) => res.json()),
        fetch('/api/Analytics/Payments/Pending').then((res) => res.json()),
        fetch('/api/Analytics/Payments/Approved').then((res) => res.json()),
      ]);

      setData({
        flightBookingPending: flightPending?.flightBookings?.count || 0,
        flightBookingApproved: flightApproved?.flightBookings?.count || 0,
        groupflightBookingPending: flightPending?.groupFlightBookings?.count || 0,
        groupflightBookingApproved: flightApproved?.groupFlightBookings?.count || 0,
        hotelBookingPending: hotelPending?.hotelBookings?.count || 0,
        hotelBookingApproved: hotelApproved?.hotelBookings?.count || 0,
        paymentPending: paymentPending?.paymentRequests?.count || 0,
        paymentApproved: paymentApproved?.paymentRequests?.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return data;
};

// Bar Chart for Revenue by Service
const RevenueByService = ({ data }) => {
  const chartData = {
    labels: ['Flight Bookings', 'Hotel Bookings', 'Payments'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          data.flightBookingApproved,
          data.hotelBookingApproved,
          data.paymentApproved,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Stats
      </Typography>
      <Bar data={chartData} options={options} />
    </Paper>
  );
};

// Doughnut Chart for Booking Status
const BookingStatus = ({ data }) => {
  const chartData = {
    labels: ['Approved', 'Pending'],
    datasets: [
      {
        label: 'Bookings',
        data: [
          data.flightBookingApproved + data.hotelBookingApproved,
          data.flightBookingPending + data.hotelBookingPending,
        ],
        backgroundColor: ['#10B981', '#3B82F6'],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Booking Status Distribution
      </Typography>
      <Doughnut data={chartData} options={options} />
    </Paper>
  );
};

// Main Analytics Page Component
const TravelAnalyticsPage = () => {
  const analyticsData = useAnalyticsData();

  return (
    <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Pending Invoices" value={analyticsData.flightBookingPending} icon={FaPlane} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Approved Invoices" value={analyticsData.flightBookingApproved} icon={FaPlane} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Pending Bookings" value={analyticsData.groupflightBookingPending} icon={FaPlane} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Approved Bookings" value={analyticsData.groupflightBookingApproved} icon={FaPlane} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Pending Bookings" value={analyticsData.hotelBookingPending} icon={FaPassport} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Approved Bookings" value={analyticsData.hotelBookingApproved} icon={FaPassport} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Pending Payments" value={analyticsData.paymentPending} icon={FaArrowDown} />
        </Grid>
        <Grid item xs={12} md={3}>
          <AnalyticsCard title="Approved Payments" value={analyticsData.paymentApproved} icon={FaArrowUp} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <RevenueByService data={analyticsData} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <BookingStatus data={analyticsData} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TravelAnalyticsPage;