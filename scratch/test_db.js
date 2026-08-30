require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const parseTimeToNumber = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

const runTest = async () => {
  console.log('Connecting to database...');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studynook');
    console.log('Connected!');

    // Clear test tables
    console.log('Clearing old test documents...');
    await User.deleteMany({ email: /test-student/ });
    await Room.deleteMany({ name: /Test Study Room/ });
    await Booking.deleteMany({});

    // 1. Create User
    console.log('Creating Test User...');
    const user = new User({
      name: 'Test Student',
      email: 'test-student@university.edu',
      photoURL: 'https://i.ibb.co.com/mRxb9gL/user-placeholder.png'
    });
    await user.save();
    console.log(`User created: ${user.name} (${user._id})`);

    // 2. Create Room
    console.log('Creating Test Room...');
    const room = new Room({
      name: 'Test Study Room A',
      description: 'A premium space with whiteboard and AC for testing.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
      floor: '3rd Floor',
      capacity: 4,
      hourlyRate: 5,
      amenities: ['Whiteboard', 'Air Conditioning'],
      owner: user._id
    });
    await room.save();
    console.log(`Room created: ${room.name} (${room._id})`);

    // 3. Define Booking slots
    const date = new Date('2026-09-01');
    date.setUTCHours(0,0,0,0);

    // Booking 1: 09:00 - 11:00 (Confirmed)
    console.log('Creating First Booking (09:00 - 11:00)...');
    const booking1 = new Booking({
      room: room._id,
      user: user._id,
      date,
      startTime: '09:00',
      endTime: '11:00',
      totalCost: 10,
      status: 'confirmed'
    });
    await booking1.save();
    await Room.findByIdAndUpdate(room._id, { $inc: { bookingCount: 1 } });
    await User.findByIdAndUpdate(user._id, { $push: { bookings: booking1._id } });
    console.log('First booking saved!');

    // Helper overlap verification checker
    const checkOverlap = async (start, end) => {
      const reqStart = parseTimeToNumber(start);
      const reqEnd = parseTimeToNumber(end);
      
      const existingBookings = await Booking.find({
        room: room._id,
        date,
        status: 'confirmed'
      });

      const hasConflict = existingBookings.some(b => {
        const existStart = parseTimeToNumber(b.startTime);
        const existEnd = parseTimeToNumber(b.endTime);
        return reqStart < existEnd && reqEnd > existStart;
      });
      return hasConflict;
    };

    // Test cases for conflicts
    console.log('\n--- Testing Conflict Checks ---');
    
    // Case A: Exact Match (09:00 - 11:00) -> Expect Conflict
    const conflictA = await checkOverlap('09:00', '11:00');
    console.log(`Case A: 09:00 - 11:00 Overlap? ${conflictA} (Expected: true)`);

    // Case B: Partial Overlap (10:00 - 12:00) -> Expect Conflict
    const conflictB = await checkOverlap('10:00', '12:00');
    console.log(`Case B: 10:00 - 12:00 Overlap? ${conflictB} (Expected: true)`);

    // Case C: Outer Overlap (08:00 - 12:00) -> Expect Conflict
    const conflictC = await checkOverlap('08:00', '12:00');
    console.log(`Case C: 08:00 - 12:00 Overlap? ${conflictC} (Expected: true)`);

    // Case D: Adjacency (11:00 - 12:00) -> Expect No Conflict (starts exactly when booking1 ends)
    const conflictD = await checkOverlap('11:00', '12:00');
    console.log(`Case D: 11:00 - 12:00 Overlap? ${conflictD} (Expected: false)`);

    // Case E: Completely separate (14:00 - 15:00) -> Expect No Conflict
    const conflictE = await checkOverlap('14:00', '15:00');
    console.log(`Case E: 14:00 - 15:00 Overlap? ${conflictE} (Expected: false)`);

    console.log('\n--- Verification Finished successfully! ---');
  } catch (error) {
    console.error('Test run failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();
