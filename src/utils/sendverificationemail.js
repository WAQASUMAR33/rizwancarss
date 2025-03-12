import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Confirm Your Email Address',
      text: `Please verify your email by clicking the following link: ${process.env.BASE_URL}/Verify?token=${token}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <table width="100%" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <thead style="background-color: #4CAF50; color: #fff;">
              <tr>
                <th style="padding: 20px; text-align: left;">
                  <h2>Welcome to Al Habib Travel Agency!</h2>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 20px;">
                  <p style="font-size: 16px; line-height: 1.6;">
                    Thank you for signing up! To complete your registration, please verify your email address by clicking the button below.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.BASE_URL}/Verify?token=${token}"
                      style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #4CAF50; border-radius: 5px; text-decoration: none;">
                      Verify Email
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #555;">
                    If you did not sign up for an account, please disregard this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666;">
                  <p>
                    &copy; 2024 Al Habib Travels. All rights reserved.
                    <br>
                    <a href="${process.env.BASE_URL}" style="color: #4CAF50; text-decoration: none;">Visit our website</a>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully.');
    return "email has been sent";
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
