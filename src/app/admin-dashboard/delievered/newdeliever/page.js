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
import Autocomplete from "@mui/material/Autocomplete";

const DeliveredVehicle = () => {
  const [vehicleSearch, setVehicleSearch] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [charges, setCharges] = useState({
    Transport_charges: 0,
    othercharges: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPerVehicle, setAmountPerVehicle] = useState(0);
  const [portCollect, setPortCollect] = useState({
    date: new Date().toISOString().split("T")[0],
    imageFile: null,
    imagePreview: null,
    imagePath: "",
    admin_id: 1,
  });
  const [allVehicles, setAllVehicles] = useState([]);

  // Fetch all vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/vehicles");
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
        }
        const result = await response.json();
        const fetchedVehicles = result.data || [];
        console.log("Fetched vehicles:", fetchedVehicles.map((v) => ({ id: v.id, chassisNo: v.chassisNo })));
        setAllVehicles(fetchedVehicles);
      } catch (err) {
        console.error("Fetch vehicles error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Handle input changes for charges
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCharges((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : parseFloat(value) || 0,
    }));
  };

  // Handle input changes for PortCollect fields
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

  // Handle changes to vRepair_charges
  const handleRepairChargeChange = (vehicleNo, value) => {
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.vehicleNo === vehicleNo
        ? { ...vehicle, vRepair_charges: value === "" || isNaN(parseFloat(value)) ? 0 : parseFloat(value) }
        : vehicle
    );
    setVehicles(updatedVehicles);
  };

  // Handle changes to vamount (disabled)
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

  // Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload image to server
  const uploadImageToServer = async (base64Image) => {
    try {
      const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
      const response = await fetch(uploadApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      if (!response.ok || !data.image_url) {
        throw new Error(data.error || "Failed to upload image");
      }
      const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
      return fullPath;
    } catch (error) {
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

    setVehicles((prev) =>
      prev.map((vehicle) => ({
        ...vehicle,
        vamount: perVehicle,
      }))
    );
  }, [charges, vehicles.length]);

  // Add selected vehicle to the grid on selection
  const addVehicle = (newValue) => {
    if (!newValue) {
      setError("Please select a vehicle to add.");
      return;
    }

    const vehicle = {
      ...newValue,
      id: newValue.id, // Use id from API response
      vehicleNo: newValue.chassisNo,
      date: new Date().toISOString().split("T")[0],
      Transport_charges: 0,
      othercharges: 0,
      totalAmount: 0,
      vRepair_charges: 0,
      vamount: 0,
      vtotalAmount: 0,
      imagePath: "",
      admin_id: 0,
    };

    if (vehicles.some((v) => v.vehicleNo === vehicle.vehicleNo)) {
      setError("This vehicle is already added.");
    } else {
      setVehicles((prev) => {
        const updatedVehicles = [...prev, vehicle];
        console.log("Added vehicle:", vehicle);
        return updatedVehicles;
      });
      setVehicleSearch(null);
    }
  };

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
        if (!imagePath) throw new Error("Image upload failed");
        setPortCollect((prev) => ({ ...prev, imagePath }));
      }

      const vehicleData = vehicles.map((vehicle) => ({
        vehicleNo: vehicle.vehicleNo,
        date: new Date(portCollect.date),
        Transport_charges: charges.Transport_charges,
        othercharges: charges.othercharges,
        totalAmount: amountPerVehicle + (vehicle.vRepair_charges || 0),
        vRepair_charges: vehicle.vRepair_charges || 0,
        vamount: vehicle.vamount || 0,
        vtotalAmount: (vehicle.vamount || 0) + (vehicle.vRepair_charges || 0),
        imagePath: imagePath || "",
        admin_id: portCollect.admin_id,
      }));

      const response = await fetch("/api/admin/deliever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      const responseBody = await response.text();
      if (!response.ok) throw new Error(`Failed to save data: ${response.statusText} - ${responseBody}`);

      const result = JSON.parse(responseBody);
      if (result.status) {
        alert(`Saved ${vehicles.length} vehicle records successfully!`);
        setCharges({ Transport_charges: 0, othercharges: 0 });
        setPortCollect({
          date: new Date().toISOString().split("T")[0],
          imageFile: null,
          imagePreview: null,
          imagePath: "",
          admin_id: 1,
        });
        setVehicles([]);
        setVehicleSearch(null);
      } else {
        throw new Error(result.error || "Failed to save data.");
      }
    } catch (err) {
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
        <Typography variant="h6" gutterBottom>Enter Charges</Typography>
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
            value={charges.Transport_charges}
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
          label="Total Amount (Divided per Vehicle)"
          value={totalAmount.toFixed(2)}
          variant="outlined"
          disabled
          sx={{ maxWidth: "200px" }}
          InputProps={{ startAdornment: "$" }}
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
        {portCollect.imagePreview && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Image Preview:</Typography>
            <img src={portCollect.imagePreview} alt="Preview" style={{ maxWidth: "300px", maxHeight: "300px", objectFit: "contain" }} />
          </Box>
        )}
        
      </Box>

      {/* Vehicle Selection with Autocomplete */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Add Vehicles</Typography>
        <Autocomplete
          options={allVehicles}
          getOptionLabel={(option) => (option ? `${option.chassisNo} - ${option.year} (${option.color})` : "")}
          value={vehicleSearch}
          onChange={(event, newValue) => {
            setVehicleSearch(newValue);
            if (newValue) addVehicle(newValue);
          }}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Vehicle"
              variant="outlined"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "25px",
                  backgroundColor: "#f5f5f5",
                  "&:hover fieldset": { borderColor: "#1976d2" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#757575" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? <ClipLoader color="#757575" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ width: "100%" }}
        />
      </Box>

      {/* Error Display */}
      {error && <Typography variant="body1" color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* Vehicle List */}
      {vehicles.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Vehicles (Total: {vehicles.length})</Typography>
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
                        value={vehicle.vRepair_charges}
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
                        value={vehicle.vamount}
                        onChange={(e) => handleVamountChange(vehicle.vehicleNo, e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                        sx={{ width: "120px" }}
                        disabled
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
                        disabled
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