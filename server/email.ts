import nodemailer from "nodemailer";
import { User } from "@shared/schema";

// Create a test SMTP service account for development
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "your-ethereal-email",
    pass: "your-ethereal-password"
  },
});

export async function sendReferralCodeEmail(user: User) {
  const registrationLink = `${process.env.APP_URL || 'http://localhost:5000'}/auth?email=${encodeURIComponent(user.email)}&referralCode=${user.referralCode}`;
  
  const mailOptions = {
    from: '"Contractor Referral System" <noreply@example.com>',
    to: user.email,
    subject: "Your Referral Code is Ready!",
    html: `
      <h1>Welcome to the Contractor Referral System!</h1>
      <p>Your contractor has added you as an existing customer. Here's your unique referral code:</p>
      <h2 style="color: #4f46e5; font-size: 24px; padding: 10px; background: #f3f4f6; border-radius: 4px; text-align: center;">
        ${user.referralCode}
      </h2>
      <p>Click the link below to create your account and start referring new customers:</p>
      <a href="${registrationLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        Create Your Account
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${registrationLink}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    // For development: Log preview URL
    console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
