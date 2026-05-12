import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/lib/firebase';
import { scheduleLocalNotification } from '@/lib/notifications';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? user.uid);
      setUserId(user.uid);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'users', userId, 'todos'),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setTodos(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Todo, 'id'>),
        })),
      );
    });
    return unsubscribe;
  }, [userId]);

  const onLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const onAddTodo = async () => {
    const text = newTodoText.trim();
    if (!text || !userId) return;
    await addDoc(collection(db, 'users', userId, 'todos'), {
      text,
      done: false,
      createdAt: Date.now(),
    });

    await scheduleLocalNotification('Todo Ditambahkan!', `"${text}" berhasil disimpan.`);

    setNewTodoText('');
    setModalVisible(false);
  };

  const onToggleDone = async (todo: Todo) => {
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId, 'todos', todo.id), {
      done: !todo.done,
    });
  };

  const onDelete = (todo: Todo) => {
    if (!userId) return;
    Alert.alert('Hapus Todo', `Hapus "${todo.text}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'users', userId, 'todos', todo.id)),
      },
    ]);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewTodoText('');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Todo List</ThemedText>
          <ThemedText style={styles.emailText}>{email ?? '-'}</ThemedText>
        </View>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <ThemedText type="defaultSemiBold" style={styles.logoutText}>
            Logout
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Belum ada todo.{'\n'}Tekan + untuk menambah.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.todoItem, item.done && styles.todoItemDone]}>
            <Pressable onPress={() => onToggleDone(item)} style={styles.checkboxWrap}>
              <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
                {item.done && <ThemedText style={styles.checkmark}>✓</ThemedText>}
              </View>
            </Pressable>

            <ThemedText style={[styles.todoText, item.done && styles.todoTextDone]} numberOfLines={2}>
              {item.text}
            </ThemedText>

            <Pressable onPress={() => onDelete(item)} style={styles.deleteWrap}>
              <ThemedText style={styles.deleteText}>✕</ThemedText>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.overlayBackdrop} onPress={closeModal} />
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Tambah Todo
            </ThemedText>
            <TextInput
              ref={inputRef}
              value={newTodoText}
              onChangeText={setNewTodoText}
              placeholder="Tulis todomu di sini..."
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              onSubmitEditing={onAddTodo}
              returnKeyType="done"
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={closeModal}>
                <ThemedText type="defaultSemiBold">Batal</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.addBtn]} onPress={onAddTodo}>
                <ThemedText type="defaultSemiBold" style={styles.addBtnText}>
                  Tambah
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailText: {
    color: '#64748b',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 10,
  },
  todoItemDone: {
    opacity: 0.7,
  },
  checkboxWrap: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 16,
  },
  todoText: {
    flex: 1,
    color: '#0f172a',
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  deleteWrap: {
    padding: 6,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 28,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    marginHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelBtn: {
    backgroundColor: '#e2e8f0',
  },
  addBtn: {
    backgroundColor: '#2563eb',
  },
  addBtnText: {
    color: '#ffffff',
  },
});

