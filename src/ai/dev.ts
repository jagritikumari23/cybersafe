
import { config } from 'dotenv';
config();

import '@/ai/flows/evidence-scrubbing.ts';
import '@/ai/flows/auto-triage.ts';
import '@/ai/flows/suggest-escalation-flow.ts';
import '@/ai/flows/translate-text-flow.ts';

