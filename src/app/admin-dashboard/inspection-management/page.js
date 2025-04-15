"use client";
import { useState, useEffect } from "react";
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
} from "@mui/material";
import { Close as CloseIcon, Download as DownloadIcon } from "@mui/icons-material";

const InspectionList = () => {
  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [editedInspection, setEditedInspection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newImagePath, setNewImagePath] = useState(null);

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
      const data = await response.json();
      if (!response.ok || !data.image_url) throw new Error("Failed to upload image");
      return `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  };

  const getExchangeRate = async () => {
    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}/pair/JPY/USD`
      );
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      const data = await response.json();
      return data.conversion_rate || 0.0067;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      return 0.0067;
    }
  };

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        console.log("Fetching inspections from API...");
        const response = await fetch("/api/admin/inspection");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch inspections: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        const fetchedInspections = result.data || [];
        console.log("Fetched inspections:", fetchedInspections);

        // Normalize data to handle missing fields
        const normalizedInspections = fetchedInspections.map((inspection) => {
          const normalized = {
            ...inspection,
            invoice_amount: inspection.invoice_amount || 0,
            invoice_tax: inspection.invoice_tax || 0,
            invoice_total: inspection.invoice_total || 0,
            invoice_amount_dollers: inspection.invoice_amount_dollers || 0,
            imagePath: inspection.imagePath || "",
            vehicle: inspection.vehicle || {},
            vehicleNo: String(inspection.vehicleNo ?? ""), // Ensure string
            vamount_doller: inspection.vamount_doller || 0,
            paidStatus: inspection.paidStatus || "UnPaid",
            invoiceno: inspection.invoiceno || "",
          };
          // Log for debugging
          if (typeof normalized.vehicleNo !== "string") {
            console.warn(`Non-string vehicleNo detected:`, inspection.vehicleNo);
          }
          return normalized;
        });
        setInspections(normalizedInspections);
        setFilteredInspections(normalizedInspections);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  useEffect(() => {
    const filtered = inspections.filter((inspection) =>
      String(inspection.vehicleNo ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.invoiceno || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInspections(filtered);
    setCurrentPage(1);
  }, [searchQuery, inspections]);

  useEffect(() => {
    if (selectedInspection) {
      setEditedInspection({ ...selectedInspection });
      setImagePreview(selectedInspection.imagePath || null);
      setNewImagePath(null);
    }
  }, [selectedInspection]);

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFieldChange = async (field, value) => {
    setEditedInspection((prev) => {
      const updatedInspection = { ...prev, [field]: value };
      if (field === "invoice_amount") {
        const invoice_amount = parseFloat(updatedInspection.invoice_amount) || 0;
        const invoice_tax = Number((invoice_amount * 0.10).toFixed(2));
        const invoice_total = Number((invoice_amount + invoice_tax).toFixed(2));
        getExchangeRate().then((rate) => {
          setEditedInspection((current) => ({
            ...current,
            invoice_tax,
            invoice_total,
            invoice_amount_dollers: Number((invoice_total * rate).toFixed(2)),
          }));
        });
        return {
          ...updatedInspection,
          invoice_tax,
          invoice_total,
        };
      }
      return updatedInspection;
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64Image = await convertToBase64(file);
        setImagePreview(base64Image);
        const uploadedImagePath = await uploadImageToServer(base64Image);
        if (uploadedImagePath) {
          setNewImagePath(uploadedImagePath);
        } else {
          alert("Failed to upload image. Using existing image path.");
        }
      } catch (error) {
        console.error("Error converting or uploading image:", error);
        alert("Error processing image. Please try again.");
      }
    }
  };

  const saveEditedInspection = async () => {
    if (!selectedInspection || !editedInspection) return;
    try {
      setIsSaving(true);
      if (!editedInspection.invoiceno) {
        throw new Error("Invoice number is required");
      }
      const payload = {
        date: editedInspection.date ? new Date(editedInspection.date).toISOString() : null,
        company: editedInspection.company || "",
        invoice_amount: Number(parseFloat(editedInspection.invoice_amount || 0).toFixed(2)),
        invoice_tax: Number(parseFloat(editedInspection.invoice_tax || 0).toFixed(2)),
        invoice_total: Number(parseFloat(editedInspection.invoice_total || 0).toFixed(2)),
        invoice_amount_dollers: Number(parseFloat(editedInspection.invoice_amount_dollers || 0).toFixed(2)),
        imagePath: newImagePath || editedInspection.imagePath || "",
        vehicleNo: parseInt(editedInspection.vehicleNo) || 0,
        vamount_doller: Number(parseFloat(editedInspection.vamount_doller || 0).toFixed(2)),
        admin_id: editedInspection.admin_id || 1,
        paidStatus: editedInspection.paidStatus || "UnPaid",
        id: editedInspection.id,
        invoiceno: editedInspection.invoiceno || "",
        createdAt: editedInspection.createdAt ? new Date(editedInspection.createdAt).toISOString() : null,
        updatedAt: new Date().toISOString(),
        vehicle: editedInspection.vehicle,
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/admin/inspection/${selectedInspection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(`Failed to update inspection: ${errorData.error || response.statusText}`);
      }

      const updatedInspection = await response.json();
      setInspections((prev) =>
        prev.map((i) => (i.id === selectedInspection.id ? { ...updatedInspection.data, vehicleNo: String(updatedInspection.data.vehicleNo) } : i))
      );
      setFilteredInspections((prev) =>
        prev.map((i) => (i.id === selectedInspection.id ? { ...updatedInspection.data, vehicleNo: String(updatedInspection.data.vehicleNo) } : i))
      );
      setSelectedInspection(null);
      alert("Inspection updated successfully!");
    } catch (err) {
      console.error("Error saving inspection:", err);
      alert(`Failed to update inspection: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading inspections...
          </Typography>
        </Box>
      </Box>
    );
  }
  if (error) {
    return (
      <Typography variant="body1" color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          Inspection List
        </Typography>
        <Box width="40%">
          <TextField
            label="Search by Vehicle Number, Company, or Invoice Number"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: searchQuery && (
                <IconButton onClick={() => setSearchQuery("")} edge="end">
                  <CloseIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Invoice No</TableCell>
              <TableCell>Invoice Amnt</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Total($)</TableCell>
              <TableCell>Vehicle No</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Paid Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInspections.length > 0 ? (
              paginatedInspections.map((inspection) => (
                <TableRow key={inspection.id} hover>
                  <TableCell>{inspection.invoiceno || inspection.id}</TableCell>
                  <TableCell>{inspection.date ? new Date(inspection.date).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>{inspection.company || "N/A"}</TableCell>
                  <TableCell>{inspection.invoiceno || "N/A"}</TableCell>
                  <TableCell>{Number(inspection.invoice_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(inspection.invoice_tax || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(inspection.invoice_total || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(inspection.invoice_amount_dollers || 0).toFixed(2)}</TableCell>
                  <TableCell>{inspection.vehicleNo || "N/A"}</TableCell>
                  <TableCell>${Number(inspection.vamount_doller || 0).toFixed(2)}</TableCell>
                  <TableCell>{inspection.paidStatus || "UnPaid"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      View/Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  No inspections found.
                </TableCell>
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
        open={!!selectedInspection}
        onClose={() => setSelectedInspection(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5" }}>
          Edit Inspection Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInspection(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInspection && editedInspection && (
            <Box>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Inspection ID</Typography>
                  <TextField
                    value={editedInspection.id || ""}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice Number</Typography>
                  <TextField
                    value={editedInspection.invoiceno || ""}
                    onChange={(e) => handleFieldChange("invoiceno", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <TextField
                    type="datetime-local"
                    value={editedInspection.date ? new Date(editedInspection.date).toISOString().slice(0, 16) : ""}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Company</Typography>
                  <TextField
                    value={editedInspection.company || ""}
                    onChange={(e) => handleFieldChange("company", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Paid Status</Typography>
                  <Select
                    value={editedInspection.paidStatus || "UnPaid"}
                    onChange={(e) => handleFieldChange("paidStatus", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  >
                    <MenuItem value="UnPaid">UnPaid</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice Amount (Yen)</Typography>
                  <TextField
                    type="number"
                    value={editedInspection.invoice_amount || ""}
                    onChange={(e) => handleFieldChange("invoice_amount", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Invoice Tax (Yen)</Typography>
                  <TextField
                    type="number"
                    value={editedInspection.invoice_tax || ""}
                    size="small"
                    fullWidth
                    disabled
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Total Amount (Yen)</Typography>
                  <TextField
                    type="number"
                    value={editedInspection.invoice_total || ""}
                    size="small"
                    fullWidth
                    disabled
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Total Amount ($)</Typography>
                  <TextField
                    type="number"
                    value={editedInspection.invoice_amount_dollers || ""}
                    size="small"
                    fullWidth
                    disabled
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vehicle Number</Typography>
                  <TextField
                    value={editedInspection.vehicleNo || ""}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vehicle Amount ($)</Typography>
                  <TextField
                    type="number"
                    value={editedInspection.vamount_doller || ""}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <TextField
                    value={editedInspection.admin_id || "N/A"}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <TextField
                    value={editedInspection.createdAt ? new Date(editedInspection.createdAt).toLocaleString() : ""}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <TextField
                    value={editedInspection.updatedAt ? new Date(editedInspection.updatedAt).toLocaleString() : ""}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Image</Typography>
                  <Box>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Inspection Receipt Preview"
                        style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain", borderRadius: "4px" }}
                      />
                    ) : (
                      <Typography variant="body1">No image selected</Typography>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSaving}
                      style={{ marginTop: "8px" }}
                    />
                    {editedInspection.imagePath && (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = editedInspection.imagePath;
                          link.download = `inspection_${editedInspection.id}.jpg`;
                          link.click();
                        }}
                        sx={{ mt: 1 }}
                        disabled={isSaving}
                      >
                        Download Original
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Box>

              {editedInspection.vehicle && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableRow>
                          <TableCell>Vehicle ID</TableCell>
                          <TableCell>Chassis No</TableCell>
                          <TableCell>Maker</TableCell>
                          <TableCell>Year</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell>Engine Type</TableCell>
                          <TableCell>Total Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{editedInspection.vehicle.id || "N/A"}</TableCell>
                          <TableCell>{editedInspection.vehicle.chassisNo || "N/A"}</TableCell>
                          <TableCell>{editedInspection.vehicle.maker || "N/A"}</TableCell>
                          <TableCell>{editedInspection.vehicle.year || "N/A"}</TableCell>
                          <TableCell>{editedInspection.vehicle.color || "N/A"}</TableCell>
                          <TableCell>{editedInspection.vehicle.engineType || "N/A"}</TableCell>
                          <TableCell>${Number(editedInspection.vamount_doller || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={saveEditedInspection}
            disabled={isSaving}
          >
            {isSaving ? <ClipLoader color="#ffffff" size={20} /> : "Save Changes"}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedInspection(null)}
            disabled={isSaving}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InspectionList;