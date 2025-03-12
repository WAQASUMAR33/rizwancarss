"use client";
import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from "@mui/material";
import { ClipLoader } from "react-spinners";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";

const CollectVehicle = () => {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [charges, setCharges] = useState({
    freight: "",
    port_charges: "",
    clearingcharges: "",
    othercharges: "",
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPerVehicle, setAmountPerVehicle] = useState(0);
  const [portCollect, setPortCollect] = useState({
    date: new Date().toISOString().split("T")[0],
    invoiceno: "",
    imageFile: null,
    imagePreview: null,
    imagePath: "",
    admin_id: 1,
  });

  // Search for a vehicle by vehicleId or chassisNo
  const searchVehicle = async () => {
    if (!vehicleSearch.trim()) {
      setError("Please enter a Vehicle ID or Chassis Number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/collect/search?query=${encodeURIComponent(vehicleSearch)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status && result.data) {
        const vehicle = result.data;
        if (vehicles.some((v) => v.vehicleId === vehicle.vehicleId)) {
          setError("This vehicle is already added.");
        } else {
          setVehicles((prev) => [...prev, vehicle]);
          setVehicleSearch("");
        }
      } else {
        throw new Error(result.error || "No vehicle found.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for vehicle search
  const handleVehicleSearchChange = (e) => {
    setVehicleSearch(e.target.value);
  };

  // Handle input changes for charges
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCharges((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : "",
    }));
  };

  // Handle input changes for PortCollect fields, including image preview
  const handlePortCollectChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile" && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setPortCollect((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
      }));
    } else {
      setPortCollect((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (portCollect.imagePreview) {
        URL.revokeObjectURL(portCollect.imagePreview);
      }
    };
  }, [portCollect.imagePreview]);

  // Remove a vehicle from the list
  const removeVehicle = (vehicleId) => {
    setVehicles((prev) => prev.filter((v) => v.vehicleId !== vehicleId));
  };

  // Convert file to Base64 (full data URL)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        console.log("Base64 conversion successful, length:", base64String.length);
        console.log("Base64 snippet:", base64String.substring(0, 50));
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
    });
  };

  // Upload image to server
  const uploadImageToServer = async (base64Image) => {
    try {
      const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
      console.log("Uploading to:", uploadApiUrl);
      console.log("Base64 image length:", base64Image.length);
      console.log("Base64 snippet:", base64Image.substring(0, 50));

      const response = await fetch(uploadApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok || !data.image_url) {
        throw new Error(data.error || "Failed to upload image");
      }

      const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
      console.log("Image uploaded successfully, path:", fullPath);
      return fullPath;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error; // Re-throw to handle in handleSave
    }
  };

  // Calculate total amount and amount per vehicle
  useEffect(() => {
    const { freight, port_charges, clearingcharges, othercharges } = charges;
    const total =
      (freight || 0) +
      (port_charges || 0) +
      (clearingcharges || 0) +
      (othercharges || 0);
    setTotalAmount(total);

    const totalVehicles = vehicles.length;
    const perVehicle = totalVehicles > 0 ? total / totalVehicles : 0;
    setAmountPerVehicle(perVehicle);
  }, [charges, vehicles]);

  // Save individual PortCollect records for each vehicle
  const handleSave = async () => {
    if (!portCollect.invoiceno) {
      setError("Invoice Number is required.");
      return;
    }
    if (vehicles.length === 0) {
      setError("Please add at least one vehicle.");
      return;
    }
  
    setSaving(true);
    setError("");
  
    try {
      let imagePath = portCollect.imagePath;
      if (portCollect.imageFile) {
        const base64Image = await convertToBase64(portCollect.imageFile);
        imagePath = await uploadImageToServer(base64Image);
        if (!imagePath) {
          throw new Error("Image upload failed");
        }
        setPortCollect((prev) => ({ ...prev, imagePath }));
      }
  
      const portCollectData = vehicles.map((vehicle) => ({
        vehicleNo: vehicle.vehicleId.toString(),
        date: new Date(portCollect.date),
        freight_amount: charges.freight || 0,
        port_charges: charges.port_charges || 0,
        clearingcharges: charges.clearingcharges || 0,
        othercharges: charges.othercharges || 0,
        totalAmount: amountPerVehicle,
        vamount: amountPerVehicle,
        invoiceno: portCollect.invoiceno,
        imagePath: imagePath || "",
        admin_id: portCollect.admin_id,
      }));
  
      console.log("Saving portCollectData:", JSON.stringify(portCollectData, null, 2));
  
      const response = await fetch("/api/admin/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portCollectData),
      });
  
      const responseBody = await response.text(); // Get raw response body
      console.log("Server response status:", response.status);
      console.log("Server response body:", responseBody);
  
      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.statusText} - ${responseBody}`);
      }
  
      const result = JSON.parse(responseBody);
      if (result.status) {
        alert(`Saved ${vehicles.length} vehicle records successfully!`);
        setCharges({
          freight: "",
          port_charges: "",
          clearingcharges: "",
          othercharges: "",
        });
        setPortCollect({
          date: new Date().toISOString().split("T")[0],
          invoiceno: "",
          imageFile: null,
          imagePreview: null,
          imagePath: "",
          admin_id: 1,
        });
        setVehicles([]);
      } else {
        throw new Error(result.error || "Failed to save data.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };


  
  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3, mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Collect Vehicle Charges
      </Typography>

      {/* Charges Input Form */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Enter Charges
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={portCollect.date}
            onChange={handlePortCollectChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Freight"
            name="freight"
            type="number"
            value={charges.freight}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Port Charges"
            name="port_charges"
            type="number"
            value={charges.port_charges}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Clearing Charges"
            name="clearingcharges"
            type="number"
            value={charges.clearingcharges}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Other Charges"
            name="othercharges"
            type="number"
            value={charges.othercharges}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Invoice Number"
            name="invoiceno"
            value={portCollect.invoiceno}
            onChange={handlePortCollectChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            required
          />
          <TextField
            label="Upload Image"
            name="imageFile"
            type="file"
            onChange={handlePortCollectChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: "image/*" }}
          />
        </Box>
        {/* Image Preview */}
        {portCollect.imagePreview && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Image Preview:</Typography>
            <img
              src={portCollect.imagePreview}
              alt="Preview"
              style={{ maxWidth: "300px", maxHeight: "300px", objectFit: "contain" }}
            />
          </Box>
        )}
        <TextField
          label="Total Amount"
          value={totalAmount.toFixed(2)}
          variant="outlined"
          disabled
          sx={{ maxWidth: "200px" }}
          InputProps={{ startAdornment: "$" }}
        />
      </Box>

      {/* Vehicle Search and Add */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Vehicles
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Vehicle ID or Chassis No"
            value={vehicleSearch}
            onChange={handleVehicleSearchChange}
            variant="outlined"
            fullWidth
            sx={{
              maxWidth: "400px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "25px",
                backgroundColor: "#f5f5f5",
                "&:hover fieldset": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1976d2",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#757575" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={searchVehicle}
            disabled={loading}
            sx={{
              borderRadius: "25px",
              padding: "10px 20px",
              background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
              boxShadow: "0 3px 5px 2px rgba(25, 118, 210, .3)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0 30%, #2196f3 90%)",
              },
              textTransform: "none",
            }}
          >
            {loading ? <ClipLoader color="#fff" size={20} /> : "Add Vehicle"}
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Vehicle List */}
      {vehicles.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Vehicles (Total: {vehicles.length})
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Amount per Vehicle: ${amountPerVehicle.toFixed(2)}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "whitesmoke" }}>
                <TableRow>
                  <TableCell>Vehicle ID</TableCell>
                  <TableCell>Chassis No</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>CC</TableCell>
                  <TableCell>Amount per Vehicle</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicleId}>
                    <TableCell>{vehicle.vehicleId}</TableCell>
                    <TableCell>{vehicle.chassisNo}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>{vehicle.cc}</TableCell>
                    <TableCell>${amountPerVehicle.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => removeVehicle(vehicle.vehicleId)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          No vehicles added yet.
        </Typography>
      )}

      {/* Save Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <ClipLoader color="#fff" size={20} /> : <SaveIcon />}
        >
          Save
        </Button>
      </Box>
    </Paper>
  );
};

export default CollectVehicle;