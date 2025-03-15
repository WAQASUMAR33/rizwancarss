"use client";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  TableFooter,
  TablePagination,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

// Fetch all CusLedger records
const fetchCusLedgers = async () => {
  const response = await fetch("/api/admin/shareholders/trnx");
  if (!response.ok) {
    throw new Error("Failed to fetch CusLedger records");
  }
  const result = await response.json();
  console.log("Fetched CusLedger records:", result);
  return result.data;
};

export default function CusLedgerManagement() {
  const [cusLedgers, setCusLedgers] = useState([]);
  const [filteredLedgers, setFilteredLedgers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const adminId = useSelector((state) => state.user.id);

  useEffect(() => {
    fetchCusLedgers()
      .then((ledgerData) => {
        // Filter CusLedger entries by adminId (if applicable)
        const adminLedgers = ledgerData.filter((ledger) => ledger.added_by === adminId);
        setCusLedgers(adminLedgers);
        setFilteredLedgers(adminLedgers); // Initial filter
      })
      .catch((err) => {
        toast.error(err.message);
        setCusLedgers([]);
      })
      .finally(() => setIsLoading(false));
  }, [adminId]);

  useEffect(() => {
    let filtered = cusLedgers;

    // Filter by search term across all fields
    if (searchTerm) {
      filtered = filtered.filter((ledger) =>
        Object.values(ledger).some((value) =>
          value &&
          (typeof value === "string" || typeof value === "number") &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (ledger.user?.fullname &&
          ledger.user.fullname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((ledger) => {
        const transactionDate = new Date(ledger.transaction_at);
        return transactionDate >= start && transactionDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((ledger) => {
        const transactionDate = new Date(ledger.transaction_at);
        return transactionDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((ledger) => {
        const transactionDate = new Date(ledger.transaction_at);
        return transactionDate <= end;
      });
    }

    setFilteredLedgers(filtered);
    setPage(0); // Reset to first page when filters change
  }, [cusLedgers, searchTerm, startDate, endDate]);

  // Calculate total IN and OUT amounts
  const totalInAmount = filteredLedgers.reduce(
    (sum, ledger) => sum + parseFloat(ledger.in_amount || 0),
    0
  );
  const totalOutAmount = filteredLedgers.reduce(
    (sum, ledger) => sum + parseFloat(ledger.out_amount || 0),
    0
  );

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <ToastContainer />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
        <TextField
          label="Search all fields..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "300px" }}
        />
        <Box display="flex" gap={2}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: "200px" }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: "200px" }}
          />
        </Box>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <TableContainer
            component={Paper}
            sx={{ maxHeight: "72vh", overflow: "auto", width: "100%" }}
          >
            <Table sx={{ minWidth: "100%", width: "100%" }} stickyHeader>
              <TableHead sx={{ backgroundColor: "whitesmoke !important" }}>
                <TableRow>
                  <TableCell sx={{ width: "5%" }}>No.</TableCell>
                  <TableCell sx={{ width: "15%" }}>User</TableCell>
                  <TableCell sx={{ width: "10%" }}>IN</TableCell>
                  <TableCell sx={{ width: "10%" }}>OUT</TableCell>
                  <TableCell sx={{ width: "10%" }}>Balance</TableCell>
                  <TableCell sx={{ width: "20%" }}>Description</TableCell>
                  <TableCell sx={{ width: "15%" }}>Transaction At</TableCell>
                  <TableCell sx={{ width: "15%" }}>Updated At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLedgers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ledger, index) => (
                    <TableRow key={ledger.id} hover>
                      <TableCell sx={{ width: "5%" }}>{ledger.id}</TableCell>
                      <TableCell sx={{ width: "15%" }}>{ledger.shareholder?.name || "N/A"}</TableCell>
                      <TableCell sx={{ width: "10%" }}>{parseFloat(ledger.in_amount || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ width: "10%" }}>{parseFloat(ledger.out_amount || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ width: "10%" }}>{parseFloat(ledger.balance || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ width: "20%" }}>{ledger.description || "N/A"}</TableCell>
                      <TableCell sx={{ width: "15%" }}>{new Date(ledger.transaction_at).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ width: "15%" }}>{new Date(ledger.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} align="left">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Left Amount: {totalInAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={4} />
                  <TableCell colSpan={2} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount: {totalOutAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredLedgers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
          />
        </Box>
      )}
    </Box>
  );
}