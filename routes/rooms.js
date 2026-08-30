const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

// Get latest 6 rooms for the Home Page
router.get('/latest', async (req, res) => {
  try {
    const rooms = await Room.find({})
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving latest rooms', error: error.message });
  }
});

// Get all rooms with search and filters
router.get('/', async (req, res) => {
  try {
    const { search, amenities, floor, minRate, maxRate, capacity } = req.query;
    let query = {};

    // 1. Search by name (case-insensitive regex)
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // 2. Filter by amenities (expects comma-separated string or array)
    if (amenities) {
      const amenitiesList = Array.isArray(amenities) 
        ? amenities 
        : amenities.split(',').map(item => item.trim()).filter(Boolean);
      
      if (amenitiesList.length > 0) {
        query.amenities = { $in: amenitiesList };
      }
    }

    // 3. Filter by floor
    if (floor) {
      query.floor = { $regex: floor, $options: 'i' };
    }

    // 4. Filter by capacity
    if (capacity) {
      query.capacity = { $gte: parseInt(capacity, 10) };
    }

    // 5. Filter by hourly rate range
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) query.hourlyRate.$lte = parseFloat(maxRate);
    }

    const rooms = await Room.find(query).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// Get My Listings (Private Route)
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your room listings', error: error.message });
  }
});

// Get single room details
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name email photoURL');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room details', error: error.message });
  }
});

// Add Room (Private Route)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;

    if (!name || !description || !image || !floor || !capacity || !hourlyRate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const newRoom = new Room({
      name,
      description,
      image,
      floor,
      capacity: parseInt(capacity, 10),
      hourlyRate: parseFloat(hourlyRate),
      amenities: Array.isArray(amenities) ? amenities : [],
      owner: req.user.id
    });

    await newRoom.save();
    res.status(201).json({ message: 'Room added successfully', room: newRoom });

  } catch (error) {
    res.status(500).json({ message: 'Error creating room listing', error: error.message });
  }
});

// Update Room (Private, Owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;
    
    // Find room
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify ownership
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this room listing' });
    }

    // Update fields
    if (name) room.name = name;
    if (description) room.description = description;
    if (image) room.image = image;
    if (floor) room.floor = floor;
    if (capacity) room.capacity = parseInt(capacity, 10);
    if (hourlyRate) room.hourlyRate = parseFloat(hourlyRate);
    if (amenities) room.amenities = Array.isArray(amenities) ? amenities : [];

    await room.save();
    res.json({ message: 'Room updated successfully', room });

  } catch (error) {
    res.status(500).json({ message: 'Error updating room listing', error: error.message });
  }
});

// Delete Room (Private, Owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify ownership
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this room listing' });
    }

    // Delete the room
    await Room.findByIdAndDelete(req.params.id);

    // Note: The challenge asks to pull the booking ID from the user's booking array when a booking is deleted.
    // If a room is deleted, we can optionally cancel/delete all bookings associated with this room.
    // Let's also update users' bookings arrays. (Optional but a nice touch)

    res.json({ message: 'Room deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting room listing', error: error.message });
  }
});

module.exports = router;
