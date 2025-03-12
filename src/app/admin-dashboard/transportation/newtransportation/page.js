"use client";
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
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
  IconButton,
} from "@mui/material";
import { Add as PlusIcon, Delete as TrashIcon, Close as CloseIcon } from "@mui/icons-material";
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
  const [vehicles, setVehicles] = useState([]);
  const [searchChassisNo, setSearchChassisNo] = useState("");
  const [seaPorts, setSeaPorts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);

  const [transportData, setTransportData] = useState({
    date: "",           // Matches `date: DateTime`
    deliveryDate: "",   // Matches `deliveryDate: DateTime`
    port: "",           // Matches `port: String`
    company: "",        // Matches `company: String`
    receiptImage: null, // Used to generate `imagePath: String`
    admin_id: null,     // Matches `admin_id: Int`
    vehicles: [],       // Used to generate `vehicleNo: String` and `vehicles` array for API
  });
  const [totalAmountYen, setTotalAmountYen] = useState(0);   // Maps to `amount: Float`
  const [tenPercentAdd, setTenPercentAdd] = useState(0);     // Maps to `tenPercentAdd: Float`
  const [totalAmount, setTotalAmount] = useState(0);         // Maps to `totalamount: Float`
  const [totalDollars, setTotalDollars] = useState(0);       // Maps to `totaldollers: Float`
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const adminId = useSelector((state) => state.user.id);

  useEffect(() => {
    setTransportData((prev) => ({ ...prev, admin_id: adminId }));
  }, [adminId]);

  useEffect(() => {
    const fetchSeaPortsAndRate = async () => {
      try {
        const [portsResponse, rate] = await Promise.all([
          fetch("/api/admin/sea_ports"),
          getExchangeRate(),
        ]);

        if (!portsResponse.ok) throw new Error("Failed to fetch sea ports");
        const portsData = await portsResponse.json();
        setSeaPorts(portsData.data || portsData);
        setExchangeRate(rate);
      } catch (err) {
        setError("Error fetching data: " + err.message);
      }
    };
    fetchSeaPortsAndRate();
  }, []);

  useEffect(() => {
    const totalYen = transportData.vehicles.reduce((sum, vehicle) => 
      sum + (parseFloat(vehicle.amount) || 0), 0);
    const tenPercent = totalYen * 0.1;
    const totalWithTenPercent = totalYen + tenPercent;
    const totalInDollars = totalWithTenPercent * exchangeRate;

    setTotalAmountYen(totalYen);       // For `amount`
    setTenPercentAdd(tenPercent);      // For `tenPercentAdd`
    setTotalAmount(totalWithTenPercent); // For `totalamount`
    setTotalDollars(totalInDollars);   // For `totaldollers`
  }, [transportData.vehicles, exchangeRate]);

  const searchVehicle = async () => {
    if (!searchChassisNo) {
      setError("Please enter a chassis number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/invoice-management/VehicleSearch/${searchChassisNo}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Vehicle not found");
      }
      const result = await response.json();
      setVehicles([result.data]);
      setError("");
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const addToTransport = (vehicle) => {
    fetch(`/api/admin/invoice-management/VehicleSearch/${vehicle.chassisNo}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch vehicle status");
        return response.json();
      })
      .then((result) => {
        const fullVehicle = result.data;
        if (fullVehicle.status === "Pending") {
          setTransportData((prev) => ({
            ...prev,
            vehicles: [...prev.vehicles, {
              id: fullVehicle.id,
              chassisNo: fullVehicle.chassisNo,
              amount: "",
              tenPercentAdd: 0,
              totalamount: 0,
              totaldollers: 0,
            }],
          }));
          setVehicles([]);
          setSearchChassisNo("");
        } else {
          alert(`Cannot add vehicle. Current status: ${fullVehicle.status}`);
        }
      })
      .catch((err) => {
        setError("Error checking vehicle status: " + err.message);
      });
  };

  const updateVehicleTransport = (index, field, value) => {
    const updatedVehicles = [...transportData.vehicles];
    updatedVehicles[index][field] = value;

    if (field === "amount") {
      const amountYen = parseFloat(value) || 0;
      updatedVehicles[index].tenPercentAdd = amountYen * 0.1;
      updatedVehicles[index].totalamount = amountYen + updatedVehicles[index].tenPercentAdd;
      updatedVehicles[index].totaldollers = updatedVehicles[index].totalamount * exchangeRate;
    }

    setTransportData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const removeVehicle = (index) => {
    const updatedVehicles = transportData.vehicles.filter((_, i) => i !== index);
    setTransportData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleInputChange = (field, value) => {
    setTransportData((prev) => ({ ...prev, [field]: value }));
    if (field === "receiptImage" && value) {
      const file = value[0];
      setImagePreview(file ? URL.createObjectURL(file) : null);
    }
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
        date: transportData.date,              // Maps to `date: DateTime`
        deliveryDate: transportData.deliveryDate, // Maps to `deliveryDate: DateTime`
        port: transportData.port,              // Maps to `port: String`
        company: transportData.company,        // Maps to `company: String`
        amount: totalAmountYen,                // Maps to `amount: Float`
        tenPercentAdd: tenPercentAdd,          // Maps to `tenPercentAdd: Float`
        totalamount: totalAmount,              // Maps to `totalamount: Float`
        totaldollers: totalDollars,            // Maps to `totaldollers: Float`
        imagePath: imagePath || "",            // Maps to `imagePath: String`
        vehicleNo: transportData.vehicles.map(v => v.chassisNo).join(", "), // Maps to `vehicleNo: String`
        admin_id: transportData.admin_id,      // Maps to `admin_id: Int`
        createdAt: new Date().toISOString(),   // Maps to `createdAt: DateTime`
        updatedAt: new Date().toISOString(),   // Maps to `updatedAt: DateTime`
        vehicles: transportData.vehicles.map(v => ({
          id: v.id,
          vehicleNo: v.chassisNo,
          amount: parseFloat(v.amount) || 0,
          totaldollers: parseFloat(v.totaldollers) || 0,
        })), // Extra data for updating `AddVehicle` statuses
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/transport-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Log raw response for debugging
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
        port: "",
        company: "",
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
    <Box sx={{ p: 2, bgcolor: "#f1f6f9" }}>
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
            value={transportData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="Delivery Date"
            variant="outlined"
            value={transportData.deliveryDate}
            onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
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

      {/* Search Vehicle */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Vehicle
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Enter Chassis Number"
            variant="outlined"
            value={searchChassisNo}
            onChange={(e) => setSearchChassisNo(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            color="success"
            onClick={searchVehicle}
            disabled={loading}
            startIcon={<PlusIcon />}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </Box>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {vehicles.map((vehicle, index) => (
          <Paper key={index} elevation={1} sx={{ mt: 2, p: 2, display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body1">Chassis No: {vehicle.chassisNo}</Typography>
              <Typography variant="body1">Maker: {vehicle.maker}</Typography>
              <Typography variant="body1">Year: {vehicle.year}</Typography>
            </Box>
            <Button
              variant="contained"
              color="success"
              onClick={() => addToTransport(vehicle)}
              startIcon={<PlusIcon />}
            >
              Add to Transport
            </Button>
          </Paper>
        ))}
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
            <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr 1fr 1fr" gap={2} sx={{ fontWeight: "bold", mb: 1 }}>
              <Typography variant="body1">Vehicle ID</Typography>
              <Typography variant="body1">Chassis No</Typography>
              <Typography variant="body1">Amount (Yen)</Typography>
              <Typography variant="body1">10% Add (Yen)</Typography>
              <Typography variant="body1">Total (Yen)</Typography>
              <Typography variant="body1">Total (USD)</Typography>
            </Box>
            {transportData.vehicles.map((vehicle, index) => (
              <Box key={index} display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr 1fr 1fr" gap={2} alignItems="center" mb={1}>
                <Typography variant="body1">{vehicle.id}</Typography>
                <Typography variant="body1">{vehicle.chassisNo}</Typography>
                <TextField
                  type="number"
                  label="Amount (Yen)"
                  variant="outlined"
                  value={vehicle.amount}
                  onChange={(e) => updateVehicleTransport(index, "amount", e.target.value)}
                  fullWidth
                />
                <TextField
                  type="number"
                  label="10% Add (Yen)"
                  variant="outlined"
                  value={(vehicle.tenPercentAdd || 0).toFixed(2)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  type="number"
                  label="Total (Yen)"
                  variant="outlined"
                  value={(vehicle.totalamount || 0).toFixed(2)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  type="number"
                  label="Total (USD)"
                  variant="outlined"
                  value={(vehicle.totaldollers || 0).toFixed(2)}
                  InputProps={{ readOnly: true }}
                  fullWidth
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
            <Box mt={2} display="flex" gap={2}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Total Amount (Yen): {totalAmountYen.toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                10% Add (Yen): {tenPercentAdd.toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Grand Total (Yen): {totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Grand Total (USD): {totalDollars.toFixed(2)}
              </Typography>
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