"use client";
import { useEffect, useState } from "react";
import {
  TextField,
  Button as MuiButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Plus, Trash } from "lucide-react";
import { useSelector } from "react-redux";

export default function NewCargoBooking() {
  const [allVehicles, setAllVehicles] = useState([]); // Store all vehicles for dropdown
  const [selectedVehicles, setSelectedVehicles] = useState({}); // Track selected vehicle for each container
  const [seaPorts, setSeaPorts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0.0067); // Default JPY to USD rate
  const [cargoData, setCargoData] = useState({
    actualShipper: "",
    cyOpen: "",
    bookingNo: "",
    etd: "",
    cyCutOff: "",
    eta: "",
    volume: 0,
    carrier: "",
    vessel: "",
    portOfLoading: "",
    portOfDischarge: "",
    cargoMode: "",
    placeOfIssue: "",
    freightTerm: "pre paid", // Default value
    shipperName: "",
    consignee: "",
    descriptionOfGoods: "",
    vanning_charges: 0,
    seal_amount: 0,
    surrender_fee: 0,
    bl_fee: 0,
    radiation_fee: 0,
    totalAmount1: 0,
    totalAmount1_dollars: 0,
    freight_amount: 0,
    freight_amount_dollars: 0,
    net_total_amount: 0,
    net_total_amount_dollars: 0,
    imagePath: "",
    added_by: 0,
    admin_id: 0,
    containerDetails: [], // Array of container details based on volume
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}/pair/JPY/USD`
        );
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        const data = await response.json();
        setExchangeRate(data.conversion_rate || 0.0067);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };
    fetchExchangeRate();
  }, []);

  // Fetch all vehicles with status "Transport" or "Inspection"
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/admin/vehicles");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch vehicles");
        }
        const vehiclesData = await response.json();
        const vehiclesArray = vehiclesData.data || vehiclesData;
        if (!Array.isArray(vehiclesArray)) {
          throw new Error("Vehicles data is not an array");
        }

        // Filter vehicles with status "Transport" or "Inspection"
        const filteredVehicles = vehiclesArray
          .filter((vehicle) => vehicle.status === "Transport" || vehicle.status === "Inspection")
          .map((vehicle) => ({
            id: vehicle.id,
            chassisNo: vehicle.chassisNo,
            maker: vehicle.maker,
            year: vehicle.year,
            color: vehicle.color,
            engineType: vehicle.engineType,
            status: vehicle.status,
          }));

        setAllVehicles(filteredVehicles);
        setError("");
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Error fetching vehicles: " + err.message);
        setAllVehicles([]);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch sea ports
  useEffect(() => {
    const fetchSeaPorts = async () => {
      try {
        const response = await fetch("/api/admin/sea_ports");
        if (!response.ok) throw new Error("Failed to fetch sea ports");
        const ports = await response.json();
        setSeaPorts(ports.data || ports);
      } catch (err) {
        setError("Error fetching sea ports: " + err.message);
      }
    };
    fetchSeaPorts();
  }, []);

  // Initialize containerDetails and admin_id only when userid changes
  useEffect(() => {
    setCargoData((prev) => {
      const volume = parseInt(prev.volume) || 0;
      const newContainerDetails = Array.from({ length: volume }, (_, i) => ({
        consigneeName: "",
        notifyParty: "",
        shipperPer: "",
        bookingNo: prev.bookingNo,
        note: "",
        imagePath: "",
        added_by: userid || 0,
        admin_id: userid || 0,
        containerItems: [],
        imageFile: null,
      }));
      return {
        ...prev,
        added_by: userid || 0,
        admin_id: userid || 0,
        containerDetails: newContainerDetails,
      };
    });
    setSelectedVehicles({});
  }, [userid]);

  // Update containerDetails when volume changes
  useEffect(() => {
    setCargoData((prev) => {
      const volume = parseInt(prev.volume) || 0;
      const currentLength = prev.containerDetails.length;
      let newContainerDetails = [...prev.containerDetails];

      if (volume > currentLength) {
        // Add new containers
        newContainerDetails = [
          ...newContainerDetails,
          ...Array.from({ length: volume - currentLength }, (_, i) => ({
            consigneeName: "",
            notifyParty: "",
            shipperPer: "",
            bookingNo: prev.bookingNo,
            note: "",
            imagePath: "",
            added_by: userid || 0,
            admin_id: userid || 0,
            containerItems: [],
            imageFile: null,
          })),
        ];
      } else if (volume < currentLength) {
        // Remove excess containers
        newContainerDetails = newContainerDetails.slice(0, volume);
      }

      return {
        ...prev,
        containerDetails: newContainerDetails,
      };
    });
  }, [cargoData.volume, userid]);

  // Calculate totals and distribute net_total_amount_dollars across vehicles
  useEffect(() => {
    const freightAmount = parseFloat(cargoData.freight_amount) || 0;
    const vanning = parseFloat(cargoData.vanning_charges) || 0;
    const seal = parseFloat(cargoData.seal_amount) || 0;
    const surrender = parseFloat(cargoData.surrender_fee) || 0;
    const bl = parseFloat(cargoData.bl_fee) || 0;
    const radiation = parseFloat(cargoData.radiation_fee) || 0;

    const netTotalAmount = freightAmount + vanning + seal + surrender + bl + radiation;
    const netTotalDollars = netTotalAmount * exchangeRate;
    const totalAmount1 = freightAmount; // Assuming totalAmount1 is freight only in Yen
    const totalAmount1Dollars = totalAmount1 * exchangeRate;

    const totalVehicles = cargoData.containerDetails.reduce(
      (sum, container) => sum + container.containerItems.length,
      0
    );
    const amountPerVehicle = totalVehicles > 0 ? netTotalDollars / totalVehicles : 0;

    setCargoData((prev) => {
      // Check if we need to update containerDetails
      const shouldUpdateItems = prev.containerDetails.some((container) =>
        container.containerItems.some((item) => item.amount !== amountPerVehicle)
      );

      if (
        prev.freight_amount_dollars === freightAmount * exchangeRate &&
        prev.net_total_amount === netTotalAmount &&
        prev.net_total_amount_dollars === netTotalDollars &&
        prev.totalAmount1 === totalAmount1 &&
        prev.totalAmount1_dollars === totalAmount1Dollars &&
        !shouldUpdateItems
      ) {
        return prev; // No update needed
      }

      return {
        ...prev,
        freight_amount_dollars: freightAmount * exchangeRate,
        net_total_amount: netTotalAmount,
        net_total_amount_dollars: netTotalDollars,
        totalAmount1: totalAmount1,
        totalAmount1_dollars: totalAmount1Dollars,
        containerDetails: shouldUpdateItems
          ? prev.containerDetails.map((container) => ({
              ...container,
              containerItems: container.containerItems.map((item) => ({
                ...item,
                amount: amountPerVehicle,
              })),
            }))
          : prev.containerDetails,
      };
    });
  }, [
    cargoData.freight_amount,
    cargoData.vanning_charges,
    cargoData.seal_amount,
    cargoData.surrender_fee,
    cargoData.bl_fee,
    cargoData.radiation_fee,
    exchangeRate,
  ]);

  const handleVehicleSelect = (containerIndex, vehicle) => {
    setSelectedVehicles((prev) => ({
      ...prev,
      [containerIndex]: vehicle || null,
    }));
    setError("");
  };

  const addToCargo = (containerIndex) => {
    const vehicle = selectedVehicles[containerIndex];
    if (!vehicle) {
      setError("Please select a vehicle to add.");
      return;
    }

    // Check if vehicle is already added in any container
    const isAlreadyAdded = cargoData.containerDetails.some((container) =>
      container.containerItems.some((item) => item.vehicleId === vehicle.id)
    );
    if (isAlreadyAdded) {
      setError(`Vehicle with Chassis No ${vehicle.chassisNo} is already added to a container.`);
      return;
    }

    // Add vehicle to container
    setCargoData((prev) => {
      const updatedContainers = [...prev.containerDetails];
      const containerItems = updatedContainers[containerIndex].containerItems;
      const newItemNo = containerItems.length + 1;

      // Ensure the vehicle isn't already in the containerItems
      if (!containerItems.some((item) => item.vehicleId === vehicle.id)) {
        updatedContainers[containerIndex].containerItems.push({
          itemNo: newItemNo.toString(),
          vehicleId: vehicle.id,
          chassisNo: vehicle.chassisNo,
          year: vehicle.year.toString(),
          color: vehicle.color,
          cc: vehicle.engineType,
          amount: 0, // Will be updated by useEffect
        });
      }

      return { ...prev, containerDetails: updatedContainers };
    });

    // Reset the selected vehicle for this container
    setSelectedVehicles((prev) => ({
      ...prev,
      [containerIndex]: null,
    }));
    setError("");
  };

  const updateContainerDetail = (index, field, value) => {
    setCargoData((prev) => {
      const updatedContainers = [...prev.containerDetails];
      updatedContainers[index][field] = value;
      return { ...prev, containerDetails: updatedContainers };
    });
  };

  const handleContainerImageChange = (index, files) => {
    const file = files[0];
    setCargoData((prev) => {
      const updatedContainers = [...prev.containerDetails];
      updatedContainers[index].imageFile = file;
      updatedContainers[index].imagePath = file ? URL.createObjectURL(file) : "";
      return { ...prev, containerDetails: updatedContainers };
    });
  };

  const removeVehicle = (containerIndex, itemIndex) => {
    setCargoData((prev) => {
      const updatedContainers = [...prev.containerDetails];
      updatedContainers[containerIndex].containerItems = updatedContainers[
        containerIndex
      ].containerItems
        .filter((_, i) => i !== itemIndex)
        .map((item, i) => ({ ...item, itemNo: (i + 1).toString() }));
      return { ...prev, containerDetails: updatedContainers };
    });
  };

  const handleInputChange = (field, value) => {
    setCargoData((prev) => {
      const updatedValue = field === "volume" ? parseInt(value) || 0 : value;
      return { ...prev, [field]: updatedValue };
    });
    if (field === "receiptImage" && value) {
      setImagePreview(value[0] ? URL.createObjectURL(value[0]) : null);
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

      let bookingImagePath = "";
      if (cargoData.receiptImage) {
        const base64Image = await convertToBase64(cargoData.receiptImage[0]);
        bookingImagePath = await uploadImageToServer(base64Image);
        if (!bookingImagePath) throw new Error("Failed to upload booking receipt image");
      }

      const containerDetailsWithImages = await Promise.all(
        cargoData.containerDetails.map(async (container) => {
          let containerImagePath = container.imagePath;
          if (container.imageFile) {
            const base64Image = await convertToBase64(container.imageFile);
            containerImagePath = await uploadImageToServer(base64Image);
            if (!containerImagePath) throw new Error("Failed to upload container image");
          }
          return { ...container, imagePath: containerImagePath || "" };
        })
      );

      const payload = {
        actualShipper: cargoData.actualShipper,
        cyOpen: cargoData.cyOpen,
        bookingNo: cargoData.bookingNo,
        etd: cargoData.etd,
        cyCutOff: cargoData.cyCutOff,
        eta: cargoData.eta,
        volume: parseInt(cargoData.volume) || 0,
        carrier: cargoData.carrier,
        vessel: cargoData.vessel,
        portOfLoading: cargoData.portOfLoading,
        portOfDischarge: cargoData.portOfDischarge,
        cargoMode: cargoData.cargoMode,
        placeOfIssue: cargoData.placeOfIssue,
        freightTerm: cargoData.freightTerm,
        shipperName: cargoData.shipperName,
        consignee: cargoData.consignee,
        descriptionOfGoods: cargoData.descriptionOfGoods,
        vanning_charges: parseFloat(cargoData.vanning_charges) || 0,
        seal_amount: parseFloat(cargoData.seal_amount) || 0,
        surrender_fee: parseFloat(cargoData.surrender_fee) || 0,
        bl_fee: parseFloat(cargoData.bl_fee) || 0,
        radiation_fee: parseFloat(cargoData.radiation_fee) || 0,
        totalAmount1: cargoData.totalAmount1,
        totalAmount1_dollars: cargoData.totalAmount1_dollars,
        freight_amount: cargoData.freight_amount,
        freight_amount_dollars: cargoData.freight_amount_dollars,
        net_total_amount: cargoData.net_total_amount,
        net_total_amount_dollars: cargoData.net_total_amount_dollars,
        imagePath: bookingImagePath || "",
        added_by: cargoData.added_by,
        admin_id: cargoData.admin_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        containerDetails: containerDetailsWithImages.map((container) => ({
          consigneeName: container.consigneeName,
          notifyParty: container.notifyParty,
          shipperPer: container.shipperPer,
          bookingNo: container.bookingNo,
          note: container.note,
          imagePath: container.imagePath,
          added_by: container.added_by,
          admin_id: container.admin_id,
          containerItemDetails: container.containerItems.map((item) => ({
            itemNo: item.itemNo,
            vehicleId: item.vehicleId,
            chassisNo: item.chassisNo,
            year: item.year,
            color: item.color,
            cc: item.cc,
            amount: item.amount,
          })),
        })),
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit cargo booking data");
      }

      alert("Cargo booking data submitted successfully!");
      setCargoData({
        actualShipper: "",
        cyOpen: "",
        bookingNo: "",
        etd: "",
        cyCutOff: "",
        eta: "",
        volume: 0,
        carrier: "",
        vessel: "",
        portOfLoading: "",
        portOfDischarge: "",
        cargoMode: "",
        placeOfIssue: "",
        freightTerm: "pre paid",
        shipperName: "",
        consignee: "",
        descriptionOfGoods: "",
        vanning_charges: 0,
        seal_amount: 0,
        surrender_fee: 0,
        bl_fee: 0,
        radiation_fee: 0,
        totalAmount1: 0,
        totalAmount1_dollars: 0,
        freight_amount: 0,
        freight_amount_dollars: 0,
        net_total_amount: 0,
        net_total_amount_dollars: 0,
        imagePath: "",
        added_by: 0,
        admin_id: 0,
        containerDetails: [],
      });
      setImagePreview(null);
      setSelectedVehicles({});
    } catch (error) {
      console.error("Error submitting cargo booking data:", error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white w-full h-full rounded p-4">
      <h1 className="text-3xl font-bold mb-4">New Cargo Booking</h1>

      {/* Cargo Booking Details */}
      <div className="p-4 border rounded-lg bg-white mb-4">
        <h2 className="text-xl font-semibold pb-2">Cargo Booking Details</h2>
        <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
          <TextField
            label="Actual Shipper"
            variant="outlined"
            value={cargoData.actualShipper}
            onChange={(e) => handleInputChange("actualShipper", e.target.value)}
            fullWidth
          />
          <TextField
            label="CY Open"
            variant="outlined"
            value={cargoData.cyOpen}
            onChange={(e) => handleInputChange("cyOpen", e.target.value)}
            fullWidth
          />
          <TextField
            label="Booking No"
            variant="outlined"
            value={cargoData.bookingNo}
            onChange={(e) => handleInputChange("bookingNo", e.target.value)}
            fullWidth
          />
          <TextField
            type="date"
            label="ETD"
            variant="outlined"
            value={cargoData.etd}
            onChange={(e) => handleInputChange("etd", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="CY Cut Off"
            variant="outlined"
            value={cargoData.cyCutOff}
            onChange={(e) => handleInputChange("cyCutOff", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="ETA"
            variant="outlined"
            value={cargoData.eta}
            onChange={(e) => handleInputChange("eta", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="number"
            label="Volume (No. of Containers)"
            variant="outlined"
            value={cargoData.volume}
            onChange={(e) => handleInputChange("volume", e.target.value)}
            fullWidth
          />
          <TextField
            label="Carrier"
            variant="outlined"
            value={cargoData.carrier}
            onChange={(e) => handleInputChange("carrier", e.target.value)}
            fullWidth
          />
          <TextField
            label="Vessel"
            variant="outlined"
            value={cargoData.vessel}
            onChange={(e) => handleInputChange("vessel", e.target.value)}
            fullWidth
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Loading</InputLabel>
            <Select
              value={cargoData.portOfLoading}
              onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
              label="Port of Loading"
            >
              <MenuItem value="">
                <em>Select Port</em>
              </MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>
                  {port.title || port.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Discharge</InputLabel>
            <Select
              value={cargoData.portOfDischarge}
              onChange={(e) => handleInputChange("portOfDischarge", e.target.value)}
              label="Port of Discharge"
            >
              <MenuItem value="">
                <em>Select Port</em>
              </MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>
                  {port.title || port.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Cargo Mode"
            variant="outlined"
            value={cargoData.cargoMode}
            onChange={(e) => handleInputChange("cargoMode", e.target.value)}
            fullWidth
          />
          <TextField
            label="Place of Issue"
            variant="outlined"
            value={cargoData.placeOfIssue}
            onChange={(e) => handleInputChange("placeOfIssue", e.target.value)}
            fullWidth
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Freight Term</InputLabel>
            <Select
              value={cargoData.freightTerm}
              onChange={(e) => handleInputChange("freightTerm", e.target.value)}
              label="Freight Term"
            >
              <MenuItem value="pre paid">Pre Paid</MenuItem>
              <MenuItem value="collect">Collect</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Shipper Name"
            variant="outlined"
            value={cargoData.shipperName}
            onChange={(e) => handleInputChange("shipperName", e.target.value)}
            fullWidth
          />
          <TextField
            label="Consignee"
            variant="outlined"
            value={cargoData.consignee}
            onChange={(e) => handleInputChange("consignee", e.target.value)}
            fullWidth
          />
          <TextField
            label="Description of Goods"
            variant="outlined"
            value={cargoData.descriptionOfGoods}
            onChange={(e) => handleInputChange("descriptionOfGoods", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Freight Amount (Yen)"
            variant="outlined"
            value={cargoData.freight_amount}
            onChange={(e) => handleInputChange("freight_amount", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Vanning Charges (Yen)"
            variant="outlined"
            value={cargoData.vanning_charges}
            onChange={(e) => handleInputChange("vanning_charges", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Seal Amount (Yen)"
            variant="outlined"
            value={cargoData.seal_amount}
            onChange={(e) => handleInputChange("seal_amount", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Surrender Fee (Yen)"
            variant="outlined"
            value={cargoData.surrender_fee}
            onChange={(e) => handleInputChange("surrender_fee", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="BL Fee (Yen)"
            variant="outlined"
            value={cargoData.bl_fee}
            onChange={(e) => handleInputChange("bl_fee", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Radiation Fee (Yen)"
            variant="outlined"
            value={cargoData.radiation_fee}
            onChange={(e) => handleInputChange("radiation_fee", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Net Total Amount (Yen)"
            variant="outlined"
            value={cargoData.net_total_amount.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            type="number"
            label="Net Total Amount (USD)"
            variant="outlined"
            value={cargoData.net_total_amount_dollars.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Receipt
            </label>
            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("receiptImage", e.target.files)}
              inputProps={{ accept: "image/*" }}
              fullWidth
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Receipt Preview"
                className="w-32 h-32 object-cover rounded-lg border mt-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* Container Details */}
      {cargoData.containerDetails.map((container, index) => (
        <div key={index} className="p-4 border rounded-lg bg-white mb-4">
          <h2 className="text-xl font-semibold pb-2">Container {index + 1} Details</h2>
          <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
            <TextField
              label="Consignee Name"
              variant="outlined"
              value={container.consigneeName}
              onChange={(e) =>
                updateContainerDetail(index, "consigneeName", e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Notify Party"
              variant="outlined"
              value={container.notifyParty}
              onChange={(e) =>
                updateContainerDetail(index, "notifyParty", e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Shipper Per"
              variant="outlined"
              value={container.shipperPer}
              onChange={(e) =>
                updateContainerDetail(index, "shipperPer", e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Note"
              variant="outlined"
              value={container.note}
              onChange={(e) => updateContainerDetail(index, "note", e.target.value)}
              fullWidth
            />
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container Image
              </label>
              <TextField
                type="file"
                variant="outlined"
                onChange={(e) => handleContainerImageChange(index, e.target.files)}
                inputProps={{ accept: "image/*" }}
                fullWidth
              />
              {container.imagePath && (
                <img
                  src={container.imagePath}
                  alt={`Container ${index + 1} Preview`}
                  className="w-32 h-32 object-cover rounded-lg border mt-2"
                />
              )}
            </div>
          </div>

          {/* Select Vehicle for this Container */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold pb-2">
              Select Vehicle for Container {index + 1}
            </h3>
            <div className="flex gap-4 items-center">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Select Vehicle</InputLabel>
                <Select
                  value={selectedVehicles[index] || ""}
                  onChange={(e) => handleVehicleSelect(index, e.target.value)}
                  label="Select Vehicle"
                  renderValue={(selected) =>
                    selected
                      ? `${selected.chassisNo} - ${selected.maker} (${selected.year})`
                      : "Select a vehicle"
                  }
                >
                  <MenuItem value="">
                    <em>Select a vehicle</em>
                  </MenuItem>
                  {allVehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle}>
                      {`${vehicle.chassisNo} - ${vehicle.maker} (${vehicle.year}) - ${vehicle.status}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <MuiButton
                variant="contained"
                color="success"
                onClick={() => addToCargo(index)}
                startIcon={<Plus />}
                disabled={!selectedVehicles[index]}
              >
                Add
              </MuiButton>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>

          {/* Container Items */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold pb-2">
              Container {index + 1} Items
            </h3>
            {container.containerItems.length === 0 ? (
              <p>No items added yet</p>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item No</TableCell>
                      <TableCell>Vehicle ID</TableCell>
                      <TableCell>Chassis No</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>CC</TableCell>
                      <TableCell>Amount (USD)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {container.containerItems.map((item, itemIndex) => (
                      <TableRow key={item.vehicleId + "-" + itemIndex}>
                        <TableCell>{item.itemNo}</TableCell>
                        <TableCell>{item.vehicleId}</TableCell>
                        <TableCell>{item.chassisNo}</TableCell>
                        <TableCell>{item.year}</TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.cc}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            variant="outlined"
                            value={item.amount.toFixed(2)}
                            InputProps={{ readOnly: true }}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <MuiButton
                            variant="contained"
                            color="error"
                            onClick={() => removeVehicle(index, itemIndex)}
                            startIcon={<Trash />}
                            size="small"
                          >
                            Remove
                          </MuiButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>
      ))}

      <MuiButton
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting || cargoData.containerDetails.some((c) => c.containerItems.length === 0)}
        className="mt-4"
      >
        {submitting ? "Submitting..." : "Submit Cargo Booking"}
      </MuiButton>
    </div>
  );
}