const { addUser, updateUser } = require("../database/db_models");

async function userAddition(userId, userName, morningTime, eveningTime) {
   await addUser(userId);
// Update user information
    await updateUser(userId, {userName: userName,
    morningGoals: ['help this worker externalize their plan on one task that they want to finish today.',
    'help this worker block a time for deep work in a distraction-free environment.',
    'help this worker identify potential tasks that they can either delegate or defer.', 
    'help this worker recognize if what they plan to do for the day is an urgent and important task or an urgent but not important task.',
    'help this worker incorporate regular physical activity into their daily routine to improve physical health and reduce stress.',
    'help this worker be mindful to manage stress and enhance mental clarity',
    'help this worker identify obstacles in the realization of their plans and think about alternate strategies if the obstacle comes in the way of their plan',
    'help this worker be mindful to manage stress and enhance mental clarity',
    'help this worker set boundaries between work and personal life to ensure they have time for relaxation and personal activities.',
    'help this worker schedule and take good breaks to refresh their mind, prevent burnout, and/or improve their concentration.',
],
    eveningGoals: [ 'help this worker identify what their core values at work are.',
    'help this worker understand how they can change behaviors for productivity.',
    'help this worker be more organized in their task management.',
    'help this worker recognize good habits that they want to establish for their productivity.',
    'help this worker change their perception of themselves for their mental health.', 
    'help this worker be compassionate to themselves at work.',
    'help this worker understand how they can change behaviors for mental well-being.', 
    'help this worker accomplish a good work-life balance.',
],
    morningTime: morningTime,
    eveningTime: eveningTime,
});
}

async function userUpdate(userId, morningTime, eveningTime) {
 // Update user information
     await updateUser(userId, {
     morningTime: morningTime,
     eveningTime: eveningTime,
 });
}

//uncommment to add a user
// userAddition("U07GT4PEQ3Y","Alifya", "08:00", "17:00");
// console.log("User Added!");