import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Contexts
import {SettingsProvider} from './src/data/SettingsContext';
import {ThemeProvider, useTheme} from './src/data/ThemeContext';
import {TransactionProvider} from './src/data/TransactionContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DebitScreen from './src/screens/DebitScreen';
import CreditScreen from './src/screens/CreditScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Initialize services
import authService from './src/services/auth';
import {currencyService} from './src/data/currencyService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const {theme} = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Debit') iconName = focused ? 'arrow-down-circle' : 'arrow-down-circle-outline';
          else if (route.name === 'Credit') iconName = focused ? 'arrow-up-circle' : 'arrow-up-circle-outline';
          else iconName = focused ? 'list' : 'list-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.activeButton,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Debit" component={DebitScreen} />
      <Tab.Screen name="Credit" component={CreditScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function App() {
  useEffect(() => {
    authService.initialize();
    currencyService.initialize();
  }, []);

  return (
    <SettingsProvider>
      <ThemeProvider>
        <TransactionProvider>
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        </TransactionProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;
