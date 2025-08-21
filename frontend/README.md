# Scorix Frontend

A modern React TypeScript frontend for the Scorix AI-Powered Grading System.

## Features

- **Modern UI/UX**: Built with Tailwind CSS and Lucide React icons
- **TypeScript**: Full type safety with comprehensive type definitions
- **Responsive Design**: Mobile-first approach with responsive sidebar
- **Role-Based Access**: Different dashboards for Students, Teachers, and Admins
- **Real-time Updates**: Toast notifications and loading states
- **Protected Routes**: Authentication-based route protection

## Tech Stack

- **React 18** with TypeScript
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Zustand** for state management
- **Lucide React** for icons

## Prerequisites

- Node.js 16+ and npm/yarn
- FastAPI backend running on `http://localhost:8000`

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components by role
│   ├── layout/          # Layout components (Sidebar, Header)
│   ├── courses/         # Course management
│   ├── questions/       # Question management
│   ├── tests/           # Test management
│   ├── grading/         # AI grading interface
│   ├── answers/         # Student answer management
│   └── profile/         # User profile management
├── contexts/            # React contexts
├── services/            # API services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx             # Main application component
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## API Integration

The frontend is configured to communicate with your FastAPI backend at `http://localhost:8000`. The proxy is set up in `package.json` for development.

### Authentication Flow

1. User registers/logs in
2. JWT token is stored in localStorage
3. Token is automatically added to API requests
4. Protected routes check authentication status

### Role-Based Features

#### Teacher Dashboard
- Course management
- Question creation and management
- Test creation and management
- AI-powered grading
- Student enrollment management

#### Student Dashboard
- View enrolled courses
- Take tests
- Submit answers
- View grades and feedback

#### Admin Dashboard
- Full system access
- User management
- System-wide analytics

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/index.css` for global styles
- Use Tailwind utility classes for component styling

### Components
- All components are built with TypeScript interfaces
- Follow the existing component patterns for consistency
- Use the provided utility classes and components

### API Calls
- API services are organized by feature in `src/services/`
- Use the provided API functions for backend communication
- Error handling is centralized in the API interceptors

## Development

### Adding New Features

1. **Create TypeScript interfaces** in `src/types/`
2. **Add API endpoints** in `src/services/api.ts`
3. **Create React components** in appropriate directories
4. **Update routing** in `src/App.tsx` and `src/components/Dashboard.tsx`

### State Management

- Use React Context for global state (authentication)
- Use local state for component-specific data
- Consider Zustand for complex state management if needed

### Form Handling

- Use React Hook Form for form management
- Implement proper validation
- Use the provided form components and styles

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder** to your hosting service

3. **Update API base URL** in production environment variables

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure FastAPI backend is running
   - Check proxy configuration in `package.json`
   - Verify CORS settings on backend

2. **TypeScript Errors**
   - Check type definitions in `src/types/`
   - Ensure proper interface implementation
   - Run `npm run build` to catch type errors

3. **Styling Issues**
   - Verify Tailwind CSS is properly configured
   - Check component class names
   - Ensure PostCSS is configured correctly

### Getting Help

- Check the FastAPI backend documentation
- Review TypeScript and React documentation
- Check Tailwind CSS documentation for styling issues

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add appropriate loading states
5. Test on different screen sizes
6. Update documentation as needed

## License

This project is part of the Scorix AI-Powered Grading System.
