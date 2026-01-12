# StacksMail - Self-Hosted Email Client

A modern, self-hosted email client built with React, Node.js, and PostgreSQL. Supports multiple IMAP/POP email accounts and SMTP profiles for sending.

## Features

- 📧 **Multi-Account Support**: Configure multiple IMAP/POP email accounts per user
- 📤 **Multiple SMTP Profiles**: Send emails from different accounts/identities
- 📥 **Inbox Management**: View, read, star, and organize your emails
- ✏️ **Compose & Reply**: Write new emails and reply to received messages
- 🔐 **Authentication**: User signup and login with JWT tokens
- 🎨 **Modern UI**: Clean, responsive interface built with React Bootstrap

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript**
- **Apollo GraphQL** Server
- **Sequelize** ORM with PostgreSQL
- **Nodemailer** for SMTP sending
- **JWT** for authentication

### Frontend
- **React 19** with Vite
- **TypeScript**
- **Apollo Client** for GraphQL
- **React Bootstrap** for UI components
- **Styled Components** for custom styling
- **React Router** for navigation

### Database
- **PostgreSQL 15** (via Docker)

## Project Structure

```
email/
├── backend/               # Express + Apollo GraphQL backend
│   ├── db/
│   │   └── models/       # Sequelize models
│   ├── mutations/        # GraphQL mutations
│   ├── queries/          # GraphQL queries
│   ├── helpers/          # Utility functions
│   └── index.ts          # Server entry point
├── frontend/             # React + Vite frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── contexts/     # React contexts
│       └── __generated__/ # Generated GraphQL types
├── common/               # Shared schema and types
│   └── schema.graphql    # GraphQL schema
└── docker-compose.yml    # PostgreSQL container config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL)

### Setup

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Generate GraphQL types:**
   ```bash
   cd common && pnpm run generate
   ```

4. **Start the development servers:**
   ```bash
   pnpm start
   ```

   This starts:
   - Backend API at `http://localhost:4000/api/graphql`
   - Frontend at `http://localhost:5173`

### Configuration

The backend expects PostgreSQL at `localhost:5432` with:
- Database: `email_client`
- Username: `postgres`
- Password: `password`

Modify `backend/db/database.ts` to change these settings.

## Usage

1. **Sign Up**: Create an account with your email and password
2. **Add Email Accounts**: Go to Settings → Email Accounts to add IMAP/POP accounts
3. **Add SMTP Profiles**: Go to Settings → SMTP Profiles to configure outgoing email
4. **Sync Emails**: Click "Sync" to fetch emails from your configured accounts
5. **Compose**: Click "Compose" to write and send new emails
6. **Reply**: Open any email and click "Reply" to respond

## API

The GraphQL API is available at `/api/graphql`. Key operations include:

### Queries
- `me` - Get current user
- `getEmails(input)` - Fetch emails with filters
- `getEmail(input)` - Get single email details
- `getEmailAccounts` - List configured email accounts
- `getSmtpProfiles` - List SMTP profiles

### Mutations
- `signUp(input)` - Create new account
- `login(input)` - Authenticate user
- `createEmailAccount(input)` - Add IMAP/POP account
- `createSmtpProfile(input)` - Add SMTP profile
- `sendEmail(input)` - Send an email
- `syncEmailAccount(input)` - Sync emails from account

## Development

### Regenerate Types

After modifying `common/schema.graphql`:

```bash
cd common && pnpm run generate
```

### Database Reset

To reset the database:

```bash
docker-compose down -v
docker-compose up -d
```

The database schema is automatically synced on backend startup.

## Future Improvements

- [ ] Implement actual IMAP/POP sync (currently mocked)
- [ ] Add attachment support
- [ ] Implement email threading
- [ ] Add search functionality
- [ ] Support email labels/folders
- [ ] Add OAuth authentication for email providers
- [ ] Implement real-time email notifications

## License

ISC
