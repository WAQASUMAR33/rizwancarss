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
      booking_service_charges = 0,
      other_amount = 0,
      paid_status = "UnPaid",
      comments = "",
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
    if (!bookingNo || !volume || !containerDetails || containerDetails.length !== parseInt(volume)) {
      console.log("Validation failed: Missing or invalid required fields");
      return NextResponse.json(
        { error: "Missing or invalid required fields (bookingNo, volume, containerDetails)", status: false },
        { status: 400 }
      );
    }

    if (!["Paid", "UnPaid"].includes(paid_status)) {
      console.log("Validation failed: Invalid paid_status:", paid_status);
      return NextResponse.json(
        { error: "Invalid paid_status. Must be 'Paid' or 'UnPaid'", status: false },
        { status: 400 }
      );
    }

    if (other_amount < 0) {
      console.log("Validation failed: Negative other_amount:", other_amount);
      return NextResponse.json(
        { error: "other_amount cannot be negative", status: false },
        { status: 400 }
      );
    }

    for (const container of containerDetails) {
      if (!container.containerItemDetails || container.containerItemDetails.length === 0) {
        console.log("Validation failed: Missing containerItemDetails");
        return NextResponse.json(
          { error: "Each ContainerDetail must include at least one ContainerItemDetail", status: false },
          { status: 400 }
        );
      }
      for (const item of container.containerItemDetails) {
        if (!item.vehicleId) {
          console.log("Validation failed: Missing vehicleId in containerItemDetails");
          return NextResponse.json(
            { error: "Each ContainerItemDetail must include a vehicleId", status: false },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate bookingNo
    console.log("Checking for existing booking with bookingNo:", bookingNo);
    const existingBooking = await prisma.containerBooking.findUnique({
      where: { bookingNo },
    });
    if (existingBooking) {
      console.log(`Duplicate bookingNo detected: ${bookingNo}`);
      return NextResponse.json(
        { error: `Booking number '${bookingNo}' already exists`, status: false },
        { status: 409 }
      );
    }

    // Fetch vehicle data
    const vehicleIds = containerDetails.flatMap((container) =>
      container.containerItemDetails.map((item) => parseInt(item.vehicleId))
    );
    console.log("Fetching vehicles with IDs:", vehicleIds);
    const vehicleData = await prisma.addVehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, admin_id: true, status: true },
    });
    console.log("Fetched vehicle data:", JSON.stringify(vehicleData, null, 2));

    const foundVehicleIds = vehicleData.map((v) => v.id);
    const missingVehicleIds = vehicleIds.filter((id) => !foundVehicleIds.includes(id));
    if (missingVehicleIds.length > 0) {
      console.log("Vehicle(s) not found:", missingVehicleIds);
      return NextResponse.json(
        { error: `Vehicle(s) not found: ${missingVehicleIds.join(", ")}`, status: false },
        { status: 404 }
      );
    }

    // Fetch admin balances (hardcode admin_id to 1)
    const targetAdminId = 1;
    console.log("Fetching admin with ID:", targetAdminId);
    const adminData = await prisma.admin.findUnique({
      where: { id: targetAdminId },
      select: { balance: true },
    });
    console.log("Fetched admin data:", JSON.stringify(adminData, null, 2));

    if (!adminData) {
      console.log("Admin not found for ID:", targetAdminId);
      return NextResponse.json(
        { error: `Admin not found for ID ${targetAdminId}`, status: false },
        { status: 404 }
      );
    }

    // Calculate transaction amount based on freightTerm
    let totalDebit = 0;
    let totalCredit = 0;
    let newBalance = adminData.balance;
    if (freightTerm.toLowerCase() === "pre paid") {
      totalDebit = parseFloat(net_total_amount_dollars) || 0;
    } else if (freightTerm.toLowerCase() === "collect") {
      totalCredit = parseFloat(totalAmount1_dollars) || 0;
    } else {
      console.log("Invalid freightTerm:", freightTerm);
      return NextResponse.json(
        { error: "Invalid freightTerm value. Must be 'pre paid' or 'collect'", status: false },
        { status: 400 }
      );
    }
    const totalTransactionAmount = totalDebit - totalCredit;

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
          booking_service_charges: parseFloat(booking_service_charges) || 0,
          shipperName,
          consignee,
          descriptionOfGoods: descriptionOfGoods || "",
          vanning_charges: parseFloat(vanning_charges) || 0,
          seal_amount: parseFloat(seal_amount) || 0,
          surrender_fee: parseFloat(surrender_fee) || 0,
          bl_fee: parseFloat(bl_fee) || 0,
          radiation_fee: parseFloat(radiation_fee) || 0,
          other_amount: parseFloat(other_amount) || 0,
          paid_status: paid_status || "UnPaid",
          comments: comments || "",
          totalAmount1: parseFloat(totalAmount1) || 0,
          totalAmount1_dollars: parseFloat(totalAmount1_dollars) || 0,
          freight_amount: parseFloat(freight_amount) || 0,
          freight_amount_dollars: parseFloat(freight_amount_dollars) || 0,
          net_total_amount: parseFloat(net_total_amount) || 0,
          net_total_amount_dollars: parseFloat(net_total_amount_dollars) || 0,
          imagePath: imagePath || "",
          added_by: parseInt(added_by) || 0,
          admin_id: targetAdminId,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
          containerDetails: {
            create: containerDetails.map((container) => ({
              consigneeName: container.consigneeName,
              notifyParty: container.notifyParty,
              shipperPer: container.shipperPer,
              bookingNo: container.bookingNo,
              note: container.note || "",
              imagePath: container.imagePath || "",
              added_by: parseInt(container.added_by) || 0,
              admin_id: targetAdminId,
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
              containerDetailId: null,
              added_by: parseInt(added_by) || 0,
              admin_id: targetAdminId,
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

    // Update balance and create ledger only if paid_status is "Paid"
    if (paid_status === "Paid") {
      newBalance = adminData.balance - totalTransactionAmount;
      console.log("Updating balance for Paid status:", { currentBalance: adminData.balance, newBalance });

      operations.push(
        prisma.admin.update({
          where: { id: targetAdminId },
          data: { balance: newBalance },
        })
      );

      operations.push(
        prisma.ledger.create({
          data: {
            admin_id: targetAdminId,
            debit: totalCredit,
            credit: totalDebit,
            balance: newBalance,
            description: `Cargo booking for bookingNo: ${bookingNo} - Paid - Debit: ${totalDebit}, Credit: ${totalCredit}, Other Amount: ${other_amount}`,
            transaction_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
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
        operationIndex += 2;
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
    const cargoBookings = await prisma.containerBooking.findMany({
      include: {
        containerDetails: true,
      },
    });

    const containerItemDetails = await prisma.containerItemDetail.findMany({
      include: {
        vehicle: true,
      },
    });

    const cargoBookingsWithItems = cargoBookings.map((booking) => {
      const relatedItems = containerItemDetails.filter((item) =>
        booking.containerDetails.some((detail) => detail.id === item.containerDetailId)
      );
      return {
        ...booking,
        containerItemDetails: relatedItems,
      };
    });

    console.log("Fetched cargo bookings with joined data:", cargoBookingsWithItems);

    return NextResponse.json(
      {
        message: "Cargo bookings fetched successfully",
        status: true,
        data: cargoBookingsWithItems,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        status: false,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}