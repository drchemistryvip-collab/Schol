import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePowerPointHtml, PresentationData } from './slide-template-engine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_FILE = path.join(__dirname, 'ai-template.json');
const COMMUNITY_POSTS_FILE = path.join(__dirname, 'community-posts.json');
const COMMUNITY_UPLOADS_DIR = path.join(__dirname, 'community-uploads');

interface CommunityComment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  text: string;
  createdAt: number;
}

interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_role: string;
  title: string;
  content: string;
  imageUrl: string;
  link: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: CommunityComment[];
  createdAt: number;
  updatedAt: number;
}

interface AuthorizedImageUser {
  id?: string;
  username: string;
  full_name?: string;
  grantedAt: number;
}

interface CommunityStore {
  authorizedImageUsers: AuthorizedImageUser[];
  posts: CommunityPost[];
}

function readCommunityStore(): CommunityStore {
  try {
    if (fs.existsSync(COMMUNITY_POSTS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(COMMUNITY_POSTS_FILE, 'utf-8'));
      return {
        authorizedImageUsers: Array.isArray(raw.authorizedImageUsers) ? raw.authorizedImageUsers : [],
        posts: Array.isArray(raw.posts) ? raw.posts : []
      };
    }
  } catch (e) {
    console.error('Failed to read community-posts.json:', e);
  }
  return { authorizedImageUsers: [], posts: [] };
}

