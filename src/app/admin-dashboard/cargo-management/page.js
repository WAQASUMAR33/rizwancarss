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
  FormControl,
  InputLabel,
} from "@mui/material";
import { Close as CloseIcon, OpenInNew as OpenInNewIcon, Download as DownloadIcon } from "@mui/icons-material";

const CargoList = () => {
  const [cargoBookings, setCargoBookings] = useState([]);
  const [filteredCargoBookings, setFilteredCargoBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Fetch all cargo bookings on mount
  useEffect(() => {
    const fetchCargoBookings = async () => {
      try {
        console.log("Fetching cargo bookings from API...");
        const response = await fetch("/api/admin/cargo");
        if (!response.ok) {
          throw new Error(`Failed to fetch cargo bookings: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("API response:", result);

        const fetchedCargoBookings = result.data || [];
        setCargoBookings(fetchedCargoBookings);
        setFilteredCargoBookings(fetchedCargoBookings);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCargoBookings();
  }, []);

  // Filter cargo bookings based on search query
  useEffect(() => {
    const filtered = cargoBookings.filter((cargo) =>
      (cargo.bookingNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cargo.shipperName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCargoBookings(filtered);
    setCurrentPage(1);
  }, [searchQuery, cargoBookings]);

  // Initialize formData when cargo is selected
  useEffect(() => {
    if (selectedCargo) {
      setFormData({
        bookingNo: selectedCargo.bookingNo || "",
        shipperName: selectedCargo.shipperName || "",
        consignee: selectedCargo.consignee || "",
        actualShipper: selectedCargo.actualShipper || "",
        cyOpen: selectedCargo.cyOpen || "",
        etd: selectedCargo.etd ? new Date(selectedCargo.etd).toISOString().split("T")[0] : "",
        cyCutOff: selectedCargo.cyCutOff ? new Date(selectedCargo.cyCutOff).toISOString().split("T")[0] : "",
        eta: selectedCargo.eta ? new Date(selectedCargo.eta).toISOString().split("T")[0] : "",
        volume: selectedCargo.volume || 0,
        carrier: selectedCargo.carrier || "",
        vessel: selectedCargo.vessel || "",
        portOfLoading: selectedCargo.portOfLoading || "",
        portOfDischarge: selectedCargo.portOfDischarge || "",
        cargoMode: selectedCargo.cargoMode || "",
        placeOfIssue: selectedCargo.placeOfIssue || "",
        freightTerm: selectedCargo.freightTerm || "",
        descriptionOfGoods: selectedCargo.descriptionOfGoods || "",
        vanning_charges: selectedCargo.vanning_charges || 0,
        seal_amount: selectedCargo.seal_amount || 0,
        surrender_fee: selectedCargo.surrender_fee || 0,
        bl_fee: selectedCargo.bl_fee || 0,
        radiation_fee: selectedCargo.radiation_fee || 0,
        booking_service_charges: selectedCargo.booking_service_charges || 0,
        other_amount: selectedCargo.other_amount || 0,
        paid_status: selectedCargo.paid_status || "UnPaid",
        comments: selectedCargo.comments || "",
        totalAmount1: selectedCargo.totalAmount1 || 0,
        totalAmount1_dollars: selectedCargo.totalAmount1_dollars || 0,
        freight_amount: selectedCargo.freight_amount || 0,
        freight_amount_dollars: selectedCargo.freight_amount_dollars || 0,
        net_total_amount: selectedCargo.net_total_amount || 0,
        net_total_amount_dollars: selectedCargo.net_total_amount_dollars || 0,
        imagePath: selectedCargo.imagePath || "",
        added_by: selectedCargo.added_by || 0,
      });
      setFormErrors({});
    }
  }, [selectedCargo]);

  // Fetch detailed booking data
  const fetchBookingDetails = async (id) => {
    setDialogLoading(true);
    try {
      const response = await fetch(`/api/admin/cargo/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch booking details: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status) {
        console.log("Fetched booking details:", result.data);
        setSelectedCargo(result.data);
        setIsEditing(false);
      } else {
        throw new Error(result.error || "Failed to load booking details");
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    let errors = { ...formErrors };
    if (name === "bookingNo" && !value.trim()) {
      errors.bookingNo = "Booking number is required";
    } else if (name === "bookingNo") {
      delete errors.bookingNo;
    }
    if (name === "other_amount" && value < 0) {
      errors.other_amount = "Other amount cannot be negative";
    } else if (name === "other_amount") {
      delete errors.other_amount;
    }
    if (name === "paid_status" && !["Paid", "UnPaid"].includes(value)) {
      errors.paid_status = "Invalid status";
    } else if (name === "paid_status") {
      delete errors.paid_status;
    }
    setFormErrors(errors);
  };

  // Handle form submission
  const handleSave = async () => {
    // Validate
    let errors = {};
    if (!formData.bookingNo.trim()) {
      errors.bookingNo = "Booking number is required";
    }
    if (formData.other_amount < 0) {
      errors.other_amount = "Other amount cannot be negative";
    }
    if (!["Paid", "UnPaid"].includes(formData.paid_status)) {
      errors.paid_status = "Invalid status";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setDialogLoading(true);
      const response = await fetch(`/api/admin/cargo/${formData.bookingNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingNo: formData.bookingNo,
          shipperName: formData.shipperName,
          consignee: formData.consignee,
          actualShipper: formData.actualShipper,
          cyOpen: formData.cyOpen,
          etd: formData.etd,
          cyCutOff: formData.cyCutOff,
          eta: formData.eta,
          volume: parseInt(formData.volume) || 0,
          carrier: formData.carrier,
          vessel: formData.vessel,
          portOfLoading: formData.portOfLoading,
          portOfDischarge: formData.portOfDischarge,
          cargoMode: formData.cargoMode,
          placeOfIssue: formData.placeOfIssue,
          freightTerm: formData.freightTerm,
          descriptionOfGoods: formData.descriptionOfGoods,
          vanning_charges: parseFloat(formData.vanning_charges) || 0,
          seal_amount: parseFloat(formData.seal_amount) || 0,
          surrender_fee: parseFloat(formData.surrender_fee) || 0,
          bl_fee: parseFloat(formData.bl_fee) || 0,
          radiation_fee: parseFloat(formData.radiation_fee) || 0,
          booking_service_charges: parseFloat(formData.booking_service_charges) || 0,
          other_amount: parseFloat(formData.other_amount) || 0,
          paid_status: formData.paid_status,
          comments: formData.comments || "",
          totalAmount1: parseFloat(formData.totalAmount1) || 0,
          totalAmount1_dollars: parseFloat(formData.totalAmount1_dollars) || 0,
          freight_amount: parseFloat(formData.freight_amount) || 0,
          freight_amount_dollars: parseFloat(formData.freight_amount_dollars) || 0,
          net_total_amount: parseFloat(formData.net_total_amount) || 0,
          net_total_amount_dollars: parseFloat(formData.net_total_amount_dollars) || 0,
          imagePath: formData.imagePath,
          added_by: parseInt(formData.added_by) || 0,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.error || "Failed to update booking");
      }

      // Update local state
      const updatedCargo = result.data;
      setCargoBookings((prev) =>
        prev.map((cargo) => (cargo.bookingNo === updatedCargo.bookingNo ? updatedCargo : cargo))
      );
      setFilteredCargoBookings((prev) =>
        prev.map((cargo) => (cargo.bookingNo === updatedCargo.bookingNo ? updatedCargo : cargo))
      );
      setSelectedCargo(updatedCargo);
      setIsEditing(false);
      alert("Booking updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await fetch(`/api/admin/cargo/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status) {
        setCargoBookings(cargoBookings.filter((cargo) => cargo.id !== id));
        setFilteredCargoBookings(filteredCargoBookings.filter((cargo) => cargo.id !== id));
        setSelectedCargo(null);
        alert("Booking deleted successfully!");
      } else {
        throw new Error(result.error || "Deletion failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    }
  };

  // Handle update toggle
  const handleUpdate = () => {
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormErrors({});
    setFormData((prev) => ({
      ...prev,
      ...selectedCargo,
      etd: selectedCargo.etd ? new Date(selectedCargo.etd).toISOString().split("T")[0] : "",
      cyCutOff: selectedCargo.cyCutOff ? new Date(selectedCargo.cyCutOff).toISOString().split("T")[0] : "",
      eta: selectedCargo.eta ? new Date(selectedCargo.eta).toISOString().split("T")[0] : "",
      comments: selectedCargo.comments || "",
    }));
  };

  // Handle image download
  const handleDownloadImage = (imageUrl, fileName) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "image.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Download error:", err));
  };

  // Handle image load error
  const handleImageError = (e, section) => {
    console.error(`Image failed to load in ${section}:`, e.target.src);
    e.target.style.display = "none";
    e.target.nextSibling.style.display = "none";
    e.target.nextSibling.nextSibling.style.display = "none";
    e.target.parentElement.insertBefore(
      document.createTextNode("Image not available"),
      e.target.nextSibling
    );
  };

  const totalPages = Math.ceil(filteredCargoBookings.length / itemsPerPage);
  const paginatedCargoBookings = filteredCargoBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading cargo bookings...
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Cargo Bookings List
        </Typography>
        <Box sx={{ width: { xs: "100%", sm: "50%" }, mt: { xs: 2, sm: 0 } }}>
          <TextField
            label="Search by Booking Number or Shipper Name"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={
              searchQuery && {
                endAdornment: (
                  <IconButton onClick={() => setSearchQuery("")} edge="end">
                    <CloseIcon />
                  </IconButton>
                ),
              }
            }
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "whitesmoke" }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Booking No</TableCell>
              <TableCell>Shipper Name</TableCell>
              <TableCell>Consignee</TableCell>
              <TableCell>Loading Port</TableCell>
              <TableCell>Discharge Port</TableCell>
              <TableCell>Freight Term</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCargoBookings.length > 0 ? (
              paginatedCargoBookings.map((cargo, index) => (
                <TableRow key={cargo.id} hover>
                  <TableCell>{cargo.id}</TableCell>
                  <TableCell>{cargo.bookingNo}</TableCell>
                  <TableCell>{cargo.shipperName}</TableCell>
                  <TableCell>{cargo.consignee}</TableCell>
                  <TableCell>{cargo.portOfLoading}</TableCell>
                  <TableCell>{cargo.portOfDischarge}</TableCell>
                  <TableCell>{cargo.freightTerm}</TableCell>
                  <TableCell>{cargo.net_total_amount_dollars}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => fetchBookingDetails(cargo.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No cargo bookings found.
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
        open={!!selectedCargo}
        onClose={() => {
          setSelectedCargo(null);
          setIsEditing(false);
          setFormErrors({});
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle sx={{ bgcolor: "whitesmoke" }}>
          {isEditing ? "Edit Cargo Booking" : "Cargo Booking Details"}
          <IconButton
            aria-label="close"
            onClick={() => {
              setSelectedCargo(null);
              setIsEditing(false);
              setFormErrors({});
            }}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <ClipLoader color="#3b82f6" size={50} />
            </Box>
          ) : selectedCargo ? (
            <Box>
              {/* Container Booking Details */}
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                {[
                  { label: "Booking ID", name: "id", disabled: true, viewOnly: true },
                  { label: "Booking No", name: "bookingNo", required: true },
                  { label: "Shipper Name", name: "shipperName" },
                  { label: "Consignee", name: "consignee" },
                  { label: "Actual Shipper", name: "actualShipper" },
                  { label: "CY Open", name: "cyOpen" },
                  { label: "ETD", name: "etd", type: "date" },
                  { label: "CY Cut Off", name: "cyCutOff", type: "date" },
                  { label: "ETA", name: "eta", type: "date" },
                  { label: "Volume", name: "volume", type: "number" },
                  { label: "Carrier", name: "carrier" },
                  { label: "Vessel", name: "vessel" },
                  { label: "Port of Loading", name: "portOfLoading" },
                  { label: "Port of Discharge", name: "portOfDischarge" },
                  { label: "Cargo Mode", name: "cargoMode" },
                  { label: "Place of Issue", name: "placeOfIssue" },
                  { label: "Freight Term", name: "freightTerm" },
                  { label: "Description of Goods", name: "descriptionOfGoods", multiline: true },
                  { label: "Vanning Charges", name: "vanning_charges", type: "number" },
                  { label: "Seal Amount", name: "seal_amount", type: "number" },
                  { label: "Surrender Fee", name: "surrender_fee", type: "number" },
                  { label: "BL Fee", name: "bl_fee", type: "number" },
                  { label: "Radiation Fee", name: "radiation_fee", type: "number" },
                  { label: "Booking Service Charges", name: "booking_service_charges", type: "number" },
                  { label: "Other Amount", name: "other_amount", type: "number", required: true },
                  {
                    label: "Paid Status",
                    name: "paid_status",
                    type: "select",
                    options: ["Paid", "UnPaid"],
                    required: true,
                  },
                  { label: "Comments", name: "comments", multiline: true },
                  { label: "Total Amount 1", name: "totalAmount1", type: "number" },
                  { label: "Total Amount 1 (USD)", name: "totalAmount1_dollars", type: "number" },
                  { label: "Freight Amount", name: "freight_amount", type: "number" },
                  { label: "Freight Amount (USD)", name: "freight_amount_dollars", type: "number" },
                  { label: "Net Total Amount", name: "net_total_amount", type: "number" },
                  { label: "Net Total Amount (USD)", name: "net_total_amount_dollars", type: "number" },
                  { label: "Image Path", name: "imagePath" },
                  { label: "Added By", name: "added_by", type: "number" },
                  { label: "Created At", name: "createdAt", disabled: true, viewOnly: true },
                  { label: "Updated At", name: "updatedAt", disabled: true, viewOnly: true },
                ].map((field) =>
                  isEditing && !field.viewOnly ? (
                    <Paper elevation={1} sx={{ p: 2 }} key={field.name}>
                      {field.type === "select" ? (
                        <FormControl fullWidth error={!!formErrors[field.name]}>
                          <InputLabel>{field.label}</InputLabel>
                          <Select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            label={field.label}
                            required={field.required}
                          >
                            {field.options.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                          {formErrors[field.name] && (
                            <Typography variant="caption" color="error">
                              {formErrors[field.name]}
                            </Typography>
                          )}
                        </FormControl>
                      ) : (
                        <TextField
                          label={field.label}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleInputChange}
                          type={field.type || "text"}
                          fullWidth
                          required={field.required}
                          disabled={field.disabled}
                          multiline={field.multiline}
                          rows={field.multiline ? 4 : 1}
                          error={!!formErrors[field.name]}
                          helperText={formErrors[field.name]}
                          variant="outlined"
                        />
                      )}
                    </Paper>
                  ) : (
                    <Paper elevation={1} sx={{ p: 2 }} key={field.name}>
                      <Typography variant="caption" color="textSecondary">
                        {field.label}
                      </Typography>
                      <Typography variant="body1">
                        {field.name === "imagePath" && selectedCargo[field.name] ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <img
                              src={selectedCargo[field.name]}
                              alt={`Booking ${selectedCargo.bookingNo}`}
                              style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain" }}
                              onError={(e) => handleImageError(e, "Container Booking")}
                            />
                            <IconButton
                              size="small"
                              href={selectedCargo[field.name]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDownloadImage(
                                  selectedCargo[field.name],
                                  `booking-${selectedCargo.id}.jpg`
                                )
                              }
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : field.name.includes("At") ? (
                          new Date(selectedCargo[field.name]).toLocaleString()
                        ) : (
                          selectedCargo[field.name] || "N/A"
                        )}
                      </Typography>
                    </Paper>
                  )
                )}
              </Box>

              {/* Container Details (View Only) */}
              {selectedCargo.containerDetails && selectedCargo.containerDetails.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Container Details
                  </Typography>
                  {selectedCargo.containerDetails.map((detail, idx) => (
                    <Paper key={detail.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Container Detail #{idx + 1}
                      </Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Consignee Name
                          </Typography>
                          <Typography variant="body1">{detail.consigneeName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Notify Party
                          </Typography>
                          <Typography variant="body1">{detail.notifyParty}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Shipper Per
                          </Typography>
                          <Typography variant="body1">{detail.shipperPer}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Booking No
                          </Typography>
                          <Typography variant="body1">{detail.bookingNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Note
                          </Typography>
                          <Typography variant="body1">{detail.note}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Image Path
                          </Typography>
                          <Typography variant="body1">
                            {detail.imagePath ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <img
                                  src={detail.imagePath}
                                  alt={`Container ${detail.id}`}
                                  style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain" }}
                                  onError={(e) => handleImageError(e, "Container Detail")}
                                />
                                <IconButton
                                  size="small"
                                  href={detail.imagePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDownloadImage(detail.imagePath, `container-${detail.id}.jpg`)
                                  }
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              "N/A"
                            )}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Added By
                          </Typography>
                          <Typography variant="body1">{detail.added_by}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Created At
                          </Typography>
                          <Typography variant="body1">
                            {new Date(detail.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Updated At
                          </Typography>
                          <Typography variant="body1">
                            {new Date(detail.updatedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Container Item Details */}
                      {detail.containerItems && detail.containerItems.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Container Items
                          </Typography>
                          <TableContainer component={Paper} sx={{ bgcolor: "#f5f5f5" }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "whitesmoke" }}>
                                <TableRow>
                                  <TableCell>Item No</TableCell>
                                  <TableCell>Vehicle ID</TableCell>
                                  <TableCell>Chassis No</TableCell>
                                  <TableCell>Year</TableCell>
                                  <TableCell>Color</TableCell>
                                  <TableCell>CC</TableCell>
                                  <TableCell>Amount</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.containerItems.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.itemNo}</TableCell>
                                    <TableCell>{item.vehicleId}</TableCell>
                                    <TableCell>{item.chassisNo}</TableCell>
                                    <TableCell>{item.year}</TableCell>
                                    <TableCell>{item.color}</TableCell>
                                    <TableCell>{item.cc}</TableCell>
                                    <TableCell>$ {item.amount}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No details available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCargo && (
            <>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={dialogLoading || Object.keys(formErrors).length > 0}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={dialogLoading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdate}
                    disabled={dialogLoading}
                  >
                    Update
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDelete(selectedCargo.id)}
                    disabled={dialogLoading}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedCargo(null)}
                    disabled={dialogLoading}
                  >
                    Close
                  </Button>
                </>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CargoList;