import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = 'mongodb+srv://prasaiprithvi42:prithvi1234@cluster0.m7crm7k.mongodb.net/realState?retryWrites=true&w=majority'; // Replace with your MongoDB connection string
const client = new MongoClient(uri);

async function createAdminUser() {
  try {
    await client.connect();

    const database = client.db('realState'); // Replace with your database name
    const users = database.collection('User');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = {
      _id: new ObjectId(), // Generate a new ObjectId
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword, // Store the hashed password
      createdAt: new Date(),
      role: 'admin', // Ensure the role is set to admin
    };

    const result = await users.insertOne(adminUser);
    console.log(`Admin user created with id: ${result.insertedId}`);
  } finally {
    await client.close();
  }
}

createAdminUser().catch(console.error);
