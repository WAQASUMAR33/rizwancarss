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
  IconButton,
  Stack,
  Paper,
  CardHeader,
  Box,
  useTheme,
  TablePagination,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable"; // For table formatting in the PDF

// Custom styled components with Material Design principles
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[8],
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
  "& .MuiTableHead-root": {
    backgroundColor: theme.palette.grey[100],
    "& .MuiTableCell-root": {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
  },
}));

// Reusable FieldCard component with Material Design styling
const FieldCard = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        p: 2,
        borderRadius: 1,
        backgroundColor: "background.paper",
        boxShadow: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        <strong>{label}:</strong>
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body1" color="text.primary">
          {value}
        </Typography>
      ) : value && typeof value === "object" && value.src ? (
        <>
          <img
            src={value.src}
            alt={label}
            style={{ maxWidth: "100%", maxHeight: "200px", marginBottom: theme.spacing(1) }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const link = document.createElement("a");
              link.href = value.src;
              link.download = `${label}_${Date.now()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            size="small"
            sx={{ mt: 1 }}
          >
            Download
          </Button>
        </>
      ) : (
        value
      )}
    </Box>
  );
};

const SaleVehicleRecords = () => {
  const [saleRecords, setSaleRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filter, setFilter] = useState("");
  const router = useRouter();
  const theme = useTheme();

  const fetchSaleRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/sale/receipt"); // Adjust endpoint as needed
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch all sale vehicle records: ${errorText || response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched sale vehicle records:", data);
      if (data.status && data.data) {
        setSaleRecords(data.data);
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
      const response = await fetch(`/api/admin/sale/${id}`);
      console.log("Response status:", response.status, "Response ok:", response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch sale vehicle record for ${id}: ${errorText || response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Fetched record details:", JSON.stringify(data, null, 2));
      if (data.status && data.data) {
        setSelectedRecord(data.data);
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
    fetchSaleRecords();
  }, []);

  const handleViewDetails = (id) => {
    fetchRecordDetails(id);
  };

  const handleBack = () => {
    setSelectedRecord(null);
  };

  // Function to generate and download the PDF receipt
  const generatePDF = (record) => {
    const doc = new jsPDF();

    // Header: Company Name and Details
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Rizwan Cars", 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("1234 Auto Street, Car City", 20, 30);
    doc.text("Phone: +123-456-7890", 20, 36);
    doc.text("Email: sales@rizwancars.com", 20, 42);

    // Receipt Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Receipt", 20, 60);

    // Sale Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt No: ${record.id}`, 20, 70);
    doc.text(`Date: ${new Date(record.date).toLocaleDateString()}`, 20, 76);

    // Customer Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 20, 90);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${record.fullname}`, 20, 100);
    doc.text(`Mobile No: ${record.mobileno}`, 20, 106);
    doc.text(`Passport No: ${record.passportNo}`, 20, 112);

    // Vehicle Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Details", 20, 126);
    doc.setFontSize(12);
    const vehicleDetails = [
      ["Vehicle No", record.vehicleNo],
      ["Chassis No", record.vehicle?.chassisNo || "N/A"],
      ["Maker", record.vehicle?.maker || "N/A"],
      ["Year", record.vehicle?.year || "N/A"],
      ["Color", record.vehicle?.color || "N/A"],
      ["Engine Type", record.vehicle?.engineType || "N/A"],
    ];
    doc.autoTable({
      startY: 130,
      head: [["Field", "Value"]],
      body: vehicleDetails,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Financial Breakdown
    let finalY = doc.lastAutoTable.finalY || 130;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Breakdown", 20, finalY + 10);
    doc.setFontSize(12);
    const financialDetails = [
      ["Sale Price", `$${record.sale_price.toFixed(2)}`],
      ["Commission Amount", `$${record.commission_amount.toFixed(2)}`],
      ["Other Charges", `$${record.othercharges.toFixed(2)}`],
      ["Total Amount", `$${record.totalAmount.toFixed(2)}`],
    ];
    doc.autoTable({
      startY: finalY + 14,
      head: [["Description", "Amount"]],
      body: financialDetails,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Footer
    finalY = doc.lastAutoTable.finalY || finalY + 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your purchase!", 20, finalY + 20);
    doc.text("For inquiries, contact us at sales@rizwancars.com", 20, finalY + 26);

    // Download the PDF
    doc.save(`Sales_Receipt_${record.id}.pdf`);
  };

  // Filter records based on input
  const filteredRecords = saleRecords.filter((record) =>
    Object.values(record).some((value) =>
      value?.toString().toLowerCase().includes(filter.toLowerCase())
    )
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: theme.spacing(4), px: theme.spacing(2) }}>
      {!selectedRecord ? (
        // List View
        <Stack spacing={theme.spacing(2)}>
          {/* Title and Filter in a Single Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={theme.spacing(2)}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: theme.spacing(2) }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: theme.typography.fontWeightBold,
                color: theme.palette.text.primary,
              }}
            >
              Sale Vehicle Records
            </Typography>
            <TextField
              label="Filter Records"
              variant="outlined"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                maxWidth: { sm: 400 },
                flexShrink: 0,
              }}
            />
          </Stack>

          {loading && (
            <Stack
              direction="row"
              justifyContent="center"
              sx={{ my: theme.spacing(4) }}
            >
              <CircularProgress />
            </Stack>
          )}
          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: theme.spacing(3), px: theme.spacing(1) }}
            >
              {error}
            </Typography>
          )}

          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Vehicle No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record) => (
                    <TableRow
                      key={record.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: theme.palette.action.hover } }}
                    >
                      <TableCell>{record.id}</TableCell>
                      <TableCell>{record.vehicleNo}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>${(record.totalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetails(record.id)}
                          title="View Details"
                          sx={{ "&:hover": { color: theme.palette.primary.dark } }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </StyledTableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRecords.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ px: theme.spacing(2) }}
          />
        </Stack>
      ) : (
        // Detail View
        <StyledCard>
          <CardHeader
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={() => generatePDF(selectedRecord)}
                >
                  Download Receipt
                </Button>
                <IconButton
                  onClick={handleBack}
                  color="primary"
                  sx={{ "&:hover": { color: theme.palette.primary.dark } }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Stack>
            }
            title={
              <Typography
                variant="h5"
                sx={{ fontWeight: theme.typography.fontWeightBold }}
              >
                Vehicle Sale Record: {selectedRecord.vehicleNo}
              </Typography>
            }
            subheader={
              <Typography variant="subtitle2" color="text.secondary">
                ID: {selectedRecord.id} | Admin ID: {selectedRecord.admin_id}
              </Typography>
            }
            sx={{
              bgcolor: theme.palette.grey[100],
              color: theme.palette.text.primary,
              py: theme.spacing(2),
            }}
          />
          <CardContent>
            <Stack spacing={theme.spacing(3)}>
              {/* Sale Details in a Grid Layout */}
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <FieldCard
                    label="Date"
                    value={new Date(selectedRecord.date).toLocaleDateString()}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Customer Name" value={selectedRecord.fullname} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Mobile No" value={selectedRecord.mobileno} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Passport No" value={selectedRecord.passportNo} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Sale Price"
                    value={`$${selectedRecord.sale_price.toFixed(2)}`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Commission Amount"
                    value={`$${selectedRecord.commission_amount.toFixed(2)}`}
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
                    label="Total Amount"
                    value={`$${selectedRecord.totalAmount.toFixed(2)}`}
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

              <Divider sx={{ my: theme.spacing(2) }} />

              {/* Vehicle Details Table (Single Record) */}
              <Typography
                variant="h6"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(2) }}
              >
                Vehicle Details
              </Typography>
              <StyledTableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle No</TableCell>
                      <TableCell>Chassis No</TableCell>
                      <TableCell>Maker</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>Engine Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      key={selectedRecord.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: theme.palette.action.hover } }}
                    >
                      <TableCell>{selectedRecord.vehicleNo}</TableCell>
                      <TableCell>{selectedRecord.vehicle?.chassisNo || "N/A"}</TableCell>
                      <TableCell>{selectedRecord.vehicle?.maker || "N/A"}</TableCell>
                      <TableCell>{selectedRecord.vehicle?.year || "N/A"}</TableCell>
                      <TableCell>{selectedRecord.vehicle?.color || "N/A"}</TableCell>
                      <TableCell>{selectedRecord.vehicle?.engineType || "N/A"}</TableCell>
                    </TableRow>
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

export default SaleVehicleRecords;