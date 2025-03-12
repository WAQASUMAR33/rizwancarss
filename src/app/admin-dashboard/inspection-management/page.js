"use client";
import { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const InspectionList = () => {
  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        console.log("Fetching inspections from API...");
        const response = await fetch("/api/admin/inspection");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch inspections: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        const fetchedInspections = result.data || [];
        console.log("Fetched inspections:", fetchedInspections);

        // Normalize data to handle missing fields
        const normalizedInspections = fetchedInspections.map((inspection) => ({
          ...inspection,
          amount: inspection.amount || 0, // Default to 0 if amount is undefined
          imagePath: inspection.imagePath || "",
          vehicle: inspection.vehicle || {}, // Default to empty object if vehicle is undefined
        }));
        setInspections(normalizedInspections);
        setFilteredInspections(normalizedInspections);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  useEffect(() => {
    const filtered = inspections.filter((inspection) =>
      (inspection.vehicleNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.company || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInspections(filtered);
    setCurrentPage(1);
  }, [searchQuery, inspections]);

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading inspections...
          </Typography>
        </Box>
      </Box>
    );
  }
  if (error) {
    return (
      <Typography variant="body1" color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Inspection List
      </Typography>

      <Box mb={2} position="relative">
        <TextField
          label="Search by Vehicle Number or Company"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton onClick={() => setSearchQuery("")} edge="end">
                <CloseIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Vehicle No</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInspections.length > 0 ? (
              paginatedInspections.map((inspection, index) => (
                <TableRow key={inspection.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{new Date(inspection.date).toLocaleDateString()}</TableCell>
                  <TableCell>{inspection.company}</TableCell>
                  <TableCell>{inspection.vehicleNo}</TableCell>
                  <TableCell>${(inspection.amount || 0).toFixed(2)}</TableCell> {/* Fallback to 0 */}
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No inspections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={1}>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, index) => (
            <Button
              key={index + 1}
              variant={currentPage === index + 1 ? "contained" : "outlined"}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="outlined"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </Box>
      )}

      <Dialog
        open={!!selectedInspection}
        onClose={() => setSelectedInspection(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          Inspection Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInspection(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInspection && (
            <Box>
              {/* Inspection Details */}
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Inspection ID</Typography>
                  <Typography variant="body1">{selectedInspection.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body1">{new Date(selectedInspection.date).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Company</Typography>
                  <Typography variant="body1">{selectedInspection.company}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vehicle No</Typography>
                  <Typography variant="body1">{selectedInspection.vehicleNo}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount</Typography>
                  <Typography variant="body1">${(selectedInspection.amount || 0).toFixed(2)}</Typography> {/* Fallback to 0 */}
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Image Path</Typography>
                  <Typography variant="body1">{selectedInspection.imagePath || "N/A"}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <Typography variant="body1">{selectedInspection.added_by || 'N/A'}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(selectedInspection.createdAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <Typography variant="body1">{new Date(selectedInspection.updatedAt).toLocaleString()}</Typography>
                </Paper>
              </Box>

              {/* Related Vehicle Details */}
              {selectedInspection.vehicle && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Vehicle ID</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.id || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Invoice No</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.invoiceNo || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.chassisNo || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Maker</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.maker || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Year</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.year || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Color</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.color || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Engine Type</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.engineType || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                        <Typography variant="body1">{Number(selectedInspection.vehicle.totalAmount || 0).toFixed(2)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Sending Port</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.sendingPort || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Status</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.status || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Added By</Typography>
                        <Typography variant="body1">{selectedInspection.vehicle.added_by || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Created At</Typography>
                        <Typography variant="body1">{new Date(selectedInspection.vehicle.createdAt).toLocaleString()}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Updated At</Typography>
                        <Typography variant="body1">{new Date(selectedInspection.vehicle.updatedAt).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedInspection(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InspectionList;