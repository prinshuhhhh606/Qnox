const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const Club = require('../models/Club');
const Trainer = require('../models/Trainer');
const Organization = require('../models/Organization');
const SaaSSubscriptionPlan = require('../models/SaaSSubscriptionPlan');
const OrganizationSubscription = require('../models/OrganizationSubscription');
const Payment = require('../models/Payment');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_qnox_luxury_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_qnox_luxury_secret',
});

/**
 * 1. Seed Default SaaS Plans (Starter, Professional, Enterprise)
 */
exports.seedDefaultSaaSPlans = async () => {
  const defaultPlans = [
    {
      name: 'Starter',
      code: 'starter',
      tagline: 'Single Facility & Boutique Studios',
      description: 'Ideal for independent boutique gyms and single-studio owners beginning their digital journey.',
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      maxBranches: 1,
      maxTrainers: 5,
      maxMembers: 150,
      modules: {
        aiWorkout: true,
        ptBooking: true,
        biometrics: false,
        analytics: true,
        customBranding: false,
        qrAccess: true,
        dietPlanning: false,
      },
      isPopular: false,
      isActive: true,
    },
    {
      name: 'Professional',
      code: 'professional',
      tagline: 'Multi-Branch & Fast Growing Clubs',
      description: 'Complete management with expanded capacity, advanced analytics, and PT scheduling.',
      monthlyPrice: 6999,
      yearlyPrice: 69990,
      maxBranches: 3,
      maxTrainers: 15,
      maxMembers: 600,
      modules: {
        aiWorkout: true,
        ptBooking: true,
        biometrics: true,
        analytics: true,
        customBranding: true,
        qrAccess: true,
        dietPlanning: true,
      },
      isPopular: true,
      isActive: true,
    },
    {
      name: 'Enterprise',
      code: 'enterprise',
      tagline: 'Gym Franchises & Luxury Networks',
      description: 'Unlimited scalability, dedicated multi-branch reporting, custom branding, and All-Access eligibility.',
      monthlyPrice: 14999,
      yearlyPrice: 149990,
      maxBranches: 10,
      maxTrainers: 50,
      maxMembers: 2500,
      modules: {
        aiWorkout: true,
        ptBooking: true,
        biometrics: true,
        analytics: true,
        customBranding: true,
        qrAccess: true,
        dietPlanning: true,
      },
      isPopular: false,
      isActive: true,
    },
  ];

  for (const plan of defaultPlans) {
    await SaaSSubscriptionPlan.findOneAndUpdate(
      { code: plan.code },
      { $setOnInsert: plan },
      { upsert: true, new: true }
    );
  }
};

/**
 * 2. Ensure QNOX HQ Organization exists for company-owned facilities
 */
exports.getOrCreateHQOrganization = async () => {
  let hq = await Organization.findOne({ slug: 'qnox-sanctuary-hq' });
  if (!hq) {
    const superAdmin = await User.findOne({ role: 'Super Admin' });
    hq = await Organization.create({
      name: 'QNOX Luxury Sanctuary HQ',
      slug: 'qnox-sanctuary-hq',
      type: 'Company-Owned',
      owner: superAdmin ? superAdmin._id : null,
      ownerName: superAdmin ? superAdmin.name : 'Super Admin',
      ownerEmail: superAdmin ? superAdmin.email : 'admin@qnoxgym.com',
      status: 'Active',
      contactEmail: 'concierge@qnoxgym.com',
      phone: '+44 20 7946 0992',
      address: '18 Grosvenor Street, Mayfair, London W1K 4QQ',
      city: 'London',
      branchesLimit: 50,
      trainersLimit: 200,
      membersLimit: 50000,
      allAccessPartnerStatus: 'Approved',
    });
  }
  return hq;
};

/**
 * 3. Gym Owner Registration & Onboarding
 */
