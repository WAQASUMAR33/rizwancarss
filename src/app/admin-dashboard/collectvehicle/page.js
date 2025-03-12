"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Stack,
  Paper,
  CardHeader,
  Box,
  Img,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";

// Custom styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
  border: "1px solid lightgray",
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  "& .MuiTableHead-root": {
    backgroundColor: "whitesmoke",
    "& .MuiTableCell-root": {
      color: theme.palette.text.primary,
      fontWeight: "bold",
    },
  },
}));

// Reusable FieldCard component for displaying fields in a card-like box
const FieldCard = ({ label, value }) => {
  return (
    <Box sx={{ border: "1px solid lightgray", p: 2, borderRadius: 2 }}>
      <Typography variant="body2">
        <strong>{label}:</strong>
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body1">{value}</Typography>
      ) : value && typeof value === "object" && value.src ? (
        <img src={value.src} alt={label} style={{ maxWidth: "100%", maxHeight: "200px" }} />
      ) : (
        value
      )}
    </Box>
  );
};

const CollectRecords = () => {
  const [collectRecords, setCollectRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchCollectRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/collect");
      if (!response.ok) throw new Error("Failed to fetch collect records");
      const data = await response.json();
      console.log("Fetched collect records:", data);
      if (data.status && data.data) {
        setCollectRecords(data.data);
      } else {
        throw new Error(data.error || "No records found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordDetails = async (id) => {
    setLoading(true);
    setError("");
    try {
      console.log(`Fetching details for id: ${id}`);
      const response = await fetch(`/api/admin/collect/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch collect record for ${id}: ${errorText}`);
      }
      const data = await response.json();
      console.log("Fetched record details:", JSON.stringify(data, null, 2));
      if (data.status && data.data) {
        setSelectedRecord(data.data.collect);
        setVehicles(data.data.vehicles || []);
      } else {
        throw new Error(data.error || "No record found");
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectRecords();
  }, []);

  const handleViewDetails = (id) => {
    fetchRecordDetails(id);
  };

  const handleBack = () => {
    setSelectedRecord(null);
    setVehicles([]);
  };

  // Calculate the maximum number of vehicles across all records
  const maxVehicles = collectRecords.reduce((max, record) => {
    const vehicleCount = record.vehicleNo ? record.vehicleNo.split(",").length : 0;
    return Math.max(max, vehicleCount);
  }, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold", color: "primary.main", mb: 4 }}
      >
        Collect Records (Max Vehicles: {maxVehicles})
      </Typography>

      {loading && (
        <Stack direction="row" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Stack>
      )}
      {error && (
        <Typography variant="body1" color="error.main" sx={{ mb: 3 }}>
          {error}
        </Typography>
      )}

      {!selectedRecord ? (
        // List View
        <StyledTableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total Charges</TableCell> {/* Reintroduced Total Charges */}
                <TableCell>Vehicles</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collectRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>{record.invoiceno}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>${(record.totalAmount || 0).toFixed(2)}</TableCell> {/* Display totalAmount */}
                  <TableCell>
                    <Chip
                      label={record.vehicleNo ? record.vehicleNo.split(",").length : 0}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewDetails(record.id)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      ) : (
        // Detail View
        <StyledCard>
          <CardHeader
            action={
              <IconButton onClick={handleBack} color="primary">
                <ArrowBackIcon />
              </IconButton>
            }
            title={
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Collect Record: {selectedRecord.invoiceno}
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                ID: {selectedRecord.id} | Admin ID: {selectedRecord.admin_id}
              </Typography>
            }
            sx={{ bgcolor: "whitesmoke", color: "black", py: 2 }}
          />
          <CardContent>
            <Stack spacing={3}>
              {/* Collect Details in a Grid Layout */}
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <FieldCard
                    label="Date"
                    value={new Date(selectedRecord.date).toLocaleDateString()}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Freight Amount"
                    value={`$${selectedRecord.freight_amount.toFixed(2)}`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Port Charges"
                    value={`$${selectedRecord.port_charges.toFixed(2)}`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Clearing Charges"
                    value={`$${selectedRecord.clearingcharges.toFixed(2)}`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Other Charges"
                    value={`$${selectedRecord.othercharges.toFixed(2)}`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Image"
                    value={
                      selectedRecord.imagePath
                        ? { src: selectedRecord.imagePath }
                        : "No image"
                    }
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Vehicles Table */}
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Associated Vehicles
              </Typography>
              <StyledTableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Chassis No</TableCell>
                      <TableCell>Maker</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.length > 0 ? (
                      vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} hover>
                          <TableCell>{vehicle.id}</TableCell>
                          <TableCell>{vehicle.chassisNo}</TableCell>
                          <TableCell>{vehicle.maker}</TableCell>
                          <TableCell>{vehicle.year}</TableCell>
                          <TableCell>{vehicle.color}</TableCell>
                          <TableCell>${selectedRecord.vamount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={vehicle.status}
                              color={vehicle.status === "Collect" ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No vehicles found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </StyledTableContainer>
            </Stack>
          </CardContent>
        </StyledCard>
      )}
    </Container>
  );
};

export default CollectRecords;