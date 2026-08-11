# Swork

A full-stack freelance/work platform with real-time communication capabilities.

## Tech Stack

### Backend
- **ASP.NET Core** - Web API framework
- **Entity Framework Core** - ORM with SQL Server
- **SignalR** - Real-time web functionality
- **JWT Authentication** - Secure token-based authentication
- **Swagger** - API documentation

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **SignalR Client** - Real-time communication
- **Axios** - HTTP client
- **React Image Crop** - Image cropping functionality

## Project Structure

```
Project4th/
├── Backend/
│   └── Backend/
│       ├── Controllers/     # API controllers
│       ├── Database/        # Database context and configurations
│       ├── Hubs/           # SignalR hubs for real-time features
│       ├── Migrations/     # Database migrations
│       ├── Models/         # Data models
│       ├── Services/       # Business logic services
│       └── wwwroot/        # Static files (uploads, profile photos)
└── Frontend/
    └── swork/
        ├── public/         # Static assets
        ├── src/           # React components and source code
        └── dist/          # Build output
```

## Getting Started

### Prerequisites
- .NET SDK (for Backend)
- Node.js and npm (for Frontend)
- SQL Server

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend/Backend
```

2. Configure connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your-Connection-String-Here"
  }
}
```

3. Configure JWT settings in `appsettings.json`:
```json
{
  "JwtSettings": {
    "Secret": "Your-Secret-Key-Minimum-32-Characters",
    "Issuer": "SworkAPI",
    "Audience": "SworkAPIUsers"
  }
}
```

4. Run database migrations:
```bash
dotnet ef database update
```

5. Run the backend:
```bash
dotnet run
```

The API will be available at `https://localhost:5001` (or as configured)
Swagger documentation will be available at `https://localhost:5001/swagger`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend/swork
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

4. For production build:
```bash
npm run build
```

## Features

- **User Authentication**: JWT-based secure authentication
- **Real-time Communication**: SignalR-powered chat and notifications
- **File Uploads**: Support for document uploads and profile photos
- **API Documentation**: Interactive Swagger UI
- **CORS Configuration**: Secure cross-origin resource sharing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## API Endpoints

The backend provides RESTful API endpoints for:
- User authentication and authorization
- Project management
- Real-time chat via SignalR
- File uploads and profile management

Access the full API documentation at `/swagger` when the backend is running.

## SignalR Hubs

- **ProjectChatHub**: Real-time project chat functionality

## Development

### Backend Development
- Use Swagger UI at `/swagger` for API testing
- Database seeding is enabled in development mode
- Hot reload is available with `dotnet watch`

### Frontend Development
- Vite provides fast HMR (Hot Module Replacement)
- React DevTools recommended for debugging
- ESLint configured for code quality

## License

This project is licensed under the MIT License.
