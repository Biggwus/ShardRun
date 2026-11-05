import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAME_HEIGHT = 500;
const BLOCK_SIZE = 30;

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
  
  const initialBlocks: Block[] = params.blocks 
    ? JSON.parse(params.blocks as string).map((b: any, index: number) => ({ ...b, id: `b-${index}`, alive: true }))
    : [];

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerPos = useRef({ x: SCREEN_WIDTH / 2, y: GAME_HEIGHT - 100 });
  const targetPos = useRef({ x: SCREEN_WIDTH / 2, y: GAME_HEIGHT - 100 });
  const obstacles = useRef<Obstacle[]>([]);
  const spawnTimer = useRef<number>(0);

  const handleMouseMove = (e: any) => {
    if (gameOver || gameWon) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    targetPos.current = {
      x: Math.max(20, Math.min(SCREEN_WIDTH - 20, e.clientX - bounds.left)),
      y: Math.max(20, Math.min(GAME_HEIGHT - 20, e.clientY - bounds.top))
    };
  };

  useEffect(() => {
    // --- ЧИТ-КОД X + 3 ---
    const pressedKeys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys[key] = true;
      if ((pressedKeys['x'] || pressedKeys['ч']) && pressedKeys['3']) {
        if (!gameOver && !gameWon) setGameWon(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ТАЙМЕР ИГРЫ (Останавливается, если наступил gameOver)
    const timer = setInterval(() => {
      if (gameOver) {
        clearInterval(timer);
        return;
      }
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!gameOver) setGameWon(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let animationFrameId: number;
    const updateGame = () => {
      if (gameOver || gameWon) return;

      playerPos.current.x += (targetPos.current.x - playerPos.current.x) * 0.15;
      playerPos.current.y += (targetPos.current.y - playerPos.current.y) * 0.15;

      spawnTimer.current++;
      if (spawnTimer.current % 40 === 0) {
        obstacles.current.push({
          x: Math.random() * (SCREEN_WIDTH - 40) + 20,
          y: -30,
          size: 25,
          speed: Math.random() * 3 + 4
        });
      }

      obstacles.current.forEach((obs) => { obs.y += obs.speed; });

      let anyCollision = false;
      const updatedBlocks = [...blocks];

      obstacles.current.forEach((obs) => {
        updatedBlocks.forEach((block) => {
          if (!block.alive) return;
          const blockX = playerPos.current.x + (block.col - 1.5) * BLOCK_SIZE;
          const blockY = playerPos.current.y + (block.row - 1.5) * BLOCK_SIZE;
          const dist = Math.hypot(blockX - obs.x, blockY - obs.y);
          if (dist < (obs.size + BLOCK_SIZE / 2)) {
            block.alive = false;
            anyCollision = true;
          }
        });
      });

      if (anyCollision) {
        setBlocks(updatedBlocks);
        if (updatedBlocks.filter(b => b.alive).length === 0) {
          setGameOver(true);
          clearInterval(timer);
        }
      }

      obstacles.current = obstacles.current.filter((obs) => obs.y < GAME_HEIGHT + 50);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, SCREEN_WIDTH, GAME_HEIGHT);
          ctx.fillStyle = '#ff4444';
          obstacles.current.forEach((obs) => {
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.size);
            ctx.lineTo(obs.x - obs.size, obs.y - obs.size);
            ctx.lineTo(obs.x + obs.size, obs.y - obs.size);
            ctx.closePath();
            ctx.fill();
          });

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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [blocks, gameOver, gameWon]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>ВРЕМЯ: {timeLeft}с</Text>
        <Text style={styles.blocksCount}>ОСТАЛОСЬ БЛОКОВ: {blocks.filter(b => b.alive).length}</Text>
      </View>

      {/* Фикс курсора — cursor: 'default' */}
      <div 
        style={{ width: SCREEN_WIDTH, height: GAME_HEIGHT, position: 'relative', cursor: 'default' }}
        onMouseMove={handleMouseMove}
      >
        <canvas ref={canvasRef} width={SCREEN_WIDTH} height={GAME_HEIGHT} style={{ backgroundColor: '#222', display: 'block' }} />

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>ПЕРСОНАЖ УНИЧТОЖЕН</Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => router.replace('/editor')}>
              <Text style={styles.buttonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameWon && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayTitle, { color: '#00ffcc' }]}>УРОВЕНЬ ПРОЙДЕН!</Text>
            <TouchableOpacity style={[styles.restartButton, { backgroundColor: '#00ffcc' }]} onPress={() => router.push({ pathname: '/puzzle', params: { survivingBlocks: JSON.stringify(blocks.filter(b => b.alive)) } })}>
              <Text style={[styles.buttonText, { color: '#1a1a1a' }]}>В ГОЛОВОЛОМКУ →</Text>
            </TouchableOpacity>
          </View>
        )}
      </div>
      <Text style={styles.instruction}>Веди курсор мыши, уклоняясь от красных шипов! (Чит: X + 3)</Text>
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
  restartButton: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: '#555' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});