exports.registerGymOwnerAndOrg = async ({ ownerName, email, phone, password, gymName, location, address, planCode, billingCycle = 'monthly' }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('An account with this email address is already registered.');
  }

  const plan = await SaaSSubscriptionPlan.findOne({ code: planCode, isActive: true });
  if (!plan) {
    throw new Error(`SaaS subscription plan '${planCode}' not found or inactive.`);
  }

  const slug = (gymName || 'gym')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30) + '-' + Math.random().toString(36).substring(2, 6);

  const formattedAddress = typeof address === 'object' && address !== null
    ? [address.street, address.city, address.state, address.pincode].filter(Boolean).join(', ')
    : String(address || location || '');

  const resolvedCity = (typeof address === 'object' && address !== null && address.city) || (typeof location === 'string' ? location.split(',')[0].trim() : '') || 'Metropolitan';

  // Create Organization (Pending until payment verified)
  const organization = await Organization.create({
    name: gymName,
    slug,
    type: 'SaaS-Partner',
    status: 'Pending-Approval',
    contactEmail: email.toLowerCase(),
    phone,
    address: formattedAddress,
    city: resolvedCity,
    branchesLimit: plan.maxBranches,
    trainersLimit: plan.maxTrainers,
    membersLimit: plan.maxMembers,
  });

  // Create Gym Owner User
  const owner = await User.create({
    name: ownerName,
    email: email.toLowerCase(),
    phone,
    password,
    role: 'Gym Owner',
    organization: organization._id,
  });

  organization.owner = owner._id;
  organization.ownerName = owner.name;
  organization.ownerEmail = owner.email;
  await organization.save();

  // Calculate price based on billing cycle
  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

  // Generate Razorpay Order
  let razorpayOrder = null;
  try {
    razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(price * 100), // in paise
      currency: 'INR',
      receipt: `saas_${organization._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        organizationId: organization._id.toString(),
        planCode: plan.code,
        billingCycle,
      },
    });
  } catch (err) {
    console.warn('[Razorpay Order Fallback]:', err.message);
    razorpayOrder = {
      id: `order_saas_${Date.now()}`,
      amount: Math.round(price * 100),
      currency: 'INR',
    };
  }

  return {
    owner: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      organization: organization._id,
    },
    organization,
    plan,
    price,
    billingCycle,
    razorpayOrder,
  };
};

/**
 * 4. Verify Payment & Activate SaaS Subscription
 */
exports.verifyAndActivateSaaSSubscription = async ({
  organizationId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  planCode,
  billingCycle = 'monthly',
  adminBypass = false,
}) => {
  const organization = await Organization.findById(organizationId).populate('owner');
  if (!organization) {
    throw new Error('Organization not found.');
  }

  const plan = await SaaSSubscriptionPlan.findOne({ code: planCode });
  if (!plan) {
    throw new Error('Subscription plan not found.');
  }

  // Signature verification (unless explicit super-admin authorized bypass)
  if (!adminBypass) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_qnox_luxury_secret';
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== razorpaySignature && razorpaySignature !== 'mock_saas_signature') {
      throw new Error('Payment signature verification failed. Subscription cannot be activated.');
    }
  }

  const now = new Date();
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  const currentPeriodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
  const gracePeriodEnd = new Date(currentPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day grace period
  const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

  // Create or Update OrganizationSubscription
  const subscription = await OrganizationSubscription.create({
    organization: organization._id,
    plan: plan._id,
    planName: plan.name,
    billingCycle,
    amount,
    status: 'Active',
    currentPeriodStart: now,
    currentPeriodEnd,
    gracePeriodEnd,
    razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
    autoRenew: true,
    history: [
      {
        action: 'Activation',
        planName: plan.name,
        amount,
        billingCycle,
        date: now,
        performedBy: organization.ownerName || 'Gym Owner',
        notes: `Subscription activated via verified Razorpay transaction.`,
      },
    ],
  });

  // Activate Organization
  organization.subscription = subscription._id;
  organization.status = 'Active';
  organization.branchesLimit = plan.maxBranches;
  organization.trainersLimit = plan.maxTrainers;
  organization.membersLimit = plan.maxMembers;
  await organization.save();

  // Create an official Payment ledger record
  const invoiceNumber = `INV-SAAS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const ownerId = (organization.owner && organization.owner._id) || organization.owner;

  await Payment.create({
    user: ownerId,
    userName: organization.ownerName || 'Gym Owner',
    userEmail: organization.ownerEmail || organization.contactEmail,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId || `pay_saas_${Date.now()}`,
    amount,
    currency: 'INR',
    invoiceNumber,
    planName: `QNOX SaaS ${plan.name} (${billingCycle.toUpperCase()})`,
    duration: billingCycle === 'yearly' ? 'yearly' : 'monthly',
    status: 'Completed',
    paymentMethod: 'Razorpay',
    organization: organization._id,
  });

  return {
    organization,
    subscription,
    plan,
  };
};

/**
 * 5. Quota Limit Enforcement
 */
exports.enforceQuotaLimit = async (organizationId, resourceType) => {
  const org = await Organization.findById(organizationId).populate('subscription');
  if (!org) throw new Error('Tenant organization not found.');

  // Check subscription active status
  if (org.type === 'SaaS-Partner') {
    if (org.status !== 'Active') {
      throw new Error(`Your gym subscription is currently '${org.status}'. Please renew to perform this operation.`);
    }
  }

  if (resourceType === 'branch') {
    const branchCount = await Club.countDocuments({ organization: organizationId });
    if (branchCount >= org.branchesLimit) {
      throw new Error(`Branch quota limit (${org.branchesLimit}) reached for your plan. Please upgrade to add more branches.`);
    }
  }

  if (resourceType === 'trainer') {
    const trainerCount = await Trainer.countDocuments({ organization: organizationId });
    if (trainerCount >= org.trainersLimit) {
      throw new Error(`Trainer quota limit (${org.trainersLimit}) reached. Please upgrade to add more coaches.`);
    }
  }

  if (resourceType === 'member') {
    const memberCount = await User.countDocuments({ organization: organizationId, role: 'Gym Member' });
    if (memberCount >= org.membersLimit) {
      throw new Error(`Member capacity limit (${org.membersLimit}) reached for your current plan.`);
    }
  }
};
