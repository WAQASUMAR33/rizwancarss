"use client";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  Edit as PencilIcon,
  Delete as TrashIcon,
  Add as PlusIcon,
  Money as MoneyIcon,
} from "@mui/icons-material";
import "react-toastify/dist/ReactToastify.css";

// Fetch all users
const fetchUsers = async () => {
  const response = await fetch("/api/admin/distributers");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const result = await response.json();
  console.log("Fetched users:", result);
  return result;
};

// Add a new user
const addUser = async (user) => {
  console.log("Sending user data:", user);
  const response = await fetch("/api/admin/distributers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const result = await response.json();
  console.log("Add user response:", result);
  if (!response.ok) {
    throw new Error(result.error || "Failed to add user");
  }
  return result.data;
};

// Update an existing user
const updateUser = async (user) => {
  const response = await fetch(`/api/admin/distributers/${user.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error("Failed to update user");
  }
  return result.data;
};

// Delete a user
const deleteUser = async (id) => {
  const response = await fetch(`/api/admin/distributers/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
  return true;
};

// Record a transaction
const recordTransaction = async (transaction) => {
  const response = await fetch("/api/admin/distributers/trnx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: transaction.user_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      added_by: transaction.added_by,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to record transaction");
  }
  return result.data;
};

export default function DistributorsManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [transactionData, setTransactionData] = useState({
    user_id: null,
    type: "IN",
    amount: "",
    description: "",
    added_by: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  // Get adminId from Redux state
  const adminId = useSelector((state) => state.user.id);
  const username = useSelector((state) => state.user.username);

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data);
        setFilteredUsers(data);
      })
      .catch((err) => {
        toast.error(err.message);
        setUsers([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phonenumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.balance || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoadingAction(id);
      try {
        await deleteUser(id);
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
        toast.success("User deleted successfully");
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
    userData.balance = parseFloat(userData.balance) || 0;
    userData.adminId = adminId ? parseInt(adminId) : null;

    console.log("Form data being sent:", userData);

    setLoadingAction("form");
    try {
      if (currentUser) {
        await updateUser({ ...currentUser, ...userData });
        toast.success("User updated successfully");
      } else {
        await addUser(userData);
        toast.success("User added successfully");
      }
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const { user_id, type, amount, description } = transactionData;

    if (!amount || !description) {
      toast.error("Please fill in all fields");
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    setLoadingAction("transaction");
    try {
      await recordTransaction({
        user_id,
        type,
        amount: transactionAmount,
        description,
        added_by: adminId, // Use adminId from Redux
      });
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      toast.success("Transaction recorded and balance updated successfully");
      setIsTransactionModalOpen(false);
      setTransactionData({ user_id: null, type: "IN", amount: "", description: "", added_by: null });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const openTransactionModal = (user) => {
    setCurrentUser(user);
    setTransactionData({
      user_id: user.id,
      type: "IN",
      amount: "",
      description: "",
      added_by: adminId,
    });
    setIsTransactionModalOpen(true);
  };

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            label="Search users by fullname, address, phone number, balance, or status..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddUser}
            startIcon={<PlusIcon />}
          >
            Add User
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "72vh", overflow: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.fullname}</TableCell>
                    <TableCell>{user.phonenumber}</TableCell>
                    <TableCell>{user.address}</TableCell>
                    <TableCell>${parseFloat(user.balance).toFixed(2)}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          user.status === "Active"
                            ? "green"
                            : user.status === "Inactive"
                            ? "red"
                            : "orange",
                        fontWeight: "medium",
                      }}
                    >
                      {user.status}
                    </TableCell>
                    <TableCell>{user.admin?.fullname || "N/A"}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(user.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdateUser(user)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                        disabled={loadingAction === user.id}
                      >
                        {loadingAction === user.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <TrashIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        onClick={() => openTransactionModal(user)}
                        color="primary"
                        disabled={loadingAction === "transaction"}
                      >
                        {loadingAction === "transaction" ? (
                          <CircularProgress size={20} />
                        ) : (
                          <MoneyIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* User Management Modal */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentUser ? "Update User" : "Add User"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                <TextField
                  label="Full Name"
                  name="fullname"
                  defaultValue={currentUser?.fullname}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Phone Number"
                  name="phonenumber"
                  defaultValue={currentUser?.phonenumber}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Address"
                  name="address"
                  defaultValue={currentUser?.address}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Balance"
                  name="balance"
                  type="number"
                  defaultValue={currentUser?.balance}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                  required
                  fullWidth
                />
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    defaultValue={currentUser?.status || "Active"}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                disabled={loadingAction === "form"}
                startIcon={loadingAction === "form" ? <CircularProgress size={20} /> : null}
              >
                {currentUser ? "Update" : "Add"} User
              </Button>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} color="error">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transaction Modal */}
        <Dialog
          open={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Transaction for {currentUser?.fullname}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleTransactionSubmit}>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                <FormControl variant="outlined" fullWidth required>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    name="type"
                    value={transactionData.type}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, type: e.target.value })
                    }
                    label="Transaction Type"
                  >
                    <MenuItem value="IN">In Amount</MenuItem>
                    <MenuItem value="OUT">Out Amount</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, amount: e.target.value })
                  }
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                  required
                  fullWidth
                />
                <TextField
                  label="Description"
                  name="description"
                  value={transactionData.description}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, description: e.target.value })
                  }
                  variant="outlined"
                  required
                  fullWidth
                  multiline
                  rows={2}
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loadingAction === "transaction"}
                startIcon={loadingAction === "transaction" ? <CircularProgress size={20} /> : null}
              >
                Record Transaction
              </Button>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsTransactionModalOpen(false)} color="error">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}