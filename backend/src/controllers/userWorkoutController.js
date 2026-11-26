const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutSession = require('../models/WorkoutSession');
const User = require('../models/User');
const { generateAiWorkoutProtocol } = require('../services/aiWorkoutService');

/**
 * 1. AI Workout Plan Generation
 * POST /api/workouts/ai-generate
 */
exports.generateAiWorkoutPlan = async (req, res) => {
  try {
    const {
      goal = 'Muscle Gain',
      experienceLevel = 'Intermediate',
      daysPerWeek = 4,
      limitations = 'None',
      focus = 'Hypertrophy & Strength',
      availableEquipment = 'Full Sanctuary Athletic Gym',
    } = req.body;

    const memberName = req.user.name || 'Sanctuary Athlete';

    const generatedPlan = generateAiWorkoutProtocol({
      goal,
      experienceLevel,
      daysPerWeek,
      limitations,
      focus,
      availableEquipment,
      memberName,
    });

    res.status(200).json({
      success: true,
      message: 'AI Workout Protocol generated successfully. Ready for review.',
      data: generatedPlan,
    });
  } catch (error) {
    console.error('Error generating AI workout plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Save Plan
 * POST /api/workouts/save
 * Associated with authenticated user, prevents duplicate saved plans
 */
exports.saveWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const planPayload = req.body;

    if (!planPayload.title || !planPayload.title.trim()) {
      return res.status(400).json({ success: false, message: 'Workout plan title is required.' });
    }

    // Check if already exists in DB by ID
    if (planPayload._id) {
      const existing = await WorkoutPlan.findOne({
        _id: planPayload._id,
        $or: [{ user: userId }, { member: userId }],
      });

      if (existing) {
        existing.isSaved = true;
        existing.savedAt = existing.savedAt || new Date();
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Workout plan saved to your library.',
          data: existing,
        });
      }
    }

    // Check for duplicate by title for this user
    const duplicate = await WorkoutPlan.findOne({
      $or: [{ user: userId }, { member: userId }],
      title: planPayload.title.trim(),
      isSaved: true,
    });

    if (duplicate) {
      return res.status(200).json({
        success: true,
        message: 'This workout plan is already in your saved library.',
        data: duplicate,
        isDuplicate: true,
      });
    }

    // Create a new saved workout plan
    const newPlanData = {
      ...planPayload,
      user: userId,
      member: userId,
      isSaved: true,
      savedAt: new Date(),
      approvalStatus: planPayload.approvalStatus || 'generated',
    };
    delete newPlanData._id;

    const savedPlan = await WorkoutPlan.create(newPlanData);

    res.status(201).json({
      success: true,
      message: 'Workout plan successfully saved to your sanctuary library!',
      data: savedPlan,
    });
  } catch (error) {
    console.error('Error saving workout plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Approve Plan
 * POST /api/workouts/approve
 * Validates, updates approval status to 'approved', sets approval timestamp,
 * and sets as user's active workout plan.
 */
exports.approveWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId, planData } = req.body;

    let targetPlan = null;

    if (planId) {
      targetPlan = await WorkoutPlan.findOne({
        _id: planId,
        $or: [{ user: userId }, { member: userId }],
      });
    }

    // If plan wasn't saved yet or planData passed directly
    if (!targetPlan && planData) {
      const newPlan = {
        ...planData,
        user: userId,
        member: userId,
        approvalStatus: 'approved',
        approvedAt: new Date(),
      };
      delete newPlan._id;
      targetPlan = await WorkoutPlan.create(newPlan);
    } else if (targetPlan) {
      targetPlan.approvalStatus = 'approved';
      targetPlan.approvedAt = new Date();
      await targetPlan.save();
    } else {
      return res.status(404).json({ success: false, message: 'Workout plan not found to approve.' });
    }

    // Deactivate previous active plans for this user
    await WorkoutPlan.updateMany(
      {
        $or: [{ user: userId }, { member: userId }],
        _id: { $ne: targetPlan._id },
        approvalStatus: 'active',
      },
      {
        $set: { approvalStatus: 'approved' },
      }
    );

    // Set this plan as active
    targetPlan.approvalStatus = 'active';
    targetPlan.activatedAt = new Date();
    await targetPlan.save();

    // Link on User record
    await User.findByIdAndUpdate(userId, { activeWorkoutPlan: targetPlan._id });

    res.status(200).json({
      success: true,
      message: 'Workout protocol approved and set as your active regimen!',
      data: targetPlan,
    });
  } catch (error) {
    console.error('Error approving workout plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Get Active Workout Plan
 * GET /api/workouts/active
 */
exports.getActiveWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id;

    let activePlan = await WorkoutPlan.findOne({
      $or: [{ user: userId }, { member: userId }],
      approvalStatus: 'active',
    }).sort({ activatedAt: -1, updatedAt: -1 });

    if (!activePlan) {
      const user = await User.findById(userId).populate('activeWorkoutPlan');
      if (user && user.activeWorkoutPlan) {
        activePlan = user.activeWorkoutPlan;
      }
    }

    // Fallback: most recent approved plan
    if (!activePlan) {
      activePlan = await WorkoutPlan.findOne({
        $or: [{ user: userId }, { member: userId }],
        approvalStatus: 'approved',
      }).sort({ approvedAt: -1, updatedAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: activePlan || null,
    });
  } catch (error) {
    console.error('Error fetching active workout plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Get Saved Workout Plans
 * GET /api/workouts/saved
 */
exports.getSavedWorkoutPlans = async (req, res) => {
  try {
    const userId = req.user._id;

    const savedPlans = await WorkoutPlan.find({
      $or: [{ user: userId }, { member: userId }],
      isSaved: true,
    }).sort({ savedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: savedPlans.length,
      data: savedPlans,
    });
  } catch (error) {
    console.error('Error fetching saved workout plans:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Get Single Workout Plan Details
 * GET /api/workouts/:id
 */
exports.getWorkoutPlanById = async (req, res) => {
  try {
    const userId = req.user._id;
    const plan = await WorkoutPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }

    // Ensure user ownership or public sanctuary access
    if (plan.user && plan.user.toString() !== userId.toString() && plan.member && plan.member.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this workout plan.' });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Delete Saved Plan
 * DELETE /api/workouts/:id
 */
exports.deleteSavedWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      $or: [{ user: userId }, { member: userId }],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // If it was active, remove from User
    if (plan.approvalStatus === 'active') {
      await User.findByIdAndUpdate(userId, { activeWorkoutPlan: null });
    }

    await WorkoutPlan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Workout plan removed from your sanctuary library.',
    });
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Start Workout Session
 * POST /api/workouts/session/start
 * Prevents multiple unintended active sessions
 */
exports.startWorkoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId, dayIndex = 0, forceNew = false } = req.body;

    // Check for existing active session
    const activeSession = await WorkoutSession.findOne({
      user: userId,
      status: 'active',
    });

    if (activeSession && !forceNew) {
      return res.status(200).json({
        success: true,
        hasActiveSession: true,
        message: 'You already have an active workout session in progress. Resuming live session.',
        data: activeSession,
      });
    }

    if (activeSession && forceNew) {
      activeSession.status = 'abandoned';
      activeSession.endedAt = new Date();
      await activeSession.save();
    }

    // Resolve workout plan
    let plan = null;
    if (planId) {
      plan = await WorkoutPlan.findById(planId);
    } else {
      plan = await WorkoutPlan.findOne({
        $or: [{ user: userId }, { member: userId }],
        approvalStatus: 'active',
      });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active or selected workout plan found. Please approve a plan first.',
      });
    }

    // Extract selected day's exercises
    const chosenDay = (plan.weeklySchedule && plan.weeklySchedule[dayIndex]) || (plan.weeklySchedule && plan.weeklySchedule[0]) || { day: 'Day 1', focus: 'Full Body Conditioning', exercises: [] };

    let sessionExercises = [];
    if (chosenDay.exercises && chosenDay.exercises.length > 0) {
      sessionExercises = chosenDay.exercises.map((ex) => ({
        name: ex.name || ex.exerciseName || 'Compound Lift',
        category: ex.category || 'General',
        targetMuscle: ex.targetMuscle || 'Full Body',
        equipment: ex.equipment || 'Dumbbells',
        targetSets: Number(ex.sets) || 3,
        targetReps: String(ex.reps || '10-12'),
        restSeconds: Number(ex.restSeconds || ex.restTimeSec) || 60,
        instructions: ex.instructions || '',
        isCompleted: false,
        completedSets: [],
      }));
    } else if (plan.exercises && plan.exercises.length > 0) {
      sessionExercises = plan.exercises.map((ex) => ({
        name: ex.name || ex.exerciseName || 'Compound Lift',
        category: ex.category || 'General',
        targetMuscle: ex.targetMuscle || 'Full Body',
        equipment: ex.equipment || 'Dumbbells',
        targetSets: Number(ex.sets) || 3,
        targetReps: String(ex.reps || '10-12'),
        restSeconds: Number(ex.restSeconds || ex.restTimeSec) || 60,
        instructions: ex.instructions || '',
        isCompleted: false,
        completedSets: [],
      }));
    }

    const newSession = await WorkoutSession.create({
      user: userId,
      workoutPlan: plan._id,
      planTitle: plan.title,
      dayName: chosenDay.day || 'Day 1',
      dayFocus: chosenDay.focus || 'Full Body Hypertrophy',
      startedAt: new Date(),
      status: 'active',
      exercises: sessionExercises,
      totalExercisesCompleted: 0,
      totalSetsCompleted: 0,
      totalRepsCompleted: 0,
      caloriesBurned: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Workout session ignited. Stay disciplined.',
      data: newSession,
    });
  } catch (error) {
    console.error('Error starting workout session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. Get Current Active Session
 * GET /api/workouts/session/current
 */
exports.getCurrentSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await WorkoutSession.findOne({
      user: userId,
      status: 'active',
    }).populate('workoutPlan', 'title category goal difficulty durationWeeks');

    res.status(200).json({
      success: true,
      data: session || null,
    });
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. Log Completed Set for an Exercise
 * PUT /api/workouts/session/:id/log-set
 */
exports.logSessionSet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { exerciseIndex, setNumber, reps, weightKg } = req.body;

    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user: userId,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active workout session not found.' });
    }

    const exIdx = Number(exerciseIndex);
    if (!session.exercises[exIdx]) {
      return res.status(400).json({ success: false, message: 'Invalid exercise index.' });
    }

    const exercise = session.exercises[exIdx];
    const newSet = {
      setNumber: Number(setNumber) || (exercise.completedSets.length + 1),
      reps: Number(reps) || 10,
      weightKg: Number(weightKg) || 0,
      completedAt: new Date(),
      isCompleted: true,
    };

    exercise.completedSets.push(newSet);

    // If completedSets matches or exceeds targetSets, mark exercise completed
    if (exercise.completedSets.length >= exercise.targetSets) {
      exercise.isCompleted = true;
      exercise.completedAt = new Date();
    }

    // Recompute total sets and reps
    let totalSets = 0;
    let totalReps = 0;
    let completedExCount = 0;

    session.exercises.forEach((ex) => {
      totalSets += ex.completedSets.length;
      ex.completedSets.forEach((s) => {
        totalReps += (s.reps || 0);
      });
      if (ex.isCompleted) completedExCount += 1;
    });

    session.totalSetsCompleted = totalSets;
    session.totalRepsCompleted = totalReps;
    session.totalExercisesCompleted = completedExCount;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Set logged successfully.',
      data: session,
    });
  } catch (error) {
    console.error('Error logging set:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 11. Complete Workout Session
 * POST /api/workouts/session/:id/complete
 */
exports.completeWorkoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notes = '', userRating = 5 } = req.body;

    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Workout session not found.' });
    }

    session.status = 'completed';
    session.endedAt = new Date();

    const diffMs = session.endedAt.getTime() - new Date(session.startedAt).getTime();
    const durationSeconds = Math.max(60, Math.round(diffMs / 1000));
    session.durationSeconds = durationSeconds;

    // Recalculate totals
    let totalSets = 0;
    let totalReps = 0;
    let completedExCount = 0;

    session.exercises.forEach((ex) => {
      totalSets += ex.completedSets.length;
      ex.completedSets.forEach((s) => {
        totalReps += (s.reps || 0);
      });
      if (ex.isCompleted || ex.completedSets.length > 0) completedExCount += 1;
    });

    session.totalSetsCompleted = totalSets;
    session.totalRepsCompleted = totalReps;
    session.totalExercisesCompleted = completedExCount;
    session.notes = notes;
    session.userRating = userRating;

    // Scientific MET calorie estimation (~7.5 kcal/min for high-intensity athletic hypertrophy)
    const minutes = durationSeconds / 60;
    const estimatedCalories = Math.round(minutes * 7.5 + totalSets * 4);
    session.caloriesBurned = estimatedCalories;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Workout completed! Supreme discipline rewarded.',
      data: {
        session,
        summary: {
          totalExercisesCompleted: session.totalExercisesCompleted,
          totalSetsCompleted: session.totalSetsCompleted,
          totalRepsCompleted: session.totalRepsCompleted,
          durationMinutes: Math.round(durationSeconds / 60),
          durationSeconds,
          caloriesBurned: session.caloriesBurned,
          dayFocus: session.dayFocus,
          planTitle: session.planTitle,
          completedAt: session.endedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error completing workout session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 12. Cancel / Abandon Session
 * POST /api/workouts/session/:id/cancel
 */
exports.cancelWorkoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user: userId,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found.' });
    }

    session.status = 'abandoned';
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Workout session cancelled.',
    });
  } catch (error) {
    console.error('Error cancelling workout session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 13. Workout Progress Dashboard
 * GET /api/workouts/progress/dashboard
 */
exports.getProgressDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total completed workouts
    const totalCompletedWorkouts = await WorkoutSession.countDocuments({
      user: userId,
      status: 'completed',
    });

    // Recent 10 completed workouts
    const recentHistory = await WorkoutSession.find({
      user: userId,
      status: 'completed',
    })
      .sort({ endedAt: -1 })
      .limit(10);

    // Current active workout plan
    const activePlan = await WorkoutPlan.findOne({
      $or: [{ user: userId }, { member: userId }],
      approvalStatus: 'active',
    });

    // Weekly activity (Last 7 days)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = await WorkoutSession.find({
      user: userId,
      status: 'completed',
      endedAt: { $gte: startOfWeek },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const daySessions = weekSessions.filter((s) => {
        if (!s.endedAt) return false;
        return new Date(s.endedAt).toISOString().split('T')[0] === dateStr;
      });

      const dayMinutes = daySessions.reduce((acc, s) => acc + Math.round((s.durationSeconds || 0) / 60), 0);
      const dayCalories = daySessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);

      weeklyActivity.push({
        day: dayName,
        date: dateStr,
        workoutCount: daySessions.length,
        durationMinutes: dayMinutes,
        calories: dayCalories,
      });
    }

    // Cumulative stats
    const allCompletedSessions = await WorkoutSession.find({
      user: userId,
      status: 'completed',
    }).select('durationSeconds caloriesBurned totalSetsCompleted totalRepsCompleted');

    const totalMinutes = allCompletedSessions.reduce((acc, s) => acc + Math.round((s.durationSeconds || 0) / 60), 0);
    const totalCalories = allCompletedSessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
    const totalSets = allCompletedSessions.reduce((acc, s) => acc + (s.totalSetsCompleted || 0), 0);
    const totalReps = allCompletedSessions.reduce((acc, s) => acc + (s.totalRepsCompleted || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalCompletedWorkouts,
        totalMinutes,
        totalCalories,
        totalSets,
        totalReps,
        weeklyActivity,
        recentHistory,
        activePlan,
      },
    });
  } catch (error) {
    console.error('Error fetching progress dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
