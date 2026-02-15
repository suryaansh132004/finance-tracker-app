// services/auth.js
import { auth } from '../config/firebase';
import {
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.deviceId = null;
  }

  // Get or create a stable device ID (per physical phone)
  async getDeviceId() {
    if (this.deviceId) return this.deviceId;

    try {
      // Try to get saved device ID first
      let savedDeviceId = await AsyncStorage.getItem('deviceId');

      if (!savedDeviceId) {
        // Build a readable, stable device ID
        const uniqueId = await DeviceInfo.getUniqueId(); // hardware-based
        const model = await DeviceInfo.getModel();
        const brand = await DeviceInfo.getBrand();

        // Example: "samsung_galaxy_a50_ab12cd34"
        savedDeviceId = `${brand}_${model}_${uniqueId.substring(0, 8)}`
          .toLowerCase()
          .replace(/\s+/g, '_');

        await AsyncStorage.setItem('deviceId', savedDeviceId);
        console.log('🆔 Created new device ID:', savedDeviceId);
      } else {
        console.log('🆔 Loaded existing device ID:', savedDeviceId);
      }

      this.deviceId = savedDeviceId;
      return savedDeviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      const fallbackId = `device_${Date.now()}`;
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  // Initialize auth and auto-sign in anonymously
  async initialize() {
    const deviceId = await this.getDeviceId();

    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, async user => {
        if (user) {
          // User is signed in
          this.currentUser = user;
          await AsyncStorage.setItem('userId', user.uid);
          await AsyncStorage.setItem(`device_${deviceId}_userId`, user.uid);
          console.log('✅ User authenticated:', user.uid, 'for device:', deviceId);
          this.notifyListeners(user);
          resolve(user);
        } else {
          // No user signed in, sign in anonymously
          console.log('🔐 No user found, signing in anonymously for device:', deviceId);
          try {
            const result = await signInAnonymously(auth);
            this.currentUser = result.user;
            await AsyncStorage.setItem('userId', result.user.uid);
            await AsyncStorage.setItem(`device_${deviceId}_userId`, result.user.uid);
            console.log('✅ Anonymous sign-in successful:', result.user.uid);
            this.notifyListeners(result.user);
            resolve(result.user);
          } catch (error) {
            console.error('❌ Anonymous sign-in failed:', error);
            resolve(null);
          }
        }
      });
    });
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser || auth.currentUser;
  }

  // Get user ID (Firebase UID)
  getUserId() {
    const user = this.getCurrentUser();
    return user ? user.uid : null;
  }

  // Expose device ID to the rest of the app
  async getDeviceIdentifier() {
    return await this.getDeviceId();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('userId');
      // Do NOT remove deviceId; keep it stable per device
      this.currentUser = null;
      console.log('✅ User signed out');
      this.notifyListeners(null);
      return true;
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return false;
    }
  }

  // Add auth state listener
  addAuthListener(callback) {
    this.authListeners.push(callback);
    // Immediately call with current state
    if (this.currentUser) {
      callback(this.currentUser);
    }
  }

  // Remove auth state listener
  removeAuthListener(callback) {
    this.authListeners = this.authListeners.filter(cb => cb !== callback);
  }

  // Notify all listeners
  notifyListeners(user) {
    this.authListeners.forEach(callback => callback(user));
  }

  // Re-authenticate if needed
  async ensureAuthenticated() {
    if (this.isAuthenticated()) {
      return true;
    }
    try {
      await this.initialize();
      return this.isAuthenticated();
    } catch (error) {
      console.error('❌ Re-authentication failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const authServiceInstance = new AuthService();

// Export as default (used in TransactionContext)
export default authServiceInstance;

// Also export as named export for backward compatibility
export const authService = authServiceInstance;

// Export helper functions
export const getCurrentUser = () => authServiceInstance.getCurrentUser();
export const getUserId = () => authServiceInstance.getUserId();
export const getDeviceId = () => authServiceInstance.getDeviceIdentifier();
export const isAuthenticated = () => authServiceInstance.isAuthenticated();
export const signOut = () => authServiceInstance.signOut();
export const ensureAuthenticated = () => authServiceInstance.ensureAuthenticated();

// Keep old exports for backward compatibility (if needed elsewhere)
export const logOut = signOut;
export const onAuthChange = callback =>
  authServiceInstance.addAuthListener(callback);
