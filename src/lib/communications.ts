import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  try {
    await twilioClient.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from: 'your-verified-sender@yourdomain.com', // Update this with your SendGrid verified sender
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateReferralMessage(
  referralCode: string,
  videoUrl: string
): string {
  return `Thank you for being a valued customer! Share this referral code with friends: ${referralCode}
Watch this video to learn more: ${videoUrl}
Click here to refer: ${process.env.NEXT_PUBLIC_APP_URL}/refer/${referralCode}`;
}
