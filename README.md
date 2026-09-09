# AgriMarket - Agricultural Marketplace Platform

A modern agricultural marketplace platform featuring a professional web application and native Android application, sharing a unified backend and database.

## Architecture

```
AGRI MARKETPLACE
       │
┌──────┴──────────┐
│                 │
WEB APPLICATION  NATIVE ANDROID APP
React.js         React Native
Vercel           Expo/EAS
│                 │
└──────────┬──────┘
           │
     REST API / HTTPS
           │
    Node.js + Express
        Render
           │
    ┌──────┴──────┐
    │             │
Aiven MySQL    Socket.IO
    │             │
 Database     Real-time
```

## Technology Stack

### Web Application
- React.js with TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- Recharts

### Android Application
- React Native
- Expo
- TypeScript
- Expo Router
- React Native Paper
- TanStack Query
- Secure storage

### Backend
- Node.js
- Express.js
- TypeScript
- REST API
- Socket.IO

### Database
- MySQL (Aiven)

## User Roles

- **Admin** - Platform management and oversight
- **Buyer** - Purchase agricultural products
- **Seller** - Sell agricultural products (requires approval)
- **Delivery Man** - Handle order deliveries

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MySQL database
- Expo CLI (for mobile development)

### Installation

1. Clone the repository
2. Install dependencies for each project:
   ```bash
   # Backend
   cd backend
   npm install

   # Web
   cd web
   npm install

   # Mobile
   cd mobile
   npm install
   ```

3. Configure environment variables (see .env.example files)

4. Run database migrations

5. Start the development servers

## Development

### Backend
```bash
cd backend
npm run dev
```

### Web Application
```bash
cd web
npm run dev
```

### Mobile Application
```bash
cd mobile
npm start
```

## Deployment

- **Web**: Vercel
- **Backend**: Render
- **Mobile**: Expo Application Services (EAS)

## Features

- Product marketplace with categories
- Search and filtering
- Shopping cart and checkout
- Multiple payment methods (GCash, COD)
- Seller application and approval system
- Delivery management
- Real-time messaging
- Social commerce features
- Trade marketplace
- Price monitoring
- Recommendation engine
- Analytics dashboards
- SEO optimization

## License

Proprietary - All rights reserved
