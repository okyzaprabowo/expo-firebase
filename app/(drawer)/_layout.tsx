import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

export default function DrawerLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(Boolean(user));
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/login" />;

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="datetime-picker"
        options={{
          title: 'DateTime Picker',
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          title: 'Map',
        }}
      />
      <Drawer.Screen
        name="sqlite-todos"
        options={{
          title: 'SQLite Todos',
        }}
      />
    </Drawer>
  );
}
