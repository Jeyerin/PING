// =============================================================================
// 📁 파일 용도: 편지함 화면 — 받은 편지 목록 + 편지 쓰기 (프리미엄 전용)
//
// 프리미엄 게이트(Gate) 패턴:
//   useFocusEffect에서 isPremium이 false이면 PremiumModal을 바로 띄워요.
//   편지 목록 자체를 렌더링하기 전에 막아요.
//
// isOpenable 함수:
//   편지의 openDate(열람 날짜)가 현재 시각보다 이전이면 열 수 있어요.
//   new Date(letter.openDate) <= new Date() → 현재 시각이 openDate 이후이면 true
//
// 잠긴 편지 UI:
//   - 🔒 자물쇠 아이콘으로 표시
//   - "D-30" 처럼 열리기까지 남은 일수를 배지로 표시해요.
//   - Math.ceil: 1.1일 → 2일로 올림 (사용자 친화적 표현)
//
// 편지 쓰기(WriteLetterScreen):
//   별도 파일이지만 Modal 안에서 렌더링해요.
//   onClose 콜백으로 모달을 닫고, loadLetters()로 목록을 새로고침해요.
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Letter, RootStackParamList } from '../types';
import { lettersApi } from '../api/letters';
import { useSubscriptionStore } from '../store/subscriptionStore';
import PremiumModal from '../components/common/PremiumModal';
import WriteLetterScreen from './WriteLetterScreen';
import { formatDate } from '../utils/date';

export default function LettersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isPremium } = useSubscriptionStore();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [writeVisible, setWriteVisible] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isPremium) {
        setPremiumVisible(true);
        return;
      }
      loadLetters();
    }, [isPremium]),
  );

  const loadLetters = async () => {
    setLoading(true);
    try {
      const res = await lettersApi.getReceived();
      setLetters(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const isOpenable = (letter: Letter) => {
    return new Date(letter.openDate) <= new Date();
  };

  const handleLetterPress = async (letter: Letter) => {
    if (!isOpenable(letter)) return;
    setSelectedLetter(letter);
  };

  const renderLetter = ({ item }: { item: Letter }) => {
    const openable = isOpenable(item);
    return (
      <TouchableOpacity
        style={[styles.letterCard, !openable && styles.letterCardLocked]}
        onPress={() => handleLetterPress(item)}
        activeOpacity={openable ? 0.7 : 1}
      >
        <View style={styles.letterIcon}>
          <Text style={styles.letterIconEmoji}>{openable ? '💌' : '🔒'}</Text>
        </View>
        <View style={styles.letterContent}>
          <Text style={styles.letterPreview} numberOfLines={1}>
            {openable ? item.content.slice(0, 30) + '...' : '봉인된 편지예요'}
          </Text>
          <Text style={styles.letterDate}>
            {openable
              ? `받은 날: ${formatDate(item.openDate)}`
              : `열리는 날: ${formatDate(item.openDate)}`}
          </Text>
        </View>
        {!openable && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockBadgeText}>D-{Math.ceil((new Date(item.openDate).getTime() - Date.now()) / 86400000)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!isPremium) {
    return (
      <>
        <SafeAreaView style={styles.container}>
          <View style={styles.premiumGate}>
            <Text style={styles.premiumGateEmoji}>💌</Text>
            <Text style={styles.premiumGateTitle}>편지함은 프리미엄 기능이에요</Text>
            <Text style={styles.premiumGateDesc}>미래의 나에게, 연인에게 편지를 써보세요</Text>
          </View>
        </SafeAreaView>
        <PremiumModal
          visible={premiumVisible}
          onClose={() => setPremiumVisible(false)}
          featureName="편지함"
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>편지함 💌</Text>
        <TouchableOpacity style={styles.writeBtn} onPress={() => setWriteVisible(true)}>
          <Text style={styles.writeBtnText}>+ 편지 쓰기</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B9D" style={{ marginTop: 40 }} />
      ) : letters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>아직 받은 편지가 없어요</Text>
          <Text style={styles.emptySubText}>연인에게 첫 편지를 써보세요</Text>
        </View>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLetter}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 편지 읽기 모달 */}
      <Modal visible={!!selectedLetter} animationType="slide" onRequestClose={() => setSelectedLetter(null)}>
        <SafeAreaView style={styles.readContainer}>
          <TouchableOpacity onPress={() => setSelectedLetter(null)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ 닫기</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.letterReadContent}>
            <Text style={styles.letterReadDate}>
              {selectedLetter ? formatDate(selectedLetter.createdAt) : ''}
            </Text>
            <Text style={styles.letterReadText}>{selectedLetter?.content}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 편지 쓰기 모달 */}
      <Modal visible={writeVisible} animationType="slide" onRequestClose={() => setWriteVisible(false)}>
        <WriteLetterScreen onClose={() => { setWriteVisible(false); loadLetters(); }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#3D2030' },
  writeBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  writeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  letterCardLocked: { opacity: 0.8, backgroundColor: '#FAFAFA' },
  letterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  letterIconEmoji: { fontSize: 22 },
  letterContent: { flex: 1 },
  letterPreview: { fontSize: 14, color: '#3D2030', fontWeight: '500', marginBottom: 4 },
  letterDate: { fontSize: 12, color: '#C4A4B0' },
  lockBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockBadgeText: { fontSize: 12, color: '#8B6570', fontWeight: '600' },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#3D2030', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#8B6570' },

  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  premiumGateEmoji: { fontSize: 64, marginBottom: 20 },
  premiumGateTitle: { fontSize: 20, fontWeight: '700', color: '#3D2030', marginBottom: 8, textAlign: 'center' },
  premiumGateDesc: { fontSize: 14, color: '#8B6570', textAlign: 'center' },

  readContainer: { flex: 1, backgroundColor: '#FFF5F8', padding: 24 },
  closeBtn: { marginBottom: 20 },
  closeBtnText: { color: '#FF6B9D', fontWeight: '600', fontSize: 15 },
  letterReadContent: { paddingBottom: 40 },
  letterReadDate: { fontSize: 13, color: '#C4A4B0', marginBottom: 20 },
  letterReadText: {
    fontSize: 16,
    color: '#3D2030',
    lineHeight: 28,
    fontStyle: 'italic',
  },
});
