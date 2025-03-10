// Microsoft Authentication Configuration
const msalConfig = {
    auth: {
        clientId: 'YOUR_CLIENT_ID', // Replace with your Azure AD app client ID
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: [
        'User.Read',
        'Calendars.ReadWrite'
    ]
};

// Initialize MSAL Instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Microsoft Graph API endpoints
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphCalendarEndpoint: "https://graph.microsoft.com/v1.0/me/calendar/events"
};

// Helper function to call MS Graph API
async function callMSGraph(endpoint, accessToken) {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${accessToken}`);

    const options = {
        method: 'GET',
        headers: headers
    };

    return fetch(endpoint, options)
        .then(response => response.json())
        .catch(error => console.error(error));
}

// Handle M365 Authentication
async function handleM365Auth() {
    const currentAccounts = msalInstance.getAllAccounts();
    
    if (currentAccounts.length === 0) {
        // No user signed in
        try {
            const loginResponse = await msalInstance.loginPopup(loginRequest);
            if (loginResponse) {
                updateUI(true);
                return loginResponse;
            }
        } catch (error) {
            console.error(error);
            showNotification('Failed to connect to M365', 'error');
        }
    } else {
        // User is signed in
        updateUI(true);
        return currentAccounts[0];
    }
}

// Get Access Token
async function getTokenPopup(request) {
    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.error(error);
        try {
            const response = await msalInstance.acquireTokenPopup(request);
            return response.accessToken;
        } catch (error) {
            console.error(error);
            showNotification('Failed to get access token', 'error');
        }
    }
}

// Create M365 Calendar Event
async function createM365Event(event) {
    try {
        const accessToken = await getTokenPopup(loginRequest);
        
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('Content-Type', 'application/json');

        const startTime = new Date(`${event.date}T${event.time}`);
        const endTime = new Date(startTime.getTime() + event.duration * 60000);

        const eventData = {
            subject: event.name,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(eventData)
        };

        const response = await fetch(graphConfig.graphCalendarEndpoint, options);
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Event synced with M365 Calendar', 'success');
            return result;
        } else {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Error creating M365 event:', error);
        showNotification('Failed to sync with M365 Calendar', 'error');
        throw error;
    }
}

// Get M365 Calendar Events
async function getM365Events() {
    try {
        const accessToken = await getTokenPopup(loginRequest);
        const response = await callMSGraph(graphConfig.graphCalendarEndpoint, accessToken);
        return response.value;
    } catch (error) {
        console.error('Error fetching M365 events:', error);
        showNotification('Failed to fetch M365 events', 'error');
        return [];
    }
}

// Update UI based on authentication state
function updateUI(isAuthenticated) {
    const connectButton = document.getElementById('m365-connect');
    const statusText = document.getElementById('m365-status');
    const syncCheckbox = document.getElementById('sync-m365');
    const calendarSource = document.getElementById('calendar-source');

    if (isAuthenticated) {
        statusText.textContent = 'Connected to M365';
        connectButton.classList.remove('bg-[#0078D4]');
        connectButton.classList.add('bg-green-600');
        syncCheckbox.disabled = false;
        calendarSource.disabled = false;
    } else {
        statusText.textContent = 'Connect M365';
        connectButton.classList.remove('bg-green-600');
        connectButton.classList.add('bg-[#0078D4]');
        syncCheckbox.disabled = true;
        calendarSource.disabled = true;
    }
}
