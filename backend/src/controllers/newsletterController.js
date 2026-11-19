const Newsletter = require('../models/Newsletter');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const { sendNewsletterWelcomeEmail, sendCampaignEmail } = require('../services/emailService');

let inMemorySubscribers = [];

exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email, tierInterest } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required to enter the QNOX Inner Circle.',
      });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Welcome back. Your Inner Circle subscription has been reactivated.',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'You are already registered in the QNOX Inner Circle dispatch.',
      });
    }

    const subscriber = await Newsletter.create({
      email,
      tierInterest: tierInterest || 'VIP Inner Circle',
    });

    sendNewsletterWelcomeEmail(subscriber).catch((e) => console.log(e.message));

    return res.status(200).json({
      success: true,
      message: 'You have been admitted to the QNOX Inner Circle. Editorial briefings will arrive shortly.',
      data: subscriber,
    });
  } catch (error) {
    inMemorySubscribers.push({ email: req.body.email, subscribedAt: new Date(), isActive: true });
    return res.status(200).json({
      success: true,
      message: 'Admitted to the QNOX Inner Circle (offline mode).',
    });
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    let query = {};
    if (token) query.unsubscribeToken = token;
    else if (email) query.email = email;
    else {
      return res.status(400).json({
        success: false,
        message: 'Unsubscribe token or email required.',
      });
    }

    const subscriber = await Newsletter.findOne(query);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber record not found.',
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'You have been unsubscribed from the QNOX Inner Circle dispatch.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    next(error);
  }
};

exports.exportSubscribersCsv = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    let csv = 'Email,Tier Interest,Status,Subscribed Date\n';
    subscribers.forEach((s) => {
      csv += `"${s.email}","${s.tierInterest}","${s.isActive ? 'Active' : 'Unsubscribed'}","${s.createdAt ? s.createdAt.toISOString() : ''}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('qnox-inner-circle-subscribers.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

exports.sendCampaign = async (req, res, next) => {
  try {
    const { subject, preheader, contentHtml } = req.body;

    if (!subject || !contentHtml) {
      return res.status(400).json({
        success: false,
        message: 'Subject and Content HTML are required to dispatch a campaign.',
      });
    }

    const activeSubscribers = await Newsletter.find({ isActive: true });

    const campaign = await NewsletterCampaign.create({
      subject,
      preheader: preheader || '',
      contentHtml,
      sentBy: req.user ? req.user.name : 'QNOX Executive Desk',
      recipientCount: activeSubscribers.length,
      status: 'Sent',
    });

    // Send emails asynchronously
    activeSubscribers.forEach((sub) => {
      sendCampaignEmail(campaign, sub.email).catch((e) => console.log(e.message));
    });

    res.status(201).json({
      success: true,
      message: `Editorial dispatch dispatched to ${activeSubscribers.length} Inner Circle members.`,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};
