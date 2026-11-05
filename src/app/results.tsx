import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function ResultsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Результаты</Text>
      <Text style={styles.subtitle}>Таблица рекордов</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#aaa' }
});