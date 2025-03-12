'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Tooltip,
} from '@mui/material';
import { PersonOutline as UserCircleIcon, GroupOutlined as UserGroupIcon } from '@mui/icons-material';
import { Providers } from '../Store/Provider';
import UserChecker from '../admin-dashboard/Usercheck';
import LoginModal from './components/LoginModel'; // Adjust path as needed

const RoleCard = ({ title, icon: Icon, onClick, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip title={`Select ${title} role`} arrow>
      <Card
        elevation={isHovered ? 8 : 2}
        sx={{
          width: 300,
          transition: 'all 0.3s ease-in-out',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          bgcolor: isHovered ? 'grey.50' : 'white',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardActionArea onClick={onClick}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Icon
              sx={{
                fontSize: 48,
                color: isHovered ? 'primary.main' : 'grey.600',
                transition: 'color 0.3s',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
};

const AdminLoginPage = () => {
  const [modalState, setModalState] = useState({
    isOpen: false, // Modal starts closed
    role: null,
  });

  const openModal = (role) => {
    console.log(`[CHECKPOINT P1] Opening modal with role: ${role}`);
    setModalState({ isOpen: true, role });
  };

  const closeModal = () => {
    console.log("[CHECKPOINT P2] Closing modal");
    setModalState({ isOpen: false, role: null });
  };

  return (
    <Providers>
      <UserChecker />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #E3F2FD, #C7D2FE)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2,
              letterSpacing: '-0.025em',
              transition: 'color 0.3s',
              '&:hover': { color: 'primary.dark' },
            }}
          >
            Rizwan Cars
          </Typography>
          <Divider
            sx={{
              height: 4,
              width: 120,
              bgcolor: 'primary.main',
              mx: 'auto',
              borderRadius: 2,
              mb: 2,
            }}
          />
          <Typography variant="body1" color="text.secondary">
            Welcome back! Please select your role to continue
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4,
            maxWidth: 960,
            mx: 'auto',
          }}
        >
          <RoleCard
            title="Admin"
            icon={UserCircleIcon}
            onClick={() => openModal('Admin')}
            description="Access administrative controls and manage system settings"
          />
          <RoleCard
            title="Distributer"
            icon={UserGroupIcon}
            onClick={() => openModal('Agent')}
            description="Handle the Transactions and booking order's with the Rizwan Cars"
          />
        </Box>

        <LoginModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          role={modalState.role}
        />
      </Box>
    </Providers>
  );
};

export default AdminLoginPage;