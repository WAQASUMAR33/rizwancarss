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

const DeliveredVehicle = () => {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [charges, setCharges] = useState({
    Transport_charges: 0, // Default to 0 to match schema default
    othercharges: 0,     // Default to 0 to match schema default
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPerVehicle, setAmountPerVehicle] = useState(0);
  const [portCollect, setPortCollect] = useState({
    date: new Date().toISOString().split("T")[0],
    imageFile: null,
    imagePreview: null,
    imagePath: "",
    admin_id: 1, // Default admin_id to match schema relation
  });

  // Search for a vehicle by chassisNo
  const searchVehicle = async () => {
    if (!vehicleSearch.trim()) {
      setError("Please enter a Chassis No to search.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/deliever/search?query=${encodeURIComponent(vehicleSearch)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Search API response:", JSON.stringify(result, null, 2));

      if (result.status && result.data) {
        // Map vehicleId to id to align with ShowRoom_Vehicle schema
        const vehicle = {
          ...result.data,
          id: result.data.vehicleId, // Map vehicleId to id
          vehicleNo: result.data.chassisNo,
          date: new Date().toISOString().split("T")[0], // Default date
          Transport_charges: 0, // Match schema default
          othercharges: 0,     // Match schema default
          totalAmount: 0,      // Match schema default
          vRepair_charges: 0,  // Match schema default
          vamount: 0,          // Match schema default (will be set as divided amount)
          vtotalAmount: 0,     // Match schema default
          imagePath: "",       // Match schema default
          admin_id: 0,         // Default admin_id (will be overridden by portCollect.admin_id on save)
        };
        console.log("Vehicle object to add:", JSON.stringify(vehicle, null, 2));
        if (vehicles.some((v) => v.vehicleNo === vehicle.vehicleNo)) {
          setError("This vehicle is already added.");
        } else {
          setVehicles((prev) => {
            const updatedVehicles = [...prev, vehicle];
            console.log("Updated vehicles state:", JSON.stringify(updatedVehicles, null, 2));
            return updatedVehicles;
          });
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
      [name]: value === "" ? 0 : parseFloat(value) || 0, // Default to 0 if empty or invalid
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

  // Handle changes to vRepair_charges for individual vehicles
  const handleRepairChargeChange = (vehicleNo, value) => {
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.vehicleNo === vehicleNo
        ? { ...vehicle, vRepair_charges: value === "" || isNaN(parseFloat(value)) ? 0 : parseFloat(value) }
        : vehicle
    );
    setVehicles(updatedVehicles);
  };

  // Handle changes to vamount for individual vehicles (disabled for now, set from amountPerVehicle)
  const handleVamountChange = (vehicleNo, value) => {
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.vehicleNo === vehicleNo
        ? { ...vehicle, vamount: value === "" || isNaN(parseFloat(value)) ? 0 : parseFloat(value) }
        : vehicle
    );
    setVehicles(updatedVehicles);
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
  const removeVehicle = (vehicleNo) => {
    setVehicles((prev) => prev.filter((v) => v.vehicleNo !== vehicleNo));
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
      throw error;
    }
  };

  // Calculate total amount and amount per vehicle
  useEffect(() => {
    const { Transport_charges, othercharges } = charges;
    const total = (Transport_charges || 0) + (othercharges || 0);
    setTotalAmount(total);

    const totalVehicles = vehicles.length;
    const perVehicle = totalVehicles > 0 ? total / totalVehicles : 0;
    setAmountPerVehicle(perVehicle);

    // Update vamount for all vehicles based on the divided amount
    setVehicles((prev) =>
      prev.map((vehicle) => ({
        ...vehicle,
        vamount: perVehicle, // Set vamount as the divided amount
      }))
    );
  }, [charges, vehicles.length]);

  // Save individual records for each vehicle
  const handleSave = async () => {
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

      const vehicleData = vehicles.map((vehicle) => ({
        vehicleNo: vehicle.vehicleNo,
        date: new Date(portCollect.date),
        Transport_charges: charges.Transport_charges,
        othercharges: charges.othercharges,
        totalAmount: amountPerVehicle + (vehicle.vRepair_charges || 0),
        vRepair_charges: vehicle.vRepair_charges || 0,
        vamount: vehicle.vamount || 0, // Divided amount per vehicle
        vtotalAmount: (vehicle.vamount || 0) + (vehicle.vRepair_charges || 0), // Total with repair charges
        imagePath: imagePath || "",
        admin_id: portCollect.admin_id,
      }));

      console.log("Saving vehicleData:", JSON.stringify(vehicleData, null, 2));

      const response = await fetch("/api/admin/deliever", { // Updated endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      const responseBody = await response.text();
      console.log("Server response status:", response.status);
      console.log("Server response body:", responseBody);

      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.statusText} - ${responseBody}`);
      }

      const result = JSON.parse(responseBody);
      if (result.status) {
        alert(`Saved ${vehicles.length} vehicle records successfully!`);
        setCharges({
          Transport_charges: 0, // Reset to 0 to match schema default
          othercharges: 0,     // Reset to 0 to match schema default
        });
        setPortCollect({
          date: new Date().toISOString().split("T")[0],
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
        Delivered Vehicle Charges
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
            label="Transport Charges"
            name="Transport_charges"
            type="number"
            value={charges.Transport_charges === "" ? 0 : charges.Transport_charges}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Other Charges"
            name="othercharges"
            type="number"
            value={charges.othercharges === "" ? 0 : charges.othercharges}
            onChange={handleInputChange}
            variant="outlined"
            sx={{ flex: "1 1 200px" }}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
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
          label="Total Amount (Divided per Vehicle)"
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
            label="Search Chassis No"
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "whitesmoke" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Chassis No</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>CC</TableCell>
                  <TableCell>Repair Charges</TableCell>
                  <TableCell>vAmount</TableCell>
                  <TableCell>Total Charges</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicleNo}>
                    <TableCell>{vehicle.id || "N/A"}</TableCell>
                    <TableCell>{vehicle.vehicleNo || "N/A"}</TableCell>
                    <TableCell>{vehicle.year || "N/A"}</TableCell>
                    <TableCell>{vehicle.color || "N/A"}</TableCell>
                    <TableCell>{vehicle.cc || "N/A"}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={vehicle.vRepair_charges === "" ? 0 : vehicle.vRepair_charges}
                        onChange={(e) => handleRepairChargeChange(vehicle.vehicleNo, e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                        sx={{ width: "120px" }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={vehicle.vamount === "" ? 0 : vehicle.vamount}
                        onChange={(e) => handleVamountChange(vehicle.vehicleNo, e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                        sx={{ width: "120px" }}
                        disabled // Disabled to reflect calculated vamount from amountPerVehicle
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={((vehicle.vRepair_charges || 0) + (vehicle.vamount || 0)).toFixed(2)}
                        variant="outlined"
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                        sx={{ width: "120px" }}
                        disabled // Total Charges is calculated
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => removeVehicle(vehicle.vehicleNo)}
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

export default DeliveredVehicle;