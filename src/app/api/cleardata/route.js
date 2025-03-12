// import prisma from "@/utils/prisma";
// export async function GET(request) {
//   try {
//     // Clear all the data from related tables in the correct order
//     await prisma.flightBookings.deleteMany({});
//     await prisma.singleFlight.deleteMany({});
//     await prisma.flightDetails.deleteMany({});
//     await prisma.passengers.deleteMany({});

//     return new Response(JSON.stringify({ message: 'Data cleared successfully!' }), {
//       status: 200,
//     });
//   } catch (error) {
//     console.error('Error clearing data:', error);
//     return new Response(
//       JSON.stringify({ message: 'Failed to clear data', error: error.message }),
//       { status: 500 }
//     );
//   }
// }
