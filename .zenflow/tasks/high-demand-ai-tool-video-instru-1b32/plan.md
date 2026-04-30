# Video → Instruction Manual Generator — Implementation Plan

## Stack
- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk
- **Payments**: Stripe ($9/mo Pro, 5 free conversions)
- **Database**: Supabase (Postgres + Storage)
- **Transcription**: OpenAI Whisper API
- **Step extraction**: OpenAI GPT-4o
- **YouTube**: `youtube-transcript` npm package
- **PDF export**: `@react-pdf/renderer`

## Steps

### [x] Step 1: Project setup & configuration
- Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui components
- All dependencies installed (Clerk, Stripe, Supabase, OpenAI, youtube-transcript, react-pdf, dnd-kit)
- `.env.example`, `.gitignore`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- TypeScript passes clean, build succeeds

### [x] Step 2: Database schema + Supabase
- Tables: `jobs`, `job_sections`, `job_steps`, `user_usage`, `waitlist`
- Migration SQL: `supabase/migrations/001_initial_schema.sql`
- Helper function: `supabase/migrations/002_functions.sql`
- Row Level Security policies, indexes, updated_at triggers
- TypeScript types in `types/database.ts`

### [x] Step 3: Video ingestion + transcription pipeline
- YouTube URL → transcript via `youtube-transcript` package
- MP4 file upload → Supabase Storage → OpenAI Whisper
- Loom URL handling (shows informative error, prompts MP4 upload)
- `/api/upload` for file uploads
- `/api/jobs` POST to create job, `/api/jobs/[id]/process` POST to run pipeline

### [x] Step 4: Step extraction with GPT-4o
- GPT-4o with JSON response format and structured system prompt
- Extracts: title, description, estimated_time, sections with steps, flat checklist
- `lib/openai.ts` with `extractStepsFromTranscript()`
- Stored in `job_sections` + `job_steps` tables

### [x] Step 5: Core UI — conversion flow
- `VideoInputForm` component: URL tab + file upload dropzone (react-dropzone)
- `/convert` page for authenticated users
- `/dashboard` page showing job list with status badges
- `/jobs/[id]` result page with ManualViewer
- `ManualViewer`: step-by-step view + checklist view tabs, inline step editing, drag-to-reorder (dnd-kit)

### [x] Step 6: PDF + SOP export
- PDF via `@react-pdf/renderer` — `/api/export/pdf/[id]`
- SOP markdown download — `/api/export/sop/[id]`
- `ManualPDF` component with professional styling, checklist page
- Download buttons in ManualViewer UI

### [x] Step 7: Monetization (Clerk + Stripe)
- Clerk auth with middleware protecting `/dashboard`, `/convert`, `/jobs`
- Free tier: 5 conversions tracked in `user_usage`
- Stripe Checkout for Pro ($9/mo) — `/api/stripe/checkout`
- Stripe webhook for subscription lifecycle — `/api/webhooks/stripe`
- Billing portal — `/api/stripe/portal`
- `UpgradeModal` component with features list
- `/pricing` page with Free vs Pro comparison

### [x] Step 8: Landing page + marketing
- Hero with GPT-4o badge, clear value proposition
- Input format bar (YouTube, Loom, MP4)
- "How it works" 3-step section
- Use-case cards (IT, Training, DIY, Education)
- Output formats showcase
- Email waitlist form → `/api/waitlist` → Supabase `waitlist` table
- Footer with nav links
