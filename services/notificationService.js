// Notification Service for Email and SMS
// This service sends notifications to patients and doctors

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // For production, integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Nodemailer with Gmail/SMTP

    console.log('📧 Email Notification:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Message:', text || html);

    // Example with SendGrid (install: npm install @sendgrid/mail)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html,
    });
    */

    // For now, we'll log to console (development mode)
    return {
      success: true,
      provider: 'console',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const sendSMS = async ({ to, message }) => {
  try {
    // For production, integrate with services like:
    // - Twilio
    // - AWS SNS
    // - MessageBird
    // - Vonage (Nexmo)

    console.log('📱 SMS Notification:');
    console.log('To:', to);
    console.log('Message:', message);

    // Example with Twilio (install: npm install twilio)
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    */

    // For now, we'll log to console (development mode)
    return {
      success: true,
      provider: 'console',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const formatAppointmentDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatAppointmentTime = (startTime, endTime) => {
  const start = new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const end = new Date(endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${start} - ${end}`;
};

// Send appointment confirmation to patient
const sendPatientConfirmation = async ({
  patientName,
  patientEmail,
  patientPhone,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  appointmentId,
}) => {
  const emailSubject = '✅ Appointment Confirmation - MediSync';

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { font-weight: 700; color: #1f2937; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .check-icon { font-size: 48px; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏥 MediSync</h1>
          <p style="margin: 10px 0 0 0;">Appointment Confirmation</p>
        </div>
        <div class="content">
          <div style="text-align: center; padding: 20px 0;">
            <div class="check-icon">✅</div>
            <h2>Your Appointment is Confirmed!</h2>
            <p>Dear ${patientName},</p>
            <p>Your appointment has been successfully scheduled.</p>
          </div>

          <div class="detail-box">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Appointment ID:</span>
              <span class="detail-value">#${appointmentId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span class="detail-value">Dr. ${doctorName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${appointmentType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${appointmentDate}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${appointmentTime}</span>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <strong>⏰ Important Reminder:</strong>
            <p style="margin: 5px 0 0 0;">Please arrive 10 minutes before your scheduled time.</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/client/dashboard" class="button">
              View My Appointments
            </a>
          </div>
        </div>
        <div class="footer">
          <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          <p>Thank you for choosing MediSync!</p>
          <p style="font-size: 12px; color: #9ca3af;">© 2025 MediSync. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
    Appointment Confirmation - MediSync

    Dear ${patientName},

    Your appointment has been successfully confirmed!

    Appointment Details:
    - ID: #${appointmentId.substring(0, 8).toUpperCase()}
    - Doctor: Dr. ${doctorName}
    - Type: ${appointmentType}
    - Date: ${appointmentDate}
    - Time: ${appointmentTime}

    Please arrive 10 minutes before your scheduled time.

    If you need to reschedule or cancel, please contact us at least 24 hours in advance.

    Thank you for choosing MediSync!
  `;

  const smsMessage = `MediSync: Appointment confirmed with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}. ID: #${appointmentId.substring(0, 8).toUpperCase()}`;

  // Send email and SMS
  const emailResult = await sendEmail({
    to: patientEmail,
    subject: emailSubject,
    html: emailHTML,
    text: emailText,
  });

  const smsResult = await sendSMS({
    to: patientPhone,
    message: smsMessage,
  });

  return {
    email: emailResult,
    sms: smsResult,
  };
};

// Send appointment notification to doctor
const sendDoctorNotification = async ({
  doctorName,
  doctorEmail,
  doctorPhone,
  patientName,
  patientEmail,
  patientPhone,
  appointmentDate,
  appointmentTime,
  appointmentType,
  appointmentReason,
  appointmentId,
}) => {
  const emailSubject = '📅 New Appointment Scheduled - MediSync';

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { font-weight: 700; color: #1f2937; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .notification-icon { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏥 MediSync</h1>
          <p style="margin: 10px 0 0 0;">New Appointment Notification</p>
        </div>
        <div class="content">
          <div style="text-align: center; padding: 20px 0;">
            <div class="notification-icon">📅</div>
            <h2>New Appointment Scheduled</h2>
            <p>Dear Dr. ${doctorName},</p>
            <p>A new appointment has been booked with you.</p>
          </div>

          <div class="detail-box">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Appointment ID:</span>
              <span class="detail-value">#${appointmentId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${appointmentTime}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${appointmentType}</span>
            </div>
          </div>

          <div class="detail-box">
            <h3 style="margin-top: 0;">Patient Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${patientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${patientEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${patientPhone}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${appointmentReason}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.BACKEND_URL}/doctor/dashboard" class="button">
              View Dashboard
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This appointment has been added to your calendar.</p>
          <p style="font-size: 12px; color: #9ca3af;">© 2025 MediSync. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
    New Appointment Scheduled - MediSync

    Dear Dr. ${doctorName},

    A new appointment has been booked with you.

    Appointment Details:
    - ID: #${appointmentId.substring(0, 8).toUpperCase()}
    - Date: ${appointmentDate}
    - Time: ${appointmentTime}
    - Type: ${appointmentType}

    Patient Information:
    - Name: ${patientName}
    - Email: ${patientEmail}
    - Phone: ${patientPhone}
    - Reason: ${appointmentReason}

    This appointment has been added to your calendar.

    MediSync Team
  `;

  const smsMessage = `MediSync: New appointment on ${appointmentDate} at ${appointmentTime} with ${patientName}. Reason: ${appointmentReason}`;

  // Send email and SMS
  const emailResult = await sendEmail({
    to: doctorEmail,
    subject: emailSubject,
    html: emailHTML,
    text: emailText,
  });

  const smsResult = await sendSMS({
    to: doctorPhone,
    message: smsMessage,
  });

  return {
    email: emailResult,
    sms: smsResult,
  };
};

// Send appointment reminder (24 hours before)
const sendAppointmentReminder = async ({
  patientName,
  patientEmail,
  patientPhone,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
}) => {
  const smsMessage = `MediSync Reminder: Your appointment with Dr. ${doctorName} is tomorrow at ${appointmentTime}. See you then!`;

  const emailSubject = '⏰ Appointment Reminder - Tomorrow - MediSync';
  const emailHTML = `
    <h2>Appointment Reminder</h2>
    <p>Dear ${patientName},</p>
    <p>This is a friendly reminder about your upcoming appointment:</p>
    <ul>
      <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
      <li><strong>Date:</strong> ${appointmentDate}</li>
      <li><strong>Time:</strong> ${appointmentTime}</li>
      <li><strong>Type:</strong> ${appointmentType}</li>
    </ul>
    <p>Please arrive 10 minutes early.</p>
    <p>See you tomorrow!</p>
  `;

  const emailResult = await sendEmail({
    to: patientEmail,
    subject: emailSubject,
    html: emailHTML,
  });

  const smsResult = await sendSMS({
    to: patientPhone,
    message: smsMessage,
  });

  return {
    email: emailResult,
    sms: smsResult,
  };
};

module.exports = {
  sendPatientConfirmation,
  sendDoctorNotification,
  sendAppointmentReminder,
  sendEmail,
  sendSMS,
  formatAppointmentDate,
  formatAppointmentTime,
};
