import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Настройки</Text>
      <Text style={styles.subtitle}>Звук и Музыка</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#aaa' }
});