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
} from "@mui/material";
import { Clear as ClearIcon, Download as DownloadIcon } from "@mui/icons-material";

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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

  // Filter vehicles when searching
  useEffect(() => {
    const filtered = vehicles.filter((vehicle) =>
      (vehicle.chassisNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.maker || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.admin?.fullname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.seaPort?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVehicles(filtered);
    setCurrentPage(1);
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
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Function to structure amounts for individual tables (excluding Invoice)
  const getAmountsTables = (totalAmounts) => {
    if (!totalAmounts) return [];

    const tables = [];

    // Auction (AddVehicle)
    tables.push({
      category: "Auction",
      headers: [
        "Auction Amount",
        "10% Add",
        "Bid Amount",
        "Bid 10%",
        "Commission",
        "Repair Charges",
        "Total Yen",
        "Total USD",
      ],
      data: {
        auctionAmount: totalAmounts.addVehicle.auction_amount || 0,
        tenPercentAdd: totalAmounts.addVehicle.tenPercentAdd || 0,
        bidAmount: totalAmounts.addVehicle.bidAmount || 0,
        bidAmount10per: totalAmounts.addVehicle.bidAmount10per || 0,
        commissionAmount: totalAmounts.addVehicle.commissionAmount || 0,
        repairCharges: totalAmounts.addVehicle.repairCharges || 0,
        totalAmountYen: totalAmounts.addVehicle.totalAmount_yen || 0,
        totalAmountDollars: totalAmounts.addVehicle.totalAmount_dollers || 0,
      },
    });

    // Transport
    tables.push({
      category: "Transport",
      headers: ["Amount", "10% Add", "Total Amount", "Total USD"],
      data: {
        amount: totalAmounts.transport.amount || 0,
        tenPercentAdd: totalAmounts.transport.tenPercentAdd || 0,
        totalAmount: totalAmounts.transport.totalamount || 0,
        totalDollars: totalAmounts.transport.totaldollers || 0,
      },
    });

    // Inspection
    tables.push({
      category: "Inspection",
      headers: ["Invoice Amount", "Invoice Tax", "Invoice Total", "Invoice USD", "Vehicle USD"],
      data: {
        invoiceAmount: totalAmounts.inspection.invoice_amount || 0,
        invoiceTax: totalAmounts.inspection.invoice_tax || 0,
        invoiceTotal: totalAmounts.inspection.invoice_total || 0,
        invoiceAmountDollars: totalAmounts.inspection.invoice_amount_dollers || 0,
        vAmountDollars: totalAmounts.inspection.vamount_doller || 0,
      },
    });

    // Port Collect
    tables.push({
      category: "Port Collect",
      headers: ["Freight", "Port Charges", "Clearing", "Other Charges", "Total Amount", "Vehicle Amount"],
      data: {
        freightAmount: totalAmounts.portCollect.freight_amount || 0,
        portCharges: totalAmounts.portCollect.port_charges || 0,
        clearingCharges: totalAmounts.portCollect.clearingcharges || 0,
        otherCharges: totalAmounts.portCollect.othercharges || 0,
        totalAmount: totalAmounts.portCollect.totalAmount || 0,
        vAmount: totalAmounts.portCollect.vamount || 0,
      },
    });

    // Showroom
    tables.push({
      category: "Showroom",
      headers: ["Transport", "Other Charges", "Total Amount", "Repair Charges", "Vehicle Amount", "Vehicle Total"],
      data: {
        transportCharges: totalAmounts.showroom.Transport_charges || 0,
        otherCharges: totalAmounts.showroom.othercharges || 0,
        totalAmount: totalAmounts.showroom.totalAmount || 0,
        vRepairCharges: totalAmounts.showroom.vRepair_charges || 0,
        vAmount: totalAmounts.showroom.vamount || 0,
        vTotalAmount: totalAmounts.showroom.vtotalAmount || 0,
      },
    });

    // Sale
    tables.push({
      category: "Sale",
      headers: ["Commission", "Other Charges", "Total Amount", "Sale Price"],
      data: {
        commissionAmount: totalAmounts.sale.commission_amount || 0,
        otherCharges: totalAmounts.sale.othercharges || 0,
        totalAmount: totalAmounts.sale.totalAmount || 0,
        salePrice: totalAmounts.sale.sale_price || 0,
      },
    });

    // Container Items
    totalAmounts.containerItems?.forEach((item, index) => {
      tables.push({
        category: `Container Item ${index + 1}`,
        headers: ["Amount"],
        data: {
          amount: item.amount || 0,
        },
      });
    });

    return tables;
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
      <Typography variant="h5" gutterBottom>Vehicles List</Typography>

      {/* Search Input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by Chassis No, Maker, Admin, or Sea Port..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: searchQuery && (
            <IconButton onClick={() => setSearchQuery("")} size="small">
              <ClearIcon />
            </IconButton>
          ),
        }}
      />

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
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3} gap={1}>
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outlined"
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, index) => (
            <Button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              variant={currentPage === index + 1 ? "contained" : "outlined"}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      )}

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
                    {getAmountsTables(detailedVehicle.totalAmounts).length > 0 ? (
                      getAmountsTables(detailedVehicle.totalAmounts).map((table, idx) => (
                        <Box key={idx} sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                              backgroundColor: "#1976d2", // Blue background for title
                              color: "#fff", // White text
                              padding: "8px 16px",
                              borderRadius: "8px",
                              display: "inline-block",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            {table.category}
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#42a5f5" }}> {/* Vibrant blue for headers */}
                                  {table.headers.map((header, hIdx) => (
                                    <TableCell
                                      key={hIdx}
                                      align="left"
                                      sx={{
                                        borderRight: "1px solid #e0e0e0",
                                        "&:last-child": { borderRight: "none" },
                                        color: "#fff", // White text for headers
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {header}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow hover>
                                  {table.headers.map((header, hIdx) => {
                                    const key = header
                                      .toLowerCase()
                                      .replace(/ /g, "")
                                      .replace(/%/g, "Percent")
                                      .replace(/usd/g, "Dollars");
                                    const value = table.data[key] || table.data[key.replace("amount", "Amount")] || 0;
                                    return (
                                      <TableCell
                                        key={hIdx}
                                        align="left"
                                        sx={{
                                          borderRight: "1px solid #e0e0e0",
                                          "&:last-child": { borderRight: "none" },
                                        }}
                                      >
                                        {value !== 0 ? value.toFixed(2) : "-"}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ))
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