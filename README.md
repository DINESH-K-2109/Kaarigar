# Kaarigar - Tradesmen Marketplace

A platform connecting tradesmen with users seeking their services.

## Features

- User authentication (tradesmen and customers)
- Tradesman profile management
- Search and filter tradesmen by skills and location
- Rating and review system
- Real-time messaging

## Tech Stack

- Next.js 14
- TypeScript
- MongoDB Atlas
- Tailwind CSS
- JWT Authentication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   MONGODB_URI_TRADESMEN=your_tradesmen_db_uri
   MONGODB_URI_CUSTOMERS=your_customers_db_uri
   JWT_SECRET=your_jwt_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is deployed on Vercel with MongoDB Atlas as the database.

## License

ISC 