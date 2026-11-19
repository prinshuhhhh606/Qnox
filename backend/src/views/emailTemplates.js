/**
 * MVC View Layer - Renderers for Concierge Pass & Notifications
 */

exports.renderTourConfirmationHtml = (guestName, clubName, conciergePassId) => {
  return `
    <div style="background-color: #050505; color: #f5f5f5; font-family: 'Helvetica Neue', sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
      <h1 style="letter-spacing: 0.3em; text-transform: uppercase; font-size: 20px; color: #d4af37; text-align: center; border-bottom: 1px solid #222; padding-bottom: 20px;">
        Q N O X &nbsp; G Y M
      </h1>
      <div style="margin-top: 30px;">
        <p style="font-size: 13px; letter-spacing: 0.15em; color: #888; text-transform: uppercase;">VIP Guest Private Access Confirmation</p>
        <h2 style="font-size: 24px; font-weight: 300; margin: 10px 0 20px 0;">Welcome, ${guestName}</h2>
        <p style="color: #bbb; line-height: 1.6; font-size: 14px;">
          Your private walkthrough appointment for <strong>${clubName}</strong> has been secured. Your dedicated Member Concierge will greet you upon arrival with a bespoke orientation kit.
        </p>
        <div style="background-color: #111; border: 1px solid #333; padding: 20px; margin: 30px 0; text-align: center;">
          <span style="font-size: 11px; letter-spacing: 0.2em; color: #777; text-transform: uppercase; display: block;">Concierge Pass ID</span>
          <span style="font-size: 24px; letter-spacing: 0.25em; color: #d4af37; font-weight: bold; display: block; margin-top: 5px;">${conciergePassId}</span>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
          TRAINING FOR LIFE &bull; LONDON &bull; NEW YORK &bull; DUBAI
        </p>
      </div>
    </div>
  `;
};
