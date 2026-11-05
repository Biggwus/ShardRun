import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = 8;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 60) / GRID_SIZE, 40);

// Глобальное сохранение поля между раундами
let globalGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
let globalScore = 0;

interface Block {
  row: number;
  col: number;
  alive: boolean;
}

export default function PuzzleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [score, setScore] = useState<number>(globalScore);
  const [grid, setGrid] = useState<number[][]>(globalGrid);
  
  // Состояние для отображения финального окна результатов
  const [showResults, setShowResults] = useState<boolean>(false);

  const shardBlocks: Block[] = params.survivingBlocks ? JSON.parse(params.survivingBlocks as string) : [];
  const [selectedShard, setSelectedShard] = useState<Block[]>(shardBlocks);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    if (selectedShard.length === 0 || showResults) return;

    const dragOffsetRaw = e.dataTransfer.getData("text/plain");
    if (!dragOffsetRaw) return;
    const { offsetRow, offsetCol } = JSON.parse(dragOffsetRaw);

    const newGrid = grid.map(row => [...row]);
    let canPlace = true;

    selectedShard.forEach(block => {
      const r = targetRow + (block.row - offsetRow);
      const c = targetCol + (block.col - offsetCol);
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || newGrid[r][c] !== 0) {
        canPlace = false;
      }
    });

    if (!canPlace) {
      alert('Фигура не помещается или клетка занята!');
      return;
    }

    selectedShard.forEach(block => {
      const r = targetRow + (block.row - offsetRow);
      const c = targetCol + (block.col - offsetCol);
      newGrid[r][c] = 1;
    });

    let rowsToClear: number[] = [];
    let colsToClear: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every(cell => cell === 1)) rowsToClear.push(r);
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < GRID_SIZE; r++) { if (newGrid[r][c] !== 1) isFull = false; }
      if (isFull) colsToClear.push(c);
    }

    rowsToClear.forEach(r => { newGrid[r] = Array(GRID_SIZE).fill(0); });
    colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = 0; });

    const linesCleared = rowsToClear.length + colsToClear.length;
    let newScore = score;
    if (linesCleared > 0) newScore += linesCleared * 100;
    else newScore += selectedShard.length * 10;

    globalGrid = newGrid;
    globalScore = newScore;
    setGrid(newGrid);
    setScore(newScore);
    setSelectedShard([]);
  };

  const handleDragStart = (e: React.DragEvent, blockRow: number, blockCol: number) => {
    if (showResults) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ offsetRow: blockRow, offsetCol: blockCol }));
  };

  // Функция полного сброса и начала новой игры из окна результатов
  const handleRestartGame = () => {
    globalGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    globalScore = 0;
    setGrid(globalGrid);
    setScore(0);
    setSelectedShard([]);
    setShowResults(false);
    router.replace('/editor');
  };

  // Функция выхода в главное меню из окна результатов
  const handleExitToMenu = () => {
    globalGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    globalScore = 0;
    setShowResults(false);
    router.replace('/');
  };

  const minRow = selectedShard.length > 0 ? Math.min(...selectedShard.map(b => b.row)) : 0;
  const minCol = selectedShard.length > 0 ? Math.min(...selectedShard.map(b => b.col)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Кнопка НАЗАД / КОНЕЦ ИГРЫ сверху */}
      <TouchableOpacity style={styles.endGameButton} onPress={() => setShowResults(true)}>
        <Text style={styles.endGameButtonText}>Выйти / Конец ❌</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>ГОЛОВОЛОМКА</Text>
        <Text style={styles.score}>ОЧКИ: {score}</Text>
      </View>

      {/* Поле 8х8 */}
      <View style={styles.grid}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rIdx, cIdx)}
                style={{
                  width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: '#2d2d2d', borderStyle: 'solid',
                  backgroundColor: cell === 1 ? '#00ffcc' : '#1e1e1e', margin: 1, borderRadius: 2,
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Док-станция для осколков */}
      <View style={styles.dockContainer}>
        {selectedShard.length > 0 ? (
          <>
            <Text style={styles.dockTitle}>Зажми мышкой фигуру и тащи на поле:</Text>
            <div draggable style={{ position: 'relative', width: 120, height: 80, cursor: 'grab' }}>
              {selectedShard.map((block, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.row, block.col)}
                  style={{
                    position: 'absolute', width: 24, height: 24, backgroundColor: '#00ffcc', border: '1px solid #fff', borderRadius: 3,
                    left: (block.col - minCol) * 26, top: (block.row - minRow) * 26,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <View style={styles.emptyDock}>
            <Text style={styles.emptyDockText}>Осколок выставлен на поле!</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.replace('/editor')}>
              <Text style={styles.actionText}>Добыть новый осколок 🏃‍♂️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.instruction}>Перетаскивай осколки прямо на клетки поля!</Text>

      {/* ФИНАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ (Оверлей) */}
      {showResults && (
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ИГРА ЗАВЕРШЕНА</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.modalScoreLabel}>Ваш результат:</Text>
              <Text style={styles.modalScoreValue}>{score} очков</Text>
            </View>

            <TouchableOpacity style={[styles.modalButton, styles.continueBtn]} onPress={handleRestartGame}>
              <Text style={styles.modalButtonText}>Играть заново 🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, styles.exitBtn]} onPress={handleExitToMenu}>
              <Text style={[styles.modalButtonText, { color: '#ff4444' }]}>Выйти в меню 🚪</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeLink} onPress={() => setShowResults(false)}>
              <Text style={styles.closeLinkText}>Вернуться в текущую игру</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  endGameButton: { alignSelf: 'flex-start', marginLeft: 20, padding: 8, backgroundColor: '#2a2a2a', borderRadius: 6, borderWidth: 1, borderColor: '#444' },
  endGameButtonText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  header: { alignItems: 'center', marginTop: 5 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  score: { fontSize: 22, fontWeight: 'bold', color: '#00ffcc', marginTop: 5 },
  grid: { backgroundColor: '#222', padding: 8, borderRadius: 10, borderWidth: 2, borderColor: '#444' },
  row: { flexDirection: 'row' },
  dockContainer: { width: '100%', alignItems: 'center', marginVertical: 15, minHeight: 120 },
  dockTitle: { color: '#aaa', fontSize: 14, marginBottom: 15 },
  emptyDock: { alignItems: 'center' },
  emptyDockText: { color: '#00ffcc', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  actionButton: { backgroundColor: '#00ffcc', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  actionText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 16 },
  instruction: { color: '#666', fontSize: 13, marginBottom: 5 },
  
  // Стили для окна результатов
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalBox: { backgroundColor: '#222', width: '85%', maxWidth: 340, padding: 25, borderRadius: 16, borderWidth: 2, borderColor: '#444', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 20, letterSpacing: 1 },
  scoreContainer: { alignItems: 'center', marginBottom: 30, backgroundColor: '#1a1a1a', width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  modalScoreLabel: { color: '#aaa', fontSize: 16, marginBottom: 5 },
  modalScoreValue: { color: '#00ffcc', fontSize: 28, fontWeight: 'bold' },
  modalButton: { width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginVertical: 8, borderWidth: 1 },
  continueBtn: { backgroundColor: '#00ffcc', borderColor: '#00e6b8' },
  exitBtn: { backgroundColor: '#2a2a2a', borderColor: '#444' },modalButtonText: { color: '#1a1a1a', fontSize: 16, fontWeight: 'bold' },
  closeLink: { marginTop: 15, padding: 5 },
  closeLinkText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' }
});