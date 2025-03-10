// Store scheduled events
let scheduledEvents = [];
let m365Events = [];
let googleEvents = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize dark mode
    initializeDarkMode();

    // Set minimum date to today
    const dateInput = document.getElementById('event-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Initialize form handling
    const scheduleForm = document.getElementById('schedule-form');
    scheduleForm.addEventListener('submit', handleScheduleSubmit);

    // Initialize M365 connect button
    const m365ConnectBtn = document.getElementById('m365-connect');
    m365ConnectBtn.addEventListener('click', handleM365Auth);

    // Initialize calendar source dropdown
    const calendarSource = document.getElementById('calendar-source');
    calendarSource.addEventListener('change', handleCalendarSourceChange);

    // Add animation classes
    document.querySelector('main').classList.add('animate-fade-in');

    // Check for existing M365 authentication
    msalInstance.handleRedirectPromise().then(() => {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            updateUI(true);
            loadM365Events();
        }
    });
}

// Dark Mode Functions
function initializeDarkMode() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or system preference
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Theme toggle button click handler
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update notification style based on theme
        updateNotificationStyle();
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
            updateNotificationStyle();
        }
    });
}

function updateNotificationStyle() {
    const notification = document.querySelector('.notification');
    if (notification) {
        if (document.documentElement.classList.contains('dark')) {
            notification.style.backgroundColor = '#374151'; // darker background for dark mode
        } else {
            notification.style.backgroundColor = '#3B82F6'; // original blue for light mode
        }
    }
}

async function handleScheduleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const eventName = document.getElementById('event-name').value;
    const eventDate = document.getElementById('event-date').value;
    const eventTime = document.getElementById('event-time').value;
    const duration = document.getElementById('event-duration').value;
    const syncWithM365 = document.getElementById('sync-m365').checked;
    const syncWithGoogle = document.getElementById('sync-google').checked;

    // Create new event object
    const newEvent = {
        id: Date.now(),
        name: eventName,
        date: eventDate,
        time: eventTime,
        duration: parseInt(duration),
        source: 'local',
        createdAt: new Date().toISOString()
    };

    try {
        // Add to scheduled events
        scheduledEvents.push(newEvent);

        // Sync with M365 if checked
        if (syncWithM365) {
            const m365Event = await createM365Event(newEvent);
            if (m365Event) {
                newEvent.m365Id = m365Event.id;
            }
        }

        // Sync with Google Calendar if checked
        if (syncWithGoogle) {
            const googleEvent = await createGoogleEvent(newEvent);
            if (googleEvent) {
                newEvent.googleId = googleEvent.id;
            }
        }

        // Show success message
        if (syncWithM365 && syncWithGoogle) {
            showNotification('Event scheduled and synced with M365 and Google Calendar!', 'success');
        } else if (syncWithM365) {
            showNotification('Event scheduled and synced with M365!', 'success');
        } else if (syncWithGoogle) {
            showNotification('Event scheduled and synced with Google Calendar!', 'success');
        } else {
            showNotification('Event scheduled successfully!', 'success');
        }

        // Clear form
        event.target.reset();

        // Update UI
        updateScheduledEventsList();
    } catch (error) {
        console.error('Error scheduling event:', error);
        showNotification('Failed to schedule event', 'error');
    }
}

async function handleCalendarSourceChange(event) {
    const source = event.target.value;
    
    switch(source) {
        case 'm365':
            await loadM365Events();
            break;
        case 'google':
            await loadGoogleEvents();
            break;
        case 'all':
            await Promise.all([loadM365Events(), loadGoogleEvents()]);
            break;
    }
    
    updateScheduledEventsList();
}

function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 
            (isDarkMode ? 'bg-green-700' : 'bg-green-500') : 
        type === 'error' ? 
            (isDarkMode ? 'bg-red-700' : 'bg-red-500') : 
            (isDarkMode ? 'bg-gray-700' : 'bg-blue-500')
    } text-white animate-fade-in z-50`;
    
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
}

function formatDuration(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
}

function getSourceBadge(source) {
    const isDarkMode = document.documentElement.classList.contains('dark');
    switch(source) {
        case 'm365':
            return `<span class="ml-2 px-2 py-1 ${isDarkMode ? 'bg-[#106EBE]' : 'bg-[#0078D4]'} text-white text-xs rounded">M365</span>`;
        case 'google':
            return `<span class="ml-2 px-2 py-1 ${isDarkMode ? 'bg-red-700' : 'bg-red-600'} text-white text-xs rounded">Google</span>`;
        default:
            return `<span class="ml-2 px-2 py-1 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} text-white text-xs rounded">Local</span>`;
    }
}

function updateScheduledEventsList() {
    const eventsList = document.querySelector('.scheduled-events');
    const calendarSource = document.getElementById('calendar-source').value;
    eventsList.innerHTML = ''; // Clear existing events
    
    let eventsToShow = [];
    
    switch (calendarSource) {
        case 'local':
            eventsToShow = scheduledEvents;
            break;
        case 'm365':
            eventsToShow = m365Events.map(event => ({
                id: event.id,
                name: event.subject,
                date: event.start.dateTime.split('T')[0],
                time: event.start.dateTime.split('T')[1].substring(0, 5),
                duration: (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000,
                source: 'm365'
            }));
            break;
        case 'google':
            eventsToShow = googleEvents.map(event => ({
                id: event.id,
                name: event.summary,
                date: event.start.dateTime.split('T')[0],
                time: event.start.dateTime.split('T')[1].substring(0, 5),
                duration: (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000,
                source: 'google'
            }));
            break;
        case 'all':
            eventsToShow = [
                ...scheduledEvents,
                ...m365Events.map(event => ({
                    id: event.id,
                    name: event.subject,
                    date: event.start.dateTime.split('T')[0],
                    time: event.start.dateTime.split('T')[1].substring(0, 5),
                    duration: (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000,
                    source: 'm365'
                })),
                ...googleEvents.map(event => ({
                    id: event.id,
                    name: event.summary,
                    date: event.start.dateTime.split('T')[0],
                    time: event.start.dateTime.split('T')[1].substring(0, 5),
                    duration: (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000,
                    source: 'google'
                }))
            ];
            break;
    }
    
    if (eventsToShow.length === 0) {
        eventsList.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-calendar-plus text-4xl mb-3"></i>
                <p>No events scheduled yet</p>
            </div>
        `;
        return;
    }

    // Sort events by date and time
    eventsToShow.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
    });
    
    eventsToShow.forEach(event => {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const eventCard = document.createElement('div');
        eventCard.className = 'bg-white dark:bg-dark-300 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-dark-400';
        
        eventCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center">
                        <h3 class="font-semibold text-lg text-gray-800 dark:text-gray-100">${event.name}</h3>
                        ${getSourceBadge(event.source)}
                    </div>
                    <div class="mt-2 space-y-1">
                        <p class="text-gray-600 dark:text-gray-400">
                            <i class="far fa-calendar mr-2"></i>${formattedDate}
                        </p>
                        <p class="text-gray-600 dark:text-gray-400">
                            <i class="far fa-clock mr-2"></i>${formatTime(event.time)}
                        </p>
                        <p class="text-gray-600 dark:text-gray-400">
                            <i class="fas fa-hourglass-half mr-2"></i>${formatDuration(event.duration)}
                        </p>
                    </div>
                </div>
                ${event.source === 'local' ? `
                    <button onclick="deleteEvent('${event.id}')" 
                            class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
                            title="Delete event">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        eventsList.appendChild(eventCard);
    });
}

async function deleteEvent(eventId) {
    const event = scheduledEvents.find(e => e.id === eventId);
    
    if (event) {
        if (event.m365Id) {
            try {
                await deleteM365Event(event.m365Id);
            } catch (error) {
                console.error('Error deleting M365 event:', error);
            }
        }
        
        if (event.googleId) {
            try {
                await deleteGoogleEvent(event.googleId);
            } catch (error) {
                console.error('Error deleting Google event:', error);
            }
        }
        
        scheduledEvents = scheduledEvents.filter(e => e.id !== eventId);
        updateScheduledEventsList();
        showNotification('Event deleted successfully!', 'success');
    }
}
