"use client";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
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
import { Edit as PencilIcon, Delete as TrashIcon, Add as PlusIcon } from "@mui/icons-material";
import "react-toastify/dist/ReactToastify.css";

// Fetch all distributors
const fetchDistributors = async () => {
  const response = await fetch("/api/admin/distributers");
  if (!response.ok) {
    throw new Error("Failed to fetch distributors");
  }
  const result = await response.json();
  console.log("Fetched distributors:", result);
  return result;
};

// Add a new distributor
const addDistributor = async (distributor) => {
  console.log("Sending distributor data:", distributor);
  const response = await fetch("/api/admin/distributers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(distributor),
  });
  const result = await response.json();
  console.log("Add distributor response:", result);
  if (!response.ok) {
    throw new Error(result.error || "Failed to add distributor");
  }
  return result.data;
};

// Update an existing distributor
const updateDistributor = async (distributor) => {
  const response = await fetch(`/api/admin/distributers/${distributor.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(distributor),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error("Failed to update distributor");
  }
  return result.data;
};

// Delete a distributor
const deleteDistributor = async (id) => {
  const response = await fetch(`/api/admin/distributers/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete distributor");
  }
  return true;
};

export default function DistributorsManagement() {
  const [distributors, setDistributors] = useState([]);
  const [filteredDistributors, setFilteredDistributors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDistributor, setCurrentDistributor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    fetchDistributors()
      .then((data) => {
        setDistributors(data);
        setFilteredDistributors(data);
      })
      .catch((err) => {
        toast.error(err.message);
        setDistributors([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredDistributors(
      distributors.filter(
        (distributor) =>
          distributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          distributor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          distributor.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [distributors, searchTerm]);

  const handleAddDistributor = () => {
    setCurrentDistributor(null);
    setIsModalOpen(true);
  };

  const handleUpdateDistributor = (distributor) => {
    setCurrentDistributor(distributor);
    setIsModalOpen(true);
  };

  const handleDeleteDistributor = async (id) => {
    if (window.confirm("Are you sure you want to delete this distributor?")) {
      setLoadingAction(id);
      try {
        await deleteDistributor(id);
        const updatedDistributors = await fetchDistributors();
        setDistributors(updatedDistributors);
        toast.success("Distributor deleted successfully");
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
    const distributorData = Object.fromEntries(formData.entries());
    console.log("Form data being sent:", distributorData);

    setLoadingAction("form");
    try {
      if (currentDistributor) {
        await updateDistributor({ ...currentDistributor, ...distributorData });
        toast.success("Distributor updated successfully");
      } else {
        await addDistributor(distributorData);
        toast.success("Distributor added successfully");
      }
      const updatedDistributors = await fetchDistributors();
      setDistributors(updatedDistributors);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            label="Search distributors by name, location, or username..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddDistributor}
            startIcon={<PlusIcon />}
          >
            Add Distributor
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
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDistributors.map((distributor, index) => (
                  <TableRow key={distributor.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{distributor.name}</TableCell>
                    <TableCell>{distributor.location}</TableCell>
                    <TableCell>{distributor.username}</TableCell>
                    <TableCell>${parseFloat(distributor.balance).toFixed(2)}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          distributor.status === "ACTIVE"
                            ? "green"
                            : distributor.status === "INACTIVE"
                            ? "red"
                            : "orange",
                        fontWeight: "medium",
                      }}
                    >
                      {distributor.status}
                    </TableCell>
                    <TableCell>{new Date(distributor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(distributor.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdateDistributor(distributor)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteDistributor(distributor.id)}
                        color="error"
                        disabled={loadingAction === distributor.id}
                      >
                        {loadingAction === distributor.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <TrashIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentDistributor ? "Update Distributor" : "Add Distributor"}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                <TextField
                  label="Name"
                  name="name"
                  defaultValue={currentDistributor?.name}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Location"
                  name="location"
                  defaultValue={currentDistributor?.location}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Username"
                  name="username"
                  defaultValue={currentDistributor?.username}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  defaultValue={currentDistributor?.password}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Balance"
                  name="balance"
                  type="number"
                  defaultValue={currentDistributor?.balance}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                  required
                  fullWidth
                />
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    defaultValue={currentDistributor?.status || "ACTIVE"}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                    <MenuItem value="PENDING">PENDING</MenuItem>
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
                {currentDistributor ? "Update" : "Add"} Distributor
              </Button>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} color="error">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}