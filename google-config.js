// Google Calendar API Configuration
const googleConfig = {
    apiKey: 'YOUR_API_KEY',
    clientId: 'YOUR_CLIENT_ID',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scopes: ['https://www.googleapis.com/auth/calendar.events']
};

// Initialize Google API Client
function initializeGoogleAPI() {
    return gapi.client.init({
        apiKey: googleConfig.apiKey,
        clientId: googleConfig.clientId,
        discoveryDocs: googleConfig.discoveryDocs,
        scope: googleConfig.scopes.join(' ')
    });
}

// Handle Google Calendar Authentication
async function handleGoogleAuth() {
    try {
        const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        
        if (!isSignedIn) {
            await gapi.auth2.getAuthInstance().signIn();
        }
        
        updateGoogleUI(true);
        await loadGoogleEvents();
        return true;
    } catch (error) {
        console.error('Error authenticating with Google:', error);
        showNotification('Failed to connect to Google Calendar', 'error');
        return false;
    }
}

// Create Google Calendar Event
async function createGoogleEvent(event) {
    try {
        const startTime = new Date(`${event.date}T${event.time}`);
        const endTime = new Date(startTime.getTime() + event.duration * 60000);

        const eventData = {
            'summary': event.name,
            'start': {
                'dateTime': startTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            'end': {
                'dateTime': endTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        const response = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': eventData
        });

        if (response.status === 200) {
            showNotification('Event synced with Google Calendar', 'success');
            return response.result;
        } else {
            throw new Error('Failed to create Google Calendar event');
        }
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        showNotification('Failed to sync with Google Calendar', 'error');
        throw error;
    }
}

// Get Google Calendar Events
async function getGoogleEvents() {
    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        });

        return response.result.items;
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        showNotification('Failed to fetch Google Calendar events', 'error');
        return [];
    }
}

// Delete Google Calendar Event
async function deleteGoogleEvent(eventId) {
    try {
        const response = await gapi.client.calendar.events.delete({
            'calendarId': 'primary',
            'eventId': eventId
        });

        if (response.status === 204) {
            showNotification('Event deleted from Google Calendar', 'success');
            return true;
        } else {
            throw new Error('Failed to delete Google Calendar event');
        }
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        showNotification('Failed to delete from Google Calendar', 'error');
        return false;
    }
}

// Update UI based on Google authentication state
function updateGoogleUI(isAuthenticated) {
    const connectButton = document.getElementById('google-connect');
    const statusText = document.getElementById('google-status');
    const syncCheckbox = document.getElementById('sync-google');
    const calendarSource = document.getElementById('calendar-source');

    if (isAuthenticated) {
        statusText.textContent = 'Connected to Google';
        connectButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        connectButton.classList.add('bg-green-600', 'hover:bg-green-700');
        syncCheckbox.disabled = false;
        
        // Enable Google Calendar option in dropdown
        Array.from(calendarSource.options).forEach(option => {
            if (option.value === 'google') {
                option.disabled = false;
            }
        });
    } else {
        statusText.textContent = 'Connect Google';
        connectButton.classList.remove('bg-green-600', 'hover:bg-green-700');
        connectButton.classList.add('bg-red-600', 'hover:bg-red-700');
        syncCheckbox.disabled = true;
        
        // Disable Google Calendar option in dropdown
        Array.from(calendarSource.options).forEach(option => {
            if (option.value === 'google') {
                option.disabled = true;
            }
        });
    }
}

// Initialize Google API
function loadGoogleAPI() {
    gapi.load('client:auth2', async () => {
        try {
            await initializeGoogleAPI();
            await gapi.auth2.init({
                client_id: googleConfig.clientId
            });

            // Add click handler for Google connect button
            document.getElementById('google-connect').addEventListener('click', handleGoogleAuth);

            // Check if user is already signed in
            const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            updateGoogleUI(isSignedIn);

            if (isSignedIn) {
                loadGoogleEvents();
            }
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    });
}

// Load the Google API when the page loads
document.addEventListener('DOMContentLoaded', loadGoogleAPI);
