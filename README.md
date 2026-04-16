# AskHR - CV Analyzer & Job Chat

An HR application for analyzing CVs against job listings and chatting with AI about job-related questions.

## Features

### CV Analyzer
- Upload CV files (PDF/DOCX)
- AI-powered matching using OpenAI embeddings + cosine similarity
- Fast analysis with pre-computed job embeddings
- Displays top matching jobs with detailed analysis

### Job Chat
- AI assistant for job-related Q&A
- Uses job listings as knowledge base
- Markdown support for responses
- Persistent chat history

## Prerequisites

- **Node.js** 18.x or later
- **PostgreSQL** database (or use Aiven/Supabase)
- **OpenAI API Key** with GPT-4o-mini and embedding access

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require

# OpenAI (for embeddings & chat)
OPENAI_API_KEY=sk-your-openai-api-key

# Admin Authentication
ADMIN_SECRET=your-secure-password
```

### Database Setup

1. Ensure your PostgreSQL database is running
2. Push the Prisma schema to create the Job table:

```bash
npx prisma db push
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Login Credentials

- **Email:** emily.nates@company.com
- **Password:** password123 (or your configured `ADMIN_SECRET`)

## Project Structure

```
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── login/          # Login page
│   ├── components/
│   │   ├── cv-analyzer/   # CV analyzer components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI components
│   └── lib/
│       ├── embeddings.ts   # OpenAI embeddings
│       ├── prisma.ts      # Prisma client
│       └── types.ts       # TypeScript types
└── .env                   # Environment variables
```

## Tech Stack

- **Framework:** Next.js 15
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI GPT-4o-mini + text-embedding-3-small
- **UI:** Radix UI + Tailwind CSS
- **Deployment:** Vercel

## Deployment to Vercel

1. Push this project to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add the environment variables in Vercel project settings
5. Deploy

## License

MIT