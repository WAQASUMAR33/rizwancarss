"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import { Close as CloseIcon, Upload as UploadIcon } from "@mui/icons-material";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(null);
  const itemsPerPage = 5;
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editedInvoice, setEditedInvoice] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state for save loading
  const router = useRouter();

  useEffect(() => {
    const fetchExchangeRate = async () => {
      const data = await getCurrencies();
      if (data && data.conversion_rate) {
        setExchangeRate(data.conversion_rate);
      } else {
        setError("Failed to load exchange rate");
      }
    };
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/admin/invoice-management");
        if (!response.ok) throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        const result = await response.json();
        const fetchedInvoices = result.data || [];
        const normalizedInvoices = fetchedInvoices.map((invoice) => ({
          ...invoice,
          createdAt: invoice.createdAt || invoice.created_at,
          updatedAt: invoice.updatedAt || invoice.updated_at,
          amountDoller: invoice.amount_doller,
          amountYen: invoice.amountYen || invoice.amount_yen,
          vehicles: invoice.vehicles || [],
          imagePath: invoice.imagePath || "",
        }));
        setInvoices(normalizedInvoices);
        setFilteredInvoices(normalizedInvoices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) =>
      (invoice.number || "").toString().includes(searchQuery) ||
      (invoice.auctionHouse || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [searchQuery, invoices]);

  const calculateVehicleTotals = (vehicle) => {
    const fieldsToSum = [
      "auction_amount",
      "tenPercentAdd",
      "recycleAmount",
      "bidAmount",
      "bidAmount10per",
      "commissionAmount",
      "numberPlateTax",
    ];
    const totalYen = fieldsToSum.reduce((sum, field) => {
      return sum + (parseFloat(vehicle[field]) || 0);
    }, 0);
    const totalUSD = exchangeRate ? (totalYen * exchangeRate).toFixed(2) : 0;
    return { totalYen, totalUSD };
  };

  useEffect(() => {
    if (editedInvoice && editedInvoice.vehicles) {
      const updatedVehicles = editedInvoice.vehicles.map((vehicle) => {
        const { totalYen, totalUSD } = calculateVehicleTotals(vehicle);
        return {
          ...vehicle,
          totalAmount_yen: totalYen,
          totalAmount_dollers: totalUSD,
        };
      });
      setEditedInvoice((prev) => ({
        ...prev,
        vehicles: updatedVehicles,
        amountYen: updatedVehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_yen) || 0), 0),
        amountDoller: updatedVehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_dollers) || 0), 0),
      }));
    }
  }, [editedInvoice?.vehicles, exchangeRate]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadImageToServer = async (base64Image) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.image_url) throw new Error("No image URL returned from server");
      return `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const saveImage = async () => {
    if (!selectedInvoice || !newImage) return;
    try {
      setIsImageUploading(true);
      const base64Image = await convertToBase64(newImage);
      const imagePath = await uploadImageToServer(base64Image);
      const response = await fetch(`/api/admin/invoice-management/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath }),
      });
      if (!response.ok) throw new Error(`Failed to update image: ${response.statusText}`);
      const updatedInvoice = await response.json();
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, imagePath } : inv))
      );
      setFilteredInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, imagePath } : inv))
      );
      setSelectedInvoice((prev) => ({ ...prev, imagePath }));
      setEditedInvoice((prev) => ({ ...prev, imagePath }));
      setNewImage(null);
      setImagePreview(null);
      alert("Image updated successfully!");
    } catch (err) {
      alert(`Failed to update image: ${err.message}`);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehicleEditChange = (vehicleIndex, field, value) => {
    setEditedInvoice((prev) => {
      const updatedVehicles = [...prev.vehicles];
      updatedVehicles[vehicleIndex] = { ...updatedVehicles[vehicleIndex], [field]: value };
      return { ...prev, vehicles: updatedVehicles };
    });
  };

  const saveEditedInvoice = async () => {
    try {
      setIsSaving(true); // Start loading
      const response = await fetch(`/api/admin/invoice-management/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedInvoice),
      });
      if (!response.ok) throw new Error(`Failed to update invoice: ${response.statusText}`);
      const updatedInvoice = await response.json();
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? updatedInvoice.data : inv))
      );
      setFilteredInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? updatedInvoice.data : inv))
      );
      setSelectedInvoice(updatedInvoice.data);
      alert("Invoice updated successfully!");
    } catch (err) {
      alert(`Failed to update invoice: ${err.message}`);
    } finally {
      setIsSaving(false); // Stop loading
    }
  };

  async function getCurrencies() {
    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}/pair/JPY/USD`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch currency data");
      }
      const data = await response.json();
      console.log("Currency pair data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching currencies:", error);
      return null;
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading invoices...</Typography>
        </Box>
      </Box>
    );
  }
  if (error) {
    return <Typography variant="body1" color="error" align="center">{error}</Typography>;
  }

  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" sx={{ flexShrink: 0, mr: 2 }}>
          Invoices List
        </Typography>
        <TextField
          label="Search by Invoice Number or Auction House"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton onClick={() => setSearchQuery("")} edge="end">
                <CloseIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Number</TableCell>
              <TableCell>Amount (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Auction House</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((invoice, index) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.number}</TableCell>
                  <TableCell>${(invoice.amountDoller || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ color: invoice.status === "PAID" ? "green" : "red" }}>
                    {invoice.status}
                  </TableCell>
                  <TableCell>{invoice.auctionHouse}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setEditedInvoice({ ...invoice });
                        setNewImage(null);
                        setImagePreview(null);
                        setIsSaveButtonDisabled(invoice.status === "PAID");
                      }}
                      sx={{ mr: 1 }}
                    >
                      View/Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">No invoices found.</TableCell>
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
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          Invoice Details (Editable)
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInvoice(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && editedInvoice && (
            <Box>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice ID</Typography>
                  <Typography variant="body1">{editedInvoice.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <TextField
                    type="date"
                    value={editedInvoice.date.split("T")[0]}
                    onChange={(e) => handleEditChange("date", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Number</Typography>
                  <TextField
                    value={editedInvoice.number}
                    onChange={(e) => handleEditChange("number", e.target.value)}
                    fullWidth
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (USD)</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.amountDoller || ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (Yen)</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.amountYen || ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Auction House</Typography>
                  <TextField
                    value={editedInvoice.auctionHouse}
                    onChange={(e) => handleEditChange("auctionHouse", e.target.value)}
                    fullWidth
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.added_by}
                    onChange={(e) => handleEditChange("added_by", parseInt(e.target.value) || 0)}
                    fullWidth
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editedInvoice.status}
                      onChange={(e) => handleEditChange("status", e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="PAID">PAID</MenuItem>
                      <MenuItem value="UNPAID">UNPAID</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice Image</Typography>
                  {editedInvoice.imagePath ? (
                    <a href={editedInvoice.imagePath} download={`invoice-${editedInvoice.id}.png`}>
                      <img
                        src={editedInvoice.imagePath}
                        alt="Invoice"
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
                      />
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block" }}>
                        Click to download
                      </Typography>
                    </a>
                  ) : (
                    <Typography variant="body1">No image available</Typography>
                  )}
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<UploadIcon />}
                      sx={{ mr: 1 }}
                      disabled={isImageUploading}
                    >
                      {isImageUploading ? "Uploading..." : "Upload New Image"}
                      <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                    </Button>
                    {imagePreview && (
                      <Box mt={1} display="flex" alignItems="center" gap={2}>
                        <img
                          src={imagePreview}
                          alt="New Invoice Preview"
                          style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4 }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={saveImage}
                          disabled={isImageUploading}
                        >
                          {isImageUploading ? <ClipLoader color="#ffffff" size={20} /> : "Save Image"}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {editedInvoice.vehicles && editedInvoice.vehicles.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  {editedInvoice.vehicles.map((vehicle, idx) => (
                    <Paper key={vehicle.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Vehicle #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                          <TextField
                            value={vehicle.chassisNo || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "chassisNo", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Maker</Typography>
                          <TextField
                            value={vehicle.maker || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "maker", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Year</Typography>
                          <TextField
                            value={vehicle.year || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "year", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Color</Typography>
                          <TextField
                            value={vehicle.color || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "color", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Engine Type</Typography>
                          <TextField
                            value={vehicle.engineType || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "engineType", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Auction Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.auction_amount || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "auction_amount", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">10% Add</Typography>
                          <TextField
                            type="number"
                            value={vehicle.tenPercentAdd || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "tenPercentAdd", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Recycle Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.recycleAmount || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "recycleAmount", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Auction House</Typography>
                          <TextField
                            value={vehicle.auction_house || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "auction_house", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.bidAmount || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "bidAmount", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount 10%</Typography>
                          <TextField
                            type="number"
                            value={vehicle.bidAmount10per || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "bidAmount10per", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Commission Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.commissionAmount || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "commissionAmount", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Number Plate Tax</Typography>
                          <TextField
                            type="number"
                            value={vehicle.numberPlateTax || "0"}
                            onChange={(e) => handleVehicleEditChange(idx, "numberPlateTax", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Repair Charges</Typography>
                          <TextField
                            type="number"
                            value={vehicle.repairCharges || "0"}
                            onChange={(e) => handleVehicleEditChange(idx, "repairCharges", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (Yen)</Typography>
                          <TextField
                            type="number"
                            value={vehicle.totalAmount_yen || ""}
                            InputProps={{ readOnly: true }}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (USD)</Typography>
                          <TextField
                            type="number"
                            value={vehicle.totalAmount_dollers || ""}
                            InputProps={{ readOnly: true }}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Sending Port</Typography>
                          <TextField
                            value={vehicle.seaPort?.name || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "seaPort", { name: e.target.value })}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Additional Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.additionalAmount || "0"}
                            onChange={(e) => handleVehicleEditChange(idx, "additionalAmount", parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Document Required</Typography>
                          <FormControl fullWidth>
                            <InputLabel>Document Required</InputLabel>
                            <Select
                              value={vehicle.isDocumentRequired || ""}
                              onChange={(e) => handleVehicleEditChange(idx, "isDocumentRequired", e.target.value)}
                              label="Document Required"
                            >
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Document Receive Date</Typography>
                          <TextField
                            type="datetime-local"
                            value={vehicle.documentReceiveDate ? vehicle.documentReceiveDate.split(".")[0] : ""}
                            onChange={(e) => handleVehicleEditChange(idx, "documentReceiveDate", e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Ownership</Typography>
                          <FormControl fullWidth>
                            <InputLabel>Ownership</InputLabel>
                            <Select
                              value={vehicle.isOwnership || ""}
                              onChange={(e) => handleVehicleEditChange(idx, "isOwnership", e.target.value)}
                              label="Ownership"
                            >
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Ownership Date</Typography>
                          <TextField
                            type="datetime-local"
                            value={vehicle.ownershipDate ? vehicle.ownershipDate.split(".")[0] : ""}
                            onChange={(e) => handleVehicleEditChange(idx, "ownershipDate", e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <TextField
                            value={vehicle.status || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "status", e.target.value)}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Admin</Typography>
                          <TextField
                            value={vehicle.admin?.fullname || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "admin", { fullname: e.target.value })}
                            fullWidth
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <TextField
                            type="number"
                            value={vehicle.added_by || ""}
                            onChange={(e) => handleVehicleEditChange(idx, "added_by", parseInt(e.target.value) || 0)}
                            fullWidth
                          />
                        </Box>
                        {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
                          <Box sx={{ gridColumn: "span 4" }}>
                            <Typography variant="caption" color="textSecondary">Images</Typography>
                            <Box display="flex" gap={2} mt={1}>
                              {vehicle.vehicleImages.map((image, imgIdx) => (
                                <a
                                  key={imgIdx}
                                  href={image.imagePath}
                                  download={`vehicle-${vehicle.id}-image-${imgIdx + 1}.${image.imagePath.split('.').pop()}`}
                                >
                                  <img
                                    src={image.imagePath}
                                    alt={`Vehicle Image ${imgIdx + 1}`}
                                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
                                  />
                                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
                                    Download
                                  </Typography>
                                </a>
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ gridColumn: "span 4" }}>
                            <Typography variant="caption" color="textSecondary">Images</Typography>
                            <Typography variant="body1">No images available</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Tooltip
            title={isSaveButtonDisabled ? "Cannot save changes for paid invoices" : ""}
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                color="success"
                onClick={saveEditedInvoice}
                disabled={isImageUploading || isSaveButtonDisabled || isSaving} // Disable during saving
              >
                {isSaving ? <ClipLoader color="#ffffff" size={20} /> : "Save Changes"}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedInvoice(null)}
            disabled={isSaving} // Optionally disable the Close button during saving
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InvoicesList;