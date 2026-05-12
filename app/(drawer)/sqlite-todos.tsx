import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
    addTodo,
    deleteTodo,
    getSqliteDbName,
    initSqliteTodos,
    listTodos,
    toggleTodoDone,
    updateTodoText,
    type SqliteTodo,
} from '@/lib/sqlite-todos';

export default function SqliteTodosScreen() {
  const [isReady, setIsReady] = useState(false);
  const [items, setItems] = useState<SqliteTodo[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [editText, setEditText] = useState('');
  const [editing, setEditing] = useState<SqliteTodo | null>(null);
  const inputRef = useRef<TextInput>(null);

  const dbName = useMemo(() => getSqliteDbName(), []);

  const refresh = async () => {
    const rows = await listTodos();
    setItems(rows);
  };

  useEffect(() => {
    initSqliteTodos()
      .then(async () => {
        await refresh();
        setIsReady(true);
      })
      .catch((e) => {
        Alert.alert('SQLite Error', e instanceof Error ? e.message : String(e));
      });
  }, []);

  const closeAdd = () => {
    setIsAddOpen(false);
    setNewText('');
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditText('');
    setEditing(null);
  };

  const onCreate = async () => {
    const text = newText.trim();
    if (!text) return;
    await addTodo(text);
    await refresh();
    closeAdd();
  };

  const onToggle = async (todo: SqliteTodo) => {
    const nextDone: 0 | 1 = todo.done === 1 ? 0 : 1;
    await toggleTodoDone(todo.id, nextDone);
    await refresh();
  };

  const onDelete = (todo: SqliteTodo) => {
    Alert.alert('Hapus Todo', `Hapus "${todo.text}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteTodo(todo.id);
          await refresh();
        },
      },
    ]);
  };

  const onOpenEdit = (todo: SqliteTodo) => {
    setEditing(todo);
    setEditText(todo.text);
    setIsEditOpen(true);
  };

  const onSaveEdit = async () => {
    const text = editText.trim();
    if (!editing || !text) return;
    await updateTodoText(editing.id, text);
    await refresh();
    closeEdit();
  };

  if (!isReady) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">SQLite Todos</ThemedText>
          <ThemedText style={styles.metaText}>{dbName}</ThemedText>
        </View>
        <ThemedText style={styles.loadingText}>Menyiapkan database...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">SQLite Todos</ThemedText>
          <ThemedText style={styles.metaText}>{dbName}</ThemedText>
        </View>
        <Pressable style={styles.addButton} onPress={() => setIsAddOpen(true)}>
          <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
            + Add
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Belum ada todo di SQLite.{'\n'}Tekan Add untuk menambah.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.todoItem, item.done === 1 && styles.todoItemDone]}>
            <Pressable onPress={() => onToggle(item)} style={styles.checkboxWrap}>
              <View style={[styles.checkbox, item.done === 1 && styles.checkboxChecked]}>
                {item.done === 1 && <ThemedText style={styles.checkmark}>✓</ThemedText>}
              </View>
            </Pressable>

            <Pressable style={styles.todoTextWrap} onPress={() => onOpenEdit(item)}>
              <ThemedText
                style={[styles.todoText, item.done === 1 && styles.todoTextDone]}
                numberOfLines={2}>
                {item.text}
              </ThemedText>
              <ThemedText style={styles.todoMeta}>{new Date(item.createdAt).toLocaleString()}</ThemedText>
            </Pressable>

            <Pressable onPress={() => onDelete(item)} style={styles.deleteWrap}>
              <ThemedText style={styles.deleteText}>✕</ThemedText>
            </Pressable>
          </View>
        )}
      />

      <Modal
        visible={isAddOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAdd}
        onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.overlayBackdrop} onPress={closeAdd} />
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Tambah Todo (SQLite)
            </ThemedText>
            <TextInput
              ref={inputRef}
              value={newText}
              onChangeText={setNewText}
              placeholder="Tulis todo..."
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              onSubmitEditing={onCreate}
              returnKeyType="done"
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={closeAdd}>
                <ThemedText type="defaultSemiBold">Batal</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.addBtn]} onPress={onCreate}>
                <ThemedText type="defaultSemiBold" style={styles.addBtnText}>
                  Simpan
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isEditOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.overlayBackdrop} onPress={closeEdit} />
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Edit Todo (SQLite)
            </ThemedText>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              placeholder="Ubah todo..."
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              onSubmitEditing={onSaveEdit}
              returnKeyType="done"
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={closeEdit}>
                <ThemedText type="defaultSemiBold">Batal</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.addBtn]} onPress={onSaveEdit}>
                <ThemedText type="defaultSemiBold" style={styles.addBtnText}>
                  Update
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
    gap: 10,
  },
  metaText: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  loadingText: {
    paddingHorizontal: 16,
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
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
  todoTextWrap: {
    flex: 1,
    gap: 2,
  },
  todoText: {
    color: '#0f172a',
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  todoMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },
  deleteWrap: {
    padding: 6,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 16,
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

