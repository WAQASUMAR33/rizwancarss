"use client";
import React, { useState, useEffect } from "react";
import {
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Stack,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";

const UsersManagement = () => {
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [status, setStatus] = useState("");
  const [reply, setReply] = useState(""); 
  const [contactNo, setContactNo] = useState(""); 
  const [balance, setBalance] = useState(""); 
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    const filtered = queries.filter(
      (query) =>
        query.username.toLowerCase().includes(search.toLowerCase()) ||
        query.fullname.toLowerCase().includes(search.toLowerCase()) ||
        query.status.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredQueries(filtered);
    setPage(1);
  }, [search, queries]);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://app.swabilaundry.ae/api/get_quries.php");
      if (response.data.status === "success") {
        setQueries(response.data.data || []);
      } else {
        console.error("Failed to fetch queries");
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleReplyChange = (e) => {
    setReply(e.target.value);
  };

  const handleContactNoChange = (e) => {
    setContactNo(e.target.value);
  };

  const handleBalanceChange = (e) => {
    setBalance(e.target.value);
  };

  const handleEdit = (query) => {
    setSelectedQuery(query);
    setStatus(query.status);
    setReply(query.reply || "");
    setContactNo(query.contact_no || "");
    setBalance(query.balance || "");
    setEditDialogOpen(true);
  };

  const handleUpdateQuery = async () => {
    try {
      const response = await axios.post(
        "https://app.swabilaundry.ae/api/update_query.php",
        {
          query_id: selectedQuery.query_id,
          status,
          reply,
          contact_no: contactNo,
          balance,
        },
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (response.data.status === "success") {
        setSnackbarMessage("Query updated successfully!");
        setSnackbarOpen(true);
        fetchQueries();
      } else {
        setSnackbarMessage("Failed to update query.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating query:", error);
    } finally {
      setEditDialogOpen(false);
    }
  };

  const handleDelete = async (query_id) => {
    try {
      const response = await axios.post("https://app.swabilaundry.ae/api/delete_query.php", { query_id });
      if (response.data.status === "success") {
        setSnackbarMessage("Query deleted successfully!");
        setSnackbarOpen(true);
        fetchQueries();
      } else {
        setSnackbarMessage("Failed to delete query.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error deleting query:", error);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const paginatedQueries = filteredQueries.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Box sx={{ padding: 3 }}>
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          User Queries
        </Typography>
        <TextField
          label="Search Queries"
          variant="outlined"
          size="small"
          sx={{ width: "300px", backgroundColor: "#fff" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Queries Table */}
      <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#007BFF" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Query ID</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Username</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Subject</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Description</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Created At</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQueries.map((query) => (
              <TableRow key={query.query_id}>
                <TableCell>{query.query_id}</TableCell>
                <TableCell>{query.username}</TableCell>
                <TableCell>{query.subject}</TableCell>
                <TableCell>{query.description}</TableCell>
                <TableCell>{query.status || "N/A"}</TableCell>
                <TableCell>{query.created_at}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(query)} sx={{ marginRight: 1 }}>
                    <FaEdit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(query.query_id)}>
                    <FaTrashAlt />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Pagination
        count={Math.ceil(queries.length / itemsPerPage)}
        page={page}
        onChange={handlePageChange}
        sx={{ display: "flex", justifyContent: "center", marginY: 2 }}
      />

      {/* Edit Query Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Query
          <IconButton
            aria-label="close"
            onClick={() => setEditDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            <strong>Description:</strong> {selectedQuery?.description || "N/A"}
          </Typography>

          <TextField
            label="Reply"
            value={reply}
            onChange={handleReplyChange}
            fullWidth
            multiline
            rows={4}
            sx={{ marginBottom: 2 }}
          />

          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={handleStatusChange}>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Process">In Process</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Contact Number"
            value={contactNo}
            onChange={handleContactNoChange}
            fullWidth
            sx={{ marginBottom: 2 }}
          />

          <TextField
            label="Balance"
            value={balance}
            onChange={handleBalanceChange}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleUpdateQuery}
            variant="contained"
            sx={{
              backgroundColor: "#E3B505",
              color: "black",
              ":hover": { backgroundColor: "#d3a004" },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersManagement;
