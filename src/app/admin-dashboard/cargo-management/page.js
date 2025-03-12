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
import { Close as CloseIcon, OpenInNew as OpenInNewIcon, Download as DownloadIcon } from "@mui/icons-material";

const CargoList = () => {
  const [cargoBookings, setCargoBookings] = useState([]);
  const [filteredCargoBookings, setFilteredCargoBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Fetch all cargo bookings on mount
  useEffect(() => {
    const fetchCargoBookings = async () => {
      try {
        console.log("Fetching cargo bookings from API...");
        const response = await fetch("/api/admin/cargo");
        if (!response.ok) {
          throw new Error(`Failed to fetch cargo bookings: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("API response:", result);

        const fetchedCargoBookings = result.data || [];
        setCargoBookings(fetchedCargoBookings);
        setFilteredCargoBookings(fetchedCargoBookings);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCargoBookings();
  }, []);

  // Filter cargo bookings based on search query
  useEffect(() => {
    const filtered = cargoBookings.filter((cargo) =>
      (cargo.bookingNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cargo.shipperName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCargoBookings(filtered);
    setCurrentPage(1);
  }, [searchQuery, cargoBookings]);

  // Fetch detailed booking data when "View" is clicked
  const fetchBookingDetails = async (id) => {
    setDialogLoading(true);
    try {
      const response = await fetch(`/api/admin/cargo/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch booking details: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status) {
        console.log("Fetched booking details:", result.data);
        setSelectedCargo(result.data);
      } else {
        throw new Error(result.error || "Failed to load booking details");
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await fetch(`/api/admin/cargo/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status) {
        setCargoBookings(cargoBookings.filter((cargo) => cargo.id !== id));
        setFilteredCargoBookings(filteredCargoBookings.filter((cargo) => cargo.id !== id));
        setSelectedCargo(null);
        alert("Booking deleted successfully!");
      } else {
        throw new Error(result.error || "Deletion failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    }
  };

  // Handle update action (placeholder for now)
  const handleUpdate = (cargo) => {
    console.log("Update clicked for:", cargo);
    alert("Update functionality to be implemented!");
  };

  // Handle image download
  const handleDownloadImage = (imageUrl, fileName) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "image.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Download error:", err));
  };

  // Handle image load error
  const handleImageError = (e, section) => {
    console.error(`Image failed to load in ${section}:`, e.target.src);
    e.target.style.display = "none"; // Hide broken image
    e.target.nextSibling.style.display = "none"; // Hide open button
    e.target.nextSibling.nextSibling.style.display = "none"; // Hide download button
    e.target.parentElement.insertBefore(
      document.createTextNode("Image not available"),
      e.target.nextSibling
    );
  };

  const totalPages = Math.ceil(filteredCargoBookings.length / itemsPerPage);
  const paginatedCargoBookings = filteredCargoBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading cargo bookings...
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
      <Typography variant="h5" component="h2" gutterBottom>
        Cargo Bookings List
      </Typography>

      <Box mb={2} position="relative">
        <TextField
          label="Search by Booking Number or Shipper Name"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={searchQuery && {
            endAdornment: (
              <IconButton onClick={() => setSearchQuery("")} edge="end">
                <CloseIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "whitesmoke" }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Booking No</TableCell>
              <TableCell>Shipper Name</TableCell>
              <TableCell>Consignee</TableCell>
              <TableCell>ETD</TableCell>
              <TableCell>ETA</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCargoBookings.length > 0 ? (
              paginatedCargoBookings.map((cargo, index) => (
                <TableRow key={cargo.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{cargo.bookingNo}</TableCell>
                  <TableCell>{cargo.shipperName}</TableCell>
                  <TableCell>{cargo.consignee}</TableCell>
                  <TableCell>{new Date(cargo.etd).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(cargo.eta).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => fetchBookingDetails(cargo.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No cargo bookings found.
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
        open={!!selectedCargo}
        onClose={() => setSelectedCargo(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle sx={{ bgcolor: "whitesmoke" }}>
          Cargo Booking Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedCargo(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <ClipLoader color="#3b82f6" size={50} />
            </Box>
          ) : selectedCargo ? (
            <Box>
              {/* Container Booking Details */}
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Booking ID</Typography>
                  <Typography variant="body1">{selectedCargo.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Booking No</Typography>
                  <Typography variant="body1">{selectedCargo.bookingNo}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Shipper Name</Typography>
                  <Typography variant="body1">{selectedCargo.shipperName}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Consignee</Typography>
                  <Typography variant="body1">{selectedCargo.consignee}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Actual Shipper</Typography>
                  <Typography variant="body1">{selectedCargo.actualShipper}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">CY Open</Typography>
                  <Typography variant="body1">{selectedCargo.cyOpen}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">ETD</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.etd).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">CY Cut Off</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.cyCutOff).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">ETA</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.eta).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Volume</Typography>
                  <Typography variant="body1">{selectedCargo.volume}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Carrier</Typography>
                  <Typography variant="body1">{selectedCargo.carrier}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vessel</Typography>
                  <Typography variant="body1">{selectedCargo.vessel}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Port of Loading</Typography>
                  <Typography variant="body1">{selectedCargo.portOfLoading}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Port of Discharge</Typography>
                  <Typography variant="body1">{selectedCargo.portOfDischarge}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Cargo Mode</Typography>
                  <Typography variant="body1">{selectedCargo.cargoMode}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Place of Issue</Typography>
                  <Typography variant="body1">{selectedCargo.placeOfIssue}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Freight Term</Typography>
                  <Typography variant="body1">{selectedCargo.freightTerm}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Description of Goods</Typography>
                  <Typography variant="body1">{selectedCargo.descriptionOfGoods}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Image Path</Typography>
                  <Typography variant="body1">
                    {selectedCargo.imagePath ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <img
                          src={selectedCargo.imagePath}
                          alt={`Booking ${selectedCargo.bookingNo}`}
                          style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain" }}
                          onError={(e) => handleImageError(e, "Container Booking")}
                        />
                        <IconButton size="small" href={selectedCargo.imagePath} target="_blank" rel="noopener noreferrer">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadImage(selectedCargo.imagePath, `booking-${selectedCargo.id}.jpg`)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      "N/A"
                    )}
                  </Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <Typography variant="body1">{selectedCargo.added_by}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.createdAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.updatedAt).toLocaleString()}</Typography>
                </Paper>
              </Box>

              {/* Container Details */}
              {selectedCargo.containerDetails && selectedCargo.containerDetails.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Container Details</Typography>
                  {selectedCargo.containerDetails.map((detail, idx) => (
                    <Paper key={detail.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Container Detail #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Consignee Name</Typography>
                          <Typography variant="body1">{detail.consigneeName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Notify Party</Typography>
                          <Typography variant="body1">{detail.notifyParty}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Shipper Per</Typography>
                          <Typography variant="body1">{detail.shipperPer}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Booking No</Typography>
                          <Typography variant="body1">{detail.bookingNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Note</Typography>
                          <Typography variant="body1">{detail.note}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Image Path</Typography>
                          <Typography variant="body1">
                            {detail.imagePath ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <img
                                  src={detail.imagePath}
                                  alt={`Container ${detail.id}`}
                                  style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain" }}
                                  onError={(e) => handleImageError(e, "Container Detail")}
                                />
                                <IconButton size="small" href={detail.imagePath} target="_blank" rel="noopener noreferrer">
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadImage(detail.imagePath, `container-${detail.id}.jpg`)}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              "N/A"
                            )}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <Typography variant="body1">{detail.added_by}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Created At</Typography>
                          <Typography variant="body1">{new Date(detail.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Updated At</Typography>
                          <Typography variant="body1">{new Date(detail.updatedAt).toLocaleString()}</Typography>
                        </Box>
                      </Box>

                      {/* Container Item Details in Table */}
                      {detail.containerItems && detail.containerItems.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>Container Items</Typography>
                          <TableContainer component={Paper} sx={{ bgcolor: "#f5f5f5" }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "whitesmoke" }}>
                                <TableRow>
                                  <TableCell>Item No</TableCell>
                                  <TableCell>Vehicle ID</TableCell>
                                  <TableCell>Chassis No</TableCell>
                                  <TableCell>Year</TableCell>
                                  <TableCell>Color</TableCell>
                                  <TableCell>CC</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Image Path</TableCell>
                                  <TableCell>Created At</TableCell>
                                  <TableCell>Updated At</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.containerItems.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.itemNo}</TableCell>
                                    <TableCell>{item.vehicleId}</TableCell>
                                    <TableCell>{item.chassisNo}</TableCell>
                                    <TableCell>{item.year}</TableCell>
                                    <TableCell>{item.color}</TableCell>
                                    <TableCell>{item.cc}</TableCell>
                                    <TableCell>{item.amount}</TableCell>
                                    <TableCell>
                                      {item.imagePath ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                          <img
                                            src={item.imagePath}
                                            alt={`Item ${item.itemNo}`}
                                            style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain" }}
                                            onError={(e) => handleImageError(e, "Container Item")}
                                          />
                                          <IconButton size="small" href={item.imagePath} target="_blank" rel="noopener noreferrer">
                                            <OpenInNewIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleDownloadImage(item.imagePath, `item-${item.id}.jpg`)}
                                          >
                                            <DownloadIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      ) : (
                                        "N/A"
                                      )}
                                    </TableCell>
                                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No details available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCargo && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleUpdate(selectedCargo)}
              >
                Update
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(selectedCargo.id)}
              >
                Delete
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            onClick={() => setSelectedCargo(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CargoList;