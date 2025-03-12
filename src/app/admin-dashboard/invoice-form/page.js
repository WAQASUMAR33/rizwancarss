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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        console.log("Fetching invoices from API...");
        const response = await fetch("/api/admin/invoice-management");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        const fetchedInvoices = result.data || [];
        console.log("Fetched invoices:", fetchedInvoices);

        // Normalize field names to match component expectations
        const normalizedInvoices = fetchedInvoices.map((invoice) => ({
          ...invoice,
          createdAt: invoice.createdAt || invoice.created_at,
          updatedAt: invoice.updatedAt || invoice.updated_at,
          amountDoller: invoice.amount_doller,
          amountYen: invoice.amountYen || invoice.amount_yen,
          vehicles: invoice.vehicles || [],
          imagePath: invoice.imagePath || "",
        }));
        setInvoices(normalizedInvoices);
        setFilteredInvoices(normalizedInvoices);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) =>
      (invoice.number || "").toString().includes(searchQuery) ||
      (invoice.auctionHouse || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [searchQuery, invoices]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = (value) => {
    setEditedStatus(value);
  };

  const saveStatus = async () => {
    if (!selectedInvoice || editedStatus === selectedInvoice.status) return;

    try {
      const response = await fetch(`/api/admin/invoice-management/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editedStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const updatedInvoice = await response.json();
      console.log("Updated invoice:", updatedInvoice);

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, status: editedStatus } : inv))
      );
      setFilteredInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, status: editedStatus } : inv))
      );
      setSelectedInvoice((prev) => ({ ...prev, status: editedStatus }));
      alert("Status updated successfully!");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading invoices...
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
        Invoices List
      </Typography>

      <Box mb={2} position="relative">
        <TextField
          label="Search by Invoice Number or Auction House"
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
              <TableCell>Number</TableCell>
              <TableCell>Amount (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Auction House</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((invoice, index) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.number}</TableCell>
                  <TableCell>${(invoice.amountDoller || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ color: invoice.status === "PAID" ? "green" : "red" }}>
                    {invoice.status}
                  </TableCell>
                  <TableCell>{invoice.auctionHouse}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setEditedStatus(invoice.status);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No invoices found.
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
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          Invoice Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInvoice(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice ID</Typography>
                  <Typography variant="body1">{selectedInvoice.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body1">{new Date(selectedInvoice.date).toLocaleDateString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Number</Typography>
                  <Typography variant="body1">{selectedInvoice.number}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (USD)</Typography>
                  <Typography variant="body1">${(selectedInvoice.amountDoller || 0).toFixed(2)}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (Yen)</Typography>
                  <Typography variant="body1">{selectedInvoice.amountYen || 'N/A'}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Auction House</Typography>
                  <Typography variant="body1">{selectedInvoice.auctionHouse}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <Typography variant="body1">{selectedInvoice.added_by || 'N/A'}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(selectedInvoice.createdAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <Typography variant="body1">{new Date(selectedInvoice.updatedAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice Image</Typography>
                  {selectedInvoice.imagePath ? (
                    <a href={selectedInvoice.imagePath} download={`invoice-${selectedInvoice.id}.png`}>
                      <img
                        src={selectedInvoice.imagePath}
                        alt="Invoice"
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
                      />
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block" }}>
                        Click to download
                      </Typography>
                    </a>
                  ) : (
                    <Typography variant="body1">No image available</Typography>
                  )}
                </Paper>
                <Paper elevation={1} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editedStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="UNPAID">Unpaid</MenuItem>
                      <MenuItem value="PAID">Paid</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" color="success" onClick={saveStatus}>
                    Save
                  </Button>
                </Paper>
              </Box>

              {selectedInvoice.vehicles && selectedInvoice.vehicles.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  {selectedInvoice.vehicles.map((vehicle, idx) => (
                    <Paper key={vehicle.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Vehicle #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                          <Typography variant="body1">{vehicle.chassisNo || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Maker</Typography>
                          <Typography variant="body1">{vehicle.maker || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Year</Typography>
                          <Typography variant="body1">{vehicle.year || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Color</Typography>
                          <Typography variant="body1">{vehicle.color || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Engine Type</Typography>
                          <Typography variant="body1">{vehicle.engineType || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Auction Amount</Typography>
                          <Typography variant="body1">{vehicle.auction_amount || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">10% Add</Typography>
                          <Typography variant="body1">{vehicle.tenPercentAdd || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Recycle Amount</Typography>
                          <Typography variant="body1">{vehicle.recycleAmount || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Auction House</Typography>
                          <Typography variant="body1">{vehicle.auction_house || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount</Typography>
                          <Typography variant="body1">{vehicle.bidAmount || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount 10%</Typography>
                          <Typography variant="body1">{vehicle.bidAmount10per || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Commission Amount</Typography>
                          <Typography variant="body1">{vehicle.commissionAmount || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Number Plate Tax</Typography>
                          <Typography variant="body1">{vehicle.numberPlateTax || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Repair Charges</Typography>
                          <Typography variant="body1">{vehicle.repairCharges || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (Yen)</Typography>
                          <Typography variant="body1">{vehicle.totalAmount_yen || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (USD)</Typography>
                          <Typography variant="body1">{vehicle.totalAmount_dollers || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Sending Port</Typography>
                          <Typography variant="body1">{vehicle.seaPort?.name || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Additional Amount</Typography>
                          <Typography variant="body1">{vehicle.additionalAmount || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Document Required</Typography>
                          <Typography variant="body1">{vehicle.isDocumentRequired === 'yes' ? 'Yes' : 'No' || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Document Receive Date</Typography>
                          <Typography variant="body1">{vehicle.documentReceiveDate ? new Date(vehicle.documentReceiveDate).toLocaleString() : 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Ownership</Typography>
                          <Typography variant="body1">{vehicle.isOwnership === 'yes' ? 'Yes' : 'No' || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Ownership Date</Typography>
                          <Typography variant="body1">{vehicle.ownershipDate ? new Date(vehicle.ownershipDate).toLocaleString() : 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <Typography variant="body1">{vehicle.status || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Admin</Typography>
                          <Typography variant="body1">{vehicle.admin?.fullname || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <Typography variant="body1">{vehicle.added_by || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Created At</Typography>
                          <Typography variant="body1">{new Date(vehicle.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Updated At</Typography>
                          <Typography variant="body1">{new Date(vehicle.updatedAt).toLocaleString()}</Typography>
                        </Box>
                        {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
                          <Box sx={{ gridColumn: "span 4" }}>
                            <Typography variant="caption" color="textSecondary">Images</Typography>
                            <Box display="flex" gap={2} mt={1}>
                              {vehicle.vehicleImages.map((image, imgIdx) => (
                                <a
                                  key={imgIdx}
                                  href={image.imagePath}
                                  download={`vehicle-${vehicle.id}-image-${imgIdx + 1}.${image.imagePath.split('.').pop()}`}
                                >
                                  <img
                                    src={image.imagePath}
                                    alt={`Vehicle Image ${imgIdx + 1}`}
                                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
                                  />
                                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
                                    Download
                                  </Typography>
                                </a>
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ gridColumn: "span 4" }}>
                            <Typography variant="caption" color="textSecondary">Images</Typography>
                            <Typography variant="body1">No images available</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedInvoice(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InvoicesList;