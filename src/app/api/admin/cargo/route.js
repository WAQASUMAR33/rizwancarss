import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    const {
      actualShipper,
      cyOpen,
      bookingNo,
      etd,
      cyCutOff,
      eta,
      volume,
      carrier,
      vessel,
      portOfLoading,
      portOfDischarge,
      cargoMode,
      placeOfIssue,
      freightTerm,
      shipperName,
      consignee,
      descriptionOfGoods,
      vanning_charges = 0,
      seal_amount = 0,
      surrender_fee = 0,
      bl_fee = 0,
      radiation_fee = 0,
      totalAmount1 = 0,
      totalAmount1_dollars = 0,
      freight_amount = 0,
      freight_amount_dollars = 0,
      net_total_amount = 0,
      net_total_amount_dollars = 0,
      imagePath,
      added_by,
      admin_id,
      createdAt,
      updatedAt,
      containerDetails,
    } = data;

    // Validation
    if (!bookingNo || !volume || !containerDetails || containerDetails.length !== volume) {
      return NextResponse.json(
        { error: "Missing or invalid required fields (bookingNo, volume, containerDetails)", status: false },
        { status: 400 }
      );
    }

    for (const container of containerDetails) {
      if (!container.containerItemDetails || container.containerItemDetails.length === 0) {
        return NextResponse.json(
          { error: "Each ContainerDetail must include at least one ContainerItemDetail", status: false },
          { status: 400 }
        );
      }
      for (const item of container.containerItemDetails) {
        if (!item.vehicleId) {
          return NextResponse.json(
            { error: "Each ContainerItemDetail must include a vehicleId", status: false },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate bookingNo
    const existingBooking = await prisma.containerBooking.findUnique({
      where: { bookingNo },
    });
    if (existingBooking) {
      return NextResponse.json(
        { error: `Booking number '${bookingNo}' already exists`, status: false },
        { status: 409 }
      );
    }

    // Fetch vehicle data
    const vehicleIds = containerDetails.flatMap((container) =>
      container.containerItemDetails.map((item) => item.vehicleId)
    );
    console.log("Fetching vehicles with IDs:", vehicleIds);
    const vehicleData = await prisma.addVehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, admin_id: true },
    });
    console.log("Fetched vehicle data:", JSON.stringify(vehicleData, null, 2));

    const foundVehicleIds = vehicleData.map((v) => v.id);
    const missingVehicleIds = vehicleIds.filter((id) => !foundVehicleIds.includes(id));
    if (missingVehicleIds.length > 0) {
      return NextResponse.json(
        { error: `Vehicle(s) not found: ${missingVehicleIds.join(", ")}`, status: false },
        { status: 404 }
      );
    }

    // Map vehicle IDs to admin_ids
    const vehicleAdminMap = vehicleData.reduce((map, vehicle) => {
      map[vehicle.id] = vehicle.admin_id;
      return map;
    }, {});

    // Fetch admin balances
    const uniqueAdminIds = [...new Set([...Object.values(vehicleAdminMap), admin_id].filter(Boolean))];
    console.log("Fetching admins with IDs:", uniqueAdminIds);
    const adminData = await prisma.admin.findMany({
      where: { id: { in: uniqueAdminIds } },
      select: { id: true, balance: true },
    });
    console.log("Fetched admin data:", JSON.stringify(adminData, null, 2));

    const adminBalanceMap = adminData.reduce((map, admin) => {
      map[admin.id] = admin.balance;
      return map;
    }, {});
    const missingAdmins = uniqueAdminIds.filter((id) => !adminBalanceMap[id] && adminBalanceMap[id] !== 0);
    if (missingAdmins.length > 0) {
      return NextResponse.json(
        { error: `Admin(s) not found: ${missingAdmins.join(", ")}`, status: false },
        { status: 404 }
      );
    }

    // Prepare Prisma operations
    const operations = [];

    // Create ContainerBooking
    operations.push(
      prisma.containerBooking.create({
        data: {
          actualShipper,
          cyOpen,
          bookingNo,
          etd: new Date(etd),
          cyCutOff: new Date(cyCutOff),
          eta: new Date(eta),
          volume: parseInt(volume),
          carrier,
          vessel,
          portOfLoading,
          portOfDischarge,
          cargoMode,
          placeOfIssue,
          freightTerm,
          shipperName,
          consignee,
          descriptionOfGoods: descriptionOfGoods || "",
          vanning_charges: parseFloat(vanning_charges) || 0,
          seal_amount: parseFloat(seal_amount) || 0,
          surrender_fee: parseFloat(surrender_fee) || 0,
          bl_fee: parseFloat(bl_fee) || 0,
          radiation_fee: parseFloat(radiation_fee) || 0,
          totalAmount1: parseFloat(totalAmount1) || 0,
          totalAmount1_dollars: parseFloat(totalAmount1_dollars) || 0,
          freight_amount: parseFloat(freight_amount) || 0,
          freight_amount_dollars: parseFloat(freight_amount_dollars) || 0,
          net_total_amount: parseFloat(net_total_amount) || 0,
          net_total_amount_dollars: parseFloat(net_total_amount_dollars) || 0,
          imagePath: imagePath || "",
          added_by: parseInt(added_by) || 0,
          admin_id: parseInt(admin_id) || 0,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
          containerDetails: {
            create: containerDetails.map((container) => ({
              consigneeName: container.consigneeName,
              notifyParty: container.notifyParty,
              shipperPer: container.shipperPer,
              bookingNo: container.bookingNo,
              note: container.note || "",
              imagePath: container.imagePath || "",
              added_by: parseInt(container.added_by) || 0,
              admin_id: parseInt(container.admin_id) || 0,
            })),
          },
        },
        include: { containerDetails: true },
      })
    );

    // Create ContainerItemDetail and update AddVehicle
    containerDetails.forEach((container) => {
      container.containerItemDetails.forEach((item) => {
        operations.push(
          prisma.containerItemDetail.create({
            data: {
              itemNo: item.itemNo,
              chassisNo: item.chassisNo || "",
              year: item.year || "",
              color: item.color || "",
              cc: item.cc || "",
              amount: parseFloat(item.amount) || 0,
              vehicleId: parseInt(item.vehicleId),
              containerDetailId: null, // Updated later
              added_by: parseInt(added_by) || 0,
              admin_id: vehicleAdminMap[item.vehicleId] || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
        );
        operations.push(
          prisma.addVehicle.update({
            where: { id: parseInt(item.vehicleId) },
            data: { status: "Shipped", updatedAt: new Date() },
          })
        );
      });
    });

    // Admin balance updates
    const adminUpdates = {};
    containerDetails.forEach((container) => {
      container.containerItemDetails.forEach((item) => {
        const vehicleAdminId = vehicleAdminMap[item.vehicleId];
        if (!adminUpdates[vehicleAdminId]) {
          adminUpdates[vehicleAdminId] = { totalDebit: 0, totalCredit: 0, vehicleCount: 0 };
        }
        adminUpdates[vehicleAdminId].vehicleCount += 1;
        if (freightTerm.toLowerCase() === "pre paid") {
          adminUpdates[vehicleAdminId].totalDebit += parseFloat(net_total_amount_dollars) || 0;
        } else if (freightTerm.toLowerCase() === "collect") {
          adminUpdates[vehicleAdminId].totalCredit += parseFloat(totalAmount1_dollars) || 0;
        }
      });
    });

    for (const [adminId, { totalDebit, totalCredit }] of Object.entries(adminUpdates)) {
      const currentBalance = adminBalanceMap[adminId] || 0;
      const newBalance = currentBalance - totalDebit + totalCredit;

      operations.push(
        prisma.admin.update({
          where: { id: parseInt(adminId) },
          data: { balance: newBalance },
        })
      );
    }

    // Execute transaction
    console.log("Executing transaction with operations:", operations.length);
    const results = await prisma.$transaction(operations, {
      maxWait: 10000,
      timeout: 20000,
    });
    console.log("Transaction results:", JSON.stringify(results, null, 2));

    // Update ContainerItemDetail with containerDetailId
    const createdBooking = results[0];
    const containerDetailIds = createdBooking.containerDetails.map((cd) => cd.id);
    let operationIndex = 1;
    for (let i = 0; i < containerDetails.length; i++) {
      const container = containerDetails[i];
      for (let j = 0; j < container.containerItemDetails.length; j++) {
        const itemResult = results[operationIndex];
        operationIndex += 2; // Skip AddVehicle update
        console.log(`Updating ContainerItemDetail ID ${itemResult.id} with containerDetailId ${containerDetailIds[i]}`);
        await prisma.containerItemDetail.update({
          where: { id: itemResult.id },
          data: { containerDetailId: containerDetailIds[i] },
        });
      }
    }

    console.log("Created cargo booking:", JSON.stringify(createdBooking, null, 2));
    return NextResponse.json(
      {
        message: "Cargo booking created successfully",
        status: true,
        data: createdBooking,
      },
      { status: 201 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        error: "Internal server error",
        status: false,
        details: error.message || "Unknown error occurred",
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request) {
  try {
    // Fetch all ContainerBookings with nested containerDetails
    const cargoBookings = await prisma.containerBooking.findMany({
      include: {
        containerDetails: true, // Include nested ContainerDetail records
      },
    });

    // Fetch all ContainerItemDetails separately and group by bookingNo
    const containerItemDetails = await prisma.containerItemDetail.findMany({
      include: {
        vehicle: true, // Include related AddVehicle data
      },
    });

    // Join ContainerItemDetails with ContainerBookings manually
    const cargoBookingsWithItems = cargoBookings.map((booking) => {
      const relatedItems = containerItemDetails.filter((item) => {
        // Assuming you might need to fetch items by bookingNo or another relation
        // Since ContainerItemDetail doesn’t directly link to ContainerBooking in schema,
        // you might need a custom query or additional relation
        // Here, we assume items are fetched separately and matched by vehicleId or another logic
        return booking.containerItemDetails?.some((detail) => detail.vehicleId === item.vehicleId) || true; // Adjust this logic
      });
      return {
        ...booking,
        containerItemDetails: relatedItems,
      };
    });

    console.log('Fetched cargo bookings with joined data:', cargoBookingsWithItems);

    return NextResponse.json(
      {
        message: 'Cargo bookings fetched successfully',
        status: true,
        data: cargoBookingsWithItems,
      },
      { status: 200 }
    );
  } catch (error) {
   
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: false,
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}