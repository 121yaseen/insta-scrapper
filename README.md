# InstaScrapr - Instagram Analytics SaaS

InstaScrapr is a SaaS application that allows users to retrieve and analyze Instagram profile information, including post counts, followers, engagement metrics, and more.

## Features

- **Profile Analysis**: Enter any Instagram handle to analyze profiles
- **Comprehensive Analytics**: Track followers, engagement rates, and content performance metrics
- **Post and Reel Insights**: View detailed information about posts and reels
- **Data Visualization**: Visual charts and graphs to illustrate metrics
- **Data Export**: Export analytics data for further analysis

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Scraping**: Custom Instagram scraping service (simulated for MVP)
- **Charts**: Chart.js with react-chartjs-2

## Getting Started

### Prerequisites

- Node.js 14.x or later
- PostgreSQL database
- Clerk account for authentication

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/insta-scrapper.git
cd insta-scrapper
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=your-postgresql-database-url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX=100 # Requests per window
RATE_LIMIT_WINDOW=60000 # Window size in milliseconds (1 minute)
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
/
├── prisma/           # Prisma schema and migrations
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js App Router files
│   │   ├── api/      # API routes
│   │   ├── auth/     # Authentication pages
│   │   ├── dashboard/# Dashboard pages
│   │   └── ...
│   ├── components/   # Reusable React components
│   ├── lib/          # Utility functions and libraries
│   ├── services/     # Service layer for external interactions
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript type definitions
│   └── ...
└── ...
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Prisma](https://prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
