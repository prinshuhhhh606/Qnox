const MembershipPlan = require('../models/MembershipPlan');

exports.getPlans = async (req, res, next) => {
  try {
    const query = req.query.all === 'true' ? {} : { isActive: true };
    let plans = await MembershipPlan.find(query).sort({ createdAt: 1 });

    const { sampleMembershipPlans } = require('../seed/seedData');

    // Auto-seed if empty
    if (plans.length === 0) {
      await MembershipPlan.insertMany(sampleMembershipPlans);
      plans = await MembershipPlan.find(query).sort({ createdAt: 1 });
    } else {
      // Synchronize database records to required pricing: 1 Mo: 1500, 3 Mo: 4000, 6 Mo: 7000, 12 Mo: 12000
      for (const sp of sampleMembershipPlans) {
        await MembershipPlan.updateOne({ code: sp.code }, { $set: { pricing: sp.pricing } });
      }
      plans = await MembershipPlan.find(query).sort({ createdAt: 1 });
    }

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found.',
      });
    }
    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({
      success: true,
      message: 'New membership residency tier established.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Membership plan updated.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Membership plan decommissioned successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.togglePlanStatus = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found.',
      });
    }
    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};