function writeCommunityStore(store: CommunityStore) {
  fs.writeFileSync(COMMUNITY_POSTS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function saveBase64PostImage(dataUrl: string, postId: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return '';
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
  if (!match) return '';
  const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const base64Data = match[2];
  if (!fs.existsSync(COMMUNITY_UPLOADS_DIR)) {
    fs.mkdirSync(COMMUNITY_UPLOADS_DIR, { recursive: true });
  }
  const fileName = `${postId}.${ext}`;
  const fullPath = path.join(COMMUNITY_UPLOADS_DIR, fileName);
  fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
  return `/community-uploads/${fileName}`;
}

function isUserAuthorizedForImages(store: CommunityStore, userId: string, username: string): boolean {
  const cleanId = String(userId || '').trim();
  const cleanUsername = String(username || '').trim().toLowerCase();
  return store.authorizedImageUsers.some(u =>
    (cleanId && u.id && String(u.id) === cleanId) ||
    (cleanUsername && u.username && String(u.username).trim().toLowerCase() === cleanUsername)
  );
}

function getAiTemplateConfig() {
  try {
    if (fs.existsSync(TEMPLATE_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read ai-template.json:', e);
  }
  return {
    version: 1,
    themeName: 'Royal Dark Presentation',
    primaryColor: '#00b4d8',
    accentColor: '#7209b7',
    backgroundColor: '#0a0f1d',
    slideBackground: '#131b2e',
    textColor: '#f8fafc',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    brandingText: 'ماڵپەرێ فەرمی یێ مامۆستایان - وانە و پوختەیا پاوەرپۆینت',
    systemPromptInstructions: 'تۆ مامۆستایەکی شارەزای پرۆگرامی پەروەردەی هەرێمی کوردستانی. وانەکان بە شێوازی سلایدی پاوەرپۆینتی پێشکەوتوو بە زمانی کوردی بە ڕوونی، خاڵبەندی جوان، پێناسە، یاسا و نموونە ئامادە بکە.'
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Shared server-side Gemini AI client (uses process.env.GEMINI_API_KEY only)
  let cachedAiClient: GoogleGenAI | null = null;
  function getServerAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }
    if (!cachedAiClient) {
      cachedAiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return cachedAiClient;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'fullstack-express-vite' });
  });

  // =========================================================================
  // ADMIN TEMPLATE ENDPOINTS
  // =========================================================================
  app.get('/api/admin/template', (req, res) => {
    res.json(getAiTemplateConfig());
  });

  app.post('/api/admin/template', (req, res) => {
    try {
      const newConfig = { ...getAiTemplateConfig(), ...req.body, updatedAt: Date.now() };
      fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
      res.json({ success: true, config: newConfig });
    } catch (e: any) {
      console.error('Error saving template config:', e);
      res.status(500).json({ error: e.message || 'Failed to save template configuration' });
    }
  });

  // =========================================================================
  // SERVER-SIDE GEMINI STATUS CHECK & PROXY ENDPOINTS
  // =========================================================================
  app.get('/api/gemini/status', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.json({
        success: false,
        ready: false,
        error: 'GEMINI_API_KEY is not configured on the server.'
      });
    }

    if (req.query.probe === '1') {
      try {
        const client = getServerAiClient();
        const testRes = await client.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: 'Reply with OK'
        });
        return res.json({
          success: Boolean(testRes?.text),
          ready: Boolean(testRes?.text),
          model: 'gemini-4-hydrogen'
        });
      } catch (err: any) {
        console.error('Server Gemini status check failed:', err);
        return res.status(500).json({
          success: false,
          ready: false,
          error: err.message || 'Gemini service is unavailable on the server.'
        });
      }
    }

    return res.json({
      success: true,
      ready: true,
      model: 'gemini-4-hydrogen'
    });
  });

  function resolveServerModel(requestedModel: string): string {
    const clean = String(requestedModel || '').replace(/^models\//, '').trim();
    const supported = new Set([
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite',
      'gemini-4-argon',
      'gemini-4-carbon'
    ]);
    if (supported.has(clean)) return clean;
    return 'gemini-4-hydrogen';
  }

  app.post('/api/gemini/v1beta/models/:modelAction', async (req, res) => {
    try {
      const ai = getServerAiClient();
      const rawParam = String(req.params.modelAction || '');
      const colonIdx = rawParam.indexOf(':');
      const requestedModel = colonIdx >= 0 ? rawParam.slice(0, colonIdx) : rawParam;
      const action = colonIdx >= 0 ? rawParam.slice(colonIdx + 1) : 'generateContent';
      const resolvedModel = resolveServerModel(requestedModel);

      const body = req.body || {};
      const contents = body.contents || [{ role: 'user', parts: [{ text: '' }] }];
      const config: Record<string, any> = {};

      if (body.systemInstruction) {
        if (typeof body.systemInstruction === 'string') {
          config.systemInstruction = body.systemInstruction;
        } else if (Array.isArray(body.systemInstruction.parts)) {
          const sysText = body.systemInstruction.parts
            .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
            .filter(Boolean)
            .join('\n');
          if (sysText) config.systemInstruction = sysText;
        }
      }

      if (body.generationConfig && typeof body.generationConfig === 'object') {
        const gc = body.generationConfig;
        if (gc.responseMimeType) config.responseMimeType = gc.responseMimeType;
        if (gc.responseSchema) config.responseSchema = gc.responseSchema;
        if (typeof gc.maxOutputTokens === 'number') config.maxOutputTokens = gc.maxOutputTokens;
      }

      const isStream = action === 'streamGenerateContent' || req.query.alt === 'sse';

      if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await ai.models.generateContentStream({
          model: resolvedModel,
          contents,
          config
        });

        for await (const chunk of stream) {
          const chunkText = chunk.text || '';
          const payload = {
            candidates: [
              {
                content: {
                  parts: chunkText ? [{ text: chunkText }] : []
                }
              }
            ]
          };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
        res.end();
        return;
      }

      const response = await ai.models.generateContent({
        model: resolvedModel,
        contents,
        config
      });

      res.json({
        candidates: [
          {
            content: {
              parts: [{ text: response.text || '' }]
            }
          }
        ]
      });
    } catch (err: any) {
      console.error('Server Gemini proxy error:', err);
      const status = typeof err?.status === 'number' ? err.status : 500;
      if (!res.headersSent) {
        res.status(status >= 400 && status < 600 ? status : 500).json({
          error: {
            message: err?.message || 'Error occurred while contacting Gemini API'
          }
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: { message: err?.message || 'Stream error' } })}\n\n`);
        res.end();
      }
    }
  });

  // =========================================================================
  // GEMINI TEACHER CONTENT GENERATION ENDPOINT (Server-Side Only)
  // =========================================================================
  app.post('/api/gemini/generate-teacher-content', async (req, res) => {
    try {
      const ai = getServerAiClient();
      const {
        subject = 'کیمیا',
        grade = '12',
        chapter = 'بەشی ١',
        title = '',
        lang = 'ku_ba', // ku_ba, ku_so, ar, en
        questionsCount = 5,
        teacherIdeas = '',
        sourceText = '',
        fileData = '',
        fileType = '',
        teacherName = 'م. حسێن ئەکرەم زێباری'
      } = req.body;

      const templateConfig = getAiTemplateConfig();
      const numQuestions = Math.min(Math.max(Number(questionsCount) || 5, 1), 1000);

      const dialectName = lang === 'ku_so' ? 'Kurdish Sorani' : (lang === 'ar' ? 'Arabic' : (lang === 'en' ? 'English' : 'Kurdish Badini (بادینی / بهديني)'));

      const promptParts: any[] = [];

      // Attach uploaded image or PDF as inlineData when provided
      if (fileData && typeof fileData === 'string') {
        const detectedMime = fileType || (fileData.match(/^data:([^;]+);base64,/)?.[1] || '');
        if (detectedMime && (detectedMime.startsWith('image/') || detectedMime === 'application/pdf')) {
          const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
          if (cleanBase64) {
            promptParts.push({
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            });
          }
        }
      }

      // Build comprehensive prompt
      const promptText = `
You are an expert curriculum educator and master presentation designer for Kurdistan schools (KRG Ministry of Education).
Generate educational content for the following context:

- Subject: ${subject}
- Grade: Grade ${grade} (پۆلی ${grade})
- Chapter / Topic: ${chapter || 'بابەتی سەرەکی'}
- Title: ${title || `${subject} - وانە و پوختە`}
- Teacher Name: ${teacherName}
- Target Language: ${dialectName} (Please use authentic educational terminology in ${dialectName})
- Number of Multiple-Choice Questions: ${numQuestions}

${teacherIdeas ? `Teacher's specific ideas & directions: "${teacherIdeas}"` : 'Teacher requests automatic curriculum-aligned presentation and high-yield questions.'}
${sourceText ? `Provided study text / notes / document content:\n"""\n${sourceText}\n"""` : ''}

Admin System Guidelines:
${templateConfig.systemPromptInstructions}

Requirements:
1. Create a 5 to 7 slide PowerPoint-style presentation structure.
   - Slide 1 must be the Title/Intro slide with layout "intro".
   - Following slides must cover: Core definitions, Key laws or scientific principles, Practical examples or formulas, and Key Summary & Review.
   - Each slide must have a clear title, a badge tag (e.g., پێناسە, یاسا, نموونە, گرنگ), a short summary banner, and 3-4 bullet points.
   - If applicable to the subject, include "formulaBox" with mathematical/chemical equation (e.g. C = n/V, F = m*a, etc.).
   - Include a golden tip / key takeaway in "keyTakeaway".
   - Suggest a FontAwesome icon name (e.g. "fa-flask", "fa-atom", "fa-calculator", "fa-dna", "fa-lightbulb", "fa-graduation-cap").

2. Create exactly ${numQuestions} modern interactive multiple-choice questions (پرسیارێن هەڵبژارتن) in ${dialectName}:
   - 4 choices per question (A, B, C, D).
   - "correctIndex" (0, 1, 2, or 3).
   - Detailed "explanation" clarifying why that answer is correct and reinforcing the learning point.
   - "difficulty" level: "ئاسان" | "ناوەند" | "پێشکەوتوو".

Return STRICT JSON complying with the requested schema. No markdown formatting outside of JSON.
`;

      promptParts.push({ text: promptText });

      // Call Gemini 4 Hydrogen model on the server
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: promptParts },
        config: {
          systemInstruction: 'You are an educational AI assistant generating structured Kurdish curriculum PowerPoint slides and multiple choice questions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              presentationTitle: { type: Type.STRING },
              presentationSubtitle: { type: Type.STRING },
              chapter: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    badge: { type: Type.STRING },
                    layout: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    formulaBox: { type: Type.STRING },
                    keyTakeaway: { type: Type.STRING },
                    icon: { type: Type.STRING }
                  },
                  required: ['id', 'title', 'bullets']
                }
              },
              quizzes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    chapter: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation']
                }
              }
            },
            required: ['presentationTitle', 'slides', 'quizzes']
          }
        }
      });

      const rawText = (response.text || '{}')
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', parseErr, rawText);
        throw new Error('Gemini output could not be parsed as JSON');
      }

      // Compile the PowerPoint-style HTML presentation using Admin template config
      const presentationPayload: PresentationData = {
        presentationTitle: parsedData.presentationTitle || title || `${subject} - وانە و پوختە`,
        presentationSubtitle: parsedData.presentationSubtitle || chapter,
        grade: String(grade),
        subject,
        teacherName,
        chapter: parsedData.chapter || chapter,
        themeConfig: templateConfig,
        slides: parsedData.slides || []
      };

      const fullHtmlPresentation = generatePowerPointHtml(presentationPayload);

      res.json({
        success: true,
        presentationTitle: presentationPayload.presentationTitle,
        presentationSubtitle: presentationPayload.presentationSubtitle,
        chapter: presentationPayload.chapter,
        slides: presentationPayload.slides,
        quizzes: parsedData.quizzes || [],
        htmlContent: fullHtmlPresentation,
        templateConfig
      });
    } catch (err: any) {
      console.error('Error generating teacher content with Gemini:', err);
      const status = typeof err?.status === 'number' ? err.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        error: err.message || 'Error occurred while contacting Gemini API'
      });
    }
  });

  // =========================================================================
  // COMMUNITY POSTS, MODERATION, COMMENTS & IMAGE PERMISSIONS API
  // =========================================================================
  if (!fs.existsSync(COMMUNITY_UPLOADS_DIR)) {
    fs.mkdirSync(COMMUNITY_UPLOADS_DIR, { recursive: true });
  }
  app.use('/community-uploads', express.static(COMMUNITY_UPLOADS_DIR));

  app.get('/api/community-posts', (req, res) => {
    const store = readCommunityStore();
    const userId = String(req.query.userId || '').trim();
    const username = String(req.query.username || '').trim();
    const isAdmin = req.query.isAdmin === 'true';

    const visiblePosts = store.posts
      .filter(p => {
        if (isAdmin) return true;
        if (p.status === 'approved') return true;
        if (userId && String(p.author_id) === userId) return true;
        return false;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.json({
      posts: visiblePosts,
      authorizedImageUsers: isAdmin ? store.authorizedImageUsers : [],
      canCurrentUserPostImages: isAdmin || isUserAuthorizedForImages(store, userId, username)
    });
  });

  app.post('/api/community-posts', (req, res) => {
    try {
      const store = readCommunityStore();
      const body = req.body || {};
      const userId = String(body.user_id || body.author_id || '').trim();
      const authorName = String(body.author_name || 'بەکارهێنەر').trim();
      const authorUsername = String(body.author_username || '').trim();
      const authorRole = String(body.author_role || 'student').trim();
      const isAdmin = Boolean(body.isAdmin === true || authorRole === 'admin');
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      const rawImage = String(body.imageData || body.imageUrl || '').trim();
      const rawLink = String(body.link || '').trim();

      if (!userId) {
        return res.status(401).json({ error: 'تکایە سەرەتا بچۆ ژوور.' });
      }
      if (!title && !content) {
        return res.status(400).json({ error: 'تکایە ناڤونیشان یان دەقێ پۆستێ بنڤیسە.' });
      }

      const canPostImage = isAdmin || isUserAuthorizedForImages(store, userId, authorUsername);
      if (!canPostImage && rawImage) {
        return res.status(403).json({
          error: 'بتنی ئەدمین یان ئەو کەسێ ئەدمینی ڕێک پێ دایی دشێن وێنەی بەلاڤ بکەن؛ قوتابی بتنی دشێن نڤیسینێ بەلاڤ بکەن.'
        });
      }

      const postId = 'cp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      let finalImageUrl = '';
      if (canPostImage && rawImage) {
        if (rawImage.startsWith('data:image/')) {
          finalImageUrl = saveBase64PostImage(rawImage, postId);
        } else if (/^https?:\/\//i.test(rawImage) || rawImage.startsWith('/community-uploads/')) {
          finalImageUrl = rawImage;
        }
      }

      const finalLink = canPostImage ? rawLink : '';
      const now = Date.now();
      const newPost: CommunityPost = {
        id: postId,
        author_id: userId,
        author_name: authorName,
        author_username: authorUsername,
        author_role: isAdmin ? 'admin' : authorRole,
        title,
        content,
        imageUrl: finalImageUrl,
        link: finalLink,
        status: isAdmin ? 'approved' : 'pending',
        comments: [],
        createdAt: now,
        updatedAt: now
      };

      store.posts.unshift(newPost);
      writeCommunityStore(store);

      res.json({
        success: true,
        post: newPost,
        pendingReview: newPost.status === 'pending'
      });
    } catch (err: any) {
      console.error('Error creating community post:', err);
      res.status(500).json({ error: err.message || 'نەشیا پۆستی تۆمار بکەت.' });
    }
  });

  app.post('/api/community-posts/:id/moderate', (req, res) => {
    const store = readCommunityStore();
    const { id } = req.params;
    const { isAdmin, status } = req.body || {};
    if (!isAdmin) {
      return res.status(403).json({ error: 'بتنی ئەدمین دشێت پێداچوونێ بکەت.' });
    }
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const post = store.posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'پۆست نەهاتە دیتن.' });
    }
    post.status = status;
    post.updatedAt = Date.now();
    writeCommunityStore(store);
    res.json({ success: true, post });
  });

  app.delete('/api/community-posts/:id', (req, res) => {
    const store = readCommunityStore();
    const { id } = req.params;
    const userId = String((req.body && req.body.user_id) || req.query.userId || '').trim();
    const isAdmin = Boolean((req.body && req.body.isAdmin === true) || req.query.isAdmin === 'true');

    const idx = store.posts.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'پۆست نەهاتە دیتن.' });
    }
    const target = store.posts[idx];
    if (!isAdmin && (!userId || String(target.author_id) !== userId)) {
      return res.status(403).json({ error: 'تۆ بتنی دشێی پۆستێن خۆ ژێببەی.' });
    }

    if (target.imageUrl && target.imageUrl.startsWith('/community-uploads/')) {
      const filePath = path.join(COMMUNITY_UPLOADS_DIR, path.basename(target.imageUrl));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    store.posts.splice(idx, 1);
    writeCommunityStore(store);
    res.json({ success: true });
  });

  app.post('/api/community-posts/:id/comments', (req, res) => {
    const store = readCommunityStore();
    const { id } = req.params;
    const { user_id, author_name, author_role, role, text, content } = req.body || {};

    if (!user_id) {
      return res.status(401).json({ error: 'بۆ نڤیسینا کۆمێنتێ، تکایە سەرەتا بچۆ ژوور.' });
    }
    const cleanText = String(content || text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'تکایە کۆمێنتا خۆ بنڤیسە.' });
    }

    const post = store.posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'پۆست نەهاتە دیتن.' });
    }
    if (post.status !== 'approved') {
      return res.status(403).json({ error: 'کۆمێنت بتنی ل سەر پۆستێن پەسەندکری ڤەکرینە.' });
    }

    const comment: CommunityComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      author_id: String(user_id),
      author_name: String(author_name || 'بەکارهێنەر'),
      author_role: String(author_role || role || 'student'),
      text: cleanText,
      createdAt: Date.now()
    };

    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push(comment);
    post.updatedAt = Date.now();
    writeCommunityStore(store);
    res.json({ success: true, comment, post });
  });

  app.delete('/api/community-posts/:id/comments/:commentId', (req, res) => {
    const store = readCommunityStore();
    const { id, commentId } = req.params;
    const userId = String((req.body && req.body.user_id) || req.query.userId || '').trim();
    const isAdmin = Boolean((req.body && req.body.isAdmin === true) || req.query.isAdmin === 'true');

    const post = store.posts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'پۆست نەهاتە دیتن.' });
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const cIdx = comments.findIndex(c => c.id === commentId);
    if (cIdx === -1) return res.status(404).json({ error: 'کۆمێنت نەهاتە دیتن.' });

    if (!isAdmin && (!userId || String(comments[cIdx].author_id) !== userId)) {
      return res.status(403).json({ error: 'تۆ بتنی دشێی کۆمێنتا خۆ ژێببەی.' });
    }
    comments.splice(cIdx, 1);
    post.updatedAt = Date.now();
    writeCommunityStore(store);
    res.json({ success: true, post });
  });

  app.get('/api/community-posts/permissions', (req, res) => {
    const store = readCommunityStore();
    res.json({ authorizedImageUsers: store.authorizedImageUsers });
  });

  app.post('/api/community-posts/permissions', (req, res) => {
    const store = readCommunityStore();
    const { isAdmin, action, username, user_id, full_name, singleOnly } = req.body || {};
    if (!isAdmin) {
      return res.status(403).json({ error: 'بتنی ئەدمین دشێت دەسەڵاتێ بدەت.' });
    }
    const cleanUsername = String(username || '').trim();
    const cleanId = String(user_id || '').trim();

    if (action === 'revoke') {
      store.authorizedImageUsers = store.authorizedImageUsers.filter(u =>
        (cleanUsername ? u.username.toLowerCase() !== cleanUsername.toLowerCase() : true) &&
        (cleanId ? String(u.id || '') !== cleanId : true)
      );
    } else if (action === 'grant') {
      if (!cleanUsername && !cleanId) {
        return res.status(400).json({ error: 'تکایە یوزەرنەیم بنڤیسە.' });
      }
      const nextEntry: AuthorizedImageUser = {
        id: cleanId || undefined,
        username: cleanUsername,
        full_name: String(full_name || '').trim() || undefined,
        grantedAt: Date.now()
      };
      if (singleOnly) {
        store.authorizedImageUsers = [nextEntry];
      } else {
        const exists = store.authorizedImageUsers.some(
          u => u.username && cleanUsername && u.username.toLowerCase() === cleanUsername.toLowerCase()
        );
        if (!exists) {
          store.authorizedImageUsers.push(nextEntry);
        }
      }
    }
    writeCommunityStore(store);
    res.json({ success: true, authorizedImageUsers: store.authorizedImageUsers });
  });

  // =========================================================================
  // VITE DEV MIDDLEWARE OR STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', (clientWs) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      clientWs.send(JSON.stringify({ error: { message: 'GEMINI_API_KEY is not configured on the server.' } }));
      clientWs.close(1011, 'Server key missing');
      return;
    }

    const upstreamUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;
    const upstreamWs = new WebSocket(upstreamUrl, {
      headers: { 'User-Agent': 'aistudio-build' }
    });

    const pendingMessages: Array<{ data: any; isBinary: boolean }> = [];
    let upstreamOpen = false;

    upstreamWs.on('open', () => {
      upstreamOpen = true;
      while (pendingMessages.length > 0) {
        const msg = pendingMessages.shift();
        if (msg && upstreamWs.readyState === WebSocket.OPEN) {
          upstreamWs.send(msg.data, { binary: msg.isBinary });
        }
      }
    });

    upstreamWs.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });

    upstreamWs.on('error', (err) => {
      console.error('Gemini Live upstream WebSocket error:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: { message: err.message || 'Upstream connection error' } }));
        clientWs.close(1011, 'Upstream error');
      }
    });

    upstreamWs.on('close', (code, reason) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code || 1000, reason?.toString() || '');
      }
    });

    clientWs.on('message', (data, isBinary) => {
      if (upstreamOpen && upstreamWs.readyState === WebSocket.OPEN) {
        upstreamWs.send(data, { binary: isBinary });
      } else if (upstreamWs.readyState === WebSocket.CONNECTING) {
        pendingMessages.push({ data, isBinary });
      }
    });

    clientWs.on('close', () => {
      if (upstreamWs.readyState === WebSocket.OPEN || upstreamWs.readyState === WebSocket.CONNECTING) {
        upstreamWs.close();
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
