'use client';

import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Grid,
  Box,
  Paper,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';

// Custom styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[8],
  background: theme.palette.background.paper,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
  maxHeight: '50vh',
  overflowY: 'auto',
  "& .MuiTableHead-root": {
    backgroundColor: theme.palette.grey[100],
    "& .MuiTableCell-root": {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
  },
}));

export default function AddPaymentRequest() {
  const admin_id = useSelector((state) => state.user.id); // Changed from userid to admin_id
  const [userbalance, setUserbalance] = useState(0);
  const [formData, setFormData] = useState({
    admin_id: admin_id, // Changed from userid to admin_id
    transactionno: '',
    amount: '',
    img_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [filteredPaymentHistory, setFilteredPaymentHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  useEffect(() => {
    async function fetchUserBalance() {
      if (!admin_id) {
        console.log("No admin_id available, skipping fetchUserBalance");
        return;
      }

      try {
        console.log("Fetching balance for admin_id:", admin_id);
        const response = await fetch(`/api/user/getuserbalance/${admin_id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user balance');
        }
        const data = await response.json();
        console.log("API Response:", data);

        // Assuming the API returns the balance directly as a number (e.g., 62432.84999999999)
        const balance = typeof data === 'number' ? data : data.balance;
        console.log("Parsed balance:", balance);

        setUserbalance(balance || 0); // Fallback to 0 if balance is undefined/null
      } catch (err) {
        console.error("Error fetching balance:", err.message);
        toast.error(err.message);
      }
    }
    fetchUserBalance();
  }, [admin_id]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredPaymentHistory(paymentHistory);
      return;
    }

    const filtered = paymentHistory.filter((entry) =>
      entry.transactionno.includes(query) ||
      entry.description?.toLowerCase().includes(query.toLowerCase()) ||
      entry.status?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPaymentHistory(filtered);
  };

  const fetchPaymentHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await fetch(`/api/user/payment-request/${admin_id}`);
      if (!response.ok) throw new Error('Failed to fetch payment history');
      const data = await response.json();
      setPaymentHistory(data);
      setFilteredPaymentHistory(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetchingHistory(false);
    }
  };

  const fetchBankAccounts = async () => {
    setFetchingAccounts(true);
    try {
      const response = await fetch('/api/admin/bank-account', { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const data = await response.json();
      setBankAccounts(data);
      setShowModal(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const uploadImage = async (imageFile) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: reader.result }),
          });
          if (!response.ok) throw new Error('Failed to upload image');
          const data = await response.json();
          console.log(data);
          resolve(data.image_url);
        } catch (error) {
          reject(error.message);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(imageFile);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, img_url: imageUrl });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error(`Image upload failed: ${error}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.admin_id || !formData.transactionno || !formData.amount || !formData.img_url) {
        throw new Error('Please fill all required fields.');
      }

      const payload = {
        admin_id: formData.admin_id,
        transactionno: formData.transactionno,
        amount: parseFloat(formData.amount).toFixed(2), // Ensure 2 decimal places
        img_url: formData.img_url,
        status: 'Pending',
      };

      const response = await fetch('/api/user/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit payment request');
      }

      toast.success('Payment request submitted successfully!');
      setFormData({ admin_id: admin_id, transactionno: '', amount: '', img_url: '' });
      fetchPaymentHistory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = () => {
    if (!date1 || !date2) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(date1);
    const end = new Date(date2);

    const filtered = paymentHistory.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= start && entryDate <= end;
    });

    setFilteredPaymentHistory(filtered);

    if (filtered.length === 0) {
      toast.info('No entries found for the selected date range.');
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [admin_id]);

  return (
    <Container maxWidth="lg" sx={{ py: theme.spacing(4), px: theme.spacing(2) }}>
      <ToastContainer />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: theme.spacing(4) }}>
        <Typography variant="h6" component="h1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
          Submit Payment Request
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
            Balance: {(userbalance || 0).toFixed(2)} {/* Fixed to 2 decimal places */}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchBankAccounts}
            disabled={fetchingAccounts}
            startIcon={fetchingAccounts && <CircularProgress size={20} />}
          >
            {fetchingAccounts ? 'Fetching Accounts...' : 'Show Bank Accounts'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={4}>
        {/* Payment Request Form */}
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: theme.typography.fontWeightBold }}>
                Payment Request Form
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Admin ID"
                  name="admin_id"
                  value={formData.admin_id}
                  disabled
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Bank Transaction ID"
                  name="transactionno"
                  value={formData.transactionno}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  required
                />
                <TextField
                  label="Amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  step="0.01"
                  required
                />
                <TextField
                  label="Upload Bank Receipt"
                  name="img_url"
                  onChange={handleImageChange}
                  fullWidth
                  variant="outlined"
                  type="file"
                  inputProps={{ accept: "image/*" }}
                  required
                />
                {formData.img_url && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${formData.img_url}`}
                      alt="Uploaded Receipt"
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: theme.shape.borderRadius }}
                    />
                  </Box>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Payment History Table */}
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                  Payment History
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Search..."
                    variant="outlined"
                    value={searchQuery}
                    onChange={handleSearch}
                    size="small"
                    sx={{ maxWidth: 200 }}
                  />
                  <TextField
                    type="date"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    label="Start Date"
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    type="date"
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    label="End Date"
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={filterByDate}
                    size="small"
                  >
                    Filter
                  </Button>
                </Stack>
              </Stack>
              {fetchingHistory ? (
                <Stack direction="row" justifyContent="center" sx={{ my: theme.spacing(2) }}>
                  <CircularProgress />
                </Stack>
              ) : (
                <StyledTableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Trnx No.</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell>Updated At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPaymentHistory.length > 0 ? (
                        filteredPaymentHistory.map((payment) => (
                          <TableRow
                            key={payment.id}
                            hover
                            sx={{ "&:hover": { backgroundColor: theme.palette.action.hover } }}
                          >
                            <TableCell>{payment.id}</TableCell>
                            <TableCell>{payment.transactionno}</TableCell>
                            <TableCell>{(payment.amount || 0).toFixed(2)}</TableCell> {/* Fixed to 2 decimal places */}
                            <TableCell>{payment.status}</TableCell>
                            <TableCell>Payment</TableCell>
                            <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(payment.updated_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body1">No payment history available</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </StyledTableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bank Accounts</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You can send payment to these bank accounts
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account) => (
                <Card key={account.id} sx={{ p: 2, borderRadius: theme.shape.borderRadius }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                        {account.bank_title}
                      </Typography>
                      <Typography variant="body2">{account.account_title}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                      {account.account_no}
                    </Typography>
                  </Stack>
                </Card>
              ))
            ) : (
              <Typography variant="body1">No bank accounts available</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}