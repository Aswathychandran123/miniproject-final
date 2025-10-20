// Script to fix existing delivery tasks with missing fields
require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryTask = require('./models/DeliveryTask');

const fixExistingTasks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all tasks
    const tasks = await DeliveryTask.find();
    console.log(`Found ${tasks.length} tasks to check`);

    let fixedCount = 0;

    for (const task of tasks) {
      let needsUpdate = false;

      // Initialize statusHistory if missing
      if (!task.statusHistory || !Array.isArray(task.statusHistory)) {
        task.statusHistory = [];
        needsUpdate = true;
      }

      // Initialize locationHistory if missing
      if (!task.locationHistory || !Array.isArray(task.locationHistory)) {
        task.locationHistory = [];
        needsUpdate = true;
      }

      // Initialize liveLocation if missing
      if (!task.liveLocation) {
        task.liveLocation = {
          type: 'Point',
          coordinates: [0, 0],
          timestamp: new Date()
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        await task.save();
        fixedCount++;
        console.log(`✓ Fixed task ${task._id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} tasks`);
    console.log(`✓ All tasks now have required fields`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing tasks:', error);
    process.exit(1);
  }
};

fixExistingTasks();
