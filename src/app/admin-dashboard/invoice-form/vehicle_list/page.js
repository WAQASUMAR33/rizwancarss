"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Modal,
  IconButton,
  Link,
  Stack,
  TablePagination,
} from "@mui/material";
import { Clear as ClearIcon, Download as DownloadIcon } from "@mui/icons-material";

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailedVehicle, setDetailedVehicle] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch initial vehicle list
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/admin/vehicles");
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const data = await response.json();
        const fetchedVehicles = data.data || [];
        setVehicles(fetchedVehicles);
        setFilteredVehicles(fetchedVehicles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Filter vehicles when searching (updated to include all fields)
  useEffect(() => {
    const filtered = vehicles.filter((vehicle) => {
      const query = searchQuery.toLowerCase();

      // Convert all fields to strings and handle null/undefined safely
      const chassisNo = (vehicle.chassisNo || "").toLowerCase();
      const maker = (vehicle.maker || "").toLowerCase();
      const year = (vehicle.year || "").toString().toLowerCase();
      const color = (vehicle.color || "").toLowerCase();
      const adminName = (vehicle.admin?.fullname || "").toLowerCase();
      const seaPortName = (vehicle.seaPort?.name || "").toLowerCase();
      const totalAmount = (vehicle.totalAmount_dollers || 0).toString().toLowerCase();
      const status = (vehicle.status || "").toLowerCase();

      // Check if any field matches the search query
      return (
        chassisNo.includes(query) ||
        maker.includes(query) ||
        year.includes(query) ||
        color.includes(query) ||
        adminName.includes(query) ||
        seaPortName.includes(query) ||
        totalAmount.includes(query) ||
        status.includes(query)
      );
    });

    setFilteredVehicles(filtered);
    setCurrentPage(0); // Reset to first page on filter change
  }, [searchQuery, vehicles]);

  // Fetch detailed vehicle data
  useEffect(() => {
    const fetchDetailedVehicle = async () => {
      if (!selectedVehicle) {
        setDetailedVehicle(null);
        return;
      }

      setDetailsLoading(true);
      try {
        const response = await fetch(`/api/admin/vehicles/${selectedVehicle.id}`);
        if (!response.ok) throw new Error("Failed to fetch vehicle details");
        const data = await response.json();
        if (data.status) {
          setDetailedVehicle(data.data);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetailedVehicle();
  }, [selectedVehicle]);

  // Pagination Logic
  const paginatedVehicles = filteredVehicles.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Pagination Handlers for TablePagination
  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  // Function to get status background color
  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case "Delivered":
        return "#e6ffe6"; // Light green
      case "Collect":
        return "#fff3e0"; // Light orange
      default:
        return "#fff0f0"; // Light red for other statuses
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading vehicles...</Typography>
      </Box>
    );
  }
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 3, bgcolor: "#fff", borderRadius: 2, boxShadow: 3 }}>
      {/* Title and Search Box in a Single Row */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5">Vehicles List</Typography>
        <TextField
          variant="outlined"
          placeholder="Search by Chassis No, Maker, Admin, or Sea Port..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            maxWidth: { sm: 400 },
            flexShrink: 0,
          }}
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton onClick={() => setSearchQuery("")} size="small">
                <ClearIcon />
              </IconButton>
            ),
          }}
        />
      </Stack>

      {/* Vehicles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Chassis No</TableCell>
              <TableCell>Maker</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Sea Port</TableCell>
              <TableCell>Total Amount (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedVehicles.length > 0 ? (
              paginatedVehicles.map((vehicle, index) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>{vehicle.id}</TableCell>
                  <TableCell>{vehicle.chassisNo}</TableCell>
                  <TableCell>{vehicle.maker}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.color}</TableCell>
                  <TableCell>{vehicle.admin?.fullname || "N/A"}</TableCell>
                  <TableCell>{vehicle.seaPort?.name || "N/A"}</TableCell>
                  <TableCell>
                    ${(vehicle.totalAmount_dollers ? parseFloat(vehicle.totalAmount_dollers) : 0).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: vehicle.status === "Delivered" ? "green" : "orange" }}>
                    {vehicle.status}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">No vehicles found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* TablePagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredVehicles.length}
        rowsPerPage={itemsPerPage}
        page={currentPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ mt: 3 }}
      />

      {/* Vehicle Details Modal */}
      <Modal
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        aria-labelledby="vehicle-details-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 1200,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" id="vehicle-details-modal" gutterBottom>
            Vehicle Details (Chassis No: {selectedVehicle?.chassisNo})
          </Typography>

          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : detailedVehicle ? (
            <Grid container spacing={3}>
              {/* Vehicle Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Vehicle Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={3}><Typography><strong>ID:</strong> {detailedVehicle.id}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Chassis No:</strong> {detailedVehicle.chassisNo}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Maker:</strong> {detailedVehicle.maker}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Year:</strong> {detailedVehicle.year}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Color:</strong> {detailedVehicle.color}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Engine Type:</strong> {detailedVehicle.engineType}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Admin:</strong> {detailedVehicle.admin?.fullname || "N/A"}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Sea Port:</strong> {detailedVehicle.seaPort?.name || "N/A"}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Total Amount (USD):</strong> ${(detailedVehicle.totalAmount_dollers || 0).toFixed(2)}</Typography></Grid>
                      <Grid item xs={3}>
                        <Typography sx={{ bgcolor: getStatusBackgroundColor(detailedVehicle.status), p: 1, borderRadius: 1 }}>
                          <strong>Status:</strong> {detailedVehicle.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}><Typography><strong>Invoice No:</strong> {detailedVehicle.invoice?.number || "N/A"}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Document Required:</strong> {detailedVehicle.isDocumentRequired}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Ownership:</strong> {detailedVehicle.isOwnership}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Auction House:</strong> {detailedVehicle.auction_house}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Amounts Tables */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>All Amounts</Typography>
                    {detailedVehicle && detailedVehicle.totalAmounts ? (
                      <>
                        {/* Auction Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Auction
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>

                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Bid Amount</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Bid 10%</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Auction Amount</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>10% Add</TableCell>
                                 
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Recycle Amount</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Number Plate</TableCell>


                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Commission</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Repair Charges</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Total Yen</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "none", color: "#000", fontWeight: "bold" }}>Total USD</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                 
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.bidAmount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.bidAmount10per?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.auction_amount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.tenPercentAdd?.toFixed(2) || "-"}
                                  </TableCell>


                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.recycleAmount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.numberPlateTax?.toFixed(2) || "-"}
                                  </TableCell>
                                  
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.commissionAmount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.repairCharges?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.totalAmount_yen?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "none" }}>
                                    {detailedVehicle.totalAmounts.addVehicle?.totalAmount_dollers?.toFixed(2) || "-"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Transport Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Transport
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                  <TableCell align="left" sx={{ borderRight: "none", color: "#000", fontWeight: "bold" }}>Total USD</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.transport?.v_amount?.toFixed(2) || "-"}
                                  </TableCell>
                                 
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Inspection Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Inspection
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Total Amount</TableCell>
                                                              </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.inspection?.vamount_doller?.toFixed(2) || "-"}
                                  </TableCell>
                                 
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Port Collect Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Port Collect
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Freight</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  <TableCell align="left" sx={{ borderRight: "none" }}>
                                    {detailedVehicle.totalAmounts.portCollect?.vamount?.toFixed(2) || "-"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Showroom Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Showroom
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Total Amount</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.showroom?.vtotalAmount?.toFixed(2) || "-"}
                                  </TableCell>
                                  
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Sale Table */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            Sale
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Commission</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Other Charges</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0", color: "#000", fontWeight: "bold" }}>Total Amount</TableCell>
                                  <TableCell align="left" sx={{ borderRight: "none", color: "#000", fontWeight: "bold" }}>Sale Price</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.sale?.commission_amount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.sale?.othercharges?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "1px solid #e0e0e0" }}>
                                    {detailedVehicle.totalAmounts.sale?.totalAmount?.toFixed(2) || "-"}
                                  </TableCell>
                                  <TableCell align="left" sx={{ borderRight: "none" }}>
                                    {detailedVehicle.totalAmounts.sale?.sale_price?.toFixed(2) || "-"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Container Item Table (Single table for first item if exists) */}
                        {detailedVehicle.totalAmounts.containerItems && detailedVehicle.totalAmounts.containerItems.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              sx={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                display: "inline-block",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              Container Item 1
                            </Typography>
                            <TableContainer component={Paper}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                    <TableCell align="left" sx={{ borderRight: "none", color: "#000", fontWeight: "bold" }}>Amount</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow hover>
                                    <TableCell align="left" sx={{ borderRight: "none" }}>
                                      {detailedVehicle.totalAmounts.containerItems[0]?.amount?.toFixed(2) || "-"}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography>No amounts available for this vehicle.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Vehicle Images */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Vehicle Images</Typography>
                    {detailedVehicle.vehicleImages && detailedVehicle.vehicleImages.length > 0 ? (
                      <Grid container spacing={2}>
                        {detailedVehicle.vehicleImages.map((image, idx) => (
                          <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <img
                                src={image.imagePath}
                                alt={`Vehicle Image ${idx + 1}`}
                                style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }}
                              />
                              <Link href={image.imagePath} download={`vehicle_image_${idx + 1}.png`}>
                                <IconButton color="primary" aria-label="download image">
                                  <DownloadIcon />
                                </IconButton>
                              </Link>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography>No images available for this vehicle.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="error">Failed to load vehicle details.</Typography>
          )}

          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedVehicle(null)}
            sx={{ mt: 3, width: "100%" }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default VehiclesList;