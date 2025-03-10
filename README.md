# Modern Scheduling App with Calendar Integrations

A modern scheduling application that allows users to create and manage events, with optional Microsoft 365 and Google Calendar integration, featuring a beautiful dark mode.

## Features

- Clean, modern UI using Tailwind CSS
- Dark mode support with smooth transitions
  * System preference detection
  * Manual toggle option
  * Persistent theme preference
  * Animated transitions
- Event scheduling with customizable duration
- Multiple calendar integrations:
  * Microsoft 365 Calendar
  * Google Calendar
  * Local calendar
- Calendar view options:
  * View local events
  * View M365 events
  * View Google Calendar events
  * View all events combined
- Real-time notifications
- Responsive design
- Smooth animations and transitions
- Accessibility features

## Dark Mode

The application includes a sophisticated dark mode implementation:

- Automatic detection of system color scheme preference
- Manual toggle via sun/moon icon
- Persistent theme storage
- Smooth transitions between themes
- Dark-mode optimized colors and contrasts
- Dark mode specific animations and effects

## Setup

1. **Basic Setup**
   - Clone the repository
   - Open index.html in a web browser
   - The basic scheduling functionality will work without any additional setup

2. **Microsoft 365 Integration Setup**
   
   To enable M365 calendar integration:

   a. Register an application in Azure AD:
      - Go to [Azure Portal](https://portal.azure.com)
      - Navigate to Azure Active Directory > App registrations
      - Click "New registration"
      - Name your application
      - Set Redirect URI to your application's URL (e.g., http://localhost:8000)
      - Select "Single-page application (SPA)" as the application type

   b. Configure API permissions:
      - In your app registration, go to "API permissions"
      - Add the following Microsoft Graph permissions:
        * Calendars.ReadWrite
        * User.Read
      - Grant admin consent for these permissions

   c. Update configuration:
      - Open `m365-config.js`
      - Replace `YOUR_CLIENT_ID` with your Azure AD application's client ID
      - Update `redirectUri` if needed

3. **Google Calendar Integration Setup**

   To enable Google Calendar integration:

   a. Create a project in Google Cloud Console:
      - Go to [Google Cloud Console](https://console.cloud.google.com)
      - Create a new project
      - Enable the Google Calendar API

   b. Configure OAuth 2.0 credentials:
      - Go to APIs & Services > Credentials
      - Click "Create Credentials" > "OAuth 2.0 Client ID"
      - Select "Web application" as the application type
      - Add your application's URL to authorized JavaScript origins
      - Add your redirect URI

   c. Update configuration:
      - Open `google-config.js`
      - Replace `YOUR_CLIENT_ID` with your Google OAuth 2.0 client ID
      - Replace `YOUR_API_KEY` with your Google API key

## Usage

1. **Theme Preferences**
   - Click the sun/moon icon to toggle between light and dark modes
   - Theme preference is automatically saved
   - System preference is respected by default

2. **Local Calendar**
   - Enter event details in the form
   - Click "Schedule Event"
   - View and manage events in the "Upcoming Events" section

3. **M365 Calendar Integration**
   - Click "Connect M365" to authenticate
   - Check "Sync with M365 Calendar" when creating events
   - Use the calendar source dropdown to view M365 events

4. **Google Calendar Integration**
   - Click "Connect Google" to authenticate
   - Check "Sync with Google Calendar" when creating events
   - Use the calendar source dropdown to view Google Calendar events

5. **Combined Calendar View**
   - Select "All" in the calendar source dropdown to view events from all sources
   - Events are color-coded by source:
     * Blue: Local events
     * Microsoft Blue: M365 events
     * Red: Google Calendar events

## Running the Application

1. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open in browser:
   ```
   http://localhost:8000
   ```

## Technical Details

- Built with vanilla JavaScript
- Styled with Tailwind CSS
- Uses Microsoft Graph API for M365 integration
- Uses Google Calendar API for Google Calendar integration
- Implements MSAL.js for Microsoft authentication
- Implements Google OAuth 2.0 for Google authentication
- Responsive design works on all device sizes
- Dark mode implementation using Tailwind's dark mode feature
- Custom CSS animations and transitions

## Security Notes

- The application uses client-side storage for local events and theme preferences
- M365 authentication is handled securely through Microsoft's MSAL library
- Google authentication is handled through Google's OAuth 2.0 flow
- No sensitive data is stored locally
- All API calls use secure OAuth 2.0 tokens

## Production Deployment

For production deployment:

1. Replace Tailwind CDN with a production build
2. Update the Azure AD app registration with production URLs
3. Update Google Cloud Console with production URLs
4. Implement proper error handling and logging
5. Consider adding a backend for persistent storage
6. Add rate limiting for API calls
7. Implement proper CORS policies
8. Optimize dark mode transitions for performance

## Support

For questions about:
- Basic functionality: Use the GitHub issues
- M365 integration: Refer to [Microsoft Graph documentation](https://docs.microsoft.com/en-us/graph/overview)
- Google Calendar integration: Refer to [Google Calendar API documentation](https://developers.google.com/calendar)
- Dark mode implementation: Refer to [Tailwind Dark Mode documentation](https://tailwindcss.com/docs/dark-mode)
