"use client";
import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  Autocomplete,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Delete as TrashIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";

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

export default function TransportBookingForm() {
  const [allVehicles, setAllVehicles] = useState([]);
  const [seaPorts, setSeaPorts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);

  const [transportData, setTransportData] = useState({
    date: "",
    deliveryDate: "",
    port: "",
    company: "",
    yardname: "",
    paymentStatus: "UnPaid",
    receiptImage: null,
    admin_id: null,
    vehicles: [],
  });
  const [totalAmountYen, setTotalAmountYen] = useState(0);
  const [tenPercentAdd, setTenPercentAdd] = useState(0);
  const [grandTotalYen, setGrandTotalYen] = useState(0);
  const [grandTotalDollars, setGrandTotalDollars] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const adminId = useSelector((state) => state.user.id);

  useEffect(() => {
    setTransportData((prev) => ({ ...prev, admin_id: adminId }));
  }, [adminId]);

  useEffect(() => {
    const fetchSeaPortsAndRateAndVehicles = async () => {
      try {
        const [portsResponse, rate, vehiclesResponse] = await Promise.all([
          fetch("/api/admin/sea_ports"),
          getExchangeRate(),
          fetch("/api/admin/vehicles"),
        ]);

        if (!portsResponse.ok) throw new Error("Failed to fetch sea ports");
        const portsData = await portsResponse.json();
        setSeaPorts(portsData.data || portsData);

        if (!vehiclesResponse.ok) throw new Error("Failed to fetch vehicles");
        const vehiclesData = await vehiclesResponse.json();
        const pendingVehicles = (vehiclesData.data || vehiclesData).filter(
          (vehicle) => vehicle.status === "Pending"
        );
        setAllVehicles(pendingVehicles);

        setExchangeRate(rate);
      } catch (err) {
        setError("Error fetching data: " + err.message);
      }
    };
    fetchSeaPortsAndRateAndVehicles();
  }, []);

  useEffect(() => {
    const totalYen = transportData.vehicles.reduce(
      (sum, vehicle) => sum + (parseFloat(vehicle.v_amount) || 0),
      0
    );
    const tenPercent = totalYen * 0.1;
    const grandTotal = totalYen + tenPercent;
    const totalDollars = grandTotal * (exchangeRate || 0.0067); // Fallback exchange rate

    setTotalAmountYen(totalYen || 0);
    setTenPercentAdd(tenPercent || 0);
    setGrandTotalYen(grandTotal || 0);
    setGrandTotalDollars(totalDollars || 0);
  }, [transportData.vehicles, exchangeRate]);

  const addToTransport = (vehicle) => {
    if (!vehicle) return;

    if (transportData.vehicles.some((v) => v.id === vehicle.id)) {
      setError("Vehicle already added to the list");
      return;
    }

    setTransportData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: vehicle.id,
          chassisNo: vehicle.chassisNo,
          v_amount: 0,
        },
      ],
    }));
    setError("");
  };

  const removeVehicle = (index) => {
    const updatedVehicles = transportData.vehicles.filter((_, i) => i !== index);
    setTransportData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleInputChange = (field, value) => {
    if ((field === "date" || field === "deliveryDate") && !value) {
      value = new Date().toISOString().split("T")[0];
    }
    setTransportData((prev) => ({ ...prev, [field]: value }));
    if (field === "receiptImage" && value) {
      const file = value[0];
      setImagePreview(file ? URL.createObjectURL(file) : null);
    }
  };

  const handleVehicleAmountChange = (index, value) => {
    const newValue = parseFloat(value) || 0;
    setTransportData((prev) => {
      const updatedVehicles = [...prev.vehicles];
      updatedVehicles[index] = { ...updatedVehicles[index], v_amount: newValue };
      return { ...prev, vehicles: updatedVehicles };
    });
  };

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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate required fields before submission
      if (!transportData.port || !transportData.company) {
        throw new Error("Port and Company are required fields");
      }

      if (transportData.vehicles.length === 0) {
        throw new Error("At least one vehicle is required");
      }

      let imagePath = "";
      if (transportData.receiptImage) {
        const base64Image = await convertToBase64(transportData.receiptImage[0]);
        imagePath = await uploadImageToServer(base64Image);
        if (!imagePath) throw new Error("Failed to upload receipt image");
      }

      const payload = {
        date: transportData.date || new Date().toISOString().split("T")[0],
        deliveryDate: transportData.deliveryDate || new Date().toISOString().split("T")[0],
        port: transportData.port,
        company: transportData.company,
        yardname: transportData.yardname,
        paymentStatus: transportData.paymentStatus,
        imagePath: imagePath || "",
        admin_id: transportData.admin_id || 1, // Fallback to 1 if admin_id is not set
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vehicles: transportData.vehicles.map((v) => ({
          id: v.id,
          vehicleNo: v.id,
          v_amount: parseFloat(v.v_amount) || 0,
          v_10per: tenPercentAdd || 0,
          v_amount_total: grandTotalYen || 0,
          v_amount_total_dollers: grandTotalDollars || 0,
        })),
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/transport-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.message || "Failed to submit transport data");
      }

      alert("Transport data submitted successfully!");
      setTransportData({
        date: "",
        deliveryDate: "",
        port: "",
        company: "",
        yardname: "",
        paymentStatus: "UnPaid",
        receiptImage: null,
        admin_id: adminId,
        vehicles: [],
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting transport data:", error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: "#FFFFFF" }}>
      <Typography variant="h4" gutterBottom>
        New Transport Booking
      </Typography>

      {/* Transport Details */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transport Details
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
          <TextField
            type="date"
            label="Transport Date"
            variant="outlined"
            value={transportData.date || new Date().toISOString().split("T")[0]}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <TextField
            type="date"
            label="Delivery Date"
            variant="outlined"
            value={transportData.deliveryDate || new Date().toISOString().split("T")[0]}
            onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <FormControl variant="outlined" fullWidth required>
            <InputLabel>Port</InputLabel>
            <Select
              value={transportData.port}
              onChange={(e) => handleInputChange("port", e.target.value)}
              label="Port"
            >
              <MenuItem value="">
                <em>Select Port</em>
              </MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.name}>
                  {port.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Yard Name"
            variant="outlined"
            value={transportData.yardname}
            onChange={(e) => handleInputChange("yardname", e.target.value)}
            fullWidth
            required
          />


          <TextField
            label="Company"
            variant="outlined"
            value={transportData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            fullWidth
            required
          />
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={transportData.paymentStatus}
              onChange={(e) => handleInputChange("paymentStatus", e.target.value)}
              label="Payment Status"
            >
              <MenuItem value="UnPaid">UnPaid</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box mt={2}>
          <TextField
            type="file"
            variant="outlined"
            onChange={(e) => handleInputChange("receiptImage", e.target.files)}
            inputProps={{ accept: "image/*" }}
            label="Upload Receipt"
            fullWidth
          />
          {imagePreview && (
            <Box mt={2}>
              <img
                src={imagePreview}
                alt="Receipt Preview"
                style={{ width: 128, height: 128, objectFit: "cover", borderRadius: 8 }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Select Vehicle */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Vehicle
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <Autocomplete
            options={allVehicles}
            getOptionLabel={(vehicle) => `${vehicle.chassisNo} - ${vehicle.maker} (${vehicle.year})`}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Vehicles (Chassis No, Maker, Year)"
                variant="outlined"
                fullWidth
                error={!!error}
                helperText={error}
              />
            )}
            renderOption={(props, vehicle) => (
              <ListItem
                {...props}
                sx={{
                  backgroundColor:
                    vehicle.status === "Pending" ? "#e8f5e9" : "#ffebee",
                }}
              >
                <ListItemText
                  primary={`${vehicle.chassisNo} - ${vehicle.maker} (${vehicle.year})`}
                  secondary={`Status: ${vehicle.status}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToTransport(vehicle);
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
          />
        </Box>
      </Paper>

      {/* Vehicles in Transport */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicles in Transport
        </Typography>
        {transportData.vehicles.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No vehicles added yet
          </Typography>
        ) : (
          <Box>
            {/* Grid Header */}
            <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" gap={2} sx={{ fontWeight: "bold", mb: 1 }}>
              <Typography variant="body1">Vehicle ID</Typography>
              <Typography variant="body1">Chassis No</Typography>
              <Typography variant="body1">Amount (Yen)</Typography>
              <Typography variant="body1">Action</Typography>
            </Box>
            {/* Grid Rows */}
            {transportData.vehicles.map((vehicle, index) => (
              <Box
                key={index}
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr 1fr"
                gap={2}
                alignItems="center"
                mb={1}
              >
                <Typography variant="body1">{vehicle.id}</Typography>
                <Typography variant="body1">{vehicle.chassisNo}</Typography>
                <TextField
                  type="number"
                  label="Amount (Yen)"
                  variant="outlined"
                  value={vehicle.v_amount || ""}
                  onChange={(e) => handleVehicleAmountChange(index, e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, step: "0.01" }}
                  required
                />
                <IconButton
                  color="error"
                  onClick={() => removeVehicle(index)}
                  aria-label="remove vehicle"
                >
                  <TrashIcon />
                </IconButton>
              </Box>
            ))}
            {/* Totals Section (Aligned in Single Line) */}
            <Box mt={3} display="flex" gap={2} alignItems="center">
              <TextField
                label="10% Add (Yen)"
                variant="outlined"
                value={tenPercentAdd.toFixed(2)}
                InputProps={{ readOnly: true }}
                sx={{ width: "150px" }}
              />
              <TextField
                label="Grand Total (Yen)"
                variant="outlined"
                value={grandTotalYen.toFixed(2)}
                InputProps={{ readOnly: true }}
                sx={{ width: "150px" }}
              />
              <TextField
                label="Grand Total (USD)"
                variant="outlined"
                value={grandTotalDollars.toFixed(2)}
                InputProps={{ readOnly: true }}
                sx={{ width: "150px" }}
              />
            </Box>
          </Box>
        )}
      </Paper>

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting || transportData.vehicles.length === 0}
        sx={{ mt: 2 }}
      >
        {submitting ? "Submitting..." : "Submit Transport"}
      </Button>
    </Box>
  );
}