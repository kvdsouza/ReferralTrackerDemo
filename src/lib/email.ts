import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReferralEmail({
  customerEmail,
  customerName,
  referrerName,
  projectDescription
}: {
  customerEmail: string;
  customerName: string;
  referrerName: string;
  projectDescription: string;
}) {
  try {
    await resend.emails.send({
      from: 'no-reply@yourdomain.com',
      to: customerEmail,
      subject: `${referrerName} has referred you for a project`,
      html: `
        <div>
          <h2>Hello ${customerName},</h2>
          <p>${referrerName} has referred you for a project on our platform.</p>
          
          <h3>Project Details:</h3>
          <p>${projectDescription}</p>
          
          <p>To get started with your project, please click the button below to create your account:</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/register" style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          ">
            Create Your Account
          </a>
          
          <p>If you have any questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>Your Platform Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
