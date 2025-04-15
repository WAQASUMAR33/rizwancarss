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

export async function PUT(request) {
  try {
    const data = await request.json();
    console.log("Received PUT data:", JSON.stringify(data, null, 2));

    const {
      bookingNo,
      shipperName,
      consignee,
      actualShipper,
      cyOpen,
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
      descriptionOfGoods,
      vanning_charges,
      seal_amount,
      surrender_fee,
      bl_fee,
      radiation_fee,
      booking_service_charges,
      other_amount,
      paid_status,
      comments,
      totalAmount1,
      totalAmount1_dollars,
      freight_amount,
      freight_amount_dollars,
      net_total_amount,
      net_total_amount_dollars,
      imagePath,
      added_by,
    } = data;

    // Validation
    if (!bookingNo) {
      console.log("Validation failed: Missing bookingNo");
      return NextResponse.json(
        { error: "Booking number is required", status: false },
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
        { error: "Other amount cannot be negative", status: false },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.containerBooking.findUnique({
      where: { bookingNo },
    });
    if (!existingBooking) {
      console.log(`Booking not found: ${bookingNo}`);
      return NextResponse.json(
        { error: `Booking number '${bookingNo}' not found`, status: false },
        { status: 404 }
      );
    }

    // Update booking
    const updatedBooking = await prisma.containerBooking.update({
      where: { bookingNo },
      data: {
        shipperName: shipperName || existingBooking.shipperName,
        consignee: consignee || existingBooking.consignee,
        actualShipper: actualShipper || existingBooking.actualShipper,
        cyOpen: cyOpen || existingBooking.cyOpen,
        etd: etd ? new Date(etd) : existingBooking.etd,
        cyCutOff: cyCutOff ? new Date(cyCutOff) : existingBooking.cyCutOff,
        eta: eta ? new Date(eta) : existingBooking.eta,
        volume: parseInt(volume) || existingBooking.volume,
        carrier: carrier || existingBooking.carrier,
        vessel: vessel || existingBooking.vessel,
        portOfLoading: portOfLoading || existingBooking.portOfLoading,
        portOfDischarge: portOfDischarge || existingBooking.portOfDischarge,
        cargoMode: cargoMode || existingBooking.cargoMode,
        placeOfIssue: placeOfIssue || existingBooking.placeOfIssue,
        freightTerm: freightTerm || existingBooking.freightTerm,
        descriptionOfGoods: descriptionOfGoods || existingBooking.descriptionOfGoods,
        vanning_charges: parseFloat(vanning_charges) || existingBooking.vanning_charges,
        seal_amount: parseFloat(seal_amount) || existingBooking.seal_amount,
        surrender_fee: parseFloat(surrender_fee) || existingBooking.surrender_fee,
        bl_fee: parseFloat(bl_fee) || existingBooking.bl_fee,
        radiation_fee: parseFloat(radiation_fee) || existingBooking.radiation_fee,
        booking_service_charges: parseFloat(booking_service_charges) || existingBooking.booking_service_charges,
        other_amount: parseFloat(other_amount) || existingBooking.other_amount,
        paid_status: paid_status || existingBooking.paid_status,
        comments: comments || existingBooking.comments || "",
        totalAmount1: parseFloat(totalAmount1) || existingBooking.totalAmount1,
        totalAmount1_dollars: parseFloat(totalAmount1_dollars) || existingBooking.totalAmount1_dollars,
        freight_amount: parseFloat(freight_amount) || existingBooking.freight_amount,
        freight_amount_dollars: parseFloat(freight_amount_dollars) || existingBooking.freight_amount_dollars,
        net_total_amount: parseFloat(net_total_amount) || existingBooking.net_total_amount,
        net_total_amount_dollars: parseFloat(net_total_amount_dollars) || existingBooking.net_total_amount_dollars,
        imagePath: imagePath || existingBooking.imagePath,
        added_by: parseInt(added_by) || existingBooking.added_by,
        updatedAt: new Date(),
      },
      include: { containerDetails: true },
    });

    console.log("Updated cargo booking:", JSON.stringify(updatedBooking, null, 2));
    return NextResponse.json(
      {
        message: "Cargo booking updated successfully",
        status: true,
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT error:", error);
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


// export async function GET(request) {
//   try {
//     const cargoBookings = await prisma.containerBooking.findMany({
//       include: {
//         containerDetails: true,
//       },
//     });

//     const containerItemDetails = await prisma.containerItemDetail.findMany({
//       include: {
//         vehicle: true,
//       },
//     });

//     const cargoBookingsWithItems = cargoBookings.map((booking) => {
//       const relatedItems = containerItemDetails.filter((item) =>
//         booking.containerDetails.some((detail) => detail.id === item.containerDetailId)
//       );
//       return {
//         ...booking,
//         containerItemDetails: relatedItems,
//       };
//     });

//     console.log("Fetched cargo bookings with joined data:", cargoBookingsWithItems);

//     return NextResponse.json(
//       {
//         message: "Cargo bookings fetched successfully",
//         status: true,
//         data: cargoBookingsWithItems,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         status: false,
//         details: error.message || "Unknown error occurred",
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }