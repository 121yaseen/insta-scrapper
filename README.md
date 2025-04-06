# 🔍 InstaScrapr

<div align="center">

![InstaScrapr Banner](public/images/pistah.svg)

**Powerful Instagram analytics and insights for creators, marketers, and businesses**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Types-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)

[Features](#-features) • 
[Tech Stack](#-tech-stack) • 
[Getting Started](#-getting-started) • 
[Contributing](#-contributing) • 
[Roadmap](#-roadmap) • 
[License](#-license)

</div>

## 🚀 Overview

InstaScrapr is an open-source Instagram analytics platform that provides comprehensive insights into any Instagram profile without requiring login credentials. It helps marketers, creators, and businesses track performance metrics, analyze engagement, and understand audience demographics.

<details>
<summary>📸 Screenshots</summary>
<br>

**Dashboard Overview**
![Dashboard](https://via.placeholder.com/800x450?text=Dashboard+Screenshot)

**Profile Analysis**
![Profile Analysis](https://via.placeholder.com/800x450?text=Profile+Analysis+Screenshot)

**Historical Data**
![Historical Data](https://via.placeholder.com/800x450?text=Historical+Data+Screenshot)

</details>

## ✨ Features

- **💯 Profile Analysis**: Retrieve metrics for any public Instagram handle
- **📊 Comprehensive Analytics**: Analyze followers, engagement rates, and content performance
- **📱 Post & Reel Insights**: Extract data from individual posts and reels
- **📅 Historical Tracking**: Monitor changes and trends over time
- **📋 Data Export**: Download reports in various formats for your presentations
- **🔍 Creator Discovery**: Find influencers by location, language, and niche

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/), [React](https://reactjs.org/), [TailwindCSS](https://tailwindcss.com/)
- **Backend**: [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- **Authentication**: [Clerk](https://clerk.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) with [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2)
- **Deployment**: [Vercel](https://vercel.com)

## 🏁 Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- [Clerk](https://clerk.dev/) account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/insta-scrapper.git
cd insta-scrapper
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=your-postgresql-database-url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX=100 
RATE_LIMIT_WINDOW=60000 
```

4. **Set up the database**

```bash
npx prisma migrate dev
```

5. **Start the development server**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 👥 Contributing

We're excited to welcome contributions to InstaScrapr! Whether it's bug fixes, new features, or documentation improvements, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a new branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm run test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clean, maintainable, and testable code
- Add appropriate documentation and comments
- Include tests for new features

### Ideas for Contributions

- **UI Improvements**: Enhance user interface and experience
- **Performance Optimization**: Improve loading times and efficiency
- **Documentation**: Improve or expand documentation
- **Internationalization**: Add support for multiple languages
- **Analytics Features**: Add new metrics or visualization options
- **Integration**: Connect with additional services or platforms

## 🗺️ Roadmap

- [ ] **User Roles and Permissions**: Admin, team member access levels
- [ ] **Instagram Stories Analytics**: Extend analysis to Stories
- [ ] **Competitor Comparison**: Compare metrics with competitor profiles
- [ ] **AI-Powered Insights**: Use AI to generate content recommendations
- [ ] **API Access**: Public API for developers to build on the platform
- [ ] **Advanced Filters**: More granular data filtering options
- [ ] **Team Collaboration**: Tools for teams to work together on analytics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to all our contributors and the amazing open-source projects that make InstaScrapr possible:

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Prisma](https://prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)

---

<div align="center">

**Made with ❤️ by the InstaScrapr Team**

[Report Bug](https://github.com/121yaseen/insta-scrapper/issues) · [Request Feature](https://github.com/121yaseen/insta-scrapper/issues)

</div>
