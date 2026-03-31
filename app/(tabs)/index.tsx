import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/lib/firebase';

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? user.uid);
    });
    return unsubscribe;
  }, [router]);

  const onLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <ThemedText type="subtitle">Nama user login</ThemedText>
      <ThemedText type="defaultSemiBold">{email ?? '-'}</ThemedText>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <ThemedText type="defaultSemiBold" style={styles.logoutButtonText}>
          Logout
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
  },
});
