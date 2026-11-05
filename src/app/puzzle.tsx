import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = 8; // Сетка 8х8 как в оригинальном Block Blast
const CELL_SIZE = Math.min((SCREEN_WIDTH - 60) / GRID_SIZE, 40);

interface Block {
  row: number;
  col: number;
  alive: boolean;
}

export default function PuzzleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Получаем и центрируем выживший осколок из раннера
  const shardBlocks: Block[] = params.survivingBlocks
    ? JSON.parse(params.survivingBlocks as string)
    : [];

  const [score, setScore] = useState<number>(0);
  // Игровое поле головоломки (0 — пусто, 1 — заполнено)
  const [grid, setGrid] = useState<number[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );

  // Позиция перетаскивания детали (в веб-версии для простоты сделаем по клику на сетку)
  const [selectedShard, setSelectedShard] = useState<Block[]>(shardBlocks);

  // Функция размещения выжившего осколка на поле головоломки
  const placePiece = (targetRow: number, targetCol: number) => {
    if (selectedShard.length === 0) return;

    // Находим минимальные координаты, чтобы нормализовать деталь относительно точки клика
    const minRow = Math.min(...selectedShard.map(b => b.row));
    const minCol = Math.min(...selectedShard.map(b => b.col));

    const newGrid = grid.map(row => [...row]);
    let canPlace = true;

    // Проверяем, влезает ли фигура на выбранные клетки поля
    selectedShard.forEach(block => {
      const r = targetRow + (block.row - minRow);
      const c = targetCol + (block.col - minCol);

      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || newGrid[r][c] !== 0) {
        canPlace = false; // Клетка занята или вышла за границы поля
      }
    });

    if (!canPlace) {
      alert('Сюда нельзя поставить эту фигуру!');
      return;
    }

    // Закрашиваем блоки на сетке
    selectedShard.forEach(block => {
      const r = targetRow + (block.row - minRow);
      const c = targetCol + (block.col - minCol);
      newGrid[r][c] = 1;
    });

    // Проверка заполненных рядов и столбцов (взрыв линий как в Block Blast)
    let rowsToClear: number[] = [];
    let colsToClear: number[] = [];

    // Ищем заполненные ряды
    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every(cell => cell === 1)) rowsToClear.push(r);
    }

    // Ищем заполненные столбцы
    for (let c = 0; c < GRID_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r][c] !== 1) isFull = false;
      }
      if (isFull) colsToClear.push(c);
    }

    // Очищаем взорванные линии и начисляем очки
    rowsToClear.forEach(r => {
      newGrid[r] = Array(GRID_SIZE).fill(0);
    });
    colsToClear.forEach(c => {
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r][c] = 0;
      }
    });

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      setScore(prev => prev + linesCleared * 100);
    } else {
      setScore(prev => prev + selectedShard.length * 10);
    }

    setGrid(newGrid);
    setSelectedShard([]); // Фигура использована
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ГОЛОВОЛОМКА</Text>
        <Text style={styles.score}>ОЧКИ: {score}</Text>
      </View>

      {/* Поле 8х8 */}
      <View style={styles.grid}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((cell, cIdx) => (
              <TouchableOpacity
                key={cIdx}
                style={[styles.cell, cell === 1 && styles.cellFilled]}
                onPress={() => placePiece(rIdx, cIdx)}
                activeOpacity={0.7}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Слот для детали, прилетевшей из раннера */}
      <View style={styles.dockContainer}>
        <Text style={styles.dockTitle}>Твой выживший осколок:</Text>
        {selectedShard.length > 0 ? (
          <View style={styles.previewBox}>
            {/* Отрендерим уменьшенное превью детали */}
            {selectedShard.map((block, idx) => (
              <View
                key={idx}
                style={[
                  styles.previewBlock,
                  {
                    left: (block.col - Math.min(...selectedShard.map(b => b.col))) * 25,
                    top: (block.row - Math.min(...selectedShard.map(b => b.row))) * 25,
                  }
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyDock}>
            <Text style={styles.emptyDockText}>Осколок выставлен на поле!</Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => router.replace('/editor')}>
              <Text style={styles.restartText}>Создать новый проект 🔄</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.instruction}>Нажми на клетку поля, чтобы разместить осколок!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 30 },
  header: { alignItems: 'center', marginTop: 10 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  score: { fontSize: 22, fontWeight: 'bold', color: '#00ffcc', marginTop: 5 },
  grid: { backgroundColor: '#222', padding: 8, borderRadius: 10, borderWidth: 2, borderColor: '#444' },
  row: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: '#2d2d2d', backgroundColor: '#1e1e1e', margin: 1, borderRadius: 2 },
  cellFilled: { backgroundColor: '#00ffcc', borderColor: '#fff' },
  dockContainer: { width: '100%', alignItems: 'center', marginVertical: 20 },
  dockTitle: { color: '#aaa', fontSize: 16, marginBottom: 15 },
  previewBox: { width: 150, height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  previewBlock: { position: 'absolute', width: 22, height: 22, backgroundColor: '#00ffcc', borderWidth: 1, borderColor: '#fff', borderRadius: 3 },
  emptyDock: { alignItems: 'center' },
  emptyDockText: { color: '#00ffcc', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  restartButton: { backgroundColor: '#00ffcc', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  restartText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 16 },
  instruction: { color: '#666', fontSize: 13, marginBottom: 10 }
});