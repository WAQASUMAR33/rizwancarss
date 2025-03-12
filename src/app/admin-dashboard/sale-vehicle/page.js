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
import { useSelector } from "react-redux"; // To get admin_id from Redux

// Custom styled components
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

// Reusable FieldCard component
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

const SaleList = () => {
  const admin_id = useSelector((state) => state.user.id); // Get admin_id from Redux
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
    if (!admin_id) {
      setError("Admin ID not available");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/sale`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sale records: ${errorText || response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched sale records:", data);
      if (data.error === false && data.data) {
        setSaleRecords(data.data);
      } else {
        throw new Error(data.message || "No records found");
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
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sale record for ${id}: ${errorText || response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched record details:", JSON.stringify(data, null, 2));
      if (data.error === false && data.data) {
        setSelectedRecord(data.data);
      } else {
        throw new Error(data.message || "No record found");
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
  }, [admin_id]);

  const handleViewDetails = (id) => {
    fetchRecordDetails(id);
  };

  const handleBack = () => {
    setSelectedRecord(null);
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
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: theme.typography.fontWeightBold,
          color: theme.palette.text.primary,
          mb: theme.spacing(4),
        }}
      >
        Sale Vehicle Records
      </Typography>

      {loading && (
        <Stack direction="row" justifyContent="center" sx={{ my: theme.spacing(4) }}>
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

      {!selectedRecord ? (
        // List View
        <Stack spacing={theme.spacing(2)}>
          <TextField
            label="Filter Records"
            variant="outlined"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ mb: theme.spacing(2), width: "100%", maxWidth: 400 }}
          />

          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Vehicle No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Sale Price</TableCell>
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
                      <TableCell>${record.sale_price.toFixed(2)}</TableCell>
                      <TableCell>${record.totalAmount.toFixed(2)}</TableCell>
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
              <IconButton
                onClick={handleBack}
                color="primary"
                sx={{ "&:hover": { color: theme.palette.primary.dark } }}
              >
                <ArrowBackIcon />
              </IconButton>
            }
            title={
              <Typography
                variant="h5"
                sx={{ fontWeight: theme.typography.fontWeightBold }}
              >
                Sale Record: {selectedRecord.vehicleNo}
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
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <FieldCard
                    label="Date"
                    value={new Date(selectedRecord.date).toLocaleDateString()}
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
                  <FieldCard label="Mobile No" value={selectedRecord.mobileno} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Passport No" value={selectedRecord.passportNo} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Full Name" value={selectedRecord.fullname} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard label="Details" value={selectedRecord.details} />
                </Grid>
                <Grid item xs={4}>
                  <FieldCard
                    label="Sale Price"
                    value={`$${selectedRecord.sale_price.toFixed(2)}`}
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
            </Stack>
          </CardContent>
        </StyledCard>
      )}
    </Container>
  );
};

export default SaleList;