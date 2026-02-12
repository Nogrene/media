const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('✓ MongoDB Connection Successful');
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);
    console.log(`  Port: ${conn.connection.port}`);
    console.log('═══════════════════════════════════════════════════');

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err.message);
    });

  } catch (error) {
    console.error('═══════════════════════════════════════════════════');
    console.error('✗ MongoDB Connection Failed');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code || 'N/A');
    if (error.reason) {
      console.error('  Reason:', error.reason);
    }
    console.error('═══════════════════════════════════════════════════');
    console.error('\nPlease check:');
    console.error('  1. MongoDB URI is correct in .env file');
    console.error('  2. Network connection is stable');
    console.error('  3. MongoDB cluster/server is running');
    console.error('  4. IP address is whitelisted (if using MongoDB Atlas)');
    console.error('═══════════════════════════════════════════════════\n');
    process.exit(1);
  }
};

module.exports = connectDB;
