"use client";
import { useEffect, useState, useMemo } from "react";
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
  CircularProgress,
} from "@mui/material";
import { Add as PlusIcon, Delete as TrashIcon, Close as CloseIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";

async function getCurrencies() {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}/pair/JPY/USD`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch currency data");
    }
    const data = await response.json();
    console.log("Currency pair data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return null;
  }
}

export default function NewBookingForm() {
  const [seaPorts, setSeaPorts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null); // JPY to USD rate
  const [invoiceData, setInvoiceData] = useState({
    date: "",
    number: "",
    status: "UNPAID",
    auctionHouse: "",
    imagePath: "",
    amountYen: 0,
    amount_doller: 0,
    added_by: "",
    vehicles: [],
  });
  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [invoiceImagePreview, setInvoiceImagePreview] = useState(null);

  // Set added_by once on mount or when userid changes
  useEffect(() => {
    setInvoiceData((prev) => ({ ...prev, added_by: userid || "" }));
  }, [userid]);

  // Fetch initial data once on mount
  useEffect(() => {
    const fetchSeaPorts = async () => {
      try {
        const response = await fetch("/api/admin/sea_ports");
        if (!response.ok) throw new Error(`Failed to fetch sea ports: ${response.statusText}`);
        const result = await response.json();
        setSeaPorts(result.data || []);
      } catch (error) {
        console.error("Error fetching sea ports:", error);
        setError(error.message);
        setSeaPorts([]);
      }
    };

    const fetchAdmins = async () => {
      try {
        const response = await fetch("/api/admin/adminuser");
        if (!response.ok) throw new Error(`Failed to fetch admins: ${response.statusText}`);
        const result = await response.json();
        setAdmins(Array.isArray(result) ? result : result.data || []);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setError(error.message);
        setAdmins([]);
      }
    };

    const fetchExchangeRate = async () => {
      const currencyData = await getCurrencies();
      if (currencyData && currencyData.conversion_rate) {
        setExchangeRate(currencyData.conversion_rate); // JPY to USD rate
      } else {
        setError("Failed to fetch exchange rate");
      }
    };

    Promise.all([fetchSeaPorts(), fetchAdmins(), fetchExchangeRate()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Calculate updated vehicles with totals using useMemo
  const updatedVehicles = useMemo(() => {
    if (!exchangeRate) return invoiceData.vehicles;

    return invoiceData.vehicles.map((vehicle) => {
      const auction_amount = parseFloat(vehicle.auction_amount) || 0;
      const bidAmount = parseFloat(vehicle.bidAmount) || 0;
      const tenPercentAdd = auction_amount * 0.1;
      const bidAmount10per = bidAmount * 0.1;
      const recycleAmount = parseFloat(vehicle.recycleAmount) || 0;
      const commissionAmount = parseFloat(vehicle.commissionAmount) || 0;
      const numberPlateTax = parseFloat(vehicle.numberPlateTax) || 0;
      const repairCharges = parseFloat(vehicle.repairCharges) || 0;
      const additionalAmount = parseFloat(vehicle.additionalAmount) || 0;

      const totalAmount_yen =
        auction_amount +
        tenPercentAdd +
        bidAmount +
        bidAmount10per +
        recycleAmount +
        commissionAmount +
        numberPlateTax +
        repairCharges +
        additionalAmount;

      const totalAmount_dollers = totalAmount_yen * exchangeRate;

      return {
        ...vehicle,
        tenPercentAdd: parseFloat(tenPercentAdd.toFixed(2)),
        bidAmount10per: parseFloat(bidAmount10per.toFixed(2)),
        totalAmount_yen: parseFloat(totalAmount_yen.toFixed(2)),
        totalAmount_dollers: parseFloat(totalAmount_dollers.toFixed(2)),
      };
    });
  }, [invoiceData.vehicles, exchangeRate]);

  // Calculate amount_doller dynamically
  const amountDoller = useMemo(() => {
    if (!exchangeRate || !invoiceData.amountYen) return invoiceData.amount_doller || 0;
    const amountYen = parseFloat(invoiceData.amountYen) || 0;
    return parseFloat((amountYen * exchangeRate).toFixed(2));
  }, [invoiceData.amountYen, exchangeRate]);

  const handleInputChange = (field, value) => {
    setInvoiceData((prev) => {
      const updatedData = { ...prev, [field]: value };
      if (field === "amountYen") {
        updatedData.amountYen = parseFloat(value) || 0;
        updatedData.amount_doller = parseFloat((updatedData.amountYen * exchangeRate).toFixed(2)) || 0;
      } else if (field === "amount_doller") {
        updatedData.amount_doller = parseFloat(value) || 0;
        if (exchangeRate) {
          updatedData.amountYen = parseFloat((updatedData.amount_doller / exchangeRate).toFixed(2));
        }
      } else if (field === "imagePath" && value) {
        const file = value[0];
        setInvoiceImagePreview(file ? URL.createObjectURL(file) : null);
      }
      return updatedData;
    });
  };

  const addVehicle = () => {
    setInvoiceData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          chassisNo: "",
          maker: "",
          year: "",
          color: "",
          engineType: "",
          auction_amount: 0,
          tenPercentAdd: 0,
          bidAmount: 0,
          bidAmount10per: 0,
          recycleAmount: 0,
          auction_house: "",
          commissionAmount: 0,
          numberPlateTax: 0,
          repairCharges: 0,
          totalAmount_yen: 0,
          totalAmount_dollers: 0,
          sendingPort: null,
          additionalAmount: 0,
          isDocumentRequired: "",
          documentReceiveDate: null,
          isOwnership: "",
          ownershipDate: null,
          status: "Pending",
          admin_id: null,
          vehicleImages: [],
          vehicleImagePreviews: [],
          added_by: userid || "",
        },
      ],
    }));
  };

  const removeVehicle = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  };

  const handleVehicleChange = (index, field, value) => {
    const updatedVehicles = [...invoiceData.vehicles];
    if (field === "vehicleImages") {
      const newImages = Array.from(value);
      updatedVehicles[index][field] = [...(updatedVehicles[index][field] || []), ...newImages];
      updatedVehicles[index]["vehicleImagePreviews"] = updatedVehicles[index][field].map((file) =>
        typeof file === "string" ? file : URL.createObjectURL(file)
      );
    } else {
      updatedVehicles[index][field] = field === "year" ? String(value) : value;
      if (
        [
          "auction_amount",
          "bidAmount",
          "recycleAmount",
          "commissionAmount",
          "numberPlateTax",
          "repairCharges",
          "additionalAmount",
        ].includes(field)
      ) {
        updatedVehicles[index][field] = parseFloat(value) || 0;
      }
    }
    setInvoiceData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const removeImage = (vehicleIndex, imageIndex) => {
    setInvoiceData((prev) => {
      const updatedVehicles = [...prev.vehicles];
      updatedVehicles[vehicleIndex].vehicleImages.splice(imageIndex, 1);
      updatedVehicles[vehicleIndex].vehicleImagePreviews = updatedVehicles[vehicleIndex].vehicleImages.map((file) =>
        typeof file === "string" ? file : URL.createObjectURL(file)
      );
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
      let jsonPayload = { ...invoiceData };

      if (!jsonPayload.number || jsonPayload.number === "") throw new Error("Invoice number is required.");
   
      jsonPayload.amountYen = parseFloat(jsonPayload.amountYen) || 0;
      jsonPayload.amount_doller = parseFloat(jsonPayload.amount_doller) || 0;
      jsonPayload.added_by = parseInt(userid);

      if (invoiceData.imagePath && invoiceData.imagePath.length > 0) {
        const base64Image = await convertToBase64(invoiceData.imagePath[0]);
        const imageUrl = await uploadImageToServer(base64Image);
        jsonPayload.imagePath = imageUrl || "";
      } else {
        jsonPayload.imagePath = "";
      }

      const updatedVehiclesForSubmit = await Promise.all(
        updatedVehicles.map(async (vehicle, index) => {
          let updatedVehicle = { ...vehicle };
          delete updatedVehicle.vehicleImagePreviews;

          const numericFields = [
            "auction_amount",
            "tenPercentAdd",
            "bidAmount",
            "bidAmount10per",
            "recycleAmount",
            "commissionAmount",
            "numberPlateTax",
            "repairCharges",
            "totalAmount_yen",
            "totalAmount_dollers",
            "additionalAmount",
          ];
          numericFields.forEach((field) => {
            updatedVehicle[field] = parseFloat(updatedVehicle[field]) || 0;
          });

          updatedVehicle.year = String(vehicle.year || "");
          updatedVehicle.sendingPort = vehicle.sendingPort ? parseInt(vehicle.sendingPort, 10) : null;
          updatedVehicle.admin_id = vehicle.admin_id ? parseInt(vehicle.admin_id, 10) : null;
          updatedVehicle.added_by = parseInt(userid);

          if (!updatedVehicle.admin_id) {
            throw new Error(`Admin ID is required for vehicle ${vehicle.chassisNo || index + 1}`);
          }

          if (vehicle.documentReceiveDate) {
            updatedVehicle.documentReceiveDate = new Date(vehicle.documentReceiveDate).toISOString();
          }
          if (vehicle.ownershipDate) {
            updatedVehicle.ownershipDate = new Date(vehicle.ownershipDate).toISOString();
          }

          if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
            const imageUrls = await Promise.all(
              vehicle.vehicleImages.map(async (file) => {
                const base64Image = await convertToBase64(file);
                return await uploadImageToServer(base64Image);
              })
            );
            updatedVehicle.vehicleImages = imageUrls.filter((url) => url !== null);
          } else {
            updatedVehicle.vehicleImages = [];
          }

          return updatedVehicle;
        })
      );

      jsonPayload.vehicles = updatedVehiclesForSubmit;
      jsonPayload.amount_doller = amountDoller;

      console.log("JSON Payload to be sent:", JSON.stringify(jsonPayload, null, 2));

      const response = await fetch("/api/admin/invoice-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonPayload),
      });

      const textResponse = await response.text();
      console.log("Raw API response:", textResponse);

      if (!response.ok) throw new Error(`Server Error: ${response.status} - ${textResponse}`);

      const jsonResponse = JSON.parse(textResponse);
      console.log("Parsed JSON response:", jsonResponse);

      setInvoiceImagePreview(null);
      setInvoiceData({
        date: "",
        number: "",
        status: "UNPAID",
        auctionHouse: "",
        imagePath: "",
        amountYen: 0,
        amount_doller: 0,
        added_by: userid || "",
        vehicles: [],
      });

      alert("Invoice and vehicles added successfully!");
    } catch (error) {
      console.error("Error submitting invoice:", error);
      alert(`Failed to submit invoice. Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading sea ports and admins...
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
    <Box sx={{ p: 2, bgcolor: "#f1f6f9" }}>
      <Typography variant="h4" gutterBottom>
        New Vehicle Booking
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Details
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <TextField
            type="date"
            label="Invoice Date"
            variant="outlined"
            value={invoiceData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="text"
            label="Invoice Number"
            variant="outlined"
            value={invoiceData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            required
            fullWidth
          />
          <TextField
            type="number"
            label="Total Amount (Yen)"
            variant="outlined"
            value={invoiceData.amountYen}
            onChange={(e) => handleInputChange("amountYen", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Total Amount (Dollar)"
            variant="outlined"
            value={amountDoller}
            onChange={(e) => handleInputChange("amount_doller", e.target.value)}
            fullWidth
          />
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={invoiceData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              label="Status"
            >
              <MenuItem value="UNPAID">Unpaid</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Auction House"
            variant="outlined"
            value={invoiceData.auctionHouse}
            onChange={(e) => handleInputChange("auctionHouse", e.target.value)}
            fullWidth
          />


            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("imagePath", e.target.files)}
              inputProps={{ accept: "image/*" }}
              fullWidth
              label="Upload Invoice Image"
            />
            
        
          
          {invoiceImagePreview && (
              <Box mt={2}>
                <img
                  src={invoiceImagePreview}
                  alt="Invoice Preview"
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                />
              </Box>
            )}
          
          <Box gridColumn="span 2">
           
            
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicle Details
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={addVehicle}
          startIcon={<PlusIcon />}
          sx={{ mb: 2 }}
        >
          Add Vehicle
        </Button>
        {updatedVehicles.map((vehicle, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
            <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={2}>
              <TextField
                label="Chassis No"
                variant="outlined"
                value={vehicle.chassisNo}
                onChange={(e) => handleVehicleChange(index, "chassisNo", e.target.value)}
                fullWidth
              />
              <TextField
                label="Maker"
                variant="outlined"
                value={vehicle.maker}
                onChange={(e) => handleVehicleChange(index, "maker", e.target.value)}
                fullWidth
              />
              <TextField
                type="text"
                label="Year"
                variant="outlined"
                value={vehicle.year}
                onChange={(e) => handleVehicleChange(index, "year", e.target.value)}
                fullWidth
              />
              <TextField
                label="Color"
                variant="outlined"
                value={vehicle.color}
                onChange={(e) => handleVehicleChange(index, "color", e.target.value)}
                fullWidth
              />
              <TextField
                label="Engine Type"
                variant="outlined"
                value={vehicle.engineType}
                onChange={(e) => handleVehicleChange(index, "engineType", e.target.value)}
                fullWidth
              />
              <TextField
                label="Auction House"
                variant="outlined"
                value={vehicle.auction_house}
                onChange={(e) => handleVehicleChange(index, "auction_house", e.target.value)}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Sending Port</InputLabel>
                <Select
                  value={vehicle.sendingPort || ""}
                  onChange={(e) => handleVehicleChange(index, "sendingPort", e.target.value)}
                  label="Sending Port"
                >
                  <MenuItem value="">
                    <em>Select Sending Port</em>
                  </MenuItem>
                  {seaPorts.map((port) => (
                    <MenuItem key={port.id} value={port.id}>
                      {port.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="outlined" fullWidth required>
                <InputLabel>Admin</InputLabel>
                <Select
                  value={vehicle.admin_id || ""}
                  onChange={(e) => handleVehicleChange(index, "admin_id", e.target.value)}
                  label="Admin"
                >
                  <MenuItem value="">
                    <em>Select Admin</em>
                  </MenuItem>
                  {admins.map((admin) => (
                    <MenuItem key={admin.id} value={admin.id}>
                      {admin.username} ({admin.fullname})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="number"
                label="Auction Amount"
                variant="outlined"
                value={vehicle.auction_amount}
                onChange={(e) => handleVehicleChange(index, "auction_amount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Ten Percent Add"
                variant="outlined"
                value={vehicle.tenPercentAdd}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                type="number"
                label="Bid Amount"
                variant="outlined"
                value={vehicle.bidAmount}
                onChange={(e) => handleVehicleChange(index, "bidAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Bid Amount 10%"
                variant="outlined"
                value={vehicle.bidAmount10per}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                type="number"
                label="Recycle Amount"
                variant="outlined"
                value={vehicle.recycleAmount}
                onChange={(e) => handleVehicleChange(index, "recycleAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Commission Amount"
                variant="outlined"
                value={vehicle.commissionAmount}
                onChange={(e) => handleVehicleChange(index, "commissionAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Number Plate Tax"
                variant="outlined"
                value={vehicle.numberPlateTax}
                onChange={(e) => handleVehicleChange(index, "numberPlateTax", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Repair Charges"
                variant="outlined"
                value={vehicle.repairCharges}
                onChange={(e) => handleVehicleChange(index, "repairCharges", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Additional Amount"
                variant="outlined"
                value={vehicle.additionalAmount}
                onChange={(e) => handleVehicleChange(index, "additionalAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Total Amount (Yen)"
                variant="outlined"
                value={vehicle.totalAmount_yen}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                type="number"
                label="Total Amount (Dollars)"
                variant="outlined"
                value={vehicle.totalAmount_dollers}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Document Required</InputLabel>
                <Select
                  value={vehicle.isDocumentRequired}
                  onChange={(e) => handleVehicleChange(index, "isDocumentRequired", e.target.value)}
                  label="Document Required"
                >
                  <MenuItem value="">
                    <em>Select Document Requirement</em>
                  </MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Document Receive Date"
                variant="outlined"
                value={vehicle.documentReceiveDate ? vehicle.documentReceiveDate.split("T")[0] : ""}
                onChange={(e) => handleVehicleChange(index, "documentReceiveDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Ownership</InputLabel>
                <Select
                  value={vehicle.isOwnership}
                  onChange={(e) => handleVehicleChange(index, "isOwnership", e.target.value)}
                  label="Ownership"
                >
                  <MenuItem value="">
                    <em>Select Ownership</em>
                  </MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Ownership Date"
                variant="outlined"
                value={vehicle.ownershipDate ? vehicle.ownershipDate.split("T")[0] : ""}
                onChange={(e) => handleVehicleChange(index, "ownershipDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={vehicle.status}
                  onChange={(e) => handleVehicleChange(index, "status", e.target.value)}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                
                </Select>
              </FormControl>
              <TextField
                type="file"
                variant="outlined"
                onChange={(e) => handleVehicleChange(index, "vehicleImages", e.target.files)}
                inputProps={{ multiple: true, accept: "image/*" }}
                label="Upload Vehicle Images"
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
            {vehicle.vehicleImagePreviews && vehicle.vehicleImagePreviews.length > 0 && (
              <Box mt={2} display="grid" gridTemplateColumns="repeat(8, 1fr)" gap={1}>
                {vehicle.vehicleImagePreviews.map((src, imgIndex) => (
                  <Box key={imgIndex} position="relative" width={96} height={96}>
                    <img
                      src={src}
                      alt={`Preview ${imgIndex}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index, imgIndex)}
                      sx={{ position: "absolute", top: 4, right: 4, bgcolor: "red", color: "white" }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Paper>

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting}
        sx={{ mt: 2 }}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {submitting ? "Submitting..." : "Submit Invoice"}
      </Button>
    </Box>
  );
}