// One-time script to fix plain-text passwords in the database
// Run this ONCE: node fix-passwords.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { User } = require('./schema');

async function fixPasswords() {
    await mongoose.connect(process.env.MongoURL, {
        tls: true,
        tlsAllowInvalidCertificates: true,
    });

    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
        // Check if password_hash is already a bcrypt hash (starts with $2b$ or $2a$)
        if (user.password_hash && !user.password_hash.startsWith('$2')) {
            console.log(`Fixing password for user: ${user.username} (role: ${user.role})`);
            const hashedPassword = await bcrypt.hash(user.password_hash, 10);
            user.password_hash = hashedPassword;
            await user.save();
            console.log(`  ✅ Password hashed successfully`);
        } else {
            console.log(`User ${user.username} already has a hashed password, skipping.`);
        }
    }

    console.log('\nDone! All passwords are now properly hashed.');
    console.log('You can now log in with the original plain-text passwords.');
    await mongoose.disconnect();
}

fixPasswords().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
