// Firebase Configuration
const firebaseConfig = {

  apiKey: "AIzaSyAqcXo1hvCXhvhltC-BR3IO6Ge86ACHxFo",

  authDomain: "irrigation-system-a2794.firebaseapp.com",

  databaseURL: "https://irrigation-system-a2794-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "irrigation-system-a2794",

  storageBucket: "irrigation-system-a2794.firebasestorage.app",

  messagingSenderId: "1060202550443",

  appId: "1:1060202550443:web:1251f6ad96feadb1fa13ee"

};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const soilMoistureEl = document.getElementById('soilMoisture');
const waterLevelEl = document.getElementById('waterLevel');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const pumpLed = document.getElementById('pumpLed');
const pumpStatusText = document.getElementById('pumpStatusText');
const togglePumpBtn = document.getElementById('togglePumpBtn');
const alarmStatus = document.getElementById('alarmStatus');
const alarmDetails = document.getElementById('alarmDetails');
const lastUpdateEl = document.getElementById('lastUpdate');
const connectionInfoEl = document.getElementById('connectionInfo');
const deviceStatusEl = document.getElementById('deviceStatus');
const moistureBar = document.getElementById('moistureBar');
const waterBar = document.getElementById('waterBar');
const logEntries = document.getElementById('logEntries');
const clearLogBtn = document.getElementById('clearLogBtn');
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const autoModeRadio = document.getElementById('autoMode');
const manualModeRadio = document.getElementById('manualMode');
const applyModeBtn = document.getElementById('applyModeBtn');
const testAlarmBtn = document.getElementById('testAlarmBtn');

// State variables
let isConnected = false;
let lastUpdateTime = null;
let pumpState = false;
let autoMode = true;

// Initialize
init();

// ==================== NATURE THEME ENHANCEMENTS ====================

// Add falling leaves animation
function addNatureEffects() {
    const container = document.querySelector('.container');
    
    // Create falling leaves
    for (let i = 0; i < 15; i++) {
        createFallingLeaf();
    }
    
    // Add water ripple effect on water card
    const waterCard = document.querySelector('.sensor-card.water');
    if (waterCard) {
        waterCard.addEventListener('mouseenter', () => {
            createRippleEffect(waterCard);
        });
    }
    
    // Add soil particles animation on moisture card
    const moistureCard = document.querySelector('.sensor-card.moisture');
    if (moistureCard) {
        moistureCard.addEventListener('mouseenter', () => {
            createSoilParticles(moistureCard);
        });
    }
}

function createFallingLeaf() {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.animationDelay = `${Math.random() * 20}s`;
    leaf.style.opacity = `${0.05 + Math.random() * 0.1}`;
    leaf.style.transform = `scale(${0.5 + Math.random() * 0.5})`;
    leaf.style.background = `hsl(${100 + Math.random() * 40}, 60%, 40%)`;
    
    document.body.appendChild(leaf);
    
    // Remove leaf after animation completes
    setTimeout(() => {
        if (leaf.parentNode) {
            leaf.parentNode.removeChild(leaf);
        }
        // Create new leaf
        setTimeout(createFallingLeaf, Math.random() * 5000);
    }, 20000);
}

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'radial-gradient(circle, rgba(33,150,243,0.2) 0%, transparent 70%)';
    ripple.style.pointerEvents = 'none';
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.left = `${Math.random() * 80 + 10}%`;
    ripple.style.top = `${Math.random() * 80 + 10}%`;
    ripple.style.animation = 'ripple 1.5s ease-out forwards';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode === element) {
            element.removeChild(ripple);
        }
    }, 1500);
}

function createSoilParticles(element) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = '#8B4513';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.left = `${Math.random() * 90 + 5}%`;
        particle.style.top = `${Math.random() * 90 + 5}%`;
        particle.style.animation = `soilParticle ${0.5 + Math.random()}s ease-out forwards`;
        
        element.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode === element) {
                element.removeChild(particle);
            }
        }, 1000);
    }
}

