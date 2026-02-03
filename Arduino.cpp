#include <ESP8266WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <FirebaseESP8266.h>

// ==================== FIREBASE CONFIGURATION ====================
#define FIREBASE_HOST "irrigation-system-a2794.firebaseio.com"
#define FIREBASE_AUTH "LVjLP9u9gsL41EkxTp3m1ZvFKwQFy4FhKPDLMCqc"
#define API_KEY "AIzaSyAqcXo1hvCXhvhltC-BR3IO6Ge86ACHxFo"

// ==================== WIFI CONFIGURATION ====================
const char* ssid = "iPhone";
const char* password = "Lesotho04";

// ==================== PIN CONFIGURATION ====================
#define MOISTURE_SENSOR A0
#define DHT_SENSOR D3
#define DHT_TYPE DHT11
#define TRIG_PIN D5
#define ECHO_PIN D4
#define PUMP_RELAY D6
#define BUZZER_RED_LED D7
#define BLUE_LED D8
#define MANUAL_BUTTON D2  // NEW: Manual toggle button
#define PUMP_STATUS_LED D1 // NEW: Pump status LED

// I2C LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ==================== FIREBASE OBJECTS ====================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ==================== SYSTEM VARIABLES ====================
float soilMoisture = 0;
float waterLevel = 0;
float temperature = 0;
float humidity = 0;
bool pumpStatus = false;
bool systemAuto = true;
bool alarmState = false;
bool lastButtonState = HIGH;
bool buttonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;
unsigned long lastFirebaseUpdate = 0;
const unsigned long firebaseUpdateInterval = 2000; // Update every 2 seconds

DHT dht(DHT_SENSOR, DHT_TYPE);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== Chaka System Starting ===");
  
  // Initialize pins
  pinMode(PUMP_RELAY, OUTPUT);
  pinMode(BUZZER_RED_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(PUMP_STATUS_LED, OUTPUT); // NEW
  pinMode(MANUAL_BUTTON, INPUT_PULLUP); // NEW
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  digitalWrite(PUMP_RELAY, LOW);
  digitalWrite(BUZZER_RED_LED, LOW);
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(PUMP_STATUS_LED, LOW); // NEW

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Chaka's System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize DHT
  dht.begin();
  
  delay(2000);
  
  // Connect to WiFi
  testWiFi();
  
  // Initialize Firebase
  initFirebase();
  
  // LCD brightness adjustment
  lcd.clear();
  lcd.print("System Ready");
  Serial.println("System Ready!");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Read all sensors
  readSensors();
  
  // Check manual button
  checkManualButton();
  
  // Pump control logic
  if (systemAuto) {
    // Auto mode
    if (soilMoisture < 40 && waterLevel > 10) {
      if (!pumpStatus) {
        setPump(true);
      }
    } else {
      if (pumpStatus) {
        setPump(false);
      }
    }
  }
  // Manual mode - pump is controlled by button/web
  
  // Check alarms and update LEDs
  checkAlarms();
  
  // Update pump status LED
  digitalWrite(PUMP_STATUS_LED, pumpStatus ? HIGH : LOW);
  
  // Update display
  updateDisplay();
  
  // Update Firebase
  if (millis() - lastFirebaseUpdate > firebaseUpdateInterval) {
    updateFirebase();
    lastFirebaseUpdate = millis();
  }
  
  // Check Firebase for commands
  checkFirebaseCommands();
  
  // Check serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    handleCommand(cmd);
  }
  
  delay(100);
}

// ==================== FIREBASE FUNCTIONS ====================
void initFirebase() {
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Set database read/write timeout
  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(2048);
  
  Serial.println("Firebase initialized");
  lcd.clear();
  lcd.print("Firebase: Ready");
  delay(1000);
  
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  config.cert.data = rootCACert;  // Optional: For SSL verification
}

void updateFirebase() {
  // Update sensor readings
  Firebase.setFloat(fbdo, "/sensors/soilMoisture", soilMoisture);
  Firebase.setFloat(fbdo, "/sensors/waterLevel", waterLevel);
  Firebase.setFloat(fbdo, "/sensors/temperature", temperature);
  Firebase.setFloat(fbdo, "/sensors/humidity", humidity);
  
  // Update system status
  Firebase.setBool(fbdo, "/system/pumpStatus", pumpStatus);
  Firebase.setBool(fbdo, "/system/autoMode", systemAuto);
  Firebase.setBool(fbdo, "/system/alarm", alarmState);
  
  // Update timestamp
  Firebase.setString(fbdo, "/system/lastUpdate", String(millis()));
}

void checkFirebaseCommands() {
  // Check for pump command
  if (Firebase.getBool(fbdo, "/commands/pump")) {
    if (fbdo.dataType() == "boolean") {
      bool webPumpCommand = fbdo.boolData();
      if (webPumpCommand != pumpStatus) {
        setPump(webPumpCommand);
      }
    }
  }
  
  // Check for auto mode command
  if (Firebase.getBool(fbdo, "/commands/autoMode")) {
    if (fbdo.dataType() == "boolean") {
      systemAuto = fbdo.boolData();
      Firebase.setBool(fbdo, "/system/autoMode", systemAuto);
    }
  }
  
  // Clear commands after processing
  Firebase.setString(fbdo, "/commands/pump", "");
  Firebase.setString(fbdo, "/commands/autoMode", "");
}

// ==================== MANUAL BUTTON HANDLING ====================
void checkManualButton() {
  bool reading = digitalRead(MANUAL_BUTTON);
  
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }
  
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;
      
      if (buttonState == LOW) { // Button pressed
        togglePump();
      }
    }
  }
  
  lastButtonState = reading;
}

