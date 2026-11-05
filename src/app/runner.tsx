import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAME_HEIGHT = 500; // Высота игрового поля
const BLOCK_SIZE = 30;  // Размер одного пикселя персонажа в раннере

interface Block {
  row: number;
  col: number;
  id: string;
  alive: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export default function RunnerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Декодируем блоки персонажа, переданные из конструктора
  const initialBlocks: Block[] = params.blocks 
    ? JSON.parse(params.blocks as string).map((b: any, index: number) => ({ ...b, id: `b-${index}`, alive: true }))
    : [];

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [timeLeft, setTimeLeft] = useState<number>(30); // 30 секунд на уровень
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Физические координаты центра фигуры
  const playerPos = useRef({ x: SCREEN_WIDTH / 2, y: GAME_HEIGHT - 100 });
  const targetPos = useRef({ x: SCREEN_WIDTH / 2, y: GAME_HEIGHT - 100 });
  
  // Массив препятствий (шипов)
  const obstacles = useRef<Obstacle[]>([]);
  const spawnTimer = useRef<number>(0);

  // Обработка движения мыши/пальца по игровому полю
  const handleMouseMove = (e: any) => {
    if (gameOver || gameWon) return;
    
    // Получаем координаты относительно игрового поля
    const bounds = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - bounds.left;
    const clientY = e.clientY - bounds.top;

    // Ограничиваем, чтобы персонаж не улетал за края экрана
    targetPos.current = {
      x: Math.max(20, Math.min(SCREEN_WIDTH - 20, clientX)),
      y: Math.max(20, Math.min(GAME_HEIGHT - 20, clientY))
    };
  };

  useEffect(() => {
    // Таймер игры (30 секунд)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameWon(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Основной игровой цикл физики и отрисовки (60 FPS)
    let animationFrameId: number;
    
    const updateGame = () => {
      if (gameOver || gameWon) return;

      // 1. Эффект маятника/сглаживания движения (персонаж плавно догоняет курсор)
      playerPos.current.x += (targetPos.current.x - playerPos.current.x) * 0.15;
      playerPos.current.y += (targetPos.current.y - playerPos.current.y) * 0.15;

      // 2. Генерация препятствий (спавним шипы сверху экрана)
      spawnTimer.current++;
      if (spawnTimer.current % 40 === 0) {
        obstacles.current.push({
          x: Math.random() * (SCREEN_WIDTH - 40) + 20,
          y: -30,
          size: 25,
          speed: Math.random() * 3 + 4 // Скорость падения шипов
        });
      }

      // 3. Движение шипов и проверка столкновений
      obstacles.current.forEach((obs) => {
        obs.y += obs.speed; // Шипы падают вниз
      });

      // Проверка коллизий для каждого живого кубика персонажа
      let anyCollision = false;
      const updatedBlocks = [...blocks];

      obstacles.current.forEach((obs) => {
        updatedBlocks.forEach((block) => {
          if (!block.alive) return;

          // Вычисляем абсолютные координаты каждого блока на экране относительно центра фигуры
          const blockX = playerPos.current.x + (block.col - 1.5) * BLOCK_SIZE;
          const blockY = playerPos.current.y + (block.row - 1.5) * BLOCK_SIZE;

          // Простая проверка пересечения квадрата блока и круглого шипа
          const dist = Math.hypot(blockX - obs.x, blockY - obs.y);
          if (dist < (obs.size + BLOCK_SIZE / 2)) {
            block.alive = false; // Блок реалистично отламывается/исчезает
            anyCollision = true;
          }
        });
      });

      if (anyCollision) {
        setBlocks(updatedBlocks);
        // Если все блоки уничтожены — геймовер
        if (updatedBlocks.filter(b => b.alive).length === 0) {
          setGameOver(true);
        }
      }

      // Удаляем шипы, улетевшие за экран
      obstacles.current = obstacles.current.filter((obs) => obs.y < GAME_HEIGHT + 50);

      // 4. Отрисовка всей сцены на HTML5 Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, SCREEN_WIDTH, GAME_HEIGHT);

          // Рисуем шипы (красные треугольники)
          ctx.fillStyle = '#ff4444';
          obstacles.current.forEach((obs) => {
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.size);
            ctx.lineTo(obs.x - obs.size, obs.y - obs.size);
            ctx.lineTo(obs.x + obs.size, obs.y - obs.size);
            ctx.closePath();
            ctx.fill();
          });

          // Рисуем выжившие блоки персонажа (неоновые квадраты)
          updatedBlocks.forEach((block) => {
            if (!block.alive) return;
            const blockX = playerPos.current.x + (block.col - 1.5) * BLOCK_SIZE - BLOCK_SIZE / 2;
            const blockY = playerPos.current.y + (block.row - 1.5) * BLOCK_SIZE - BLOCK_SIZE / 2;

            ctx.fillStyle = '#00ffcc';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
          });
        }
      }

      animationFrameId = requestAnimationFrame(updateGame);
    };

    animationFrameId = requestAnimationFrame(updateGame);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks, gameOver, gameWon]);

  // Кнопка перехода на финальный Этап 3 (Головоломка)
  const handleNextStage = () => {
    const survivingBlocks = blocks.filter(b => b.alive);
    router.push({
      pathname: '/puzzle',
      params: { survivingBlocks: JSON.stringify(survivingBlocks) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>ВРЕМЯ: {timeLeft}с</Text>
        <Text style={styles.blocksCount}>ОСТАЛОСЬ БЛОКОВ: {blocks.filter(b => b.alive).length}</Text>
      </View>

      {/* Интерактивная зона игры */}
      <div 
        style={{ width: SCREEN_WIDTH, height: GAME_HEIGHT, position: 'relative', cursor: 'none' }}
        onMouseMove={handleMouseMove}
      >
        <canvas 
          ref={canvasRef} 
          width={SCREEN_WIDTH} 
          height={GAME_HEIGHT} 
          style={{ backgroundColor: '#222', display: 'block' }}
        />

        {/* Экран поражения */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>ПЕРСОНАЖ УНИЧТОЖЕН</Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => router.replace('/editor')}>
              <Text style={styles.buttonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Экран победы (выживания 30 секунд) */}
        {gameWon && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayTitle, { color: '#00ffcc' }]}>УРОВЕНЬ ПРОЙДЕН!</Text>
            <Text style={styles.overlaySubtitle}>Фигура зафиксирована. Перенос осколков...</Text>
            <TouchableOpacity style={[styles.restartButton, { backgroundColor: '#00ffcc' }]} onPress={handleNextStage}>
              <Text style={[styles.buttonText, { color: '#1a1a1a' }]}>В ГОЛОВОЛОМКУ →</Text>
            </TouchableOpacity>
          </View>
        )}
      </div>

      <Text style={styles.instruction}>Веди курсор мыши, уклоняясь от красных шипов!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: SCREEN_WIDTH - 40, marginTop: 10 },
  timer: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  blocksCount: { color: '#00ffcc', fontSize: 18, fontWeight: 'bold' },
  instruction: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  overlayTitle: { fontSize: 28, fontWeight: '900', color: '#ff4444', marginBottom: 15, textAlign: 'center' },
  overlaySubtitle: { fontSize: 16, color: '#fff', marginBottom: 25, textAlign: 'center', paddingHorizontal: 20 },
  restartButton: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: '#555' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});