// Add CSS for new animations
function addNatureAnimationsCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            0% { transform: scale(0.1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes soilParticle {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-20px) scale(0); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize nature effects when page loads
document.addEventListener('DOMContentLoaded', () => {
    addNatureAnimationsCSS();
    addNatureEffects();
    
    // Add seasonal greeting based on current month
    const month = new Date().getMonth();
    const seasonGreetings = [
        'Spring Growth', 'Summer Harvest', 'Autumn Preparation', 'Winter Planning'
    ];
    const season = seasonGreetings[Math.floor(month / 3)];
    
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.innerHTML += ` <span style="color: var(--leaf-green); font-weight: 600;">| ${season}</span>`;
    }
});

// Add these helper functions to your existing app.js file
// Make sure to call init() and other existing functions

function init() {
    setupEventListeners();
    setupFirebaseListeners();
    updateConnectionStatus();
}

function setupEventListeners() {
    // Pump toggle button
    togglePumpBtn.addEventListener('click', togglePump);
    
    // Mode apply button
    applyModeBtn.addEventListener('click', applyMode);
    
    // Test alarm button
    testAlarmBtn.addEventListener('click', testAlarm);
    
    // Clear log button
    clearLogBtn.addEventListener('click', clearLog);
    
    // Update mode radios based on Firebase
    autoModeRadio.addEventListener('change', () => {
        if (autoModeRadio.checked) updateModeInFirebase(true);
    });
    
    manualModeRadio.addEventListener('change', () => {
        if (manualModeRadio.checked) updateModeInFirebase(false);
    });
}

function setupFirebaseListeners() {
    // Listen for sensor data changes
    database.ref('/sensors').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateSensorDisplay(data);
            updateBars(data);
        }
    });
    
    // Listen for system status changes
    database.ref('/system').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateSystemDisplay(data);
        }
    });
    
    // Listen for alarm changes
    database.ref('/alarms').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateAlarmDisplay(data);
        }
    });
    
    // Monitor connection state
    database.ref('.info/connected').on('value', (snapshot) => {
        isConnected = snapshot.val() === true;
        updateConnectionStatus();
    });
}

function updateSensorDisplay(data) {
    if (data.soilMoisture !== undefined) {
        soilMoistureEl.textContent = `${data.soilMoisture.toFixed(1)} %`;
        document.getElementById('moistureStatus').textContent = 
            getMoistureStatus(data.soilMoisture);
    }
    
    if (data.waterLevel !== undefined) {
        waterLevelEl.textContent = `${data.waterLevel.toFixed(1)} %`;
        document.getElementById('waterStatus').textContent = 
            getWaterStatus(data.waterLevel);
    }
    
    if (data.temperature !== undefined) {
        temperatureEl.textContent = `${data.temperature.toFixed(1)} °C`;
        document.getElementById('tempStatus').textContent = 
            getTemperatureStatus(data.temperature);
    }
    
    if (data.humidity !== undefined) {
        humidityEl.textContent = `${data.humidity.toFixed(1)} %`;
        document.getElementById('humidityStatus').textContent = 
            getHumidityStatus(data.humidity);
    }
    
    lastUpdateTime = new Date();
    lastUpdateEl.textContent = lastUpdateTime.toLocaleTimeString();
    deviceStatusEl.textContent = 'Online';
    deviceStatusEl.style.color = '#2ecc71';
}

function updateBars(data) {
    if (data.soilMoisture !== undefined) {
        moistureBar.style.width = `${data.soilMoisture}%`;
    }
    
    if (data.waterLevel !== undefined) {
        waterBar.style.width = `${data.waterLevel}%`;
    }
}

function updateSystemDisplay(data) {
    // Update pump status
    if (data.pumpStatus !== undefined) {
        pumpState = data.pumpStatus;
        pumpLed.className = pumpState ? 'led on' : 'led';
        pumpStatusText.textContent = `PUMP: ${pumpState ? 'ON' : 'OFF'}`;
        togglePumpBtn.innerHTML = pumpState ? 
            '<i class="fas fa-power-off"></i> TURN PUMP OFF' : 
            '<i class="fas fa-power-off"></i> TURN PUMP ON';
    }
    
    // Update auto mode
    if (data.autoMode !== undefined) {
        autoMode = data.autoMode;
        autoModeRadio.checked = autoMode;
        manualModeRadio.checked = !autoMode;
        applyModeBtn.innerHTML = autoMode ? 
            '<i class="fas fa-robot"></i> AUTOMATIC MODE ACTIVE' : 
            '<i class="fas fa-hand-paper"></i> MANUAL MODE ACTIVE';
        applyModeBtn.style.background = autoMode ? 
            'linear-gradient(135deg, #667eea, #764ba2)' : 
            'linear-gradient(135deg, #95a5a6, #7f8c8d)';
    }
}

