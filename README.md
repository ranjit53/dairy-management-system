# Dairy Management System

A comprehensive dairy management system built with Next.js, featuring milk collection tracking, customer management, payment processing, and analytics. Fully responsive design for mobile and desktop devices.

## Features

- 🐄 **Milk Collection Management** - Record morning and evening milk entries with Nepali calendar support
- 👥 **Customer Management** - Add, edit, and manage customer profiles with unique IDs
- 💰 **Payment Tracking** - Generate invoices, track payments, and monitor dues
- 📊 **Analytics Dashboard** - Visual graphs and charts showing milk collection trends
- ⚙️ **Custom Rates** - Set different milk rates for each customer
- 💾 **Data Backup & Restore** - Backup data to JSON files and restore from backups or uploads
- 📱 **Fully Responsive** - Works seamlessly on mobile, tablet, and desktop devices
- 🔐 **Role-Based Access** - Admin and Customer dashboards with different permissions

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Database**: JSON files (stored in `/data` folder)
- **Language**: TypeScript
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dairy
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login Credentials

- **Admin**: 
  - User ID: `ADMIN001`
  - Password: `admin123`

- **Customer**: 
  - User ID: `CUST001`
  - Password: `1234`

## Project Structure

```
dairy/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   ├── customer/        # Customer dashboard pages
│   ├── login/           # Login page
│   └── page.tsx         # Landing page
├── data/                # JSON database files
├── lib/                 # Utility functions
└── public/              # Static assets
```

## Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect Next.js and configure the build
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to complete deployment

### Vercel Configuration

The project includes a `vercel.json` configuration file for optimal deployment:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Important Notes for Vercel Deployment

⚠️ **Data Persistence**: Since this app uses JSON files for storage, data will reset on each deployment. Use the **Backup/Restore** feature in Settings to:

1. **Before redeployment**: Download your data via Backup
2. **After redeployment**: Restore data via Upload/Restore

This is a limitation of serverless functions on Vercel. For production use with persistent data, consider migrating to a database (MongoDB, PostgreSQL, etc.).

## Responsive Design

The application is fully responsive and optimized for:

- 📱 **Mobile**: 320px - 640px
- 📱 **Tablet**: 641px - 1024px
- 💻 **Desktop**: 1025px+

### Responsive Features

- **Admin Sidebar**: Collapsible mobile menu with hamburger icon
- **Dashboard Cards**: Stack on mobile, grid layout on tablet/desktop
- **Tables**: Horizontal scroll on mobile, full width on desktop
- **Forms**: Full-width inputs on mobile, optimized spacing on desktop
- **Navigation**: Condensed headers on mobile, full navigation on desktop

## Build for Production

```bash
npm run build
npm start
```

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
