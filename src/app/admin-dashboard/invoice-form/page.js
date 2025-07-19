"use client";
import { useState, useEffect, useMemo } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [manualEdits, setManualEdits] = useState({});
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
          amountDoller: invoice.amount_doller || 0,
          amountYen: invoice.amountYen || invoice.amount_yen || 0,
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
      "repairCharges",
      "additionalAmount",
    ];
    const totalYen = fieldsToSum.reduce((sum, field) => {
      return sum + (parseFloat(vehicle[field]) || 0);
    }, 0);
    const totalUSD = exchangeRate ? (totalYen * exchangeRate).toFixed(2) : 0;
    return { totalYen, totalUSD: parseFloat(totalUSD) || 0 };
  };

  const getInvoiceTotals = useMemo(() => {
    if (!editedInvoice?.vehicles) return { totalYen: 0, totalUSD: 0 };
    const totalYen = editedInvoice.vehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_yen) || 0), 0);
    const totalUSD = editedInvoice.vehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_dollers) || 0), 0);
    return { totalYen, totalUSD };
  }, [editedInvoice?.vehicles]);

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
    setEditedInvoice((prev) => ({
      ...prev,
      [field]: field.includes("amount") ? (value === "" ? "" : parseFloat(value) || 0) : field === "added_by" ? parseInt(value) || 0 : value,
    }));
    if (field.includes("amount")) {
      setManualEdits((prev) => ({ ...prev, [field]: true }));
    }
  };

  const handleVehicleEditChange = (vehicleIndex, field, value) => {
    setEditedInvoice((prev) => {
      const updatedVehicles = prev.vehicles.map((vehicle, idx) => {
        if (idx !== vehicleIndex) return vehicle;
        const updatedVehicle = {
          ...vehicle,
          [field]: field.includes("Amount") || field === "added_by" ? (value === "" ? "" : parseFloat(value) || 0) : value,
        };
        if (
          field.includes("Amount") &&
          !field.includes("totalAmount") &&
          !manualEdits[`vehicle_${vehicleIndex}_totalAmount_yen`] &&
          !manualEdits[`vehicle_${vehicleIndex}_totalAmount_dollers`]
        ) {
          const { totalYen, totalUSD } = calculateVehicleTotals(updatedVehicle);
          updatedVehicle.totalAmount_yen = totalYen;
          updatedVehicle.totalAmount_dollers = totalUSD;
        }
        return updatedVehicle;
      });
      const totalYen = updatedVehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_yen) || 0), 0);
      const totalUSD = updatedVehicles.reduce((sum, v) => sum + (parseFloat(v.totalAmount_dollers) || 0), 0);
      return {
        ...prev,
        vehicles: updatedVehicles,
        amountYen: manualEdits.amountYen ? prev.amountYen : totalYen,
        amountDoller: manualEdits.amountDoller ? prev.amountDoller : totalUSD,
      };
    });
    if (field.includes("totalAmount")) {
      setManualEdits((prev) => ({ ...prev, [`vehicle_${vehicleIndex}_${field}`]: true }));
    }
  };

  const saveEditedInvoice = async () => {
    const fieldsToSum = [
      "auction_amount",
      "tenPercentAdd",
      "recycleAmount",
      "bidAmount",
      "bidAmount10per",
      "commissionAmount",
      "numberPlateTax",
      "repairCharges",
      "additionalAmount",
      "totalAmount_yen",
      "totalAmount_dollers",
    ];
    const hasInvalidFields = editedInvoice.vehicles.some((v) =>
      fieldsToSum.some((field) => v[field] !== "" && isNaN(parseFloat(v[field])))
    );
    if (hasInvalidFields || (editedInvoice.amountYen !== "" && isNaN(parseFloat(editedInvoice.amountYen))) || (editedInvoice.amountDoller !== "" && isNaN(parseFloat(editedInvoice.amountDoller)))) {
      alert("Please correct invalid numeric fields");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/invoice-management/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editedInvoice,
          vehicles: editedInvoice.vehicles.map((v) => ({
            ...v,
            totalAmount_yen: parseFloat(v.totalAmount_yen) || 0,
            totalAmount_dollers: parseFloat(v.totalAmount_dollers) || 0,
          })),
          amountYen: parseFloat(editedInvoice.amountYen) || 0,
          amountDoller: parseFloat(editedInvoice.amountDoller) || 0,
        }),
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
      setIsSaving(false);
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
      return data;
    } catch (error) {
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
                        setManualEdits({});
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
                    value={editedInvoice.date ? editedInvoice.date.split("T")[0] : ""}
                    onChange={(e) => handleEditChange("date", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Number</Typography>
                  <TextField
                    value={editedInvoice.number ?? ""}
                    onChange={(e) => handleEditChange("number", e.target.value)}
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (USD)</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.amountDoller ?? ""}
                    onChange={(e) => handleEditChange("amountDoller", e.target.value)}
                    fullWidth
                    disabled={isSaving}
                    error={editedInvoice.amountDoller !== "" && isNaN(parseFloat(editedInvoice.amountDoller))}
                    helperText={editedInvoice.amountDoller !== "" && isNaN(parseFloat(editedInvoice.amountDoller)) ? "Invalid number" : ""}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Amount (Yen)</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.amountYen ?? ""}
                    onChange={(e) => handleEditChange("amountYen", e.target.value)}
                    fullWidth
                    disabled={isSaving}
                    error={editedInvoice.amountYen !== "" && isNaN(parseFloat(editedInvoice.amountYen))}
                    helperText={editedInvoice.amountYen !== "" && isNaN(parseFloat(editedInvoice.amountYen)) ? "Invalid number" : ""}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Auction House</Typography>
                  <TextField
                    value={editedInvoice.auctionHouse ?? ""}
                    onChange={(e) => handleEditChange("auctionHouse", e.target.value)}
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <TextField
                    type="number"
                    value={editedInvoice.added_by ?? ""}
                    onChange={(e) => handleEditChange("added_by", parseInt(e.target.value) || 0)}
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <FormControl fullWidth disabled={isSaving}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editedInvoice.status ?? ""}
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
                      disabled={isImageUploading || isSaving}
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
                          disabled={isImageUploading || isSaving}
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
                    <Paper key={vehicle.id || idx} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Vehicle #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                          <TextField
                            value={vehicle.chassisNo ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "chassisNo", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Maker</Typography>
                          <TextField
                            value={vehicle.maker ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "maker", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Year</Typography>
                          <TextField
                            value={vehicle.year ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "year", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Color</Typography>
                          <TextField
                            value={vehicle.color ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "color", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Engine Type</Typography>
                          <TextField
                            value={vehicle.engineType ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "engineType", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>


                          <Box>
                          <Typography variant="caption" color="textSecondary">Auction House</Typography>
                          <TextField
                            value={vehicle.auction_house ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "auction_house", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Auction Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.auction_amount ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "auction_amount", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.auction_amount !== "" && isNaN(parseFloat(vehicle.auction_amount))}
                            helperText={vehicle.auction_amount !== "" && isNaN(parseFloat(vehicle.auction_amount)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">10% Add</Typography>
                          <TextField
                            type="number"
                            value={vehicle.tenPercentAdd ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "tenPercentAdd", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.tenPercentAdd !== "" && isNaN(parseFloat(vehicle.tenPercentAdd))}
                            helperText={vehicle.tenPercentAdd !== "" && isNaN(parseFloat(vehicle.tenPercentAdd)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Recycle Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.recycleAmount ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "recycleAmount", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.recycleAmount !== "" && isNaN(parseFloat(vehicle.recycleAmount))}
                            helperText={vehicle.recycleAmount !== "" && isNaN(parseFloat(vehicle.recycleAmount)) ? "Invalid number" : ""}
                          />
                        </Box>
                      
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.bidAmount ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "bidAmount", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.bidAmount !== "" && isNaN(parseFloat(vehicle.bidAmount))}
                            helperText={vehicle.bidAmount !== "" && isNaN(parseFloat(vehicle.bidAmount)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Bid Amount 10%</Typography>
                          <TextField
                            type="number"
                            value={vehicle.bidAmount10per ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "bidAmount10per", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.bidAmount10per !== "" && isNaN(parseFloat(vehicle.bidAmount10per))}
                            helperText={vehicle.bidAmount10per !== "" && isNaN(parseFloat(vehicle.bidAmount10per)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Commission Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.commissionAmount ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "commissionAmount", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.commissionAmount !== "" && isNaN(parseFloat(vehicle.commissionAmount))}
                            helperText={vehicle.commissionAmount !== "" && isNaN(parseFloat(vehicle.commissionAmount)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Number Plate Tax</Typography>
                          <TextField
                            type="number"
                            value={vehicle.numberPlateTax ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "numberPlateTax", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.numberPlateTax !== "" && isNaN(parseFloat(vehicle.numberPlateTax))}
                            helperText={vehicle.numberPlateTax !== "" && isNaN(parseFloat(vehicle.numberPlateTax)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Repair Charges</Typography>
                          <TextField
                            type="number"
                            value={vehicle.repairCharges ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "repairCharges", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.repairCharges !== "" && isNaN(parseFloat(vehicle.repairCharges))}
                            helperText={vehicle.repairCharges !== "" && isNaN(parseFloat(vehicle.repairCharges)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (Yen)</Typography>
                          <TextField
                            type="number"
                            value={vehicle.totalAmount_yen ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "totalAmount_yen", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.totalAmount_yen !== "" && isNaN(parseFloat(vehicle.totalAmount_yen))}
                            helperText={vehicle.totalAmount_yen !== "" && isNaN(parseFloat(vehicle.totalAmount_yen)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount (USD)</Typography>
                          <TextField
                            type="number"
                            value={vehicle.totalAmount_dollers ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "totalAmount_dollers", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.totalAmount_dollers !== "" && isNaN(parseFloat(vehicle.totalAmount_dollers))}
                            helperText={vehicle.totalAmount_dollers !== "" && isNaN(parseFloat(vehicle.totalAmount_dollers)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Sending Port</Typography>
                          <TextField
                            value={vehicle.seaPort?.name ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "seaPort", { name: e.target.value })}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Additional Amount</Typography>
                          <TextField
                            type="number"
                            value={vehicle.additionalAmount ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "additionalAmount", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                            error={vehicle.additionalAmount !== "" && isNaN(parseFloat(vehicle.additionalAmount))}
                            helperText={vehicle.additionalAmount !== "" && isNaN(parseFloat(vehicle.additionalAmount)) ? "Invalid number" : ""}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Document Required</Typography>
                          <FormControl fullWidth disabled={isSaving}>
                            <InputLabel>Document Required</InputLabel>
                            <Select
                              value={vehicle.isDocumentRequired ?? ""}
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
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Ownership</Typography>
                          <FormControl fullWidth disabled={isSaving}>
                            <InputLabel>Ownership</InputLabel>
                            <Select
                              value={vehicle.isOwnership ?? ""}
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
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <TextField
                            value={vehicle.status ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "status", e.target.value)}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Admin</Typography>
                          <TextField
                            value={vehicle.admin?.fullname ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "admin", { fullname: e.target.value })}
                            fullWidth
                            disabled={isSaving}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <TextField
                            type="number"
                            value={vehicle.added_by ?? ""}
                            onChange={(e) => handleVehicleEditChange(idx, "added_by", parseInt(e.target.value) || 0)}
                            fullWidth
                            disabled={isSaving}
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
                disabled={isImageUploading || isSaveButtonDisabled || isSaving}
              >
                {isSaving ? <ClipLoader color="#ffffff" size={20} /> : "Save Changes"}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedInvoice(null)}
            disabled={isSaving}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InvoicesList;
