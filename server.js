const express = require('express');
const { Client } = require('pg');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(express.json()); // Add this line to parse JSON request bodies
const port = 3000;

// Database connection details - replace with your actual credentials
const dbConfig = {
  user: 'your_database_user',
  host: 'your_database_host',
  database: 'your_database_name',
  password: 'your_database_password',
  port: 5432, // Default PostgreSQL port
};

const client = new Client(dbConfig);

// Connect to the database
client
 .connect()
 .then(() => {
 console.log('Connected to PostgreSQL database');
 // Connect to MongoDB after successful PostgreSQL connection
 mongoose
 .connect('mongodb://localhost:27017/your_mongodb_database', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
 .then(() => console.log('Connected to MongoDB database'))
 .catch((err) => console.error('Error connecting to MongoDB database', err));
  })
 .catch((err) => console.error('Error connecting to PostgreSQL database', err));

// Initialize Firebase Admin SDK
// Replace 'path/to/your/serviceAccountKey.json' with the actual path to your service account key file
const serviceAccount = require('path/to/your/serviceAccountKey.json'); // Placeholder
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// Use CORS middleware

// Initialize Google Generative AI client
// Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API key
// It's recommended to use environment variables for your API key
const genAI = new GoogleGenerativeAI('YOUR_GEMINI_API_KEY'); // Placeholder
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Example model


app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// New route to write messages to Firebase Realtime Database
app.post('/api/messages', async (req, res) => {
  const message = req.body; // Assuming the message is sent in the request body

  try {
    // Get a reference to the 'messages' node in the Realtime Database
    const messagesRef = admin.database().ref('messages');
    // Push the new message to the database
    await messagesRef.push(message);
    res.status(201).send('Message sent successfully!');
  } catch (error) {
    console.error('Error writing message to Firebase Realtime Database:', error);
    res.status(500).send('Error sending message.');
  }
});

// API route for user registration
app.post('/api/register', (req, res) => {
  // Placeholder for user registration logic
  res.send('Register route is working');
});

// API route for user login
app.post('/api/login', (req, res) => {
  // Placeholder for user login logic
  res.send('Login route is working');
});

// API route to submit a new complaint
app.post('/api/complaints/submit', (req, res) => {
  // Placeholder for complaint submission logic
  res.send('Complaint submission route is working');
});

// API route to get the status of a specific complaint
app.get('/api/complaints/:id/status', (req, res) => {
  const complaintId = req.params.id;
  // Placeholder for fetching complaint status logic
  res.send(`Status for complaint ${complaintId} is working`);
});

// API route to add a message to a complaint chat
app.post('/api/complaints/:id/chat', (req, res) => {
  const complaintId = req.params.id;
  // Placeholder for adding chat message logic
  res.send(`Chat route for complaint ${complaintId} is working`);
});

// API route to upload evidence
app.post('/api/upload/evidence', (req, res) => {
  // Placeholder for evidence upload logic
  res.send('Evidence upload route is working');
});

// API route to escalate a complaint or issue
app.post('/api/escalate', (req, res) => {
// New route to generate text using Gemini API
app.get('/api/generate-text', async (req, res) => {
  try {
    const prompt = 'Write a short, catchy slogan for a cyber security awareness campaign.'; // Example prompt
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    res.status(200).send(text);
  } catch (error) {
    console.error('Error generating text with Gemini API:', error);
    res.status(500).send('Error generating text.');
  }
});
  // Placeholder for escalation logic
  res.send('Escalate route is working');
});

// API route for text translation
app.get('/api/translate', (req, res) => {
  // Placeholder for text translation logic
  res.send('Translate route is working');
});

// API route for voice-to-text conversion
app.post('/api/voice-to-text', (req, res) => {
  // Placeholder for voice-to-text logic
  res.send('Voice-to-text route is working');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log('Express server started');
});
