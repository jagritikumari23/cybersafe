<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { z } = require('zod');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initializeDatabases, pgPool } = require('./config/database');
const { authenticateUser, authorizeRole } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Input validation schemas
const reportSchema = z.object({
    type: z.string().min(1),
    description: z.string().min(10),
    incidentDate: z.string().datetime(),
    reporterName: z.string().min(1),
    reporterContact: z.string().email(),
    suspectDetails: z.object({}).optional(),
    incidentLocation: z.object({}).optional(),
    additionalEvidenceText: z.string().optional(),
    evidenceFiles: z.array(z.object({})).optional()
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
};

// Routes
=======

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

// In-memory store for prototype (if DB connection fails or for quick iteration)
// These would be replaced by actual DB interactions.
const reportsStore = []; // Store report objects
const chatMessagesStore = {}; // Store chat messages, e.g., { "reportId1": [], "reportId2": [] }


// Connect to the database
client
 .connect()
 .then(() => {
    console.log('Connected to PostgreSQL database');
    // Example: Create tables if they don't exist (conceptual)
    /*
    client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(255),
        description TEXT,
        incident_date TIMESTAMPTZ,
        reporter_name VARCHAR(255),
        reporter_contact VARCHAR(255),
        status VARCHAR(50),
        submission_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ai_triage_category VARCHAR(100),
        ai_triage_urgency VARCHAR(50),
        ai_triage_summary TEXT,
        ai_escalation_target VARCHAR(100),
        ai_escalation_reasoning TEXT,
        suspect_details JSONB,
        incident_location JSONB,
        additional_evidence_text TEXT,
        evidence_files_metadata JSONB,
        timeline_notes TEXT,
        assigned_officer_name VARCHAR(255),
        chat_id VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        message_id SERIAL PRIMARY KEY,
        report_id VARCHAR(255) REFERENCES reports(id),
        sender VARCHAR(50), -- 'user' or 'officer'
        text TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => console.log("Tables checked/created conceptually."))
      .catch(err => console.error("Error creating tables conceptually:", err));
    */

    // Connect to MongoDB after successful PostgreSQL connection
    mongoose
    .connect('mongodb://localhost:27017/your_mongodb_database', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
    .then(() => console.log('Connected to MongoDB database'))
    .catch((err) => console.error('Error connecting to MongoDB database', err));
  })
 .catch((err) => {
    console.error('Error connecting to PostgreSQL database:', err, "\nFalling back to in-memory store for this session.");
  });

// Initialize Firebase Admin SDK (if still needed for other purposes, e.g. Auth)
// Replace 'path/to/your/serviceAccountKey.json' with the actual path to your service account key file
// const serviceAccount = require('path/to/your/serviceAccountKey.json'); // Placeholder
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Initialize Google Generative AI client
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'); // Placeholder
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Example model


app.use(cors());

>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
app.get('/', (req, res) => {
  res.send('CyberSafe Backend is running!');
});

<<<<<<< HEAD
// API route to submit a new complaint
app.post('/api/complaints/submit', authenticateUser, async (req, res) => {
    try {
        const reportData = reportSchema.parse(req.body);
        const reportId = `SRV-${Date.now()}`;
=======
// API route for user registration (Placeholder)
app.post('/api/register', (req, res) => {
  // Placeholder for user registration logic
  // Would interact with Firebase Auth or a users table in PostgreSQL
  res.status(501).send('Register route placeholder - Not Implemented');
});

// API route for user login (Placeholder)
app.post('/api/login', (req, res) => {
  // Placeholder for user login logic
  res.status(501).send('Login route placeholder - Not Implemented');
});

// API route to submit a new complaint
app.post('/api/complaints/submit', async (req, res) => {
  const reportData = req.body; // Assuming reportData matches the structure needed
  // Basic validation
  if (!reportData || !reportData.type || !reportData.description || !reportData.incidentDate) {
    return res.status(400).json({ error: 'Missing required report fields.' });
  }

  const reportId = `SRV-${Date.now()}`; // Simple server-generated ID
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
  const submissionDate = new Date().toISOString();
  const initialStatus = 'Filed';

  const newReport = {
    id: reportId,
    ...reportData,
    submissionDate,
    status: initialStatus,
<<<<<<< HEAD
        };

        const queryText = `
            INSERT INTO reports(id, type, description, incident_date, reporter_name, reporter_contact, status, submission_date, suspect_details, incident_location, additional_evidence_text, evidence_files_metadata)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;

        const values = [
            newReport.id, newReport.type, newReport.description, newReport.incidentDate,
            newReport.reporterName, newReport.reporterContact, newReport.status, newReport.submissionDate,
            newReport.suspectDetails ? JSON.stringify(newReport.suspectDetails) : null,
            newReport.incidentLocation ? JSON.stringify(newReport.incidentLocation) : null,
            newReport.additionalEvidenceText,
            newReport.evidenceFiles ? JSON.stringify(newReport.evidenceFiles) : null,
        ];

        const result = await pgPool.query(queryText, values);
        res.status(201).json(result.rows[0]);
  } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input data', details: error.errors });
        } else {
    console.error('Error submitting complaint:', error);
            res.status(500).json({ error: 'Error submitting complaint', details: error.message });
        }
=======
    // Other fields like AI triage results would be added after AI processing steps
  };

  try {
    // Illustrative PostgreSQL INSERT
    // const queryText = `
    //   INSERT INTO reports(id, type, description, incident_date, reporter_name, reporter_contact, status, submission_date, suspect_details, incident_location, additional_evidence_text, evidence_files_metadata)
    //   VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    //   RETURNING *;
    // `;
    // const values = [
    //   newReport.id, newReport.type, newReport.description, newReport.incidentDate,
    //   newReport.reporterName, newReport.reporterContact, newReport.status, newReport.submissionDate,
    //   newReport.suspectDetails ? JSON.stringify(newReport.suspectDetails) : null,
    //   newReport.incidentLocation ? JSON.stringify(newReport.incidentLocation) : null,
    //   newReport.additionalEvidenceText,
    //   newReport.evidenceFiles ? JSON.stringify(newReport.evidenceFiles) : null,
    // ];
    // const dbResult = await client.query(queryText, values);
    // const savedReport = dbResult.rows[0];
    // console.log('Report saved to PostgreSQL:', savedReport);
    // res.status(201).json(savedReport);

    // For prototype without live DB or if DB connection failed:
    reportsStore.push(newReport);
    console.log('Report saved to in-memory store:', newReport);
    // Simulate AI processing delay before sending response
    setTimeout(() => {
         // In a real backend, AI processing would happen here, updating the newReport object.
         // For now, we just return it as is.
        res.status(201).json(newReport);
    }, 1000);


  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: 'Error submitting complaint.', details: error.message });
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
  }
});

// API route to get the status of a specific complaint
<<<<<<< HEAD
app.get('/api/complaints/:id/status', authenticateUser, async (req, res) => {
    try {
  const { id: reportId } = req.params;
        const queryText = 'SELECT id, status, timeline_notes FROM reports WHERE id = $1;';
        const result = await pgPool.query(queryText, [reportId]);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
    } else {
            res.status(404).json({ error: 'Report not found' });
    }
  } catch (error) {
        console.error('Error fetching complaint status:', error);
        res.status(500).json({ error: 'Error fetching complaint status', details: error.message });
=======
app.get('/api/complaints/:id/status', async (req, res) => {
  const { id: reportId } = req.params;
  try {
    // Illustrative PostgreSQL SELECT
    // const queryText = 'SELECT id, status, timeline_notes FROM reports WHERE id = $1;';
    // const dbResult = await client.query(queryText, [reportId]);
    // if (dbResult.rows.length > 0) {
    //   res.status(200).json(dbResult.rows[0]);
    // } else {
    //   res.status(404).json({ error: 'Report not found' });
    // }

    // For prototype:
    const report = reportsStore.find(r => r.id === reportId);
    if (report) {
      res.status(200).json({ id: report.id, status: report.status, timelineNotes: report.timelineNotes });
    } else {
      res.status(404).json({ error: 'Report not found in-memory' });
    }
  } catch (error) {
    console.error(`Error fetching status for complaint ${reportId}:`, error);
    res.status(500).json({ error: 'Error fetching complaint status.', details: error.message });
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
  }
});

// API route to add a message to a complaint chat
<<<<<<< HEAD
app.post('/api/complaints/:id/chat', authenticateUser, async (req, res) => {
    try {
=======
app.post('/api/complaints/:id/chat', async (req, res) => {
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
  const { id: reportId } = req.params;
  const { sender, text } = req.body;

  if (!sender || !text) {
<<<<<<< HEAD
            return res.status(400).json({ error: 'Missing sender or text for chat message' });
  }

        const queryText = `
            INSERT INTO chat_messages(report_id, sender, text, timestamp)
            VALUES($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [reportId, sender, text, new Date().toISOString()];
        const result = await pgPool.query(queryText, values);
        res.status(201).json(result.rows[0]);
  } catch (error) {
        console.error('Error adding chat message:', error);
        res.status(500).json({ error: 'Error adding chat message', details: error.message });
=======
    return res.status(400).json({ error: 'Missing sender or text for chat message.' });
  }

  const message = {
    messageId: `msg-${Date.now()}`, // Simple server-generated ID
    reportId,
    sender,
    text,
    timestamp: new Date().toISOString(),
  };

  try {
    // Illustrative PostgreSQL INSERT
    // const queryText = `
    //   INSERT INTO chat_messages(report_id, sender, text, timestamp)
    //   VALUES($1, $2, $3, $4)
    //   RETURNING *;
    // `;
    // const values = [message.reportId, message.sender, message.text, message.timestamp];
    // const dbResult = await client.query(queryText, values);
    // const savedMessage = dbResult.rows[0];
    // console.log('Chat message saved to PostgreSQL:', savedMessage);
    // res.status(201).json(savedMessage);

    // For prototype:
    if (!chatMessagesStore[reportId]) {
      chatMessagesStore[reportId] = [];
    }
    chatMessagesStore[reportId].push(message);
    console.log(`Chat message for report ${reportId} saved to in-memory store:`, message);
    res.status(201).json(message);

  } catch (error) {
    console.error(`Error adding chat message for complaint ${reportId}:`, error);
    res.status(500).json({ error: 'Error adding chat message.', details: error.message });
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
  }
});

// API route to get chat messages for a specific complaint
<<<<<<< HEAD
app.get('/api/complaints/:id/chat/messages', authenticateUser, async (req, res) => {
    try {
  const { id: reportId } = req.params;
        const queryText = 'SELECT message_id, sender, text, timestamp FROM chat_messages WHERE report_id = $1 ORDER BY timestamp ASC;';
        const result = await pgPool.query(queryText, [reportId]);
        res.status(200).json(result.rows);
  } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Error fetching chat messages', details: error.message });
  }
});

=======
app.get('/api/complaints/:id/chat/messages', async (req, res) => {
  const { id: reportId } = req.params;
  try {
    // Illustrative PostgreSQL SELECT
    // const queryText = 'SELECT message_id, sender, text, timestamp FROM chat_messages WHERE report_id = $1 ORDER BY timestamp ASC;';
    // const dbResult = await client.query(queryText, [reportId]);
    // res.status(200).json(dbResult.rows);

    // For prototype:
    const messages = chatMessagesStore[reportId] || [];
    res.status(200).json(messages);

  } catch (error) {
    console.error(`Error fetching chat messages for complaint ${reportId}:`, error);
    res.status(500).json({ error: 'Error fetching chat messages.', details: error.message });
  }
});


>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae
// API route to upload evidence (Placeholder - needs file handling)
app.post('/api/upload/evidence', (req, res) => {
  // Placeholder for evidence upload logic.
  // This would typically involve a multipart/form-data parser (e.g., multer)
  // and saving files to a filesystem or cloud storage (AWS S3, Firebase Storage).
  console.log('Evidence upload route hit. Body:', req.body); // Log to see what's received
  res.status(501).send('Evidence upload placeholder - Not Implemented with file handling.');
});

// API route to escalate a complaint or issue (Placeholder)
app.post('/api/escalate', (req, res) => {
  res.status(501).send('Escalate route placeholder - Not Implemented');
});

// API route for text translation (Placeholder - Genkit flow should be used directly by Next.js if possible)
app.post('/api/translate', async (req, res) => {
    // const { textToTranslate, targetLanguage, sourceLanguage } = req.body;
    // if (!textToTranslate || !targetLanguage) {
    //   return res.status(400).json({ error: 'Missing textToTranslate or targetLanguage.' });
    // }
    // try {
    //   // Conceptual: Call Genkit translate flow if this Express server runs Genkit
    //   // const translationResult = await callGenkitTranslateFlow({textToTranslate, targetLanguage, sourceLanguage});
    //   // res.status(200).json(translationResult);
    //   res.status(501).json({ message: "Translate route placeholder - Genkit flows are typically called from Next.js API routes or server components."})
    // } catch (error) {
    //   res.status(500).json({ error: 'Translation failed.', details: error.message });
    // }
    res.status(501).send('Translate route placeholder - Not Implemented directly in Express, prefer Genkit in Next.js API Routes.');
});

// API route for voice-to-text conversion (Placeholder)
app.post('/api/voice-to-text', (req, res) => {
  res.status(501).send('Voice-to-text route placeholder - Not Implemented');
});

// Gemini API example (can be part of a specific flow if needed, or a direct utility)
// app.get('/api/generate-text', async (req, res) => {
//   try {
//     const prompt = 'Write a short, catchy slogan for a cyber security awareness campaign.'; // Example prompt
//     const result = await model.generateContent(prompt);
//     const response = result.response;
//     const text = response.text();
//     res.status(200).send(text);
//   } catch (error) {
//     console.error('Error generating text with Gemini API:', error);
//     res.status(500).send('Error generating text.');
//   }
// });

<<<<<<< HEAD
// Add error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await initializeDatabases();
app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
=======
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
  console.log('This server provides conceptual backend routes. The Next.js app uses its own API routes for current functionality.');
});
>>>>>>> 73b36b58779457292a121e59d2b86d4df8326aae

    