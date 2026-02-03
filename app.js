// ==================== FIREBASE CONFIGURATION ====================
// Replace with YOUR actual Firebase config
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
const auth = firebase.auth();

// ==================== AUTHENTICATION STATE MANAGEMENT ====================
let currentUser = null;
let authCheckDone = false;

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        console.log('User signed in:', user.email);
        
        // If we're on login page, redirect to dashboard
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('index.html')) {
            window.location.href = 'dashboard.html';
        } else {
            // Load dashboard content
            loadDashboard();
        }
    } else {
        // User is signed out
        currentUser = null;
        
        // If we're not on login page, redirect to login
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
    authCheckDone = true;
});

// ==================== LOGIN PAGE FUNCTIONS ====================
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const googleBtn = document.getElementById('googleBtn');
    const errorMessage = document.getElementById('errorMessage');
    const registerLink = document.getElementById('registerLink');
    const forgotPassword = document.getElementById('forgotPassword');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginWithEmail(emailInput.value, passwordInput.value);
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginWithEmail(emailInput.value, passwordInput.value);
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', loginWithGoogle);
    }

    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
        });
    }

    if (forgotPassword) {
        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
}

function loginWithEmail(email, password) {
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;

    // Show loading state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    loginBtn.disabled = true;
    errorMessage.style.display = 'none';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            console.log('Login successful:', userCredential.user.email);
            
            // Store user data in localStorage
            localStorage.setItem('userEmail', userCredential.user.email);
            localStorage.setItem('userId', userCredential.user.uid);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            // Handle errors
            console.error('Login error:', error);
            errorMessage.textContent = getErrorMessage(error.code);
            errorMessage.style.display = 'block';
            
            // Reset button
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const googleBtn = document.getElementById('googleBtn');
    const originalText = googleBtn.innerHTML;

    googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    googleBtn.disabled = true;

    auth.signInWithPopup(provider)
        .then((result) => {
            // This gives you a Google Access Token
            const credential = result.credential;
            const token = credential.accessToken;
            const user = result.user;
            
            console.log('Google login successful:', user.email);
            
            // Store user data
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userName', user.displayName);
            localStorage.setItem('userPhoto', user.photoURL);
            
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Google login error:', error);
            document.getElementById('errorMessage').textContent = 
                'Google login failed. Please try again.';
            document.getElementById('errorMessage').style.display = 'block';
            
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        });
}

function showRegisterModal() {
    const modalHTML = `
        <div class="modal-overlay" id="registerModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Create New Account</h3>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="regEmail">Email Address</label>
                            <input type="email" id="regEmail" required 
                                   placeholder="Enter your email">
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Password</label>
                            <input type="password" id="regPassword" required 
                                   placeholder="Create a password (min. 6 characters)">
                        </div>
                        <div class="form-group">
                            <label for="regConfirmPassword">Confirm Password</label>
                            <input type="password" id="regConfirmPassword" required 
                                   placeholder="Confirm your password">
                        </div>
                        <div class="form-group">
                            <label for="regName">Full Name (Optional)</label>
                            <input type="text" id="regName" 
                                   placeholder="Enter your full name">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary" 
                                    id="registerSubmitBtn">Create Account</button>
                        </div>
                    </form>
                    <div id="registerErrorMessage" class="error-message"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        registerNewUser();
    });
}

function registerNewUser() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const name = document.getElementById('regName').value;
    const errorEl = document.getElementById('registerErrorMessage');
    const submitBtn = document.getElementById('registerSubmitBtn');
    const originalText = submitBtn.innerHTML;

    // Validation
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match!';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters long';
        errorEl.style.display = 'block';
        return;
    }

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    errorEl.style.display = 'none';

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Update user profile with name if provided
            if (name) {
                return user.updateProfile({
                    displayName: name
                }).then(() => {
                    return user;
                });
            }
            return user;
        })
        .then((user) => {
            console.log('Registration successful:', user.email);
            
            // Store user data
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userId', user.uid);
            if (name) localStorage.setItem('userName', name);
            
            // Close modal and redirect
            closeModal();
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Registration error:', error);
            errorEl.textContent = getErrorMessage(error.code);
            errorEl.style.display = 'block';
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function showForgotPasswordModal() {
    const modalHTML = `
        <div class="modal-overlay" id="forgotPasswordModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Reset Password</h3>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Enter your email address and we'll send you a password reset link.</p>
                    <form id="forgotPasswordForm">
                        <div class="form-group">
                            <label for="resetEmail">Email Address</label>
                            <input type="email" id="resetEmail" required 
                                   placeholder="Enter your email">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary" 
                                    id="resetSubmitBtn">Send Reset Link</button>
                        </div>
                    </form>
                    <div id="resetErrorMessage" class="error-message"></div>
                    <div id="resetSuccessMessage" class="success-message"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        resetPassword();
    });
}

