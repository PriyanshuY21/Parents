import OpenAI from 'openai';
import { AnalysisResult, AnalyzeReportParams, CompareResult } from '../types/index';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set.');

    _client = new OpenAI({
      apiKey,
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    });
  }
  return _client;
}

const MODEL = (): string => process.env.GRADIENT_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are HealthLens, a health education AI assistant.
IMPORTANT: You do NOT provide diagnoses or medical advice. You provide educational information only.
You help users understand their lab reports in plain English.

Always:
- Use simple, warm, non-clinical language
- Flag values outside reference ranges clearly
- Recommend speaking with a qualified healthcare provider
- Never store or repeat personally identifying information
- Respond ONLY with valid JSON — no markdown fences, no preamble

HIPAA reminder: treat all input as confidential health information.`;

const JSON_SCHEMA = `Respond ONLY with this JSON structure:
{
  "summary": "2-3 sentence plain-English overview",
  "overall_status": "normal|attention|urgent",
  "findings": [
    {
      "name": "Test name",
      "value": "Result with unit",
      "range": "Reference range",
      "flag": "high|low|ok|info",
      "gauge": 65,
      "explain": "One plain-English sentence about what this means"
    }
  ],
  "risk_summary": [
    { "label": "Cardiovascular", "level": "ok|warn|high" },
    { "label": "Metabolic",      "level": "ok|warn|high" },
    { "label": "Immune",         "level": "ok|warn|high" },
    { "label": "Endocrine",      "level": "ok|warn|high" }
  ],
  "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "disclaimer": "This is educational information only. Please consult your healthcare provider."
}
Rules: gauge 0-100 (ok: 55-75, high: 80-98, low: 5-30). Min 4 findings.`;

type MessageContent =
  | string
  | Array<{ type: 'image_url'; image_url: { url: string; detail: string } } | { type: 'text'; text: string }>;

function buildUserContent({ text, imageBase64, mimeType }: AnalyzeReportParams): MessageContent {
  if (imageBase64 && mimeType) {
    return [
      {
        type: 'text',
        text: `${text ? `Additional context: ${text}\n\n` : ''}Analyze this lab report image.\n\n${JSON_SCHEMA}`,
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${imageBase64}`,
          detail: 'high',
        },
      },
    ];
  }
  return `${text}\n\n${JSON_SCHEMA}`;
}

/**
 * Analyze a lab report or symptom text.
 * HIPAA: imageBase64 is never stored server-side.
 */
export async function analyzeReport(params: AnalyzeReportParams): Promise<AnalysisResult> {
  const client = getClient();
  const userContent = buildUserContent(params);

  const response = await client.chat.completions.create({
    model: MODEL(),
    max_completion_tokens: 2000,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent as string },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as AnalysisResult;
}

/**
 * Follow-up chat with conversation history.
 */
export async function chatFollowUp(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: MODEL(),
    max_completion_tokens: 600,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are HealthLens, a health education AI. Answer follow-up questions about lab results clearly, briefly (2-3 sentences). Never diagnose. Always recommend confirming with a doctor. Do not repeat or store PHI.',
      },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Compare two lab reports for trends.
 */
export async function compareTrends(reportA: string, reportB: string): Promise<CompareResult> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: MODEL(),
    max_completion_tokens: 1000,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content:
          'You are HealthLens. Compare two lab reports and identify improvements, declines, and stable values. Respond ONLY with valid JSON: { "improved": [...], "declined": [...], "stable": [...], "summary": "..." }. No diagnoses. Educational only.',
      },
      {
        role: 'user',
        content: `Report A (older):\n${reportA}\n\nReport B (newer):\n${reportB}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';
  return JSON.parse(raw.replace(/```json|```/g, '').trim()) as CompareResult;
}