function updateAlarmDisplay(data) {
    if (data.active === 'NONE') {
        alarmStatus.innerHTML = `
            <div class="alarm-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="alarm-info">
                <h4>System Normal</h4>
                <p>All parameters within safe limits</p>
            </div>
        `;
        alarmDetails.innerHTML = '';
        alarmStatus.style.background = '#e8f6ef';
    } else if (data.active === 'LOW_WATER') {
        alarmStatus.innerHTML = `
            <div class="alarm-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alarm-info">
                <h4>ALARM: Low Water Level</h4>
                <p>Water tank is running low!</p>
            </div>
        `;
        alarmDetails.innerHTML = '⚠️ Water level is below threshold. Refill the water tank.';
        alarmStatus.style.background = '#ffebee';
        addLogEntry('ALARM: Low water level detected');
    } else if (data.active === 'LOW_MOISTURE') {
        alarmStatus.innerHTML = `
            <div class="alarm-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alarm-info">
                <h4>ALARM: Low Soil Moisture</h4>
                <p>Soil is too dry!</p>
            </div>
        `;
        alarmDetails.innerHTML = '⚠️ Soil moisture is critically low. Check irrigation system.';
        alarmStatus.style.background = '#ffebee';
        addLogEntry('ALARM: Low soil moisture detected');
    }
}

function updateConnectionStatus() {
    if (isConnected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected to Firebase';
        connectionInfoEl.textContent = 'Firebase: Connected';
        connectionInfoEl.style.color = '#2ecc71';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        connectionInfoEl.textContent = 'Firebase: Disconnected';
        connectionInfoEl.style.color = '#e74c3c';
        deviceStatusEl.textContent = 'Offline';
        deviceStatusEl.style.color = '#e74c3c';
    }
}

function togglePump() {
    const newState = !pumpState;
    database.ref('/commands/pump').set(newState)
        .then(() => {
            addLogEntry(`Pump ${newState ? 'turned ON' : 'turned OFF'} manually`);
        })
        .catch((error) => {
            console.error('Error toggling pump:', error);
            addLogEntry('ERROR: Failed to control pump');
        });
}

function updateModeInFirebase(isAuto) {
    database.ref('/commands/autoMode').set(isAuto)
        .then(() => {
            addLogEntry(`Mode changed to ${isAuto ? 'AUTOMATIC' : 'MANUAL'}`);
        })
        .catch((error) => {
            console.error('Error updating mode:', error);
        });
}

function applyMode() {
    const isAuto = autoModeRadio.checked;
    updateModeInFirebase(isAuto);
}

function testAlarm() {
    addLogEntry('Alarm test triggered');
    alarmStatus.innerHTML = `
        <div class="alarm-icon">
            <i class="fas fa-bell"></i>
        </div>
        <div class="alarm-info">
            <h4>TEST ALARM</h4>
            <p>This is a test of the alarm system</p>
        </div>
    `;
    alarmDetails.innerHTML = '⚠️ Test alarm active. System is functioning normally.';
    alarmStatus.style.background = '#fff3cd';
    
    // Reset after 3 seconds
    setTimeout(() => {
        database.ref('/alarms/active').once('value').then((snapshot) => {
            if (snapshot.exists()) {
                updateAlarmDisplay({active: snapshot.val()});
            }
        });
    }, 3000);
}

function addLogEntry(message) {
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-message">${message}</span>
    `;
    logEntries.insertBefore(logEntry, logEntries.firstChild);
    
    // Keep only last 50 entries
    while (logEntries.children.length > 50) {
        logEntries.removeChild(logEntries.lastChild);
    }
}

function clearLog() {
    logEntries.innerHTML = `
        <div class="log-entry">
            <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
            <span class="log-message">Log cleared</span>
        </div>
    `;
}

// Helper functions for status messages
function getMoistureStatus(value) {
    if (value < 20) return 'CRITICALLY LOW';
    if (value < 40) return 'LOW';
    if (value < 60) return 'OPTIMAL';
    if (value < 80) return 'HIGH';
    return 'SATURATED';
}

function getWaterStatus(value) {
    if (value < 20) return 'CRITICALLY LOW';
    if (value < 50) return 'LOW';
    if (value < 80) return 'GOOD';
    return 'FULL';
}

function getTemperatureStatus(value) {
    if (value < 10) return 'TOO COLD';
    if (value < 20) return 'COOL';
    if (value < 30) return 'OPTIMAL';
    if (value < 35) return 'WARM';
    return 'HOT';
}

function getHumidityStatus(value) {
    if (value < 30) return 'DRY';
    if (value < 60) return 'COMFORTABLE';
    return 'HUMID';
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page is visible again, refresh data
        database.ref('/sensors').once('value').then(updateSensorDisplay);
        database.ref('/system').once('value').then(updateSystemDisplay);
    }
});

// Add initial log entry
addLogEntry('Web interface initialized');
