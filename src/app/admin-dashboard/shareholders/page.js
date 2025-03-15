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

// Fetch all ShareHolders
const fetchShareHolders = async () => {
  const response = await fetch("/api/admin/shareholders");
  if (!response.ok) {
    throw new Error("Failed to fetch shareholders");
  }
  const result = await response.json();
  console.log("Fetched shareholders:", result);
  return result;
};

// Add a new ShareHolder
const addShareHolder = async (shareHolder) => {
  console.log("Sending shareholder data:", shareHolder);
  const response = await fetch("/api/admin/shareholders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shareHolder),
  });
  const result = await response.json();
  console.log("Add shareholder response:", result);
  if (!response.ok) {
    throw new Error(result.error || "Failed to add shareholder");
  }
  return result.data;
};

// Update an existing ShareHolder
const updateShareHolder = async (shareHolder) => {
  const response = await fetch(`/api/admin/shareholders/${shareHolder.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shareHolder),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error("Failed to update shareholder");
  }
  return result.data;
};

// Delete a ShareHolder
const deleteShareHolder = async (id) => {
  const response = await fetch(`/api/admin/shareholders/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete shareholder");
  }
  return true;
};

// Record a transaction
const recordTransaction = async (transaction) => {
  const response = await fetch("/api/admin/shareholders/trnx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shareholder_id: transaction.user_id,
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

export default function ShareHoldersManagement() {
  const [shareHolders, setShareHolders] = useState([]);
  const [filteredShareHolders, setFilteredShareHolders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [currentShareHolder, setCurrentShareHolder] = useState(null);
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
    fetchShareHolders()
      .then((data) => {
        setShareHolders(data);
        setFilteredShareHolders(data);
      })
      .catch((err) => {
        toast.error(err.message);
        setShareHolders([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredShareHolders(
      shareHolders.filter(
        (shareHolder) =>
          shareHolder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shareHolder.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shareHolder.phonenumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (shareHolder.balance || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          shareHolder.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [shareHolders, searchTerm]);

  const handleAddShareHolder = () => {
    setCurrentShareHolder(null);
    setIsModalOpen(true);
  };

  const handleUpdateShareHolder = (shareHolder) => {
    setCurrentShareHolder(shareHolder);
    setIsModalOpen(true);
  };

  const handleDeleteShareHolder = async (id) => {
    if (window.confirm("Are you sure you want to delete this shareholder?")) {
      setLoadingAction(id);
      try {
        await deleteShareHolder(id);
        const updatedShareHolders = await fetchShareHolders();
        setShareHolders(updatedShareHolders);
        toast.success("Shareholder deleted successfully");
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
    const shareHolderData = Object.fromEntries(formData.entries());
    shareHolderData.balance = parseFloat(shareHolderData.balance) || 0;
    shareHolderData.adminId = adminId ? parseInt(adminId) : null;

    console.log("Form data being sent:", shareHolderData);

    setLoadingAction("form");
    try {
      if (currentShareHolder) {
        await updateShareHolder({ ...currentShareHolder, ...shareHolderData });
        toast.success("Shareholder updated successfully");
      } else {
        await addShareHolder(shareHolderData);
        toast.success("Shareholder added successfully");
      }
      const updatedShareHolders = await fetchShareHolders();
      setShareHolders(updatedShareHolders);
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
      const updatedShareHolders = await fetchShareHolders();
      setShareHolders(updatedShareHolders);
      toast.success("Transaction recorded and balance updated successfully");
      setIsTransactionModalOpen(false);
      setTransactionData({ user_id: null, type: "IN", amount: "", description: "", added_by: null });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const openTransactionModal = (shareHolder) => {
    setCurrentShareHolder(shareHolder);
    setTransactionData({
      user_id: shareHolder.id,
      type: "IN",
      amount: "",
      description: "",
      added_by: adminId,
    });
    setIsTransactionModalOpen(true);
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <ToastContainer />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          label="Search shareholders by name, address, phone number, balance, or status..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "300px" }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleAddShareHolder}
          startIcon={<PlusIcon />}
        >
          Add ShareHolder
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <TableContainer
            component={Paper}
            sx={{ maxHeight: "72vh", overflow: "auto", width: "100%" }}
          >
            <Table sx={{ minWidth: "100%", width: "100%" }} stickyHeader>
              <TableHead sx={{ backgroundColor: "whitesmoke !important" }}>
                <TableRow>
                  <TableCell sx={{ width: "5%" }}>No.</TableCell>
                  <TableCell sx={{ width: "15%" }}>Name</TableCell>
                  <TableCell sx={{ width: "10%" }}>Phone#</TableCell>
                  <TableCell sx={{ width: "15%" }}>Address</TableCell>
                  <TableCell sx={{ width: "10%" }}>Balance</TableCell>
                  <TableCell sx={{ width: "10%" }}>Status</TableCell>
                
                  <TableCell sx={{ width: "10%" }}>Created At</TableCell>
                  <TableCell sx={{ width: "10%" }}>Updated At</TableCell>
                  <TableCell sx={{ width: "15%" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredShareHolders.map((shareHolder, index) => (
                  <TableRow key={shareHolder.id} hover>
                    <TableCell sx={{ width: "5%" }}>{index + 1}</TableCell>
                    <TableCell sx={{ width: "15%" }}>{shareHolder.name}</TableCell>
                    <TableCell sx={{ width: "10%" }}>{shareHolder.phonenumber}</TableCell>
                    <TableCell sx={{ width: "15%" }}>{shareHolder.address}</TableCell>
                    <TableCell sx={{ width: "10%" }}>${parseFloat(shareHolder.balance).toFixed(2)}</TableCell>
                    <TableCell
                      sx={{
                        width: "10%",
                        color:
                          shareHolder.status === "ACTIVE"
                            ? "green"
                            : shareHolder.status === "INACTIVE"
                            ? "red"
                            : "orange",
                        fontWeight: "medium",
                      }}
                    >
                      {shareHolder.status}
                    </TableCell>
                    {/* <TableCell sx={{ width: "10%" }}>{shareHolder.admin?.fullname || "N/A"}</TableCell> */}
                    <TableCell sx={{ width: "10%" }}>{new Date(shareHolder.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ width: "10%" }}>{new Date(shareHolder.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ width: "15%" }}>
                      <IconButton onClick={() => handleUpdateShareHolder(shareHolder)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteShareHolder(shareHolder.id)}
                        color="error"
                        disabled={loadingAction === shareHolder.id}
                      >
                        {loadingAction === shareHolder.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <TrashIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        onClick={() => openTransactionModal(shareHolder)}
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
        </Box>
      )}

      {/* ShareHolder Management Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{currentShareHolder ? "Update ShareHolder" : "Add ShareHolder"}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
              <TextField
                label="Name"
                name="name"
                defaultValue={currentShareHolder?.name}
                variant="outlined"
                required
                fullWidth
              />
              <TextField
                label="Phone Number"
                name="phonenumber"
                defaultValue={currentShareHolder?.phonenumber}
                variant="outlined"
                required
                fullWidth
              />
              <TextField
                label="Address"
                name="address"
                defaultValue={currentShareHolder?.address}
                variant="outlined"
                required
                fullWidth
              />
              <TextField
                label="Balance"
                name="balance"
                type="number"
                defaultValue={currentShareHolder?.balance}
                variant="outlined"
                inputProps={{ step: "0.01" }}
                required
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  defaultValue={currentShareHolder?.status || "ACTIVE"}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
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
              {currentShareHolder ? "Update" : "Add"} ShareHolder
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
        <DialogTitle>Record Transaction for {currentShareHolder?.name}</DialogTitle>
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
  );
}