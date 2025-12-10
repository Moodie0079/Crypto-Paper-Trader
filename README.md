# PaperTrader

A paper trading simulator for cryptocurrency.

## Overview

PaperTrader is a full-stack web application that allows users to practice trading cryptocurrencies using virtual money. The application streams real-time price data from Binance and allows users to buy and sell assets, track their portfolio, and monitor their performance.

## Architecture

- **Backend**: Ruby on Rails 
- **Frontend**: React with TypeScript
- **Database**: MySQL
- **Real-time Updates**: WebSocket connections
- **Price Data**: Binance WebSocket API

## Prerequisites

- Ruby 3.x or higher
- Node.js 18.x or higher
- MySQL 5.6.4 or higher
- Bundler gem

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
bundle install
```

3. Create a `.env` file in the backend directory with your database credentials:
```
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
```

4. Create and setup the database:
```bash
rails db:create
rails db:migrate
rails db:seed
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend

From the `backend` directory:

```bash
rails server
```

The API will be available at `http://localhost:3000`

### Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `GET /portfolio` - Retrieve user portfolio and assets
- `POST /trade` - Execute a buy trade
- `POST /sell` - Execute a sell trade
- `POST /reset` - Reset user account to initial balance

## Database Schema

### Users
- `id` - Primary key
- `balance_usd` - Available USD balance
- `starting_balance` - Initial balance for tracking performance

### Assets
- `id` - Primary key
- `user_id` - Foreign key to users
- `symbol` - Cryptocurrency symbol (e.g., BTCUSDT)
- `quantity` - Amount owned
- `cost_basis` - Average purchase price

### MarketPrices
- `id` - Primary key
- `symbol` - Cryptocurrency symbol
- `price` - Current market price
- `updated_at` - Last update timestamp

## Environment Variables

### Backend
- `DB_PASSWORD` - MySQL database password
- `DB_HOST` - MySQL database host (default: 127.0.0.1)
- `RAILS_MAX_THREADS` - Maximum Rails threads (default is 5)