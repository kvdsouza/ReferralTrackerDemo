# Referral Management System

A modern web application for managing customer referrals and rewards in the contracting industry.

## Features

- 🔐 Secure authentication with Supabase
- 💼 Contractor and customer dashboards
- 🎁 Automated reward distribution with Tremendous
- 📊 Real-time analytics and tracking
- 🔄 Automated referral code generation
- 📱 Responsive design for all devices

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/referral-system.git
   cd referral-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables in `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TREMENDOUS_API_KEY=your_tremendous_api_key
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test:watch
```

## Security Features

- 🔒 Rate limiting on API routes
- 🛡️ Secure headers with HSTS
- 🚫 XSS protection
- 🔐 CSRF protection
- 📝 Comprehensive audit logging
- 🚦 Role-based access control

## Deployment

The application is automatically deployed to Vercel through GitHub Actions when changes are pushed to the main branch.

### Manual Deployment

```bash
npm run build
vercel deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
