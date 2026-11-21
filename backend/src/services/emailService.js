const nodemailer = require('nodemailer');

// Luxury Base HTML Template Wrapper
const getLuxuryTemplate = (title, preheader, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050505; color: #e5e5e5; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background-color: #090909; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px 32px; }
    .brand { text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 24px; margin-bottom: 32px; }
    .brand-title { font-size: 24px; font-weight: 700; letter-spacing: 0.35em; color: #ffffff; text-transform: uppercase; margin: 0; }
    .brand-sub { font-size: 9px; letter-spacing: 0.45em; color: #c5a880; text-transform: uppercase; margin-top: 4px; }
    .preheader { font-size: 11px; letter-spacing: 0.25em; color: #c5a880; text-transform: uppercase; font-weight: 600; margin-bottom: 12px; }
    .title { font-size: 28px; font-weight: 300; color: #ffffff; margin: 0 0 20px 0; line-height: 1.2; font-family: Georgia, serif; }
    .text { font-size: 14px; line-height: 1.7; color: #a3a3a3; font-weight: 300; margin-bottom: 24px; }
    .highlight-box { background-color: #0f0f0f; border: 1px solid rgba(197, 168, 128, 0.3); padding: 24px; margin: 28px 0; text-align: center; }
    .code-label { font-size: 10px; letter-spacing: 0.25em; color: #737373; text-transform: uppercase; }
    .code-val { font-size: 26px; letter-spacing: 0.25em; color: #c5a880; font-weight: bold; margin-top: 8px; font-family: monospace; }
    .btn { display: inline-block; background-color: #c5a880; color: #050505; text-decoration: none; padding: 14px 28px; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 700; margin-top: 10px; }
    .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; margin-top: 40px; text-align: center; font-size: 11px; color: #525252; letter-spacing: 0.15em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <h1 class="brand-title">Q N O X</h1>
      <div class="brand-sub">LUXURY FITNESS SANCTUARY</div>
    </div>
    <div class="preheader">${preheader}</div>
    <h2 class="title">${title}</h2>
    ${contentHtml}
    <div class="footer">
      MAYFAIR &bull; SOHO &bull; CANARY WHARF &bull; OBSIDIAN TOWER<br>
      TRAINING FOR LIFE &bull; LONDON &bull; NEW YORK &bull; DUBAI
    </div>
  </div>
</body>
</html>
`;

// Transporter with automatic fail-safe
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[QNOX Email Simulation] To: ${to} | Subject: "${subject}"`);
      return { simulated: true, success: true };
    }
    const info = await transporter.sendMail({
      from: `"QNOX Sanctuary Concierge" <${process.env.SMTP_FROM || 'concierge@qnoxgym.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`[QNOX Email Sent] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[QNOX Email Error] (${error.message}). Non-blocking.`);
    return { success: false, error: error.message };
  }
};

exports.sendEmail = sendEmail;

exports.sendWelcomeRegistrationEmail = async (user) => {
  const content = `
    <p class="text">Welcome to QNOX GYM, <strong>${user.name}</strong>. Your sanctuary identity has been established across our global ecosystem.</p>
    <div class="highlight-box">
      <div class="code-label">SANCTUARY MEMBER ID</div>
      <div class="code-val">QNX-${user._id.toString().slice(-6).toUpperCase()}</div>
    </div>
    <p class="text">Explore our six London sanctuaries, reserve masterclasses with world-class coaches, or upgrade your residency through your private Member Portal.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Welcome to QNOX GYM | Sanctuary Membership Established',
    html: getLuxuryTemplate('Welcome to QNOX', 'MEMBER ADMISSION CONFIRMED', content),
  });
};

exports.sendBookingConfirmationEmail = async (booking) => {
  const content = `
    <p class="text">Your reservation for <strong>${booking.classTitle}</strong> has been secured at <strong>${booking.clubName}</strong>.</p>
    <div class="highlight-box">
      <div class="code-label">CONCIERGE ACCESS PASS</div>
      <div class="code-val">${booking.reservationCode}</div>
      <p style="color:#737373; font-size:11px; margin-top:8px;">${booking.day} &bull; ${booking.startTime} (${booking.durationMinutes} Mins)</p>
    </div>
    <p class="text">Instructor: <strong>${booking.trainerName}</strong><br>Discipline: ${booking.category}</p>
    <p class="text" style="font-size:12px; color:#737373;">Please arrive 10 minutes prior to session for biometric check-in and hydro orientation.</p>
  `;
  return sendEmail({
    to: booking.userEmail,
    subject: `Reserved: ${booking.classTitle} [Pass: ${booking.reservationCode}]`,
    html: getLuxuryTemplate('Masterclass Reserved', 'SANCTUARY ACCESS CONFIRMED', content),
  });
};

exports.sendBookingCancellationEmail = async (booking) => {
  const content = `
    <p class="text">Your booking for <strong>${booking.classTitle}</strong> on ${booking.day} (${booking.startTime}) has been cancelled.</p>
    <p class="text">Your slot has been immediately released back to the sanctuary waitlist.</p>
  `;
  return sendEmail({
    to: booking.userEmail,
    subject: `Cancelled: ${booking.classTitle}`,
    html: getLuxuryTemplate('Booking Cancelled', 'SLOT RELEASED', content),
  });
};

exports.sendPaymentReceiptEmail = async (payment, user) => {
  const content = `
    <p class="text">We have confirmed receipt of your payment for <strong>${payment.planName}</strong> (${payment.duration.toUpperCase()} Residency).</p>
    <div class="highlight-box">
      <div class="code-label">OFFICIAL INVOICE NUMBER</div>
      <div class="code-val">${payment.invoiceNumber}</div>
      <p style="color:#c5a880; font-size:16px; margin-top:8px;">Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}</p>
    </div>
    <p class="text">Transaction ID: <strong>${payment.paymentId || payment.orderId}</strong><br>
    Status: <strong>Active & Confirmed</strong></p>
  `;
  return sendEmail({
    to: user.email,
    subject: `Payment Receipt: ${payment.planName} [${payment.invoiceNumber}]`,
    html: getLuxuryTemplate('Residency Activated', 'PAYMENT RECEIPT & INVOICE', content),
  });
};

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  const content = `
    <p class="text">You have requested a secure password reset for your QNOX GYM account.</p>
    <p class="text">Click the luxury token below to reset your password. This link is valid for 30 minutes only.</p>
    <div style="text-align:center; margin: 30px 0;">
      <a href="${resetUrl}" class="btn">RESET SANCTUARY PASSWORD</a>
    </div>
    <p class="text" style="font-size:11px; color:#525252;">If you did not initiate this request, please disregard this transmission immediately.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Secure Security Token: Reset Password',
    html: getLuxuryTemplate('Reset Your Password', 'SECURITY VERIFICATION', content),
  });
};

exports.sendTourInquiryConfirmationEmail = async (inquiry, conciergePassId) => {
  const content = `
    <p class="text">Thank you, <strong>${inquiry.fullName}</strong>. Your private walkthrough request for <strong>${inquiry.preferredClub}</strong> has been logged with our Senior Membership Concierge.</p>
    <div class="highlight-box">
      <div class="code-label">VIP CONCIERGE WALKTHROUGH CODE</div>
      <div class="code-val">${conciergePassId}</div>
      <p style="color:#737373; font-size:11px; margin-top:8px;">Preferred Tier: ${inquiry.membershipTier}</p>
    </div>
    <p class="text">A Senior Concierge will contact you within 4 business hours to finalize timing and allocate your private guide.</p>
  `;
  return sendEmail({
    to: inquiry.email,
    subject: `Walkthrough Requested: ${inquiry.preferredClub} [Code: ${conciergePassId}]`,
    html: getLuxuryTemplate('Private Tour Scheduled', 'VIP CONCIERGE REQUEST', content),
  });
};

exports.sendNewsletterWelcomeEmail = async (subscriber) => {
  const content = `
    <p class="text">Welcome to the QNOX Inner Circle. You will receive discreet editorial updates, private member allocations, and invitations to new club openings.</p>
  `;
  return sendEmail({
    to: subscriber.email,
    subject: 'Welcome to the QNOX Inner Circle',
    html: getLuxuryTemplate('The Inner Circle', 'EDITORIAL DISPATCH ADMISSION', content),
  });
};

exports.sendCampaignEmail = async (campaign, recipientEmail) => {
  return sendEmail({
    to: recipientEmail,
    subject: campaign.subject,
    html: getLuxuryTemplate(campaign.subject, 'QNOX EDITORIAL DISPATCH', campaign.contentHtml),
  });
};

exports.sendMembershipExpiryReminderEmail = async ({
  user,
  planName = 'The Metropolitan',
  expiryDate,
  daysRemaining = 0,
  stage = 'EXPIRY_DATE',
}) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let preheader = 'MEMBERSHIP RENEWAL NOTICE';
  let title = 'Your Gym Membership Has Expired!';
  let message = `Hello <strong>${user.name}</strong>, your <strong>${planName}</strong> membership expired on <strong>${formattedDate}</strong>. Renew your membership today to continue enjoying your fitness journey at QNOX GYM.`;

  if (daysRemaining > 1) {
    preheader = `RENEWAL ALERT &bull; ${daysRemaining} DAYS REMAINING`;
    title = `Membership Expiring in ${daysRemaining} Days`;
    message = `Hello <strong>${user.name}</strong>, your <strong>${planName}</strong> membership at QNOX GYM will expire in <strong>${daysRemaining} days</strong> on <strong>${formattedDate}</strong>. Renew early to maintain uninterrupted biometric sanctuary access, reserved lockers, and recovery spa privileges.`;
  } else if (daysRemaining === 1) {
    preheader = 'FINAL NOTICE &bull; EXPIRES TOMORROW';
    title = 'Membership Expires Tomorrow';
    message = `Hello <strong>${user.name}</strong>, your <strong>${planName}</strong> membership will expire tomorrow on <strong>${formattedDate}</strong>. Renew your residency today to keep all club booking benefits active.`;
  } else if (daysRemaining === 0) {
    preheader = 'SANCTUARY ACCESS EXPIRED';
    title = 'Your Gym Membership Has Expired!';
    message = `Hello <strong>${user.name}</strong>, your <strong>${planName}</strong> membership expired on <strong>${formattedDate}</strong>. Renew your membership today to continue enjoying your fitness journey at QNOX GYM.`;
  } else if (daysRemaining < 0) {
    preheader = 'SANCTUARY MEMBERSHIP RECOVERY';
    title = 'We Miss You at QNOX GYM';
    message = `Hello <strong>${user.name}</strong>, your <strong>${planName}</strong> membership expired 3 days ago on <strong>${formattedDate}</strong>. We invite you back to re-establish your residency today.`;
  }

  const ctaUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}#membership` : 'http://localhost:5173#membership';

  const content = `
    <p class="text">${message}</p>
    <div class="highlight-box">
      <div class="code-label">RESIDENCY TIER</div>
      <div class="code-val">${planName.toUpperCase()}</div>
      <p style="color:#c5a880; font-size:13px; margin-top:8px;">Expiry Date: <strong>${formattedDate}</strong></p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" class="btn" style="display:inline-block; background-color:#c5a880; color:#050505; text-decoration:none; padding:14px 28px; font-size:11px; letter-spacing:0.25em; text-transform:uppercase; font-weight:700;">RENEW MEMBERSHIP</a>
    </div>
    <p class="text" style="font-size:12px; color:#737373; text-align:center;">
      Prefer personal concierge assistance? Visit the front reception or contact our Mayfair Concierge Desk.
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: daysRemaining === 0
      ? 'Your Gym Membership Has Expired! | QNOX GYM'
      : daysRemaining > 0
      ? `Notice: Your QNOX Membership Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`
      : 'Reactivate Your QNOX Membership | Follow-Up Concierge Notice',
    html: getLuxuryTemplate(title, preheader, content),
  });
};

exports.sendMembershipRenewalSuccessEmail = async ({
  user,
  planName,
  expiryDate,
  invoiceNumber,
  amount,
}) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const content = `
    <p class="text">Hello <strong>${user.name}</strong>,</p>
    <p class="text">Your <strong>${planName}</strong> membership at QNOX GYM has been successfully renewed. Your residency is now active through <strong>${formattedDate}</strong>.</p>
    <div class="highlight-box">
      <div class="code-label">RENEWED UNTIL</div>
      <div class="code-val">${formattedDate}</div>
      ${invoiceNumber ? `<p style="color:#737373; font-size:11px; margin-top:8px;">Official Invoice: ${invoiceNumber}</p>` : ''}
      ${amount ? `<p style="color:#c5a880; font-size:14px; margin-top:4px;">Amount Paid: ₹${Number(amount).toLocaleString('en-IN')}</p>` : ''}
    </div>
    <p class="text">All privileges—including biometric club entry, 25m slate pool access, altitude chambers, and coach reservations—remain uninterrupted.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Membership Successfully Renewed! | ${planName}`,
    html: getLuxuryTemplate('Membership Successfully Renewed!', 'RESIDENCY EXTENSION CONFIRMED', content),
  });
};

