import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastKind = 'success' | 'error' | 'info';
type ToastMessage = { id: number; message: string; kind: ToastKind };
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    setToast({ id: Date.now(), message, kind });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const value = useMemo(() => ({ showToast }), [showToast]);
  const icon = toast?.kind === 'success' ? 'checkmark-circle' : toast?.kind === 'error' ? 'alert-circle' : 'information-circle';
  const backgroundColor = toast?.kind === 'success' ? '#176B3D' : toast?.kind === 'error' ? '#B83232' : '#26352C';

  return <ToastContext.Provider value={value}>
    {children}
    {toast ? <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable accessibilityRole="alert" onPress={() => setToast(null)} style={[styles.toast, { backgroundColor }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
        <Text style={styles.message}>{toast.message}</Text>
        <Ionicons name="close" size={18} color="#FFFFFF" />
      </Pressable>
    </View> : null}
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider.');
  return context;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 58, left: 16, right: 16, zIndex: 1000, alignItems: 'center' },
  toast: { width: '100%', maxWidth: 560, minHeight: 54, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  message: { color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '700' },
});
