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
  Stack,
  Grid,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
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

const StyledTable = styled(Table)(({ theme }) => ({
  marginTop: theme.spacing(2),
  "& .MuiTableHead-root": {
    backgroundColor: theme.palette.grey[200],
    "& .MuiTableCell-root": {
      fontWeight: theme.typography.fontWeightBold,
    },
  },
}));

export default function SaleVehicle() {
  const admin_id = useSelector((state) => state.user.id); // Get admin_id from Redux
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicle, setVehicle] = useState(null); // Store the searched vehicle
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    admin_id: admin_id,
    vehicleNo: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    commission_amount: 0,
    othercharges: 0,
    totalAmount: 0,
    mobileno: '',
    passportNo: '',
    fullname: '',
    details: '',
    sale_price: 0,
    imagePath: '',
  });
  const theme = useTheme();

  // Update formData.admin_id when admin_id changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, admin_id }));
  }, [admin_id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      toast.error('Please enter a vehicle number to search');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sale/search?query=${searchQuery}`);
      if (!response.ok) throw new Error('Vehicle not found');
      const result = await response.json();

      if (result.status && result.data) {
        setVehicle(result.data);
        setFormData((prev) => ({
          ...prev,
          vehicleNo: result.data.vehicleId.toString(), // Using vehicleId as vehicleNo
          details: `Chassis: ${result.data.chassisNo}, Year: ${result.data.year}, Color: ${result.data.color}, CC: ${result.data.cc}`,
        }));
        toast.success('Vehicle found!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to find vehicle');
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'commission_amount' || name === 'othercharges' || name === 'sale_price' || name === 'totalAmount'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, imagePath: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error(`Image upload failed: ${error}`);
    }
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
          resolve(data.image_url);
        } catch (error) {
          reject(error.message);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(imageFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.admin_id || !formData.vehicleNo || !formData.date || !formData.sale_price) {
        throw new Error('Please fill all required fields (Admin ID, Vehicle No, Date, Sale Price)');
      }

      const payload = {
        admin_id: formData.admin_id,
        vehicleNo: formData.vehicleNo,
        date: new Date(formData.date).toISOString(),
        commission_amount: parseFloat(formData.commission_amount),
        othercharges: parseFloat(formData.othercharges),
        totalAmount: parseFloat(formData.totalAmount),
        mobileno: formData.mobileno,
        passportNo: formData.passportNo,
        fullname: formData.fullname,
        details: formData.details,
        sale_price: parseFloat(formData.sale_price),
        imagePath: formData.imagePath,
      };

      const response = await fetch('/api/admin/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save sale vehicle');
      }

      toast.success('Sale vehicle saved successfully!');
      setFormData({
        admin_id: admin_id,
        vehicleNo: '',
        date: new Date().toISOString().split('T')[0],
        commission_amount: 0,
        othercharges: 0,
        totalAmount: 0,
        mobileno: '',
        passportNo: '',
        fullname: '',
        details: '',
        sale_price: 0,
        imagePath: '',
      });
      setVehicle(null);
      setSearchQuery('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: theme.spacing(4), px: theme.spacing(2) }}>
      <ToastContainer />
      <Typography variant="h4" component="h1" sx={{ fontWeight: theme.typography.fontWeightBold, mb: 4 }}>
        Add Sale Vehicle
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={12}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: theme.typography.fontWeightBold }}>
                Search Vehicle
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Vehicle Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Stack>
              {vehicle && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Vehicle Found:
                  </Typography>
                  <StyledTable>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vehicle ID</TableCell>
                        <TableCell>Chassis No</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>CC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{vehicle.vehicleId}</TableCell>
                        <TableCell>{vehicle.chassisNo}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>{vehicle.color}</TableCell>
                        <TableCell>{vehicle.cc}</TableCell>
                      </TableRow>
                    </TableBody>
                  </StyledTable>
                </Box>
              )}
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: theme.typography.fontWeightBold }}>
                Sale Vehicle Form
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Admin ID"
                      name="admin_id"
                      value={formData.admin_id}
                      disabled
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Vehicle Number"
                      name="vehicleNo"
                      value={formData.vehicleNo}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Sale Date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Sale Price"
                      name="sale_price"
                      value={formData.sale_price}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="number"
                      step="0.01"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Commission Amount"
                      name="commission_amount"
                      value={formData.commission_amount}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="number"
                      step="0.01"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Other Charges"
                      name="othercharges"
                      value={formData.othercharges}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="number"
                      step="0.01"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Total Amount"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="number"
                      step="0.01"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Mobile Number"
                      name="mobileno"
                      value={formData.mobileno}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Passport Number"
                      name="passportNo"
                      value={formData.passportNo}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Full Name"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Details"
                      name="details"
                      value={formData.details}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Upload Image"
                      name="imagePath"
                      type="file"
                      onChange={handleImageChange}
                      fullWidth
                      variant="outlined"
                      inputProps={{ accept: 'image/*' }}
                    />
                  </Grid>
                  {formData.imagePath && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${formData.imagePath}`}
                          alt="Uploaded Image"
                          style={{ maxWidth: '100%', height: 'auto', borderRadius: theme.shape.borderRadius }}
                        />
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      fullWidth
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Saving...' : 'Save Sale Vehicle'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Container>
  );
}