import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DateTimePickerExample() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const formatted = useMemo(() => {
    try {
      return selectedDate.toLocaleString();
    } catch {
      return String(selectedDate);
    }
  }, [selectedDate]);

  const openPicker = (nextMode: 'date' | 'time') => {
    setMode(nextMode);

    if (Platform.OS === 'android') {
      setIsOpen(false);
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return;
    }

    setIsOpen(true);
  };

  const onChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'web') return;

    if (Platform.OS !== 'ios' && event.type === 'dismissed') {
      setIsOpen(false);
      setMode('date');
      return;
    }

    if (!date) return;

    if (Platform.OS === 'android') {
      if (mode === 'date') {
        const next = new Date(selectedDate);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setSelectedDate(next);
        setIsOpen(false);
        requestAnimationFrame(() => {
          setMode('time');
          setIsOpen(true);
        });
        return;
      }

      const next = new Date(selectedDate);
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setSelectedDate(next);
      setIsOpen(false);
      setMode('date');
      return;
    }

    setSelectedDate(date);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="subtitle">DateTime Picker</ThemedText>
        <ThemedText style={styles.text}>{formatted}</ThemedText>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => {
              openPicker('date');
            }}>
            <ThemedText type="defaultSemiBold" style={styles.btnText}>
              Pilih Tanggal
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => {
              openPicker('time');
            }}>
            <ThemedText type="defaultSemiBold" style={styles.btnText}>
              Pilih Jam
            </ThemedText>
          </Pressable>
          {Platform.OS !== 'ios' && (
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => setIsOpen(false)}>
              <ThemedText type="defaultSemiBold" style={styles.btnSecondaryText}>
                Tutup
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.pickerCard}>
          <ThemedText style={styles.text}>DateTimePicker tidak didukung di web.</ThemedText>
        </View>
      ) : Platform.OS === 'ios' ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display="spinner"
            onChange={onChange}
          />
        </View>
      ) : (
        isOpen && (
          <DateTimePicker value={selectedDate} mode={mode} display="default" onChange={onChange} />
        )
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  btnSecondaryText: {
    color: '#0f172a',
    fontSize: 12,
  },
  pickerCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
});
