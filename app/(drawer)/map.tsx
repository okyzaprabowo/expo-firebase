import React from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapScreen() {
  if (Platform.OS === 'web') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.webCard}>
          <ThemedText type="subtitle">Map</ThemedText>
          <ThemedText style={styles.webText}>
            react-native-maps tidak didukung di web pada setup ini. Jalankan di Android/iOS.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webCard: {
    margin: 16,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  webText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
});
