/**
 * Email Service for sending transactional emails
 * This centralizes email functionality and provides better error handling
 */
const nodemailer = require('nodemailer');

// Create reusable transporter with configuration from environment variables
let transporter;

try {
  // Try to create the transporter with environment variables
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || (process.env.EMAIL_SECURE === 'true' ? 465 : 587),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  console.log('✅ Email service initialized');
} catch (error) {
  console.error('❌ Failed to initialize email service:', error.message);
  
  // Create mock transporter for development if real one fails
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Creating mock email service for development');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('📧 MOCK EMAIL SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text?.substring(0, 100) + '...');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
  }
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<Object>} - Send result with messageId if successful
 */
const sendEmail = async (options) => {
  // If email service is not available, log and resolve without error
  if (!transporter) {
    console.log('⚠️ Email service not available. Would have sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    // Return mock success
    return { messageId: 'mock-id-' + Date.now(), sent: false };
  }
  
  try {
    // Prepare email options
    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || 'noreply@lyriclingo.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to} (ID: ${info.messageId})`);
    return { ...info, sent: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error.message);
    return { error: error.message, sent: false };
  }
};

module.exports = { sendEmail }; 