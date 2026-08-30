require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('node:dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const User = require('../models/User');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing sample rooms
    await Room.deleteMany({});
    
    // Find or create default admin/owner user
    let defaultUser = await User.findOne({ email: 'demo@studynook.com' });
    if (!defaultUser) {
      const hashedPassword = await bcrypt.hash('StudyNook@123', 12);
      defaultUser = new User({
        name: 'Library Admin',
        email: 'demo@studynook.com',
        password: hashedPassword,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
      });
      await defaultUser.save();
    }

    const sampleRooms = [
      {
        name: 'Quiet Study Pod 301',
        description: 'A noise-isolated private workspace designed for deep focus, exam prep, and individual research with ergonomic seating.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
        floor: '3rd Floor',
        capacity: 2,
        hourlyRate: 5,
        amenities: ['Wi-Fi', 'Quiet Zone', 'Power Outlets'],
        owner: defaultUser._id,
        bookingCount: 3
      },
      {
        name: 'Collaborative Tech Lab B',
        description: 'Equipped with a magnetic whiteboard and wireless 4K projector, ideal for group projects, presentations, and team brainstorming.',
        image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
        floor: '2nd Floor',
        capacity: 6,
        hourlyRate: 8,
        amenities: ['Whiteboard', 'Projector', 'Wi-Fi', 'Power Outlets'],
        owner: defaultUser._id,
        bookingCount: 7
      },
      {
        name: 'Executive Seminar Suite',
        description: 'Spacious study hall room featuring climate control, conference table, and multimedia presentation screens.',
        image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800',
        floor: '4th Floor',
        capacity: 10,
        hourlyRate: 12,
        amenities: ['Whiteboard', 'Projector', 'Air Conditioning', 'Wi-Fi'],
        owner: defaultUser._id,
        bookingCount: 12
      },
      {
        name: 'Silent Research Nook 104',
        description: 'Single-occupancy cubicle located in the library soundproof zone. Perfect for thesis writing and reading uninterrupted.',
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
        floor: '1st Floor',
        capacity: 1,
        hourlyRate: 4,
        amenities: ['Wi-Fi', 'Quiet Zone', 'Air Conditioning'],
        owner: defaultUser._id,
        bookingCount: 5
      },
      {
        name: 'Group Discussion Chamber C',
        description: 'Comfortable studio setup with writable glass walls, dual charging stations, and soft acoustic panels.',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
        floor: '2nd Floor',
        capacity: 4,
        hourlyRate: 7,
        amenities: ['Whiteboard', 'Power Outlets', 'Air Conditioning', 'Wi-Fi'],
        owner: defaultUser._id,
        bookingCount: 8
      },
      {
        name: 'Creative Workshop Hub',
        description: 'Modular seating arrangement with HD projector and high-speed Wi-Fi designed for student hackathons and design sprints.',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
        floor: '3rd Floor',
        capacity: 8,
        hourlyRate: 10,
        amenities: ['Projector', 'Wi-Fi', 'Power Outlets', 'Air Conditioning'],
        owner: defaultUser._id,
        bookingCount: 4
      }
    ];

    await Room.insertMany(sampleRooms);
    console.log('Seeded 6 sample study rooms successfully!');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedData();
