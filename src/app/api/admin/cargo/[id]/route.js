import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET: Retrieve a single ContainerBooking by id (slug)
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id); // Extract id from the slug and convert to integer

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Valid id is required", status: false },
        { status: 400 }
      );
    }

    const booking = await prisma.containerBooking.findUnique({
      where: { id },
      include: {
        containerDetails: {
          include: {
            containerItems: {
              include: {
                vehicle: true,
                Admin: true,
              },
            },
            Admin: true,
          },
        },
        Admin: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: `Booking with id '${id}' not found`, status: false },
        { status: 404 }
      );
    }

    console.log("Retrieved booking:", JSON.stringify(booking, null, 2));
    return NextResponse.json(
      {
        message: "Booking retrieved successfully",
        status: true,
        data: booking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error in GET booking:", error);
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

// PUT: Update an existing ContainerBooking by id (slug)
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id); // Extract id from the slug
    const data = await request.json();
    console.log("Received update data:", JSON.stringify(data, null, 2));

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
      vanning_charges,
      seal_amount,
      surrender_fee,
      bl_fee,
      radiation_fee,
      totalAmount1,
      totalAmount1_dollars,
      freight_amount,
      freight_amount_dollars,
      net_total_amount,
      net_total_amount_dollars,
      imagePath,
      added_by,
      admin_id,
      containerDetails,
    } = data;

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Valid id is required for update", status: false },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.containerBooking.findUnique({
      where: { id },
      include: { containerDetails: { include: { containerItems: true } } },
    });
    if (!existingBooking) {
      return NextResponse.json(
        { error: `Booking with id '${id}' not found`, status: false },
        { status: 404 }
      );
    }

    // Check if bookingNo is being updated and ensure it’s unique
    if (bookingNo && bookingNo !== existingBooking.bookingNo) {
      const duplicateBooking = await prisma.containerBooking.findUnique({
        where: { bookingNo },
      });
      if (duplicateBooking) {
        return NextResponse.json(
          { error: `Booking number '${bookingNo}' already exists`, status: false },
          { status: 409 }
        );
      }
    }

    // Prepare transaction operations
    const operations = [];

    // Update ContainerBooking
    operations.push(
      prisma.containerBooking.update({
        where: { id },
        data: {
          actualShipper,
          cyOpen,
          bookingNo,
          etd: etd ? new Date(etd) : undefined,
          cyCutOff: cyCutOff ? new Date(cyCutOff) : undefined,
          eta: eta ? new Date(eta) : undefined,
          volume: volume ? parseInt(volume) : undefined,
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
          vanning_charges: vanning_charges !== undefined ? parseFloat(vanning_charges) : undefined,
          seal_amount: seal_amount !== undefined ? parseFloat(seal_amount) : undefined,
          surrender_fee: surrender_fee !== undefined ? parseFloat(surrender_fee) : undefined,
          bl_fee: bl_fee !== undefined ? parseFloat(bl_fee) : undefined,
          radiation_fee: radiation_fee !== undefined ? parseFloat(radiation_fee) : undefined,
          totalAmount1: totalAmount1 !== undefined ? parseFloat(totalAmount1) : undefined,
          totalAmount1_dollars: totalAmount1_dollars !== undefined ? parseFloat(totalAmount1_dollars) : undefined,
          freight_amount: freight_amount !== undefined ? parseFloat(freight_amount) : undefined,
          freight_amount_dollars: freight_amount_dollars !== undefined ? parseFloat(freight_amount_dollars) : undefined,
          net_total_amount: net_total_amount !== undefined ? parseFloat(net_total_amount) : undefined,
          net_total_amount_dollars: net_total_amount_dollars !== undefined ? parseFloat(net_total_amount_dollars) : undefined,
          imagePath,
          added_by: added_by !== undefined ? parseInt(added_by) : undefined,
          admin_id: admin_id !== undefined ? parseInt(admin_id) : undefined,
          updatedAt: new Date(),
        },
      })
    );

    if (containerDetails) {
      // Delete existing ContainerDetails and ContainerItemDetails
      operations.push(
        prisma.containerItemDetail.deleteMany({
          where: { containerDetailId: { in: existingBooking.containerDetails.map((cd) => cd.id) } },
        })
      );
      operations.push(
        prisma.containerDetail.deleteMany({
          where: { containerBookingId: id },
        })
      );

      // Recreate ContainerDetails
      operations.push(
        prisma.containerBooking.update({
          where: { id },
          data: {
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

      // Recreate ContainerItemDetails
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
                added_by: parseInt(container.added_by) || 0,
                admin_id: parseInt(container.admin_id) || 0,
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
    }

    // Execute transaction
    console.log("Executing update transaction with operations:", operations.length);
    const results = await prisma.$transaction(operations);
    const updatedBooking = results.find((r) => r.id === id && r.containerDetails);
    const containerDetailIds = updatedBooking.containerDetails.map((cd) => cd.id);

    // Update ContainerItemDetail with containerDetailId
    if (containerDetails) {
      let operationIndex = operations.length - containerDetails.flatMap(c => c.containerItemDetails).length * 2;
      for (let i = 0; i < containerDetails.length; i++) {
        const container = containerDetails[i];
        for (let j = 0; j < container.containerItemDetails.length; j++) {
          const itemResult = results[operationIndex];
          operationIndex += 2; // Skip AddVehicle update
          await prisma.containerItemDetail.update({
            where: { id: itemResult.id },
            data: { containerDetailId: containerDetailIds[i] },
          });
        }
      }
    }

    console.log("Updated booking:", JSON.stringify(updatedBooking, null, 2));
    return NextResponse.json(
      {
        message: "Booking updated successfully",
        status: true,
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error in PUT booking:", error);
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

// DELETE: Delete a ContainerBooking by id (slug)
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id); // Extract id from the slug

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Valid id is required for deletion", status: false },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.containerBooking.findUnique({
      where: { id },
      include: { containerDetails: true },
    });
    if (!existingBooking) {
      return NextResponse.json(
        { error: `Booking with id '${id}' not found`, status: false },
        { status: 404 }
      );
    }

    // Delete related records in a transaction
    const operations = [
      prisma.containerItemDetail.deleteMany({
        where: { containerDetailId: { in: existingBooking.containerDetails.map((cd) => cd.id) } },
      }),
      prisma.containerDetail.deleteMany({
        where: { containerBookingId: id },
      }),
      prisma.containerBooking.delete({
        where: { id },
      }),
    ];

    console.log("Executing delete transaction with operations:", operations.length);
    await prisma.$transaction(operations);

    console.log(`Deleted booking with id: ${id}`);
    return NextResponse.json(
      {
        message: "Booking deleted successfully",
        status: true,
        data: { id },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error in DELETE booking:", error);
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