void togglePump() {
  setPump(!pumpStatus);
  systemAuto = false; // Switch to manual mode when button is pressed
  Firebase.setBool(fbdo, "/system/autoMode", systemAuto);
  Serial.println("Manual mode activated via button");
}

// ==================== BASIC FUNCTIONS (Updated) ====================
void testWiFi() {
  lcd.clear();
  lcd.print("WiFi: Connecting");
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    digitalWrite(BLUE_LED, !digitalRead(BLUE_LED));
    
    lcd.setCursor(0, 1);
    lcd.print("Attempt " + String(attempts));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.print("WiFi: Connected");
    digitalWrite(BUZZER_RED_LED, HIGH);
    delay(200);
    digitalWrite(BUZZER_RED_LED, LOW);
    digitalWrite(BLUE_LED, HIGH);
  } else {
    Serial.println("\nWiFi Failed!");
    lcd.clear();
    lcd.print("WiFi: Failed");
    lcd.setCursor(0, 1);
    lcd.print("Status: " + String(WiFi.status()));
    digitalWrite(BLUE_LED, LOW);
  }
  delay(2000);
}

void readSensors() {
  // Read moisture
  int moistRaw = analogRead(MOISTURE_SENSOR);
  soilMoisture = map(moistRaw, 200, 600, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);
  
  // Read water level
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration > 0) {
    float distance = duration * 0.034 / 2;
    waterLevel = ((12.0 - distance) / 12.0) * 100;
    waterLevel = constrain(waterLevel, 0, 100);
  } else {
    waterLevel = 50;
  }
  
  // Read DHT
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    temperature = 25.0;
    humidity = 50.0;
  }
}

void setPump(bool state) {
  pumpStatus = state;
  digitalWrite(PUMP_RELAY, state ? HIGH : LOW);
  digitalWrite(PUMP_STATUS_LED, state ? HIGH : LOW); // Update status LED
  Firebase.setBool(fbdo, "/system/pumpStatus", state);
  Serial.println(state ? "PUMP: ON" : "PUMP: OFF");
}

void checkAlarms() {
  bool waterAlarm = (waterLevel < 10);
  bool moistAlarm = (soilMoisture < 20);
  
  alarmState = waterAlarm || moistAlarm;
  
  if (alarmState) {
    digitalWrite(BUZZER_RED_LED, HIGH);
    digitalWrite(BLUE_LED, LOW);
    
    if (waterAlarm) {
      Firebase.setString(fbdo, "/alarms/active", "LOW_WATER");
    } else if (moistAlarm) {
      Firebase.setString(fbdo, "/alarms/active", "LOW_MOISTURE");
    }
  } else {
    digitalWrite(BUZZER_RED_LED, LOW);
    digitalWrite(BLUE_LED, HIGH);
    Firebase.setString(fbdo, "/alarms/active", "NONE");
  }
}

void updateDisplay() {
  static unsigned long lastDisplayChange = 0;
  static int displayMode = 0;
  
  if (millis() - lastDisplayChange > 4000) {
    displayMode = (displayMode + 1) % 5;
    lastDisplayChange = millis();
  }
  
  lcd.clear();
  
  switch(displayMode) {
    case 0:
      lcd.setCursor(0, 0);
      lcd.print("Moisture: " + String(soilMoisture, 0) + "%");
      lcd.setCursor(0, 1);
      lcd.print("Pump: " + String(pumpStatus ? "ON " : "OFF"));
      break;
      
    case 1:
      lcd.setCursor(0, 0);
      lcd.print("Water: " + String(waterLevel, 0) + "%");
      lcd.setCursor(0, 1);
      if (waterLevel < 20) lcd.print("LOW!");
      else if (waterLevel < 50) lcd.print("MEDIUM");
      else lcd.print("GOOD");
      break;
      
    case 2:
      lcd.setCursor(0, 0);
      lcd.print("Temp: " + String(temperature, 1) + "C");
      lcd.setCursor(0, 1);
      lcd.print("Humidity: " + String(humidity, 0) + "%");
      break;
      
    case 3:
      lcd.setCursor(0, 0);
      lcd.print("Mode: " + String(systemAuto ? "AUTO" : "MANUAL"));
      lcd.setCursor(0, 1);
      lcd.print("Firebase: Active");
      break;
      
    case 4:
      lcd.setCursor(0, 0);
      lcd.print("System Status");
      lcd.setCursor(0, 1);
      if (alarmState) lcd.print("ALERT - CHECK");
      else lcd.print("ALL SYSTEMS OK");
      break;
  }
}

void handleCommand(String cmd) {
  cmd.toLowerCase();
  Serial.print("Command: ");
  Serial.println(cmd);
  
  if (cmd == "pump on") {
    setPump(true);
  } else if (cmd == "pump off") {
    setPump(false);
  } else if (cmd == "auto on") {
    systemAuto = true;
    Serial.println("Auto mode ON");
  } else if (cmd == "auto off") {
    systemAuto = false;
    Serial.println("Manual mode ON");
  } else if (cmd == "status") {
    readSensors();
  } else if (cmd == "wifi") {
    testWiFi();
  } else if (cmd == "firebase") {
    updateFirebase();
  } else if (cmd == "button test") {
    Serial.println("Testing manual button...");
    for (int i = 0; i < 10; i++) {
      Serial.print("Button state: ");
      Serial.println(digitalRead(MANUAL_BUTTON));
      delay(500);
    }
  } else {
    Serial.println("Unknown command. Try: pump on, pump off, auto on, auto off, status, wifi, firebase, button test");
  }
}
