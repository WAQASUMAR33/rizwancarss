'use client';

import { toast, ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
import {
  Edit as PencilIcon,
  Delete as TrashIcon,
  Add as PlusIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon,
  Search as MagnifyingGlassIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  InputAdornment,
} from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';

const fetchAdminUsers = async () => {
  const response = await fetch('/api/admin/adminuser');
  if (!response.ok) throw new Error('Failed to fetch admin users');
  return response.json();
};

const addAdminUser = async (user) => {
  const response = await fetch('/api/admin/adminuser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error('Failed to add admin user');
  return response.json();
};

const updateAdminUser = async (user) => {
  const response = await fetch(`/api/admin/adminuser/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error('Failed to update admin user');
  return response.json();
};

const deleteAdminUser = async (id) => {
  const response = await fetch(`/api/admin/adminuser/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to delete admin user');
  return true;
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdminUsers()
      .then((data) => {
        console.log("All users are", data);
        setUsers(data);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setLoadingAction(id);
      try {
        await deleteAdminUser(id);
        setUsers(users.filter((user) => user.id !== id));
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());

    setLoadingAction('form');
    try {
      if (currentUser) {
        const updatedUser = await updateAdminUser({ ...currentUser, ...userData });
        setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
        toast.success('User updated successfully');
      } else {
        const newUser = await addAdminUser(userData);
        setUsers([...users, newUser]);
        toast.success('User added successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer />
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlassIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Add new admin user" arrow>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlusIcon />}
                onClick={handleAddUser}
                sx={{ '&:hover': { bgcolor: 'primary.dark' } }}
              >
                Add Admin User
              </Button>
            </Tooltip>
          </Box>

          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DialogTitle>{currentUser ? 'Update Admin User' : 'Add Admin User'}</DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Full Name"
                  name="fullname"
                  defaultValue={currentUser?.fullname}
                  required
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Username"
                  name="username"
                  defaultValue={currentUser?.username}
                  required
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required={!currentUser}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    defaultValue={currentUser?.role || 'admin'}
                    label="Role"
                  >
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loadingAction === 'form'}
                  startIcon={loadingAction === 'form' ? <CircularProgress size={20} /> : null}
                >
                  {currentUser ? 'Update' : 'Add'} User
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': { bgcolor: 'grey.100' },
                        transition: 'background-color 0.3s',
                      }}
                    >
                      <TableCell>{user.fullname}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={user.role === 'admin' ? 'primary' : 'success'}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit user" arrow>
                          <IconButton
                            onClick={() => handleUpdateUser(user)}
                            sx={{ mr: 1, '&:hover': { color: 'primary.main' } }}
                          >
                            <PencilIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user" arrow>
                          <IconButton
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loadingAction === user.id}
                            sx={{
                              color: 'error.main',
                              '&:hover': { color: 'error.dark' },
                            }}
                          >
                            {loadingAction === user.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <TrashIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Box>
  );
}