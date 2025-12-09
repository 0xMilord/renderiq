# Renderiq - AI Architectural Visualization Platform

Transform your architectural sketches into hyperrealistic AI renders and videos using multiple state-of-the-art AI models.

## Features

- 🎨 **AI-Powered Rendering**: Transform sketches into photorealistic architectural visualizations
- 🚀 **Fast Processing**: Get renders in minutes, not hours
- 🔒 **Secure & Private**: Enterprise-grade security and privacy protection
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🎥 **Video Generation**: Create both images and videos from your sketches
- 🌐 **Public Gallery**: Share and discover amazing renders from the community

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI Engine**: Multi-model support for image, video, and 3D generation
- **Validation**: Zod
- **UI Components**: Custom components with Tailwind CSS

## Architecture

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│  (Components, Pages, Client Logic)      │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│           Hooks Layer                   │
│  (use-auth, use-projects, use-gallery)  │
│  - Bridge client ↔ server               │
│  - Manage loading states                │
│  - Handle optimistic updates            │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│        Server Actions Layer             │
│  (/lib/actions/*.actions.ts)            │
│  - Entry point from client              │
│  - Input validation (Zod)               │
│  - Authentication checks                │
│  - Cache revalidation                   │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Service Layer                   │
│  (/lib/services/*.service.ts)           │
│  - Business logic                       │
│  - Database operations                  │
│  - External API calls                   │
│  - Domain rules                         │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Data Layer                      │
│  (Drizzle ORM + PostgreSQL)             │
│  - Schema definitions                   │
│  - Type-safe queries                    │
│  - Migrations                           │
└─────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Supabase account
- API keys for AI models (image, video, and 3D generation)
- Google Veo API key (for video generation)
- Tencent Hunyuan3D API key (for 3D generation, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Renderiq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `GEMINI_API_KEY`: Your API key for image generation models
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Alternative Google API key
   - `HUNYUAN3D_API_KEY`: Your Tencent Hunyuan3D API key (for 3D generation, optional)

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
Renderiq/
├── app/                    # Next.js App Router pages
│   ├── api-docs/          # API documentation page
│   ├── gallery/           # Public gallery page
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── upload/            # Upload page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── gallery-grid.tsx  # Gallery display component
│   ├── navbar.tsx        # Navigation component
│   ├── render-display.tsx # Render display component
│   ├── render-form.tsx   # Render creation form
│   └── upload-form.tsx   # Upload form component
├── lib/                  # Core application logic
│   ├── actions/          # Server actions
│   ├── dal/             # Data access layer
│   ├── db/              # Database schema and connection
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic services
│   ├── supabase/        # Supabase client configuration
│   └── types/           # TypeScript type definitions
├── drizzle.config.ts     # Drizzle ORM configuration
├── proxy.ts              # Next.js proxy (formerly middleware)
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signout` - Sign out user

### Renders
- `POST /api/renders` - Create new render
- `GET /api/renders/[id]` - Get render status
- `GET /api/renders` - List user renders

### Gallery
- `GET /api/gallery` - Get public gallery
- `POST /api/gallery/[id]/like` - Like gallery item
- `POST /api/gallery/[id]/view` - Record view

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `name` (String, Optional)
- `avatar` (String, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Projects
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `name` (String)
- `description` (String, Optional)
- `original_image_url` (String)
- `original_image_key` (String)
- `status` (Enum: processing, completed, failed)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Renders
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key)
- `type` (Enum: image, video)
- `prompt` (String)
- `settings` (JSON)
- `output_url` (String, Optional)
- `output_key` (String, Optional)
- `status` (Enum: pending, processing, completed, failed)
- `error_message` (String, Optional)
- `processing_time` (Integer, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Gallery Items
- `id` (UUID, Primary Key)
- `render_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `is_public` (Boolean)
- `likes` (Integer)
- `views` (Integer)
- `created_at` (Timestamp)

## Development

### Database Commands
```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Ensure PostgreSQL database is accessible
- Set all required environment variables
- Run database migrations
- Build and start the application

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@renderiq.io or join our Discord community: https://discord.gg/KADV5pX3

## Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced AI style presets
- [ ] Batch processing capabilities
- [ ] Mobile app (React Native)
- [ ] Integration with popular CAD software
- [ ] Advanced analytics and insights