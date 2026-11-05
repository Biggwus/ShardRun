import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Описываем тип данных для закрашенных ячеек
interface SelectedCells {
  [key: string]: boolean;
}

export default function ConstructorScreen() {
  const router = useRouter();
  
  // Размер сетки: false = 3x3 (Средняя), true = 6x6 (Высокая)
  const [isHighDifficulty, setIsHighDifficulty] = useState<boolean>(false);
  const gridSize = isHighDifficulty ? 6 : 3;

  // Храним состояние закрашенных ячеек. Ключ — "строка-колонка", значение — true/false
  const [selectedCells, setSelectedCells] = useState<SelectedCells>({});

  // Переключение закраски ячейки при клике
  const toggleCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setSelectedCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Смена сложности с полной очисткой старого рисунка
  const changeGridSize = (high: boolean) => {
    setIsHighDifficulty(high);
    setSelectedCells({});
  };

  // Вычисляем размер одной ячейки, чтобы сетка красиво вписывалась в экран
  const cellSize = Math.min((SCREEN_WIDTH - 60) / gridSize, 60);

  // Функция отрисовки сетки блоков
  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r < gridSize; r++) {
      const cols = [];
      for (let c = 0; c < gridSize; c++) {
        const key = `${r}-${c}`;
        const isSelected = !!selectedCells[key];
        cols.push(
          <TouchableOpacity
            key={key}
            style={[
              styles.cell,
              { width: cellSize, height: cellSize },
              isSelected && styles.cellSelected,
            ]}
            onPress={() => toggleCell(r, c)}
            activeOpacity={0.8}
          />
        );
      }
      rows.push(
        <View key={r} style={styles.row}>
          {cols}
        </View>
      );
    }
    return rows;
  };

  // Кнопка запуска игры
  const handlePlay = () => {
    // Собираем координаты всех закрашенных блоков
    const gridData = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (selectedCells[`${r}-${c}`]) {
          gridData.push({ row: r, col: c });
        }
      }
    }

    // Проверка, нарисовал ли игрок хоть что-то
    if (gridData.length === 0) {
      alert('Закрасьте хотя бы одну клетку, чтобы создать персонажа!');
      return;
    }

    // Переходим на экран Физического раннера и передаем данные персонажа
    router.push({
      pathname: '/runner',
      params: { size: gridSize.toString(), blocks: JSON.stringify(gridData) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Кнопка НАЗАД в меню */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
        <Text style={styles.backButtonText}>← Меню</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Создай персонажа</Text>

      {/* Переключатель сложности сетки */}
      <View style={styles.difficultyContainer}>
        <TouchableOpacity
          style={[styles.diffButton, !isHighDifficulty && styles.diffButtonActive]}
          onPress={() => changeGridSize(false)}
        >
          <Text style={[styles.diffText, !isHighDifficulty && styles.diffTextActive]}>3х3 (Средняя)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.diffButton, isHighDifficulty && styles.diffButtonActive]}
          onPress={() => changeGridSize(true)}
        >
          <Text style={[styles.diffText, isHighDifficulty && styles.diffTextActive]}>6х6 (Высокая)</Text>
        </TouchableOpacity>
      </View>

      {/* Пиксельное поле рисования */}
      <View style={styles.gridContainer}>
        {renderGrid()}
      </View>

      {/* Кнопка запуска следующего этапа */}
      <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
        <Text style={styles.playButtonText}>ИГРАТЬ →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#00ffcc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  difficultyContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 4,
    marginVertical: 10,
  },
  diffButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  diffButtonActive: {
    backgroundColor: '#00ffcc',
  },
  diffText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  diffTextActive: {
    color: '#1a1a1a',
  },
  gridContainer: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2d2d2d',
    margin: 3,
    borderRadius: 4,
  },
  cellSelected: {
    backgroundColor: '#00ffcc', // Твой фирменный неоновый цвет персонажа
    borderColor: '#fff',
    shadowColor: '#00ffcc',
    shadowRadius: 10,
    shadowOpacity: 0.5,
  },
  playButton: {
    backgroundColor: '#00ffcc',
    width: '80%',
    maxWidth: 300,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  playButtonText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});