function resetPassword() {
    const email = document.getElementById('resetEmail').value;
    const errorEl = document.getElementById('resetErrorMessage');
    const successEl = document.getElementById('resetSuccessMessage');
    const submitBtn = document.getElementById('resetSubmitBtn');
    const originalText = submitBtn.innerHTML;

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    auth.sendPasswordResetEmail(email)
        .then(() => {
            successEl.textContent = 'Password reset email sent! Check your inbox.';
            successEl.style.display = 'block';
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Close modal after 3 seconds
            setTimeout(() => {
                closeModal();
            }, 3000);
        })
        .catch((error) => {
            console.error('Reset password error:', error);
            errorEl.textContent = getErrorMessage(error.code);
            errorEl.style.display = 'block';
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.remove());
}

function getErrorMessage(errorCode) {
    switch(errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// ==================== DASHBOARD FUNCTIONS ====================
function loadDashboard() {
    // Show user info
    displayUserInfo();
    
    // Setup Firebase listeners
    setupFirebaseListeners();
    
    // Setup logout button
    setupLogoutButton();
    
    // Setup nature effects
    addNatureEffects();
}

function displayUserInfo() {
    const user = auth.currentUser;
    if (!user) return;

    const userInfoEl = document.getElementById('userInfo');
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) {
        userNameEl.textContent = user.displayName || user.email.split('@')[0];
    }
    
    if (userEmailEl) {
        userEmailEl.textContent = user.email;
    }
    
    if (userAvatarEl) {
        if (user.photoURL) {
            userAvatarEl.src = user.photoURL;
            userAvatarEl.style.display = 'block';
        } else {
            // Show initials
            const initials = (user.displayName || user.email)
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            userAvatarEl.style.display = 'none';
            if (userInfoEl) {
                const initialsEl = document.createElement('div');
                initialsEl.className = 'user-initials';
                initialsEl.textContent = initials;
                initialsEl.style.background = getRandomColor();
                userInfoEl.appendChild(initialsEl);
            }
        }
    }
}

function getRandomColor() {
    const colors = [
        '#8B4513', '#228B22', '#1E90FF', '#FF8C00',
        '#654321', '#32CD32', '#87CEEB', '#FFD700'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut()
                .then(() => {
                    console.log('User signed out');
                    localStorage.clear();
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                });
        });
    }
}

// ==================== FIREBASE DATA LISTENERS ====================
function setupFirebaseListeners() {
    // Only setup if user is authenticated
    if (!currentUser) return;

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
    
    // Listen for user-specific data
    database.ref(`/users/${currentUser.uid}/settings`).on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            updateUserSettings(settings);
        }
    });
}

function updateUserSettings(settings) {
    // Update UI based on user preferences
    if (settings.theme) {
        document.body.setAttribute('data-theme', settings.theme);
    }
    if (settings.notifications !== undefined) {
        // Handle notification settings
    }
}

// ==================== NATURE EFFECTS (From Previous Code) ====================
function addNatureEffects() {
    // Create raindrops
    for (let i = 0; i < 20; i++) {
        createRaindrop();
    }
    
    // Create sun
    createSun();
    
    // Add water effect to water card
    const waterCard = document.querySelector('.sensor-card.water');
    if (waterCard) {
        waterCard.addEventListener('mouseenter', createWaterRipple);
    }
}

function createRaindrop() {
    const raindrop = document.createElement('div');
    raindrop.className = 'raindrop';
    raindrop.style.left = `${Math.random() * 100}%`;
    raindrop.style.animationDuration = `${1 + Math.random() * 2}s`;
    raindrop.style.animationDelay = `${Math.random() * 5}s`;
    raindrop.style.opacity = `${0.1 + Math.random() * 0.3}`;
    
    document.body.appendChild(raindrop);
    
    setTimeout(() => {
        if (raindrop.parentNode) {
            raindrop.parentNode.removeChild(raindrop);
        }
        setTimeout(createRaindrop, Math.random() * 3000);
    }, 3000);
}

function createSun() {
    const sunContainer = document.createElement('div');
    sunContainer.className = 'sun-container';
    const sun = document.createElement('div');
    sun.className = 'sun';
    sunContainer.appendChild(sun);
    document.body.appendChild(sunContainer);
}

function createWaterRipple() {
    const ripples = ['💧', '🌊', '💦'];
    const ripple = document.createElement('span');
    ripple.textContent = ripples[Math.floor(Math.random() * ripples.length)];
    ripple.style.position = 'absolute';
    ripple.style.fontSize = '2rem';
    ripple.style.opacity = '0.5';
    ripple.style.animation = 'waterDrop 1.5s ease-out forwards';
    ripple.style.zIndex = '1';
    ripple.style.left = `${Math.random() * 80 + 10}%`;
    ripple.style.top = `${Math.random() * 80 + 10}%`;
    
    this.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode === this) {
            this.removeChild(ripple);
        }
    }, 1500);
}

// ==================== DASHBOARD DISPLAY FUNCTIONS ====================
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

// ... [Keep all your existing dashboard functions from previous code]

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on login page or dashboard
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('index.html')) {
        setupLoginPage();
    }
    
    // Add nature animations CSS
    addNatureAnimationsCSS();
});
