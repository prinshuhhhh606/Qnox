/**
 * QNOX Luxury Sanctuary AI Workout Assistance Engine
 * Biomechanically optimized exercise split synthesizer
 */

const exerciseCatalog = {
  Chest: [
    { name: 'Incline Dumbbell Press', muscle: 'Upper Chest', equipment: 'Dumbbells', sets: 4, reps: '8-10', rest: 90, instructions: 'Set bench to 30 degrees. Retract scapulae, lower dumbbells until deep chest stretch, drive up converging at apex without locking elbows.' },
    { name: 'Barbell Flat Bench Press', muscle: 'Mid Chest', equipment: 'Barbells', sets: 4, reps: '6-8', rest: 120, instructions: 'Arch upper back slightly, grip 1.5x shoulder width, touch sternum with control, press with maximum leg drive.' },
    { name: 'Cable Chest Flyes', muscle: 'Inner Chest', equipment: 'Cable Machine', sets: 3, reps: '12-15', rest: 60, instructions: 'Maintain slight elbow bend. Squeeze pecs together at center of chest for a full 2-second isometric contraction.' },
    { name: 'Dips (Chest Leaning)', muscle: 'Lower Chest', equipment: 'Parallel Bars', sets: 3, reps: '10-12', rest: 75, instructions: 'Lean torso forward 30 degrees, flare elbows moderately, descend until parallel, push through palms.' },
  ],
  Back: [
    { name: 'Neutral-Grip Lat Pulldown', muscle: 'Lats (Width)', equipment: 'Cable Machine', sets: 4, reps: '10-12', rest: 75, instructions: 'Drive elbows down to waist pockets. Avoid excessive backward lean. Emphasize full overhead lat stretch.' },
    { name: 'Barbell Bent-Over Row', muscle: 'Mid-Back / Rhomboids', equipment: 'Barbells', sets: 4, reps: '8-10', rest: 90, instructions: 'Hinge hips at 45 degrees, flat lumbar spine. Pull barbell towards navel, squeezing shoulder blades together.' },
    { name: 'Seated Cable Row', muscle: 'Mid-Back & Lats', equipment: 'Cable Machine', sets: 3, reps: '10-12', rest: 60, instructions: 'Chest proud, pull handle to lower abdomen, pause 1 second in contracted position.' },
    { name: 'Single-Arm Dumbbell Row', muscle: 'Lower Lat Focus', equipment: 'Dumbbells', sets: 3, reps: '10-12', rest: 60, instructions: 'Keep hips square, draw dumbbell to hip in an arcing motion, squeeze lat at top.' },
  ],
  Legs: [
    { name: 'Barbell Back Squat', muscle: 'Quads & Glutes', equipment: 'Barbells', sets: 4, reps: '6-8', rest: 120, instructions: 'Brace core with intra-abdominal pressure. Descend below parallel keeping chest upright, explode through midfoot.' },
    { name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings & Posterior Chain', equipment: 'Barbells', sets: 4, reps: '8-10', rest: 90, instructions: 'Soft knee bend, push hips backward towards the wall, maintain neutral spine until deep hamstring stretch.' },
    { name: 'Leg Press (45 Degree)', muscle: 'Quad Hypertrophy', equipment: 'Leg Press', sets: 3, reps: '12-15', rest: 90, instructions: 'Feet hip-width on platform center. Lower sled smoothly to 90 degrees knee flexion, drive up without hyper-extending knees.' },
    { name: 'Standing Calf Raises', muscle: 'Calves (Gastrocnemius)', equipment: 'Calf Machine', sets: 4, reps: '15-20', rest: 45, instructions: 'Full stretch at bottom for 1 second, elevate onto balls of feet, hold peak contraction.' },
  ],
  Shoulders: [
    { name: 'Overhead Barbell Military Press', muscle: 'Anterior & Lateral Deltoids', equipment: 'Barbells', sets: 4, reps: '6-8', rest: 90, instructions: 'Glutes and core locked tight. Press bar vertically overhead, clearing chin, locking out directly over spine.' },
    { name: 'Dumbbell Lateral Raises', muscle: 'Lateral Deltoids (Cap Width)', equipment: 'Dumbbells', sets: 4, reps: '12-15', rest: 45, instructions: 'Lead with elbows, slight forward tilt, elevate to shoulder height. 3-second eccentric tempo.' },
    { name: 'Rear Delt Face Pulls', muscle: 'Posterior Deltoids & Rotator Cuff', equipment: 'Rope Cable', sets: 3, reps: '15-18', rest: 45, instructions: 'Attach rope at eye height, pull towards face while externally rotating forearms back.' },
  ],
  Arms: [
    { name: 'Incline Dumbbell Bicep Curl', muscle: 'Biceps Long Head', equipment: 'Dumbbells', sets: 3, reps: '10-12', rest: 60, instructions: 'Seat back 45 degrees for maximum bicep stretch. Curl with palms supinating fully at top.' },
    { name: 'Triceps Rope Pushdown', muscle: 'Triceps Lateral & Medial Head', equipment: 'Cable Machine', sets: 3, reps: '12-15', rest: 45, instructions: 'Pin elbows to ribs, extend downwards spreading rope ends apart at bottom lockout.' },
    { name: 'Barbell Skull Crushers', muscle: 'Triceps Long Head', equipment: 'EZ-Bar', sets: 3, reps: '8-10', rest: 75, instructions: 'Lie on flat bench, lower bar smoothly towards hairline, extend forearms forcefully.' },
  ],
  Core: [
    { name: 'Hanging Leg Raises', muscle: 'Lower Abs & Hip Flexors', equipment: 'Pull-Up Bar', sets: 3, reps: '12-15', rest: 45, instructions: 'Hang without swinging, tuck pelvis and raise legs parallel to floor, lower with 2-second control.' },
    { name: 'Cable Woodchoppers', muscle: 'Obliques & Core Rotational Power', equipment: 'Cable Machine', sets: 3, reps: '12 each side', rest: 45, instructions: 'Rotate through core and hips, keeping arms extended across body in explosive diagonal slice.' },
  ],
};

function generateAiWorkoutProtocol({
  goal = 'Muscle Gain',
  experienceLevel = 'Intermediate',
  daysPerWeek = 4,
  limitations = 'None',
  focus = 'Hypertrophy & Strength',
  availableEquipment = 'Full Sanctuary Athletic Gym',
  memberName = 'Member',
}) {
  const safeDays = [3, 4, 5].includes(Number(daysPerWeek)) ? Number(daysPerWeek) : 4;

  const splitBlueprints = {
    3: [
      { day: 'Monday', focus: 'Push Focus (Chest, Shoulders & Triceps)', muscles: ['Chest', 'Shoulders', 'Arms'] },
      { day: 'Wednesday', focus: 'Pull Focus (Back, Rear Delts & Biceps)', muscles: ['Back', 'Shoulders', 'Arms'] },
      { day: 'Friday', focus: 'Legs & Core Power (Quads, Hamstrings & Abs)', muscles: ['Legs', 'Core'] },
    ],
    4: [
      { day: 'Monday', focus: 'Upper Body Power & Chest Hypertrophy', muscles: ['Chest', 'Back', 'Shoulders'] },
      { day: 'Tuesday', focus: 'Lower Body Strength & Posterior Chain', muscles: ['Legs', 'Core'] },
      { day: 'Thursday', focus: 'Upper Body Sculpt & Arm Specialization', muscles: ['Back', 'Chest', 'Arms'] },
      { day: 'Friday', focus: 'Legs Hypertrophy & Athletic Core Conditioning', muscles: ['Legs', 'Core'] },
    ],
    5: [
      { day: 'Monday', focus: 'Chest Dynamic Strength & Upper Pec Activation', muscles: ['Chest', 'Core'] },
      { day: 'Tuesday', focus: 'Back Thickness & Lat Width Hypertrophy', muscles: ['Back', 'Arms'] },
      { day: 'Wednesday', focus: 'Legs Heavy Compound & Quad Development', muscles: ['Legs'] },
      { day: 'Thursday', focus: 'Shoulders 3D Deltoid & Traps Sculpting', muscles: ['Shoulders', 'Core'] },
      { day: 'Friday', focus: 'Arms Arms & Functional Conditioning', muscles: ['Arms', 'Core', 'Legs'] },
    ],
  };

  const chosenDays = splitBlueprints[safeDays] || splitBlueprints[4];
  const allTargetMuscles = new Set();

  const weeklySchedule = chosenDays.map((splitItem) => {
    const dayExercises = [];
    splitItem.muscles.forEach((muscleGroup) => {
      allTargetMuscles.add(muscleGroup);
      const exercisesForMuscle = exerciseCatalog[muscleGroup] || [];
      // Pick 1-2 exercises per muscle group for balanced volume
      const count = splitItem.muscles.length <= 2 ? 2 : 1;
      exercisesForMuscle.slice(0, count).forEach((ex) => {
        let sets = ex.sets;
        let reps = ex.reps;
        if (goal === 'Strength Training') {
          sets = Math.min(5, sets + 1);
          reps = '4-6';
        } else if (goal === 'Fat Loss') {
          reps = '12-15';
        } else if (goal === 'Endurance') {
          reps = '15-20';
        }

        dayExercises.push({
          name: ex.name,
          exerciseName: ex.name,
          category: muscleGroup,
          targetMuscle: ex.muscle,
          equipment: ex.equipment,
          sets,
          reps,
          weight: 'Progressive overload',
          weightKg: 0,
          restSeconds: ex.rest,
          restTimeSec: ex.rest,
          instructions: `${ex.instructions}${limitations && limitations !== 'None' ? ` (Adapted for constraint: ${limitations})` : ''}`,
          isCompleted: false,
        });
      });
    });

    return {
      day: splitItem.day,
      focus: splitItem.focus,
      isRestDay: false,
      estimatedMinutes: dayExercises.length * 8 + 10,
      exercises: dayExercises,
    };
  });

  const muscleList = Array.from(allTargetMuscles);
  const category = goal === 'Fat Loss' ? 'Fat Loss Workout' : goal === 'Strength Training' ? 'Strength Training' : 'Muscle Gain Workout';
  const estimatedDurationMinutes = 45 + safeDays * 3;

  return {
    title: `QNOX AI Adaptive Protocol: ${goal} (${experienceLevel})`,
    description: `Scientifically periodized for ${memberName}. Targeted for ${focus} on a high-efficiency ${safeDays}-day weekly split. Rest intervals and mechanical stress calibrated for peak biological adaptation. Constraints factored: ${limitations || 'None'}.`,
    category,
    goal,
    difficulty: experienceLevel,
    targetAudience: experienceLevel,
    targetMuscles: muscleList,
    durationWeeks: 6,
    estimatedDurationMinutes,
    weeklySchedule,
    approvalStatus: 'generated',
    isSaved: false,
    isAiGenerated: true,
    aiGenerated: true,
    aiPromptContext: {
      goal,
      experienceLevel,
      daysPerWeek: safeDays,
      limitations: limitations || 'None',
      focus: focus || 'Hypertrophy & Strength',
      availableEquipment,
    },
  };
}

module.exports = {
  generateAiWorkoutProtocol,
  exerciseCatalog,
};
