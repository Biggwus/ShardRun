import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MainMenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.menuContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.gameTitle}>ShardRun</Text>
        <Text style={styles.welcomeText}>Добро пожаловать в игру</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.menuButton, styles.startButton]} 
          onPress={() => router.push({ pathname: '/editor' })}
        >
          <Text style={styles.buttonText}>НАЧАТЬ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => router.push({ pathname: '/settings' })}
        >
          <Text style={styles.buttonText}>НАСТРОЙКИ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => router.push({ pathname: '/results' })}
        >
          <Text style={styles.buttonText}>РЕЗУЛЬТАТЫ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuContainer: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  headerContainer: { alignItems: 'center', marginTop: 40 },
  gameTitle: { fontSize: 48, fontWeight: '900', color: '#00ffcc', letterSpacing: 4, marginBottom: 10, textTransform: 'uppercase' },
  welcomeText: { fontSize: 18, color: '#ffffff', opacity: 0.8 },
  buttonContainer: { width: '100%', paddingHorizontal: 40, marginBottom: 40 },
  menuButton: { backgroundColor: '#2a2a2a', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginVertical: 10, borderWidth: 1, borderColor: '#444' },
  startButton: { backgroundColor: '#00ffcc', borderColor: '#00e6b8' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },
});