"use client";
import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Autocomplete,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
} from "@mui/material";
import { Add as PlusIcon, Delete as TrashIcon } from "@mui/icons-material";
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

export default function InspectionBookingForm() {
  const [allVehicles, setAllVehicles] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [inspectionData, setInspectionData] = useState({
    date: "",
    company: "",
    receiptImage: null,
    admin_id: null,
    vehicles: [],
    invoiceno: "",
    invoice_amount: "",
    invoice_tax: 0,
    invoice_total: 0,
    invoice_amount_dollers: 0,
    paid_status: "UnPaid",
  });
  const [totalAmountYen, setTotalAmountYen] = useState(0);
  const [totalAmountDollars, setTotalAmountDollars] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  useEffect(() => {
    setInspectionData((prev) => ({ ...prev, admin_id: userid }));
  }, [userid]);

  useEffect(() => {
    const fetchExchangeRateAndVehicles = async () => {
      try {
        const [rate, vehiclesResponse] = await Promise.all([
          getExchangeRate(),
          fetch("/api/admin/vehicles"),
        ]);

        if (!vehiclesResponse.ok) {
          const errorData = await vehiclesResponse.json();
          throw new Error(errorData.message || "Failed to fetch vehicles");
        }
        const vehiclesData = await vehiclesResponse.json();
        const vehiclesArray = vehiclesData.data || vehiclesData;
        if (!Array.isArray(vehiclesArray)) {
          throw new Error("Vehicles data is not an array");
        }

        const filteredVehicles = vehiclesArray.map((vehicle) => ({
          id: vehicle.id,
          chassisNo: vehicle.chassisNo,
          maker: vehicle.maker,
          year: vehicle.year,
          status: vehicle.status,
        }));

        setAllVehicles(filteredVehicles);
        setExchangeRate(rate);
        setFetchError("");
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchError("Error fetching vehicles: " + err.message);
        setAllVehicles([]);
      }
    };
    fetchExchangeRateAndVehicles();
  }, []);

  useEffect(() => {
    const invoiceAmount = parseFloat(inspectionData.invoice_amount) || 0;
    const invoiceTax = invoiceAmount * 0.1;
    const invoiceTotal = invoiceAmount + invoiceTax;
    const invoiceAmountDollers = invoiceTotal * exchangeRate;

    setInspectionData((prev) => ({
      ...prev,
      invoice_tax: invoiceTax,
      invoice_total: invoiceTotal,
      invoice_amount_dollers: invoiceAmountDollers,
      vehicles: prev.vehicles.map((vehicle) => ({
        ...vehicle,
        vamount_doller:
          prev.vehicles.length > 0 ? invoiceAmountDollers / prev.vehicles.length : 0,
      })),
    }));

    setTotalAmountYen(invoiceTotal);
    setTotalAmountDollars(invoiceAmountDollers);
  }, [inspectionData.invoice_amount, inspectionData.vehicles.length, exchangeRate]);

  const addToInspection = (vehicle) => {
    if (!vehicle) return;

    if (inspectionData.vehicles.some((v) => v.id === vehicle.id)) {
      setError("This vehicle has already been added.");
      return;
    }

    if (vehicle.status === "Transport") {
      setInspectionData((prev) => {
        const updatedVehicles = [
          ...prev.vehicles,
          {
            id: vehicle.id,
            chassisNo: vehicle.chassisNo,
            vamount_doller: prev.invoice_amount_dollers / (prev.vehicles.length + 1) || 0,
          },
        ];
        return { ...prev, vehicles: updatedVehicles };
      });
      setError("");
    } else {
      setError(`Cannot add vehicle. Current status: ${vehicle.status}. Must be 'Transport'.`);
    }
  };

  const removeVehicle = (index) => {
    const updatedVehicles = inspectionData.vehicles.filter((_, i) => i !== index);
    setInspectionData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleInputChange = (field, value) => {
    setInspectionData((prev) => ({ ...prev, [field]: value }));
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
      if (inspectionData.receiptImage) {
        const base64Image = await convertToBase64(inspectionData.receiptImage[0]);
        imagePath = await uploadImageToServer(base64Image);
        if (!imagePath) throw new Error("Failed to upload receipt image");
      }

      const vehicleNo = inspectionData.vehicles.map((v) => v.chassisNo).join(", ");
      const vamountDoller =
        inspectionData.vehicles.length > 0
          ? inspectionData.invoice_amount_dollers / inspectionData.vehicles.length
          : 0;

      const payload = {
        date: inspectionData.date,
        company: inspectionData.company,
        vehicleNo: vehicleNo,
        invoiceno: inspectionData.invoiceno || `INS-${Date.now()}`,
        invoice_amount: parseFloat(inspectionData.invoice_amount) || 0,
        invoice_tax: inspectionData.invoice_tax,
        invoice_total: inspectionData.invoice_total,
        invoice_amount_dollers: inspectionData.invoice_amount_dollers,
        vamount_doller: vamountDoller,
        imagePath: imagePath || "",
        paid_status: inspectionData.paid_status,
        admin_id: inspectionData.admin_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vehicles: inspectionData.vehicles.map((v) => ({
          id: v.id,
        })),
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.details || "Failed to submit inspection data");
      }

      console.log("Submission response:", responseData);
      alert("Inspection data submitted successfully!");
      setInspectionData({
        date: "",
        company: "",
        receiptImage: null,
        admin_id: userid,
        vehicles: [],
        invoiceno: "",
        invoice_amount: "",
        invoice_tax: 0,
        invoice_total: 0,
        invoice_amount_dollers: 0,
        paid_status: "UnPaid",
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting inspection data:", error.stack || error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: "white" }}>
      <Typography variant="h4" gutterBottom>
        New Inspection Booking
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Inspection Details
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <TextField
            type="date"
            label="Inspection Date"
            variant="outlined"
            value={inspectionData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <TextField
            label="Company"
            variant="outlined"
            value={inspectionData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Invoice Number"
            variant="outlined"
            value={inspectionData.invoiceno}
            onChange={(e) => handleInputChange("invoiceno", e.target.value)}
            fullWidth
          />
          <Select
            label="Payment Status"
            variant="outlined"
            value={inspectionData.paid_status}
            onChange={(e) => handleInputChange("paid_status", e.target.value)}
            fullWidth
          >
            <MenuItem value="UnPaid">UnPaid</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </Select>
          <TextField
            type="number"
            label="Invoice Amount (Yen)"
            variant="outlined"
            value={inspectionData.invoice_amount}
            onChange={(e) => handleInputChange("invoice_amount", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Invoice Tax (10%) (Yen)"
            variant="outlined"
            value={inspectionData.invoice_tax.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            type="number"
            label="Invoice Total (Yen)"
            variant="outlined"
            value={inspectionData.invoice_total.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            type="number"
            label="Invoice Total (USD)"
            variant="outlined"
            value={inspectionData.invoice_amount_dollers.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <Box display="flex" flexDirection="column">
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
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Vehicle
        </Typography>
        {fetchError && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {fetchError}
          </Typography>
        )}
        <Box display="flex" flexDirection="column" gap={2}>
          <Autocomplete
            options={allVehicles}
            getOptionLabel={(vehicle) =>
              vehicle ? `${vehicle.chassisNo} - ${vehicle.maker} (${vehicle.year})` : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Vehicles (Chassis No, Maker, Year)"
                variant="outlined"
                fullWidth
                error={!!error}
                helperText={error || (allVehicles.length === 0 ? "No vehicles available" : "")}
              />
            )}
            renderOption={(props, vehicle) => (
              <ListItem {...props}>
                <ListItemText
                  primary={`${vehicle.chassisNo} - ${vehicle.maker} (${vehicle.year})`}
                  secondary={
                    <Typography
                      component="span"
                      sx={{
                        display: "inline-block",
                        backgroundColor:
                          vehicle.status === "Transport" ? "#e8f5e9" : "#ffebee",
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      Status: {vehicle.status}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToInspection(vehicle);
                    }}
                  >
                    <PlusIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
            noOptionsText="No vehicles found"
          />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicles for Inspection
        </Typography>
        {inspectionData.vehicles.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No vehicles added yet
          </Typography>
        ) : (
          <Box>
            <Box
              display="grid"
              gridTemplateColumns="1fr 1fr 1fr 1fr"
              gap={2}
              sx={{ fontWeight: "bold", mb: 1 }}
            >
              <Typography variant="body1">Vehicle ID</Typography>
              <Typography variant="body1">Chassis No</Typography>
              <Typography variant="body1">Amount per Vehicle (USD)</Typography>
              <Typography variant="body1">Actions</Typography>
            </Box>
            {inspectionData.vehicles.map((vehicle, index) => (
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
                  label="Amount (USD)"
                  variant="outlined"
                  value={(vehicle.vamount_doller || 0).toFixed(2)}
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
                Total Amount (USD): {totalAmountDollars.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting || inspectionData.vehicles.length === 0}
        sx={{ mt: 2 }}
      >
        {submitting ? "Submitting..." : "Submit Inspection"}
      </Button>
    </Box>
  );
}