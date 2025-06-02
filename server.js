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
app.get('/', (req, res) => {
  res.send('CyberSafe Backend is running!');
});

// API route to submit a new complaint
app.post('/api/complaints/submit', authenticateUser, async (req, res) => {
    try {
        const reportData = reportSchema.parse(req.body);
        const reportId = `SRV-${Date.now()}`;
  const submissionDate = new Date().toISOString();
  const initialStatus = 'Filed';

  const newReport = {
    id: reportId,
    ...reportData,
    submissionDate,
    status: initialStatus,
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
  }
});

// API route to get the status of a specific complaint
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
  }
});

// API route to add a message to a complaint chat
app.post('/api/complaints/:id/chat', authenticateUser, async (req, res) => {
    try {
  const { id: reportId } = req.params;
  const { sender, text } = req.body;

  if (!sender || !text) {
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
  }
});

// API route to get chat messages for a specific complaint
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

    