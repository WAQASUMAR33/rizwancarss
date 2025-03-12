import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const data = await request.json();

  try {
    // Insert Admin records
    // for (const admin of data.Admin) {
    //   const hashedPassword = await bcrypt.hash(admin.password, 10);
    //   await prisma.admin.create({
    //     data: {
    //       role: admin.role,
    //       username: admin.username,
    //       password: hashedPassword,
    //       fullname: admin.fullname,
    //       created_at: new Date(admin.created_at),
    //       updated_at: new Date(admin.updated_at),
    //     },
    //   });
    // }

    // // Insert Users records
    // for (const user of data.Users) {
    //   const hashedPassword = await bcrypt.hash(user.password, 10);
    //   await prisma.users.create({
    //     data: {
    //       name: user.name,
    //       username: user.username,
    //       password: hashedPassword,
    //       phoneno: user.phoneno,
    //       city: user.city,
    //       address: user.address,
    //       bname: user.bname,
    //       created_at: new Date(user.created_at),
    //       updated_at: new Date(user.updated_at),
    //       emailverification: user.emailverification,
    //       status: user.status,
    //       token: user.token,
    //       role: user.role,
    //       balance: user.balance,
    //     },
    //   });
    // }

    // // Insert Packages records
    // for (const packageItem of data.Packages) {
    //   await prisma.packages.create({
    //     data: {
    //       title: packageItem.title,
    //       description: packageItem.description,
    //       image: packageItem.image,
    //       amount: packageItem.amount,
    //       created_at: new Date(packageItem.created_at),
    //       updated_at: new Date(packageItem.updated_at),
    //     },
    //   });
    // }

    // // Insert Visa records
    // for (const visa of data.Visa) {
    //   await prisma.visa.create({
    //     data: {
    //       title: visa.title,
    //       description: visa.description,
    //       image: visa.image,
    //       amount: visa.amount,
    //       created_at: new Date(visa.created_at),
    //       updated_at: new Date(visa.updated_at),
    //     },
    //   });
    // }

    // // Insert Tickets records
    // for (const ticket of data.Tickets) {
    //   await prisma.tickets.create({
    //     data: {
    //       title: ticket.title,
    //       description: ticket.description,
    //       image: ticket.image,
    //       amount: ticket.amount,
    //       created_at: new Date(ticket.created_at),
    //       updated_at: new Date(ticket.updated_at),
    //     },
    //   });
    // }

    // // Insert PaymentRequests records
    // for (const paymentRequest of data.PaymentRequests) {
    //   await prisma.paymentRequests.create({
    //     data: {
    //       userid: paymentRequest.userid,
    //       transactionno: paymentRequest.transactionno,
    //       img_url: paymentRequest.img_url,
    //       status: paymentRequest.status,
    //       verified_by: paymentRequest.verified_by,
    //       amount: paymentRequest.amount,
    //       created_at: new Date(paymentRequest.created_at),
    //       updated_at: new Date(paymentRequest.updated_at),
    //     },
    //   });
    // }

    // // Insert Ledger records
    // for (const ledger of data.Ledger) {
    //   await prisma.ledger.create({
    //     data: {
    //       userId: ledger.userId,
    //       debit: ledger.debit,
    //       credit: ledger.credit,
    //       balance: ledger.balance,
    //       description: ledger.description,
    //       transaction_at: new Date(ledger.transaction_at),
    //       created_at: new Date(ledger.created_at),
    //       updated_at: new Date(ledger.updated_at),
    //     },
    //   });
    // }

    // // Insert PackageBookings records
    // for (const packageBooking of data.PackageBookings) {
    //   await prisma.packageBookings.create({
    //     data: {
    //       user_id: packageBooking.user_id,
    //       package_id: packageBooking.package_id,
    //       total_amount: packageBooking.total_amount,
    //       paid_amount: packageBooking.paid_amount,
    //       remaining_amount: packageBooking.remaining_amount,
    //       status: packageBooking.status,
    //       payment_method: packageBooking.payment_method,
    //       notes: packageBooking.notes,
    //       created_at: new Date(packageBooking.created_at),
    //       updated_at: new Date(packageBooking.updated_at),
    //     },
    //   });
    // }

    // // Insert VisaBookings records
    // for (const visaBooking of data.VisaBookings) {
    //   await prisma.visaBookings.create({
    //     data: {
    //       user_id: visaBooking.user_id,
    //       visa_id: visaBooking.visa_id,
    //       total_amount: visaBooking.total_amount,
    //       paid_amount: visaBooking.paid_amount,
    //       remaining_amount: visaBooking.remaining_amount,
    //       status: visaBooking.status,
    //       payment_method: visaBooking.payment_method,
    //       notes: visaBooking.notes,
    //       created_at: new Date(visaBooking.created_at),
    //       updated_at: new Date(visaBooking.updated_at),
    //     },
    //   });
    // }

    // // Insert TicketBookings records
    // for (const ticketBooking of data.TicketBookings) {
    //   await prisma.ticketBookings.create({
    //     data: {
    //       user_id: ticketBooking.user_id,
    //       ticket_id: ticketBooking.ticket_id,
    //       total_amount: ticketBooking.total_amount,
    //       paid_amount: ticketBooking.paid_amount,
    //       remaining_amount: ticketBooking.remaining_amount,
    //       status: ticketBooking.status,
    //       payment_method: ticketBooking.payment_method,
    //       notes: ticketBooking.notes,
    //       created_at: new Date(ticketBooking.created_at),
    //       updated_at: new Date(ticketBooking.updated_at),
    //     },
    //   });
    // }

    // // Insert BankAccounts records
    // for (const bankAccount of data.BankAccounts) {
    //   await prisma.bankAccounts.create({
    //     data: {
    //       bank_title: bankAccount.bank_title,
    //       account_title: bankAccount.account_title,
    //       account_no: bankAccount.account_no,
    //       created_at: new Date(bankAccount.created_at),
    //       updated_at: new Date(bankAccount.updated_at),
    //     },
    //   });
    // }

    // Insert FlightDetails records
    // for (const flightDetail of data.FlightDetails) {
    //   await prisma.flightDetails.create({
    //     data: {
    //       airline: flightDetail.airline,
    //       airline_sn: flightDetail.airline_sn,
    //       meal: flightDetail.meal,
    //       fare: flightDetail.fare,
    //       type: flightDetail.type,
    //       created_at: new Date(flightDetail.created_at),
    //       updated_at: new Date(flightDetail.updated_at),
    //     },
    //   });
    // }

    // Insert SingleFlight records
    // for (const singleFlight of data.SingleFlight) {
    //   await prisma.singleFlight.create({
    //     data: {
    //       flightdetails_id: singleFlight.flightdetails_id,
    //       flight_number: singleFlight.flight_number,
    //       flight_date: new Date(singleFlight.flight_date),
    //       origin: singleFlight.origin,
    //       destination: singleFlight.destination,
         
    //       baggage: singleFlight.baggage,
         
    //     },
    //   });
    // }

    // for (const passenger of data.Passengers) {
    //   await prisma.passengers.create({
    //     data: {
    //       givenname: passenger.givenname,
    //       surname: passenger.surname,
    //       title: passenger.title,
    //       type: passenger.type,
    //       passportid: passenger.passportid,
    //       dob: passenger.dob,
    //       doe: passenger.doe,
    //       // created_at: new Date(passenger.created_at),
    //       // updated_at: new Date(passenger.updated_at),
    //     },
    //   });
    // }
    // Insert FlightBookings records
    // for (const flightBooking of data.FlightBookings) {
    //   await prisma.flightBookings.create({
    //     data: {
    //       flightdetails_id: flightBooking.flightdetails_id,
    //       passenger_id: flightBooking.passenger_id,
    //       childs: flightBooking.childs,
    //       adults: flightBooking.adults,
    //       infants: flightBooking.infants,
    //       status: flightBooking.status,
    //       remarks: flightBooking.remarks,
    //       // created_at: new Date(flightBooking.created_at),
    //       // updated_at: new Date(flightBooking.updated_at),
    //     },
    //   });
    // }

    // Insert Passengers records
    

    return NextResponse.json(
      { message: "All data imported successfully!" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error importing data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
