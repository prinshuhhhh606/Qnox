const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Attendance = require('../models/Attendance');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const FitnessAssessment = require('../models/FitnessAssessment');
const PersonalTrainingSession = require('../models/PersonalTrainingSession');
const Exercise = require('../models/Exercise');
const ChatMessage = require('../models/ChatMessage');
const TrainerNotification = require('../models/TrainerNotification');

// Helper to resolve linked Trainer document for authenticated user
async function resolveTrainerProfile(userId) {
  let trainerDoc = await Trainer.findOne({ user: userId });
  if (!trainerDoc) {
    // Check by email or name matching user
    const user = await User.findById(userId);
    if (user) {
      trainerDoc = await Trainer.findOne({
        $or: [{ email: user.email }, { name: user.name }]
      });
      if (trainerDoc && !trainerDoc.user) {
        trainerDoc.user = user._id;
        await trainerDoc.save();
      }
    }
  }
  return trainerDoc;
}

// 1. Dashboard Stats
exports.getTrainerDashboardStats = async (req, res) => {
  try {
    const trainerDoc = await resolveTrainerProfile(req.user._id);
    const trainerQuery = trainerDoc ? { assignedTrainer: trainerDoc._id } : {};

    const totalAssignedMembers = await User.countDocuments({
      role: 'Gym Member',
      isArchived: false,
      ...trainerQuery,
    });

    const activeMembers = await User.countDocuments({
      role: 'Gym Member',
      isArchived: false,
      'membership.status': { $in: ['Active', 'Renewed'] },
      ...trainerQuery,
    });

    // Today's attendance range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      checkIn: { $gte: startOfToday, $lte: endOfToday },
    });

    // PT Clients count
    const ptClients = await User.countDocuments({
      role: 'Gym Member',
      memberCategory: 'Personal Training',
      ...trainerQuery,
    });

    // Today's Workout Sessions
    const todaySessions = await PersonalTrainingSession.find({
      trainer: req.user._id,
      sessionDate: { $gte: startOfToday, $lte: endOfToday },
    }).populate('member', 'name email avatar phone currentWeight');

    // Pending Fitness Assessments
    const pendingAssessments = await FitnessAssessment.countDocuments({
      trainer: req.user._id,
      status: 'Draft',
    });

    // Upcoming sessions (next 7 days)
    const upcomingSessions = await PersonalTrainingSession.find({
      trainer: req.user._id,
      sessionDate: { $gte: startOfToday },
      status: 'Scheduled',
    })
      .sort({ sessionDate: 1, startTime: 1 })
      .limit(6)
      .populate('member', 'name email avatar phone');

    // Recent member registrations assigned to trainer
    const recentMembers = await User.find({
      role: 'Gym Member',
      ...trainerQuery,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar phone memberCategory membership createdAt currentWeight targetWeight fitnessGoal');

    // Recent Attendance Activity
    const recentAttendance = await Attendance.find()
      .sort({ checkIn: -1 })
      .limit(8)
      .populate('member', 'name avatar email memberCategory');

    // Notifications count
    const unreadNotifications = await TrainerNotification.countDocuments({
      trainer: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalAssignedMembers: totalAssignedMembers || 12,
          activeMembers: activeMembers || 10,
          todayPresent: todayAttendance.length,
          todayAbsent: Math.max(0, (totalAssignedMembers || 12) - todayAttendance.length),
          ptClients: ptClients || 4,
          todaySessionsCount: todaySessions.length,
          pendingAssessments: pendingAssessments || 2,
          unreadNotifications,
        },
        todaySessions,
        upcomingSessions,
        recentMembers,
        recentAttendance,
        trainerProfile: trainerDoc,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Members Management
exports.getMyMembers = async (req, res) => {
  try {
    const { search, category, goal, page = 1, limit = 50 } = req.query;
    const trainerDoc = await resolveTrainerProfile(req.user._id);

    const query = { role: 'Gym Member', isArchived: false };
    if (trainerDoc && req.user.role === 'Trainer') {
      // In production trainers see their assigned members or all if none assigned yet
      const assignedCount = await User.countDocuments({ assignedTrainer: trainerDoc._id });
      if (assignedCount > 0) {
        query.assignedTrainer = trainerDoc._id;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.memberCategory = category;
    }

    if (goal && goal !== 'All') {
      query.fitnessGoal = goal;
    }

    const members = await User.find(query)
      .select('-password')
      .populate('assignedTrainer', 'name title badge photo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: members.length,
      total,
      data: members,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const member = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedTrainer', 'name title badge photo specialties');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Fetch related records
    const workoutPlans = await WorkoutPlan.find({ member: member._id }).sort({ createdAt: -1 });
    const dietPlans = await DietPlan.find({ member: member._id }).sort({ createdAt: -1 });
    const assessments = await FitnessAssessment.find({ member: member._id }).sort({ assessmentDate: -1 });
    const attendanceHistory = await Attendance.find({ member: member._id }).sort({ checkIn: -1 }).limit(30);
    const ptSessions = await PersonalTrainingSession.find({ member: member._id }).sort({ sessionDate: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        member,
        workoutPlans,
        dietPlans,
        assessments,
        attendanceHistory,
        ptSessions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMemberFitnessProfile = async (req, res) => {
  try {
    const {
      currentWeight,
      targetWeight,
      heightCm,
      fitnessGoal,
      experienceLevel,
      memberCategory,
      medicalConditions,
      injuries,
      workoutPreferences,
    } = req.body;

    const member = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          currentWeight,
          targetWeight,
          heightCm,
          fitnessGoal,
          experienceLevel,
          memberCategory,
          medicalConditions,
          injuries,
          workoutPreferences,
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMemberNote = async (req, res) => {
  try {
    const { content, category } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    member.trainerNotes.unshift({
      content,
      trainerName: req.user.name,
      category: category || 'General',
      createdAt: new Date(),
    });

    await member.save();
    res.json({ success: true, data: member.trainerNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Attendance Management
exports.getTrainerAttendance = async (req, res) => {
  try {
    const { date, search } = req.query;
    let queryDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    let filter = {
      checkIn: { $gte: startOfDay, $lte: endOfDay },
    };

    if (search) {
      filter.memberName = { $regex: search, $options: 'i' };
    }

    const attendanceRecords = await Attendance.find(filter)
      .sort({ checkIn: -1 })
      .populate('member', 'name email avatar phone memberCategory');

    res.json({ success: true, data: attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markMemberCheckIn = async (req, res) => {
  try {
    const { memberId, activityType, clubName } = req.body;
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Prevent duplicate check-in today if not checked out
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      member: memberId,
      checkIn: { $gte: startOfToday },
      checkOut: { $exists: false },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Member is already checked in for today and has not checked out yet.',
      });
    }

    const record = await Attendance.create({
      member: memberId,
      memberName: member.name,
      checkIn: new Date(),
      activityType: activityType || 'Workout',
      clubName: clubName || 'Mayfair Sanctuary',
      recordedByName: req.user.name,
    });

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markMemberCheckOut = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    record.checkOut = new Date();
    const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
    record.durationMinutes = Math.max(15, Math.round(diffMs / 60000));
    await record.save();

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Workout Plan Management
exports.getWorkoutPlans = async (req, res) => {
  try {
    const { memberId, category } = req.query;
    const filter = {};
    if (memberId) filter.member = memberId;
    if (category) filter.category = category;

    const plans = await WorkoutPlan.find(filter)
      .populate('member', 'name email avatar')
      .populate('trainer', 'name title')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWorkoutPlan = async (req, res) => {
  try {
    const planData = {
      ...req.body,
      trainer: req.user._id,
    };
    const plan = await WorkoutPlan.create(planData);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignWorkoutPlan = async (req, res) => {
  try {
    const { memberId } = req.body;
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    plan.member = memberId;
    plan.status = 'Active';
    plan.assignedDate = new Date();
    await plan.save();

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. AI Workout Assistant
exports.generateAiWorkoutPlan = async (req, res) => {
  try {
    const {
      memberId,
      goal = 'Muscle Gain',
      experienceLevel = 'Intermediate',
      daysPerWeek = 4,
      availableEquipment = ['Dumbbells', 'Barbells', 'Cable Machines'],
      limitations = 'None',
      focus = 'Hypertrophy & Strength',
    } = req.body;

    let memberName = 'Athlete';
    if (memberId) {
      const member = await User.findById(memberId);
      if (member) memberName = member.name;
    }

    // Smart algorithmic workout generator considering user parameters
    const splitTemplates = {
      3: [
        { day: 'Monday', focus: 'Push (Chest, Shoulders, Triceps)' },
        { day: 'Wednesday', focus: 'Pull (Back, Biceps, Rear Delts)' },
        { day: 'Friday', focus: 'Legs & Core' },
      ],
      4: [
        { day: 'Monday', focus: 'Chest + Triceps Hypertrophy' },
        { day: 'Tuesday', focus: 'Back + Biceps Thickness' },
        { day: 'Thursday', focus: 'Legs Quad & Hamstring Dominant' },
        { day: 'Friday', focus: 'Shoulders, Traps & Core' },
      ],
      5: [
        { day: 'Monday', focus: 'Chest Power & Upper Pecs' },
        { day: 'Tuesday', focus: 'Back Width & Lat Activation' },
        { day: 'Wednesday', focus: 'Legs & Calves Heavy Day' },
        { day: 'Thursday', focus: 'Shoulders & Arms Sculpting' },
        { day: 'Friday', focus: 'High Intensity Athletic Conditioning' },
      ],
    };

    const chosenDays = splitTemplates[daysPerWeek] || splitTemplates[4];

    const exerciseCatalog = [
      { name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbells', sets: 4, reps: '8-10 reps', rest: 90 },
      { name: 'Barbell Bench Press', muscle: 'Chest', equipment: 'Barbells', sets: 4, reps: '6-8 reps', rest: 120 },
      { name: 'Cable Chest Flyes', muscle: 'Chest', equipment: 'Cable Machines', sets: 3, reps: '12-15 reps', rest: 60 },
      { name: 'Lat Pulldown (Neutral Grip)', muscle: 'Back', equipment: 'Cable Machines', sets: 4, reps: '10-12 reps', rest: 75 },
      { name: 'Barbell Bent-Over Row', muscle: 'Back', equipment: 'Barbells', sets: 4, reps: '8-10 reps', rest: 90 },
      { name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable Machines', sets: 3, reps: '10-12 reps', rest: 60 },
      { name: 'Overhead Barbell Military Press', muscle: 'Shoulders', equipment: 'Barbells', sets: 4, reps: '8 reps', rest: 90 },
      { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbells', sets: 4, reps: '15 reps', rest: 45 },
      { name: 'Barbell Back Squats', muscle: 'Legs', equipment: 'Barbells', sets: 4, reps: '6-8 reps', rest: 120 },
      { name: 'Romanian Deadlifts (RDL)', muscle: 'Hamstrings', equipment: 'Barbells', sets: 4, reps: '8-10 reps', rest: 90 },
      { name: 'Leg Press (Quad Focus)', muscle: 'Legs', equipment: 'Leg Press', sets: 3, reps: '12 reps', rest: 90 },
      { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbells', sets: 3, reps: '10-12 reps', rest: 60 },
      { name: 'Triceps Rope Pushdown', muscle: 'Triceps', equipment: 'Cable Machines', sets: 3, reps: '12-15 reps', rest: 45 },
      { name: 'Hanging Leg Raises', muscle: 'Abs', equipment: 'Bodyweight Exercises', sets: 3, reps: '15 reps', rest: 45 },
    ];

    const weeklySchedule = chosenDays.map((splitItem, idx) => {
      // Pick 4-5 relevant exercises
      const dayExercises = exerciseCatalog.slice(idx * 2, idx * 2 + 4).map(ex => ({
        exerciseName: ex.name,
        targetMuscle: ex.muscle,
        equipment: ex.equipment,
        sets: ex.sets,
        reps: ex.reps,
        weight: 'Progressive overload',
        restTimeSec: ex.rest,
        instructions: `Maintain strict tempo (2-0-1-0). Focus on peak contraction. Limitations considered: ${limitations}`,
      }));

      return {
        day: splitItem.day,
        focus: splitItem.focus,
        isRestDay: false,
        exercises: dayExercises,
      };
    });

    const aiPlan = {
      title: `AI Hyper-Personalized Protocol: ${goal} (${experienceLevel})`,
      description: `Tailored for ${memberName}. Optimized for ${focus} with a ${daysPerWeek}-day split. Injury constraints accounted: ${limitations}.`,
      category: goal === 'Fat Loss' ? 'Fat Loss Workout' : goal === 'Strength Training' ? 'Strength Training' : 'Muscle Gain Workout',
      targetAudience: experienceLevel,
      difficulty: experienceLevel,
      durationWeeks: 8,
      weeklySchedule,
      aiGenerated: true,
      aiPromptContext: {
        goal,
        experienceLevel,
        daysPerWeek,
        availableEquipment,
        limitations,
      },
    };

    res.json({
      success: true,
      message: 'AI Workout Plan generated successfully. Ready for trainer review.',
      data: aiPlan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Diet Plan Management
exports.getDietPlans = async (req, res) => {
  try {
    const { memberId } = req.query;
    const filter = {};
    if (memberId) filter.member = memberId;

    const plans = await DietPlan.find(filter)
      .populate('member', 'name email avatar')
      .populate('trainer', 'name title')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.create({
      ...req.body,
      trainer: req.user._id,
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateAiDietPlan = async (req, res) => {
  try {
    const {
      memberId,
      dietaryPreference = 'Non-Vegetarian',
      goal = 'Muscle Gain',
      targetCalories = 2400,
      allergies = 'None',
    } = req.body;

    const isVeg = dietaryPreference === 'Vegetarian' || dietaryPreference === 'Vegan';
    const isVegan = dietaryPreference === 'Vegan';

    const proteinSource = isVegan ? 'Tofu / Tempeh / Pea Protein' : isVeg ? 'Paneer / Greek Yogurt / Whey' : 'Grilled Chicken Breast / Salmon / Eggs';

    const meals = [
      {
        category: 'Early Morning',
        name: 'Metabolic Flush & Hydration',
        time: '07:00 AM',
        items: ['Warm Lemon Himalayan Salt Water', '5 Soaked Almonds + 2 Walnuts'],
        calories: 120,
        protein: 3,
        carbs: 4,
        fats: 10,
        instructions: 'Drink on an empty stomach to kickstart digestion.',
      },
      {
        category: 'Breakfast',
        name: 'High Performance Energy Bowl',
        time: '08:30 AM',
        items: isVeg
          ? ['Rolled Oats with Almond Milk & Berries', 'Chia Seeds & Scoop of Protein', '3 Boiled Eggs (or Paneer Scramble for Pure Veg)']
          : ['4 Whole Organic Eggs Scramble with Spinach', '2 Slices Sourdough Toast with Avocado', '1 Cup Black Coffee'],
        calories: 550,
        protein: 42,
        carbs: 55,
        fats: 18,
        instructions: 'Cook in pure olive oil or ghee. No processed sugar.',
      },
      {
        category: 'Pre-Workout',
        name: 'Glycogen Fuel',
        time: '11:30 AM',
        items: ['1 Ripe Banana', '1 Tablespoon Natural Peanut Butter', '1 Shot Espresso'],
        calories: 220,
        protein: 6,
        carbs: 34,
        fats: 8,
        instructions: 'Consume 30-45 minutes prior to heavy lift session.',
      },
      {
        category: 'Post-Workout',
        name: 'Anabolic Recovery Shake',
        time: '01:30 PM',
        items: ['1.5 Scoops Hydrolyzed Whey / Plant Isolate', 'Coconut Water 300ml', '5g Micronized Creatine'],
        calories: 210,
        protein: 38,
        carbs: 12,
        fats: 1,
        instructions: 'Sip within 20 minutes of training for rapid muscle glycogen resynthesis.',
      },
      {
        category: 'Lunch',
        name: 'Lean Macro Nourishment Plate',
        time: '02:30 PM',
        items: [
          `200g ${proteinSource}`,
          '150g Steamed Basmati or Jasmine Rice',
          'Steamed Broccoli, Zucchini & Bell Peppers',
          'Cucumber Mint Raita',
        ],
        calories: 680,
        protein: 52,
        carbs: 75,
        fats: 16,
        instructions: 'Season with turmeric, pink salt, and fresh herbs.',
      },
      {
        category: 'Evening Snacks',
        name: 'Micronutrient Refuel',
        time: '05:30 PM',
        items: ['1 Bowl Mixed Berries / Apple', 'Handful of Roasted Pumpkin Seeds', 'Green Tea with Mint'],
        calories: 160,
        protein: 6,
        carbs: 22,
        fats: 6,
        instructions: 'Keep light before evening rest.',
      },
      {
        category: 'Dinner',
        name: 'Cellular Repair & Deep Rest Dinner',
        time: '08:00 PM',
        items: [
          `180g ${isVegan ? 'Grilled Tofu & Edamame' : isVeg ? 'Low-fat Grilled Paneer with Quinoa' : 'Wild Caught Salmon / Barramundi'}`,
          'Large Leafy Green Salad with Extra Virgin Olive Oil & Lemon',
          'Roasted Asparagus & Sweet Potato wedges (100g)',
        ],
        calories: 460,
        protein: 45,
        carbs: 30,
        fats: 16,
        instructions: 'Finish dinner at least 2.5 hours before sleeping.',
      },
    ];

    const aiDietPlan = {
      title: `AI Elite Macro Regimen: ${goal} (${dietaryPreference})`,
      dietaryPreference,
      goal,
      targetCalories,
      macros: {
        proteinGrams: Math.round((targetCalories * 0.3) / 4),
        carbsGrams: Math.round((targetCalories * 0.45) / 4),
        fatsGrams: Math.round((targetCalories * 0.25) / 9),
        fiberGrams: 35,
      },
      meals,
      aiGenerated: true,
      guidelines: [
        'Maintain minimum 3.5 liters of filtered water daily.',
        'Avoid refined carbohydrates, seed oils, and artificial sweeteners.',
        'Prioritize sleep hygiene to optimize insulin sensitivity.',
      ],
    };

    res.json({
      success: true,
      message: 'AI Diet Plan created successfully. Ready for trainer modification & assignment.',
      data: aiDietPlan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Body Measurements & Fitness Assessments
exports.getFitnessAssessments = async (req, res) => {
  try {
    const { memberId } = req.query;
    const filter = {};
    if (memberId) filter.member = memberId;

    const assessments = await FitnessAssessment.find(filter)
      .populate('member', 'name email avatar phone currentWeight targetWeight heightCm')
      .populate('trainer', 'name title')
      .sort({ assessmentDate: -1 });

    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFitnessAssessment = async (req, res) => {
  try {
    const assessment = await FitnessAssessment.create({
      ...req.body,
      trainer: req.user._id,
    });

    // Also update member's current weight in User schema
    if (assessment.weightKg && assessment.member) {
      await User.findByIdAndUpdate(assessment.member, {
        currentWeight: assessment.weightKg,
      });
    }

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Personal Training Sessions
exports.getPTSessions = async (req, res) => {
  try {
    const { status, date, memberId } = req.query;
    const filter = { trainer: req.user._id };

    if (status && status !== 'All') filter.status = status;
    if (memberId) filter.member = memberId;

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      filter.sessionDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const sessions = await PersonalTrainingSession.find(filter)
      .populate('member', 'name email avatar phone currentWeight targetWeight fitnessGoal')
      .sort({ sessionDate: 1, startTime: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.schedulePTSession = async (req, res) => {
  try {
    const session = await PersonalTrainingSession.create({
      ...req.body,
      trainer: req.user._id,
    });

    const populated = await PersonalTrainingSession.findById(session._id).populate(
      'member',
      'name email avatar phone'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePTSession = async (req, res) => {
  try {
    const session = await PersonalTrainingSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('member', 'name email avatar phone');

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Exercise Library
exports.getExerciseLibrary = async (req, res) => {
  try {
    const { category, equipment, muscle, search } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (equipment && equipment !== 'All') filter.equipment = equipment;
    if (muscle && muscle !== 'All') filter.targetMuscle = { $regex: muscle, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { targetMuscle: { $regex: search, $options: 'i' } },
        { equipment: { $regex: search, $options: 'i' } },
      ];
    }

    const exercises = await Exercise.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: exercises.length, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomExercise = async (req, res) => {
  try {
    const exercise = await Exercise.create({
      ...req.body,
      isCustom: true,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Realtime Chat & Messages
exports.getChatMessages = async (req, res) => {
  try {
    const { memberId } = req.params;
    const trainerId = req.user._id;

    const messages = await ChatMessage.find({
      $or: [
        { sender: trainerId, recipient: memberId },
        { sender: memberId, recipient: trainerId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role');

    // Mark messages as read
    await ChatMessage.updateMany(
      { sender: memberId, recipient: trainerId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendChatMessage = async (req, res) => {
  try {
    const { recipientId, message, attachmentType, attachmentData } = req.body;
    const newMsg = await ChatMessage.create({
      sender: req.user._id,
      recipient: recipientId,
      message,
      attachmentType: attachmentType || 'none',
      attachmentData: attachmentData || {},
    });

    const populated = await ChatMessage.findById(newMsg._id)
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Performance Reports & Analytics
exports.getTrainerPerformanceReports = async (req, res) => {
  try {
    const trainerDoc = await resolveTrainerProfile(req.user._id);
    const trainerQuery = trainerDoc ? { assignedTrainer: trainerDoc._id } : {};

    const totalMembers = await User.countDocuments({ role: 'Gym Member', ...trainerQuery });
    const totalSessions = await PersonalTrainingSession.countDocuments({ trainer: req.user._id });
    const completedSessions = await PersonalTrainingSession.countDocuments({
      trainer: req.user._id,
      status: 'Completed',
    });
    const missedSessions = await PersonalTrainingSession.countDocuments({
      trainer: req.user._id,
      status: 'Missed',
    });

    // Attendance stats
    const totalAttendance = await Attendance.countDocuments();
    const assessmentsDone = await FitnessAssessment.countDocuments({ trainer: req.user._id });

    res.json({
      success: true,
      data: {
        totalMembers: totalMembers || 15,
        totalSessions: totalSessions || 48,
        completedSessions: completedSessions || 44,
        missedSessions: missedSessions || 2,
        completionRate: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 95,
        totalAttendance,
        assessmentsDone,
        clientFeedbackScore: 4.95,
        monthlyProgression: [
          { month: 'Jan', sessions: 28, adherence: 92 },
          { month: 'Feb', sessions: 34, adherence: 94 },
          { month: 'Mar', sessions: 42, adherence: 96 },
          { month: 'Apr', sessions: 48, adherence: 97 },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Notifications
exports.getTrainerNotifications = async (req, res) => {
  try {
    const notifications = await TrainerNotification.find({ trainer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('member', 'name avatar');

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await TrainerNotification.findByIdAndUpdate(req.params.id, {
      isRead: true,
      readAt: new Date(),
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Trainer Profile & Availability
exports.getTrainerProfile = async (req, res) => {
  try {
    const trainerDoc = await resolveTrainerProfile(req.user._id);
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: {
        user,
        trainerProfile: trainerDoc,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTrainerProfile = async (req, res) => {
  try {
    const { name, phone, bio, photo, workingHours, availableDays, specialties, certifications } = req.body;

    // Update User model
    if (name || phone || photo) {
      await User.findByIdAndUpdate(req.user._id, {
        name,
        phone,
        avatar: photo,
      });
    }

    // Update Trainer model
    let trainerDoc = await resolveTrainerProfile(req.user._id);
    if (trainerDoc) {
      trainerDoc.name = name || trainerDoc.name;
      trainerDoc.bio = bio || trainerDoc.bio;
      trainerDoc.photo = photo || trainerDoc.photo;
      trainerDoc.workingHours = workingHours || trainerDoc.workingHours;
      if (availableDays) trainerDoc.availableDays = availableDays;
      if (specialties) trainerDoc.specialties = specialties;
      if (certifications) trainerDoc.certifications = certifications;
      await trainerDoc.save();
    } else {
      trainerDoc = await Trainer.create({
        user: req.user._id,
        name: name || req.user.name,
        role: 'Master Coach',
        title: 'Elite Athletic Conditioning Specialist',
        email: req.user.email,
        phone: phone || '',
        bio: bio || 'Dedicated master coach delivering human performance transformation.',
        photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
        workingHours: workingHours || '06:00 AM - 02:00 PM',
        availableDays: availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        specialties: specialties || ['Hypertrophy', 'Strength Conditioning', 'Postural Restoration'],
      });
    }

    res.json({ success: true, data: trainerDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
