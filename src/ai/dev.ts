import { config } from 'dotenv';
config();

import '@/ai/flows/evidence-scrubbing.ts';
import '@/ai/flows/auto-triage.ts';