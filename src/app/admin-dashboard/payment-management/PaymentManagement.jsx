'use client';

import { toast, ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  useTheme,
  TablePagination,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';

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
  maxHeight: '72vh',
  overflowY: 'auto',
  "& .MuiTableHead-root": {
    backgroundColor: theme.palette.grey[100],
    "& .MuiTableCell-root": {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
  },
}));

const fetchPaymentRequests = async () => {
  const response = await fetch('/api/admin/payment-requests');
  if (!response.ok) {
    throw new Error('Failed to fetch payment requests');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || []; // Ensure data is an array
};

export default function PaymentRequestManagement() {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [filteredPaymentRequests, setFilteredPaymentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [paymentImage, setPaymentImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [dialogMode, setDialogMode] = useState(null); // 'view', 'add', 'edit'
  const [formData, setFormData] = useState({
    admin_id: '',
    transactionno: '',
    amount: '',
    img_url: '',
    status: 'Pending',
    verified_by: '',
  });
  const [page, setPage] = useState(0); // Current page (0-based index)
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const username = useSelector((state) => state.user.username);
  const theme = useTheme();

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0); // Reset to first page on search

    if (query.trim() === '') {
      setFilteredPaymentRequests(paymentRequests);
      return;
    }
    console.log("The query is : ", query);

    const filtered = paymentRequests.filter((req) =>
      (req.transactionno?.toLowerCase().includes(query.toLowerCase()) ||
       req.Admin?.fullname?.toLowerCase().includes(query.toLowerCase()) ||
       req.status.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredPaymentRequests(filtered);
  };

  useEffect(() => {
    fetchPaymentRequests()
      .then((data) => {
        console.log("Fetched payment requests:", data); // Debug log
        setPaymentRequests(Array.isArray(data) ? data : data.data || []);
        setFilteredPaymentRequests(Array.isArray(data) ? data : data.data || []);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        toast.error(err.message);
        setPaymentRequests([]); // Set to empty array on error
        setFilteredPaymentRequests([]); // Set to empty array on error
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setPaymentImage(imageData);
        setFormData((prev) => ({ ...prev, img_url: imageData }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleApprove = async () => {
    setLoadingAction('approve');
    try {
      const payload = {
        ...selectedRequest,
        status: 'Approved',
        verified_by: username,
      };

      const response = await fetch(`/api/admin/payment-requests/approve/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Payment request approved successfully!');
        setDialogMode(null);
        setPaymentRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: 'Approved', verified_by: username } : req
          )
        );
        setLoadingAction('');
      } else {
        toast.error(result.message || 'Failed to approve payment request.');
        setLoadingAction('');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setLoadingAction('');
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      const payload = { ...selectedRequest, status: 'Rejected', verified_by: username };
      const response = await fetch(
        `/api/admin/payment-requests/reject/${selectedRequest.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to reject payment request.');

      toast.success('Payment request rejected successfully!');
      setDialogMode(null);
      setPaymentRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: 'Rejected', verified_by: username } : req
        )
      );
      setLoadingAction('');
    } catch (err) {
      toast.error(err.message);
      setLoadingAction('');
    }
  };

  const handleAction = async () => {
    try {
      const payload = { ...formData, verified_by: username };
      const response = await fetch(
        `/api/admin/payment-requests${dialogMode === 'edit' ? `/${formData.id}` : ''}`,
        {
          method: dialogMode === 'add' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error('Failed to submit payment request');

      toast.success(
        `Payment request ${dialogMode === 'add' ? 'added' : 'updated'} successfully!`
      );
      setDialogMode(null);
      setFormData({ admin_id: '', transactionno: '', amount: '', img_url: '', status: 'Pending' });

      if (dialogMode === 'edit') {
        setPaymentRequests((prev) =>
          prev.map((req) =>
            req.id === formData.id ? { ...req, ...formData } : req
          )
        );
      } else {
        setPaymentRequests((prev) => [payload, ...prev]);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/admin/payment-requests/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment request');

      toast.success('Payment request deleted successfully!');
      setPaymentRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadImage = (req) => {
    const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${req.img_url}`;
    const filename = `${req.transactionno}.jpg`;
    const apiUrl = `/api/download-image?imageUrl=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    window.location.href = apiUrl;
  };

  const filterByDate = () => {
    if (!date1 || !date2) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(date1);
    const end = new Date(date2);

    const filtered = paymentRequests.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= start && entryDate <= end;
    });

    setFilteredPaymentRequests(filtered);
    setPage(0); // Reset to first page on date filter

    if (filtered.length === 0) {
      toast.info('No entries found for the selected date range.');
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  // Calculate the entries to display based on pagination
  const paginatedRequests = filteredPaymentRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ py: theme.spacing(4), px: theme.spacing(2) }}>
      <ToastContainer />
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
        Payment Request Management
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: theme.spacing(4), alignItems: 'center' }}>
        <TextField
          label="Search payment requests..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearch}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <TextField
          type="date"
          value={date1}
          onChange={(e) => setDate1(e.target.value)}
          InputLabelProps={{ shrink: true }}
          label="Start Date"
          variant="outlined"
        />
        <TextField
          type="date"
          value={date2}
          onChange={(e) => setDate2(e.target.value)}
          InputLabelProps={{ shrink: true }}
          label="End Date"
          variant="outlined"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={filterByDate}
          sx={{ px: 4 }}
        >
          Filter
        </Button>
      </Stack>

      {isLoading ? (
        <Stack direction="row" justifyContent="center" sx={{ my: theme.spacing(4) }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Admin ID</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Transaction No</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(paginatedRequests) && paginatedRequests.length > 0 ? (
                  paginatedRequests.map((req, index) => (
                    <TableRow
                      key={req.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: theme.palette.action.hover } }}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{req.admin_id}</TableCell>
                      <TableCell>{req.Admin?.fullname || 'Unknown'}</TableCell>
                      <TableCell>
                        {req.img_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${req.img_url}`}
                            style={{ width: 48, height: 48 }}
                            alt="Payment"
                          />
                        ) : (
                          <img
                            src="/logo/logo1.jpg"
                            style={{ width: 96, height: 96 }}
                            alt="Default"
                          />
                        )}
                      </TableCell>
                      <TableCell>{req.transactionno}</TableCell>
                      <TableCell>{req.amount}</TableCell>
                      <TableCell>{req.status}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setSelectedRequest(req);
                            setDialogMode('view');
                          }}
                          title="View Details"
                          sx={{ "&:hover": { color: theme.palette.primary.dark } }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {/* Uncomment if you want to enable delete functionality */}
                        {/* <IconButton
                          color="error"
                          onClick={() => handleDelete(req.id)}
                          title="Delete"
                          sx={{ "&:hover": { color: theme.palette.error.dark } }}
                        >
                          <DeleteIcon />
                        </IconButton> */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1">No data available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPaymentRequests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      <Dialog open={!!dialogMode} onClose={() => setDialogMode(null)}>
        <DialogTitle>
          {dialogMode === 'view' && 'Payment Request Details'}
          {dialogMode === 'add' && 'Add Payment Request'}
          {dialogMode === 'edit' && 'Edit Payment Request'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'view' && selectedRequest && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Admin ID:</strong> {selectedRequest.admin_id}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Transaction No:</strong> {selectedRequest.transactionno}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Amount:</strong> {selectedRequest.amount}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong> {selectedRequest.status}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <img
                    src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${selectedRequest.img_url}`}
                    alt="Payment"
                    style={{ width: '100%', height: 320, objectFit: 'contain' }}
                  />
                </Grid>
              </Grid>
              {selectedRequest.status !== 'Approved' && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApprove}
                    startIcon={loadingAction === 'approve' && <CircularProgress size={20} />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleReject}
                    startIcon={loadingAction === 'reject' && <CircularProgress size={20} />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => handleDownloadImage(selectedRequest)}
                    startIcon={<DownloadIcon />}
                  >
                    Download Image
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
          {(dialogMode === 'add' || dialogMode === 'edit') && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Admin ID"
                name="admin_id"
                value={formData.admin_id}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Transaction No"
                name="transactionno"
                value={formData.transactionno}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
              />
              <TextField
                type="file"
                name="img_url"
                onChange={handleImageChange}
                inputProps={{ accept: "image/*" }}
                variant="outlined"
                fullWidth
              />
              <Button
                variant="contained"
                color="success"
                onClick={handleAction}
                sx={{ mt: 2 }}
              >
                {dialogMode === 'edit' ? 'Update' : 'Add'}
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogMode(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}