// =============================================================================
// 📁 파일 용도: 프리미엄 구독 화면 — 기능 비교표 + RevenueCat 결제
//
// 화면 구성:
//   1. 헤더 (구독 중이면 만료일 배지 표시)
//   2. 무료 vs 프리미엄 기능 비교표
//   3. 구독 버튼 (RevenueCat에서 가져온 실제 가격 표시)
//   4. 이전 구매 복원 버튼
//
// RevenueCat Offerings:
//   - RevenueCat 대시보드에서 설정한 "패키지"들을 가져와요.
//   - 예: 월간 구독 패키지 1개, 연간 구독 패키지 1개
//   - packages 배열을 map()으로 각각 버튼을 만들어요.
//   - offerings를 못 가져오면 (네트워크 오류 등) 기본 가격(₩2,900)을 하드코딩으로 표시해요.
//
// handlePurchase:
//   Purchases.purchasePackage(pkg) — 실제 결제 플로우(앱스토어/플레이스토어)를 실행해요.
//   성공 시 customerInfo.entitlements.active['premium']으로 구독 활성화를 확인해요.
//   userCancelled: 사용자가 스스로 취소하면 에러 다이얼로그를 띄우지 않아요.
//
// handleRestore:
//   같은 Apple/Google 계정으로 이전에 구독한 내역을 복원해요.
//   기기를 교체하거나 앱을 재설치했을 때 유용해요.
// =============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { haptic } from '../utils/haptics';

const FEATURES = [
  { label: '하트 버튼', free: true, premium: true },
  { label: '달력 사진 등록', free: '10장', premium: '무제한' },
  { label: '오늘의 문답', free: true, premium: true },
  { label: '편지함', free: false, premium: true },
  { label: '기념일 알림', free: false, premium: true },
  { label: '광고 없음', free: false, premium: true },
];

export default function PremiumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isPremium, expiresAt, setSubscription } = useSubscriptionStore();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (err) {
      console.log('RevenueCat offerings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = customerInfo.entitlements.active['premium'];
      if (entitlement) {
        setSubscription(true, entitlement.expirationDate ?? undefined);
        await haptic.success();
        Alert.alert(
          '구독 완료! 💕',
          '프리미엄 멤버가 됐어요. 모든 기능을 즐겨보세요!',
          [{ text: '확인', onPress: () => navigation.goBack() }],
        );
      }
    } catch (err: unknown) {
      const purchaseErr = err as { userCancelled?: boolean };
      if (!purchaseErr.userCancelled) {
        Alert.alert('결제 오류', '결제를 완료하지 못했어요. 다시 시도해주세요');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements.active['premium'];
      if (entitlement) {
        setSubscription(true, entitlement.expirationDate ?? undefined);
        Alert.alert('복원 완료', '구독이 복원됐어요 💕');
      } else {
        Alert.alert('복원 실패', '이전 구독 내역을 찾을 수 없어요');
      }
    } catch {
      Alert.alert('오류', '구독 복원에 실패했어요');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerEmoji}>💎</Text>
          <Text style={styles.headerTitle}>프리미엄</Text>
          <Text style={styles.headerSubtitle}>더 깊은 사랑을 나눠요</Text>

          {isPremium && expiresAt && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ 구독 중 · 만료일 {expiresAt.slice(0, 10)}</Text>
            </View>
          )}
        </View>

        {/* 기능 비교표 */}
        <View style={styles.comparisonTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellFeature]} />
            <Text style={[styles.tableCell, styles.tableHeaderText]}>무료</Text>
            <Text style={[styles.tableCell, styles.tableHeaderPremium]}>프리미엄</Text>
          </View>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellFeature]}>{f.label}</Text>
              <View style={styles.tableCell}>
                {typeof f.free === 'boolean' ? (
                  <Text style={f.free ? styles.checkYes : styles.checkNo}>
                    {f.free ? '✓' : '✕'}
                  </Text>
                ) : (
                  <Text style={styles.tableValueText}>{f.free}</Text>
                )}
              </View>
              <View style={styles.tableCell}>
                {typeof f.premium === 'boolean' ? (
                  <Text style={styles.checkYesPremium}>✓</Text>
                ) : (
                  <Text style={styles.tableValuePremium}>{f.premium}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 결제 버튼 */}
        {!isPremium && (
          <View style={styles.purchaseSection}>
            {loading ? (
              <ActivityIndicator color="#FF6B9D" />
            ) : packages.length > 0 ? (
              packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={styles.purchaseBtn}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.purchaseBtnTitle}>
                        {pkg.product.title}
                      </Text>
                      <Text style={styles.purchaseBtnPrice}>
                        {pkg.product.priceString} / 월
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity style={styles.purchaseBtn} disabled>
                <Text style={styles.purchaseBtnTitle}>프리미엄 구독</Text>
                <Text style={styles.purchaseBtnPrice}>₩2,900 / 월</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
              <Text style={styles.restoreBtnText}>이전 구매 복원</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              구독은 언제든지 설정에서 취소할 수 있어요.{'\n'}
              취소 시 현재 기간 만료일까지 이용 가능합니다.
            </Text>
          </View>
        )}

        {isPremium && (
          <View style={styles.purchaseSection}>
            <View style={styles.premiumActiveCard}>
              <Text style={styles.premiumActiveEmoji}>💕</Text>
              <Text style={styles.premiumActiveText}>프리미엄 멤버예요!</Text>
              <Text style={styles.premiumActiveSubText}>
                모든 기능을 마음껏 사용해요
              </Text>
            </View>
            <Text style={styles.legalText}>
              구독 취소는 앱스토어/플레이스토어 설정에서 할 수 있어요.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },

  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#FFF0F4',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#FF6B9D', fontSize: 14, fontWeight: '500' },
  headerEmoji: { fontSize: 52, marginBottom: 12 },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#3D2030',
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 15, color: '#8B6570', marginBottom: 12 },
  activeBadge: {
    backgroundColor: '#FF6B9D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 4,
  },
  activeBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  comparisonTable: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F4',
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#FFF5F8',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellFeature: {
    flex: 1.5,
    alignItems: 'flex-start',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B6570',
    textAlign: 'center',
  } as never,
  tableHeaderPremium: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B9D',
    textAlign: 'center',
  } as never,
  checkYes: { color: '#27AE60', fontSize: 16, fontWeight: '700' },
  checkNo: { color: '#C4A4B0', fontSize: 16 },
  checkYesPremium: { color: '#FF6B9D', fontSize: 16, fontWeight: '700' },
  tableValueText: { fontSize: 12, color: '#8B6570', textAlign: 'center' } as never,
  tableValuePremium: { fontSize: 12, color: '#FF6B9D', fontWeight: '600', textAlign: 'center' } as never,

  purchaseSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  purchaseBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  purchaseBtnTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 2 },
  purchaseBtnPrice: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },

  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreBtnText: { color: '#8B6570', fontSize: 14 },
  legalText: {
    fontSize: 11,
    color: '#C4A4B0',
    textAlign: 'center',
    lineHeight: 18,
  },

  premiumActiveCard: {
    backgroundColor: '#FFF0F4',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumActiveEmoji: { fontSize: 44, marginBottom: 8 },
  premiumActiveText: { fontSize: 20, fontWeight: '700', color: '#3D2030', marginBottom: 4 },
  premiumActiveSubText: { fontSize: 14, color: '#8B6570' },
});
