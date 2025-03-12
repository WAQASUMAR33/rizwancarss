"use client";
import { useEffect, useState } from "react";
import { TextField, Button as MuiButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { Plus, Trash } from "lucide-react";
import { useSelector } from "react-redux";

export default function NewCargoBooking() {
  const [vehicles, setVehicles] = useState([]);
  const [searchChassisNo, setSearchChassisNo] = useState("");
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
  const [loading, setLoading] = useState(false);
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

  // Sync admin_id and initialize containerDetails based on volume
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
        imageFile: null, // For file upload
      }));
      return {
        ...prev,
        added_by: userid || 0,
        admin_id: userid || 0,
        containerDetails: newContainerDetails,
      };
    });
  }, [userid, cargoData.volume, cargoData.bookingNo]);

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

    setCargoData((prev) => ({
      ...prev,
      freight_amount_dollars: freightAmount * exchangeRate,
      net_total_amount: netTotalAmount,
      net_total_amount_dollars: netTotalDollars,
      totalAmount1: totalAmount1,
      totalAmount1_dollars: totalAmount1Dollars,
      containerDetails: prev.containerDetails.map((container) => ({
        ...container,
        containerItems: container.containerItems.map((item) => ({
          ...item,
          amount: amountPerVehicle,
        })),
      })),
    }));
  }, [
    cargoData.freight_amount,
    cargoData.vanning_charges,
    cargoData.seal_amount,
    cargoData.surrender_fee,
    cargoData.bl_fee,
    cargoData.radiation_fee,
    cargoData.containerDetails,
    exchangeRate,
  ]);

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

  const addToCargo = (vehicle, containerIndex) => {
    fetch(`/api/admin/invoice-management/VehicleSearch/${vehicle.chassisNo}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch vehicle status");
        return response.json();
      })
      .then((result) => {
        const fullVehicle = result.data;
        if (fullVehicle.status === "Transport" || fullVehicle.status === "Inspection") {
          setCargoData((prev) => {
            const updatedContainers = [...prev.containerDetails];
            const newItemNo = updatedContainers[containerIndex].containerItems.length + 1;
            updatedContainers[containerIndex].containerItems.push({
              itemNo: newItemNo.toString(),
              vehicleId: fullVehicle.id,
              chassisNo: fullVehicle.chassisNo,
              year: fullVehicle.year.toString(),
              color: fullVehicle.color,
              cc: fullVehicle.engineType,
              amount: 0, // Will be updated by useEffect
            });
            return { ...prev, containerDetails: updatedContainers };
          });
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
      updatedContainers[containerIndex].containerItems = updatedContainers[containerIndex].containerItems
        .filter((_, i) => i !== itemIndex)
        .map((item, i) => ({ ...item, itemNo: (i + 1).toString() }));
      return { ...prev, containerDetails: updatedContainers };
    });
  };

  const handleInputChange = (field, value) => {
    setCargoData((prev) => ({ ...prev, [field]: value }));
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
    } catch (error) {
      console.error("Error submitting cargo booking data:", error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#f1f6f9] w-full h-full rounded p-4">
      <h1 className="text-3xl font-bold mb-4">New Cargo Booking</h1>

      {/* Cargo Booking Details */}
      <div className="p-4 border rounded-lg bg-white mb-4">
        <h2 className="text-xl font-semibold pb-2">Cargo Booking Details</h2>
        <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
          <TextField label="Actual Shipper" variant="outlined" value={cargoData.actualShipper} onChange={(e) => handleInputChange("actualShipper", e.target.value)} fullWidth />
          <TextField label="CY Open" variant="outlined" value={cargoData.cyOpen} onChange={(e) => handleInputChange("cyOpen", e.target.value)} fullWidth />
          <TextField label="Booking No" variant="outlined" value={cargoData.bookingNo} onChange={(e) => handleInputChange("bookingNo", e.target.value)} fullWidth />
          <TextField type="date" label="ETD" variant="outlined" value={cargoData.etd} onChange={(e) => handleInputChange("etd", e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField type="date" label="CY Cut Off" variant="outlined" value={cargoData.cyCutOff} onChange={(e) => handleInputChange("cyCutOff", e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField type="date" label="ETA" variant="outlined" value={cargoData.eta} onChange={(e) => handleInputChange("eta", e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField type="number" label="Volume (No. of Containers)" variant="outlined" value={cargoData.volume} onChange={(e) => handleInputChange("volume", e.target.value)} fullWidth />
          <TextField label="Carrier" variant="outlined" value={cargoData.carrier} onChange={(e) => handleInputChange("carrier", e.target.value)} fullWidth />
          <TextField label="Vessel" variant="outlined" value={cargoData.vessel} onChange={(e) => handleInputChange("vessel", e.target.value)} fullWidth />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Loading</InputLabel>
            <Select value={cargoData.portOfLoading} onChange={(e) => handleInputChange("portOfLoading", e.target.value)} label="Port of Loading">
              <MenuItem value=""><em>Select Port</em></MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>{port.title || port.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Discharge</InputLabel>
            <Select value={cargoData.portOfDischarge} onChange={(e) => handleInputChange("portOfDischarge", e.target.value)} label="Port of Discharge">
              <MenuItem value=""><em>Select Port</em></MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>{port.title || port.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Cargo Mode" variant="outlined" value={cargoData.cargoMode} onChange={(e) => handleInputChange("cargoMode", e.target.value)} fullWidth />
          <TextField label="Place of Issue" variant="outlined" value={cargoData.placeOfIssue} onChange={(e) => handleInputChange("placeOfIssue", e.target.value)} fullWidth />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Freight Term</InputLabel>
            <Select value={cargoData.freightTerm} onChange={(e) => handleInputChange("freightTerm", e.target.value)} label="Freight Term">
              <MenuItem value="pre paid">Pre Paid</MenuItem>
              <MenuItem value="collect">Collect</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Shipper Name" variant="outlined" value={cargoData.shipperName} onChange={(e) => handleInputChange("shipperName", e.target.value)} fullWidth />
          <TextField label="Consignee" variant="outlined" value={cargoData.consignee} onChange={(e) => handleInputChange("consignee", e.target.value)} fullWidth />
          <TextField label="Description of Goods" variant="outlined" value={cargoData.descriptionOfGoods} onChange={(e) => handleInputChange("descriptionOfGoods", e.target.value)} fullWidth />
          <TextField type="number" label="Freight Amount (Yen)" variant="outlined" value={cargoData.freight_amount} onChange={(e) => handleInputChange("freight_amount", e.target.value)} fullWidth />
          <TextField type="number" label="Vanning Charges (Yen)" variant="outlined" value={cargoData.vanning_charges} onChange={(e) => handleInputChange("vanning_charges", e.target.value)} fullWidth />
          <TextField type="number" label="Seal Amount (Yen)" variant="outlined" value={cargoData.seal_amount} onChange={(e) => handleInputChange("seal_amount", e.target.value)} fullWidth />
          <TextField type="number" label="Surrender Fee (Yen)" variant="outlined" value={cargoData.surrender_fee} onChange={(e) => handleInputChange("surrender_fee", e.target.value)} fullWidth />
          <TextField type="number" label="BL Fee (Yen)" variant="outlined" value={cargoData.bl_fee} onChange={(e) => handleInputChange("bl_fee", e.target.value)} fullWidth />
          <TextField type="number" label="Radiation Fee (Yen)" variant="outlined" value={cargoData.radiation_fee} onChange={(e) => handleInputChange("radiation_fee", e.target.value)} fullWidth />
          <TextField type="number" label="Net Total Amount (Yen)" variant="outlined" value={cargoData.net_total_amount.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
          <TextField type="number" label="Net Total Amount (USD)" variant="outlined" value={cargoData.net_total_amount_dollars.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt</label>
            <TextField type="file" variant="outlined" onChange={(e) => handleInputChange("receiptImage", e.target.files)} inputProps={{ accept: "image/*" }} fullWidth />
            {imagePreview && <img src={imagePreview} alt="Receipt Preview" className="w-32 h-32 object-cover rounded-lg border mt-2" />}
          </div>
        </div>
      </div>

      {/* Container Details */}
      {cargoData.containerDetails.map((container, index) => (
        <div key={index} className="p-4 border rounded-lg bg-white mb-4">
          <h2 className="text-xl font-semibold pb-2">Container {index + 1} Details</h2>
          <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
            <TextField label="Consignee Name" variant="outlined" value={container.consigneeName} onChange={(e) => updateContainerDetail(index, "consigneeName", e.target.value)} fullWidth />
            <TextField label="Notify Party" variant="outlined" value={container.notifyParty} onChange={(e) => updateContainerDetail(index, "notifyParty", e.target.value)} fullWidth />
            <TextField label="Shipper Per" variant="outlined" value={container.shipperPer} onChange={(e) => updateContainerDetail(index, "shipperPer", e.target.value)} fullWidth />
            <TextField label="Note" variant="outlined" value={container.note} onChange={(e) => updateContainerDetail(index, "note", e.target.value)} fullWidth />
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Container Image</label>
              <TextField type="file" variant="outlined" onChange={(e) => handleContainerImageChange(index, e.target.files)} inputProps={{ accept: "image/*" }} fullWidth />
              {container.imagePath && <img src={container.imagePath} alt={`Container ${index + 1} Preview`} className="w-32 h-32 object-cover rounded-lg border mt-2" />}
            </div>
          </div>

          {/* Search Vehicle for this Container */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold pb-2">Search Vehicle for Container {index + 1}</h3>
            <div className="flex gap-4 items-center">
              <TextField label="Enter Chassis Number" variant="outlined" value={searchChassisNo} onChange={(e) => setSearchChassisNo(e.target.value)} fullWidth />
              <MuiButton variant="contained" color="success" onClick={searchVehicle} disabled={loading} startIcon={<Plus />}>
                {loading ? "Searching..." : "Search"}
              </MuiButton>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {vehicles.map((vehicle, vIndex) => (
              <div key={vIndex} className="mt-4 p-2 border rounded flex justify-between items-center">
                <div>
                  <p>Vehicle ID: {vehicle.id}</p>
                  <p>Chassis No: {vehicle.chassisNo}</p>
                  <p>Maker: {vehicle.maker}</p>
                  <p>Year: {vehicle.year}</p>
                </div>
                <MuiButton variant="contained" color="success" onClick={() => addToCargo(vehicle, index)} startIcon={<Plus />}>
                  Add to Container {index + 1}
                </MuiButton>
              </div>
            ))}
          </div>

          {/* Container Items */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold pb-2">Container {index + 1} Items</h3>
            {container.containerItems.length === 0 ? (
              <p>No items added yet</p>
            ) : (
              <div className="grid md:grid-cols-7 grid-cols-1 gap-4 font-semibold mb-2">
                <span>Item No</span>
                <span>Vehicle ID</span>
                <span>Chassis No</span>
                <span>Year</span>
                <span>Color</span>
                <span>CC</span>
                <span>Amount (USD)</span>
              </div>
            )}
            {container.containerItems.map((item, itemIndex) => (
              <div key={itemIndex} className="grid md:grid-cols-7 grid-cols-1 gap-4 mb-2 items-center">
                <span>{item.itemNo}</span>
                <span>{item.vehicleId}</span>
                <span>{item.chassisNo}</span>
                <span>{item.year}</span>
                <span>{item.color}</span>
                <span>{item.cc}</span>
                <TextField type="number" variant="outlined" value={item.amount.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
                <MuiButton variant="contained" color="error" onClick={() => removeVehicle(index, itemIndex)} startIcon={<Trash />}>
                  Remove
                </MuiButton>
              </div>
            ))}
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