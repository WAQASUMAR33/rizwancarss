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
    return data.conversion_rate || 0.0067; // Fallback rate if API fails
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 0.0067; // Default fallback rate (approx JPY to USD)
  }
}

export default function TransportBookingForm() {
  const [allVehicles, setAllVehicles] = useState([]); // Store all vehicles for dropdown
  const [seaPorts, setSeaPorts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);

  const [transportData, setTransportData] = useState({
    date: "",
    deliveryDate: "",
    invoiceno: "",
    port: "",
    company: "",
    transportAmount: 0,
    receiptImage: null,
    admin_id: null,
    vehicles: [],
  });
  const [totalAmountYen, setTotalAmountYen] = useState(0);
  const [tenPercentAdd, setTenPercentAdd] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDollars, setTotalDollars] = useState(0);
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
        // Filter vehicles to only include those with "Pending" status
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
    const transportAmountYen = parseFloat(transportData.transportAmount) || 0;
    const tenPercent = transportAmountYen ;
    const totalWithTenPercent = transportAmountYen + tenPercent;
    const totalInDollars = totalWithTenPercent * exchangeRate;

    setTotalAmountYen(transportAmountYen);
    setTenPercentAdd(tenPercent);
    setTotalAmount(totalWithTenPercent);
    setTotalDollars(totalInDollars);

    // Recalculate per vehicle amount based on custom values or total if no custom values
    const customTotalDollars = transportData.vehicles.reduce((sum, vehicle) => sum + (parseFloat(vehicle.totaldollers) || 0), 0);
    const vehicleCount = transportData.vehicles.length;
    const defaultPerVehicleDollarAmount = vehicleCount > 0 ? totalInDollars / vehicleCount : 0;
    transportData.vehicles.forEach((vehicle, index) => {
      if (!vehicle.totaldollers || vehicle.totaldollers === 0) {
        setTransportData((prev) => {
          const updatedVehicles = [...prev.vehicles];
          updatedVehicles[index] = { ...updatedVehicles[index], totaldollers: defaultPerVehicleDollarAmount };
          return { ...prev, vehicles: updatedVehicles };
        });
      }
    });
  }, [transportData.transportAmount, transportData.vehicles, exchangeRate]);

  const addToTransport = (vehicle) => {
    if (!vehicle) return;

    // Check if vehicle is already added
    if (transportData.vehicles.some((v) => v.id === vehicle.id)) {
      setError("Vehicle already added to the list");
      return;
    }

    // Calculate initial share based on totalDollars
    const vehicleCount = transportData.vehicles.length + 1;
    const initialShare = vehicleCount > 0 ? totalDollars / vehicleCount : 0;

    setTransportData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: vehicle.id,
          chassisNo: vehicle.chassisNo,
          totaldollers: initialShare, // Initial share, editable later
        },
      ],
    }));
    setError(""); // Clear any previous error
  };

  const removeVehicle = (index) => {
    const updatedVehicles = transportData.vehicles.filter((_, i) => i !== index);
    setTransportData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleInputChange = (field, value) => {
    // Ensure date fields are valid or default to current date
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
      updatedVehicles[index] = { ...updatedVehicles[index], totaldollers: newValue };
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

      let imagePath = "";
      if (transportData.receiptImage) {
        const base64Image = await convertToBase64(transportData.receiptImage[0]);
        imagePath = await uploadImageToServer(base64Image);
        if (!imagePath) throw new Error("Failed to upload receipt image");
      }

      const payload = {
        date: transportData.date,
        deliveryDate: transportData.deliveryDate,
        invoiceno: transportData.invoiceno || "",
        port: transportData.port,
        company: transportData.company,
        amount: totalAmountYen,
        tenPercentAdd: tenPercentAdd,
        totalamount: totalAmount,
        totaldollers: transportData.vehicles.reduce((sum, vehicle) => sum + (parseFloat(vehicle.totaldollers) || 0), 0),
        imagePath: imagePath || "",
        admin_id: transportData.admin_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vehicles: transportData.vehicles.map((v) => ({
          id: v.id,
          vehicleNo: v.chassisNo,
          totaldollers: v.totaldollers,
        })),
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/transport-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : { message: "No response body" };
        } catch (e) {
          throw new Error(`Failed to parse server response: ${responseText || "Empty response"}`);
        }
        throw new Error(errorData.message || "Failed to submit transport data");
      }

      alert("Transport data submitted successfully!");
      setTransportData({
        date: "",
        deliveryDate: "",
        invoiceno: "",
        port: "",
        company: "",
        transportAmount: 0,
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
        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
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
          <TextField
            label="Invoice Number"
            variant="outlined"
            value={transportData.invoiceno}
            onChange={(e) => handleInputChange("invoiceno", e.target.value)}
            fullWidth
          />
          <FormControl variant="outlined" fullWidth>
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
            label="Company"
            variant="outlined"
            value={transportData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Transport Amount (Yen)"
            variant="outlined"
            value={transportData.transportAmount}
            onChange={(e) => handleInputChange("transportAmount", e.target.value)}
            fullWidth
          />
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
        {/* Invoice Totals */}
        <Box mt={2} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <TextField
            label="Transport Amount (Yen)"
            variant="outlined"
            value={totalAmountYen.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="10% Add (Yen)"
            variant="outlined"
            value={tenPercentAdd.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Grand Total (Yen)"
            variant="outlined"
            value={totalAmount.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Grand Total (USD)"
            variant="outlined"
            value={totalDollars.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
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
                    vehicle.status === "Pending" ? "#e8f5e9" : "#ffebee", // Green for Pending, Red for others
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
              <Typography variant="body1">Share of Total (USD)</Typography>
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
                  label="Share of Total (USD)"
                  variant="outlined"
                  value={vehicle.totaldollers || ""}
                  onChange={(e) => handleVehicleAmountChange(index, e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => removeVehicle(index)}
                  startIcon={<TrashIcon />}
                >
                  Remove
                </Button>
              </Box>
            ))}
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