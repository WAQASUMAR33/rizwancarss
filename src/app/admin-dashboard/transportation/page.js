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
  MenuItem,
  Select,
} from "@mui/material";
import { Close as CloseIcon, Download as DownloadIcon } from "@mui/icons-material";

const TransportList = () => {
  const [transports, setTransports] = useState([]);
  const [filteredTransports, setFilteredTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [editedTransport, setEditedTransport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newImagePath, setNewImagePath] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(0.0067);

  async function getExchangeRate() {
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
  }

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rate = await getExchangeRate();
        setExchangeRate(rate);

        console.log("Fetching transports from API...");
        const response = await fetch("/api/admin/transport-management");
        if (!response.ok) throw new Error(`Failed to fetch transports: ${response.statusText}`);
        const result = await response.json();
        const fetchedTransports = result.data || [];
        setTransports(fetchedTransports);
        setFilteredTransports(fetchedTransports);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = transports.filter((transport) =>
      (transport.vehicleNo?.toString() || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transport.company?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
    setFilteredTransports(filtered);
    setCurrentPage(1);
  }, [searchQuery, transports]);

  useEffect(() => {
    if (selectedTransport) {
      setEditedTransport({ ...selectedTransport });
      setImagePreview(selectedTransport.imagePath || null);
      setNewImagePath(null);
    }
  }, [selectedTransport]);

  const totalRows = filteredTransports.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage);
  const paginatedTransports = filteredTransports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadImage = (imageUrl, fileName) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "transport-image.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Error downloading image:", err));
  };

  const handleFieldChange = (field, value) => {
    setEditedTransport((prev) => {
      const updatedTransport = { ...prev, [field]: value };
      if (field === "v_amount") {
        const v_amount = parseFloat(value) || 0;
        const v_10per = Number((v_amount * 0.1).toFixed(2));
        const v_amount_total = Number((v_amount + v_10per).toFixed(2));
        const v_amount_total_dollers = Number((v_amount_total * exchangeRate).toFixed(2));
        return {
          ...updatedTransport,
          v_amount: Number(v_amount.toFixed(2)),
          v_10per,
          v_amount_total,
          v_amount_total_dollers,
        };
      }
      if (field === "v_amount_total") {
        const v_amount_total = parseFloat(value) || 0;
        const v_amount_total_dollers = Number((v_amount_total * exchangeRate).toFixed(2));
        return {
          ...updatedTransport,
          v_amount_total: Number(v_amount_total.toFixed(2)),
          v_amount_total_dollers,
        };
      }
      if (field === "v_amount_total_dollers") {
        return {
          ...updatedTransport,
          v_amount_total_dollers: value ? Number(parseFloat(value).toFixed(2)) : "",
        };
      }
      if (field === "v_10per") {
        return {
          ...updatedTransport,
          v_10per: value ? Number(parseFloat(value).toFixed(2)) : "",
        };
      }
      return updatedTransport;
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

  const saveEditedTransport = async () => {
    if (!selectedTransport || !editedTransport) return;
    try {
      setIsSaving(true);
      const payload = {
        date: editedTransport.date ? new Date(editedTransport.date).toISOString() : null,
        deliveryDate: editedTransport.deliveryDate ? new Date(editedTransport.deliveryDate).toISOString() : null,
        port: editedTransport.port || "",
        company: editedTransport.company || "",
        v_amount: Number(parseFloat(editedTransport.v_amount || 0).toFixed(2)),
        v_10per: Number(parseFloat(editedTransport.v_10per || 0).toFixed(2)),
        v_amount_total: Number(parseFloat(editedTransport.v_amount_total || 0).toFixed(2)),
        v_amount_total_dollers: Number(parseFloat(editedTransport.v_amount_total_dollers || 0).toFixed(2)),
        imagePath: newImagePath || editedTransport.imagePath || "",
        paid_status: editedTransport.paid_status ,
        admin_id: 1,
        vehicleNo: selectedTransport.vehicleNo,
        id: editedTransport.id,
        createdAt: editedTransport.createdAt ? new Date(editedTransport.createdAt).toISOString() : null,
        updatedAt: editedTransport.updatedAt ? new Date(editedTransport.updatedAt).toISOString() : null,
        Admin: editedTransport.Admin,
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/admin/transport-management/${selectedTransport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(`Failed to update transport: ${errorData.error || response.statusText}`);
      }

      const updatedTransport = await response.json();
      if (updatedTransport.data.transport.paid_status === "Paid") {
        setTransports((prev) => prev.filter((t) => t.id !== selectedTransport.id));
        setFilteredTransports((prev) => prev.filter((t) => t.id !== selectedTransport.id));
      } else {
        setTransports((prev) =>
          prev.map((t) => (t.id === selectedTransport.id ? updatedTransport.data.transport : t))
        );
        setFilteredTransports((prev) =>
          prev.map((t) => (t.id === selectedTransport.id ? updatedTransport.data.transport : t))
        );
      }
      setSelectedTransport(null);
      alert("Transport updated successfully!");
    } catch (err) {
      console.error("Error saving transport:", err);
      alert(`Failed to update transport: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading transports...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body1" color="error" align="center">{error}</Typography>
    );
  }

  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
     
      <Box mb={2} position="relative">
        <TextField
          label="Search by Vehicle Number or Company"
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#F5F5F5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Chassis#</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Port</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Company</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Total (USD)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Payment Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransports.length > 0 ? (
              paginatedTransports.map((transport) => {
                const firstVehicle = transport.vehicles && transport.vehicles.length > 0 ? transport.vehicles[0] : null;
                return (
                  <TableRow key={transport.id} hover>
                    <TableCell>{transport.id || "N/A"}</TableCell>
                    <TableCell>{transport.date ? new Date(transport.date).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>{firstVehicle ? firstVehicle.chassisNo : "N/A"}</TableCell>
                    <TableCell>{transport.port || "N/A"}</TableCell>
                    <TableCell>{transport.company || "N/A"}</TableCell>   
                    <TableCell>{Number(transport.v_amount_total_dollers || 0).toFixed(2)}</TableCell>
                    <TableCell>{transport.paid_status}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setSelectedTransport(transport)}
                      >
                        View/Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">No transports found.</TableCell>
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
        open={!!selectedTransport}
        onClose={() => setSelectedTransport(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle sx={{ backgroundColor: "#F5F5F5" }}>
          Edit Transport Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedTransport(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransport && editedTransport && (
            <Box>
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Vehicle Details (Vehicle No: {selectedTransport.vehicleNo})
                </Typography>
                {selectedTransport.vehicles && selectedTransport.vehicles.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#F5F5F5" }}>
                        <TableRow>
                          <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>Vehicle ID</TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>Chassis No</TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>Maker</TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>Year</TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTransport.vehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell sx={{ border: "1px solid #ddd" }}>{vehicle.id || "N/A"}</TableCell>
                            <TableCell sx={{ border: "1px solid #ddd" }}>{vehicle.chassisNo || "N/A"}</TableCell>
                            <TableCell sx={{ border: "1px solid #ddd" }}>{vehicle.maker || "N/A"}</TableCell>
                            <TableCell sx={{ border: "1px solid #ddd" }}>{vehicle.year || "N/A"}</TableCell>
                            <TableCell sx={{ border: "1px solid #ddd" }}>{vehicle.status || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" align="center" mt={4}>
                    No vehicle found for this vehicle number.
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom mt={4}>
                Transport Details
              </Typography>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Transport ID
                  </Typography>
                  <TextField
                    value={editedTransport.id || ""}
                    onChange={(e) => handleFieldChange("id", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Date
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={editedTransport.date ? new Date(editedTransport.date).toISOString().slice(0, 16) : ""}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Delivery Date
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={editedTransport.deliveryDate ? new Date(editedTransport.deliveryDate).toISOString().slice(0, 16) : ""}
                    onChange={(e) => handleFieldChange("deliveryDate", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Port
                  </Typography>
                  <TextField
                    value={editedTransport.port || ""}
                    onChange={(e) => handleFieldChange("port", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Company
                  </Typography>
                  <TextField
                    value={editedTransport.company || ""}
                    onChange={(e) => handleFieldChange("company", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Amount (Yen)
                  </Typography>
                  <TextField
                    type="number"
                    value={editedTransport.v_amount || ""}
                    onChange={(e) => handleFieldChange("v_amount", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    10% Add (Yen)
                  </Typography>
                  <TextField
                    type="number"
                    value={editedTransport.v_10per || ""}
                    onChange={(e) => handleFieldChange("v_10per", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Total Amount (Yen)
                  </Typography>
                  <TextField
                    type="number"
                    value={editedTransport.v_amount_total || ""}
                    onChange={(e) => handleFieldChange("v_amount_total", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Total Dollars (USD)
                  </Typography>
                  <TextField
                    type="number"
                    value={editedTransport.v_amount_total_dollers || ""}
                    onChange={(e) => handleFieldChange("v_amount_total_dollers", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                    inputProps={{ step: "0.01" }}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Status
                  </Typography>
                  <Select
                    value={editedTransport.paid_status || "UnPaid"}
                    onChange={(e) => handleFieldChange("paid_status", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  >
                    <MenuItem value="UnPaid">UnPaid</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Added By
                  </Typography>
                  <TextField
                    value={editedTransport.Admin ? `${editedTransport.Admin.fullname} (${editedTransport.Admin.username})` : ""}
                    onChange={(e) => handleFieldChange("Admin", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Created At
                  </Typography>
                  <TextField
                    value={editedTransport.createdAt ? new Date(editedTransport.createdAt).toLocaleString() : ""}
                    onChange={(e) => handleFieldChange("createdAt", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Updated At
                  </Typography>
                  <TextField
                    value={editedTransport.updatedAt ? new Date(editedTransport.updatedAt).toLocaleString() : ""}
                    onChange={(e) => handleFieldChange("updatedAt", e.target.value)}
                    size="small"
                    fullWidth
                    disabled={isSaving}
                  />
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Image
                  </Typography>
                  <Box>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Transport Receipt Preview"
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
                    {editedTransport.imagePath && (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadImage(editedTransport.imagePath, `transport_${editedTransport.id}.jpg`)}
                        sx={{ mt: 1 }}
                        disabled={isSaving}
                      >
                        Download Original
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={saveEditedTransport}
            disabled={isSaving || (selectedTransport && selectedTransport.paid_status === "Paid")}
          >
            {isSaving ? <ClipLoader color="#ffffff" size={20} /> : "Save Changes"}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedTransport(null)}
            disabled={isSaving}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TransportList;