const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Helper to convert time string (e.g., "08:00") into a numeric hour value (e.g. 8.5 for "08:30")
const parseTimeToNumber = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

// Create Booking (Private)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { room: roomId, date, startTime, endTime, totalCost, specialNote } = req.body;
    const userId = req.user.id;

    if (!roomId || !date || !startTime || !endTime || !totalCost) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    // Normalize date (set hours to midnight UTC to prevent time zone mismatching)
    const bookingDate = new Date(date);
    bookingDate.setUTCHours(0, 0, 0, 0);

    const reqStart = parseTimeToNumber(startTime);
    const reqEnd = parseTimeToNumber(endTime);

    if (reqStart >= reqEnd) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // 1. Conflict Check: check other confirmed bookings for this room on the same date
    const existingBookings = await Booking.find({
      room: roomId,
      date: bookingDate,
      status: 'confirmed'
    });

    const hasConflict = existingBookings.some((booking) => {
      const existingStart = parseTimeToNumber(booking.startTime);
      const existingEnd = parseTimeToNumber(booking.endTime);
      // Overlap: request starts before booking ends AND request ends after booking starts
      return reqStart < existingEnd && reqEnd > existingStart;
    });

    if (hasConflict) {
      return res.status(400).json({ 
        message: 'This time slot overlaps with an existing booking. Please choose a different slot.' 
      });
    }

    // 2. Create the Booking
    const newBooking = new Booking({
      room: roomId,
      user: userId,
      date: bookingDate,
      startTime,
      endTime,
      totalCost,
      specialNote: specialNote || '',
      status: 'confirmed'
    });

    await newBooking.save();

    // 3. Increment the room's booking count
    await Room.findByIdAndUpdate(roomId, { $inc: { bookingCount: 1 } });

    // 4. Challenge Requirement: Use $push operator to add booking ID to user's bookings array
    await User.findByIdAndUpdate(userId, { $push: { bookings: newBooking._id } });

    res.status(201).json({
      message: 'Room booked successfully!',
      booking: newBooking
    });

  } catch (error) {
    res.status(500).json({ message: 'Error processing booking request', error: error.message });
  }
});

// Get My Bookings (Private)
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all bookings for this user, populate room details
    const bookings = await Booking.find({ user: userId })
      .populate('room', 'name image hourlyRate floor')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your bookings', error: error.message });
  }
});

// Cancel Booking (Private)
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify booking belongs to the current user
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized: This is not your booking' });
    }

    // Verify it is not already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Decrement the room's booking count
    await Room.findByIdAndUpdate(booking.room, { $inc: { bookingCount: -1 } });

    // Challenge Requirement: Use $pull to remove booking ID from user's bookings array
    await User.findByIdAndUpdate(userId, { $pull: { bookings: bookingId } });

    res.json({ message: 'Booking cancelled successfully', booking });

  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

module.exports = router;
