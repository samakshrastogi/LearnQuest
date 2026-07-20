import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Sparkles, Coins, ArrowRight, Heart } from 'lucide-react';

interface GameComponentProps {
  levelId: string;
  onClose: () => void;
  onComplete: (rewards: any) => void;
}

export default function GameComponent({ levelId, onClose, onComplete }: GameComponentProps) {
  const { profile, updateWallet } = useAuthStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Game session states
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Active question overlays
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'incorrect'>('none');

  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // Time tracker for anti-cheat
  const startTimeRef = useRef<number>(Date.now());
  const answersLogRef = useRef<any[]>([]);
  const scoreRef = useRef<number>(100); // Start at 100, drops on wrong answers

  // 1. Initialize Game Session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const res = await api.post('/game/start-session', { levelId });
        setSessionToken(res.data.data.sessionToken);
        setLoading(false);
      } catch (err: any) {
        setSessionError(err.response?.data?.message || 'Failed to initialize level session.');
        setLoading(false);
      }
    };
    initSession();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [levelId]);

  // Dynamic Checkpoint Question Generator for Class Level
  const classLvl = profile?.classLevel || 5;
  const isScience = String(levelId).includes('science');
  const isEnglish = String(levelId).includes('english');

  const questionObj = isScience ? {
    _id: `q_science_${levelId}`,
    questionText: `Class ${classLvl} Science Gate: Which gas do plants absorb during photosynthesis?`,
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
    correctAnswer: '1',
  } : isEnglish ? {
    _id: `q_english_${levelId}`,
    questionText: `Class ${classLvl} English Gate: Identify the Noun in "The brave knight unlocked the golden door."`,
    options: ['Brave', 'Knight', 'Unlocked', 'Golden'],
    correctAnswer: '1',
  } : {
    _id: `q_math_${levelId}`,
    questionText: `Class ${classLvl} Math Gate: Solve: 25 x 4`,
    options: ['80', '90', '100', '110'],
    correctAnswer: '2',
  };

  const levelDetails = {
    checkpointQuestions: [questionObj],
  };

  // 2. Launch Phaser Game Scene once session is generated
  useEffect(() => {
    if (!sessionToken || !canvasRef.current || gameInstanceRef.current || !levelDetails) return;

    const questionsList = levelDetails.checkpointQuestions;

    class PlatformerScene extends Phaser.Scene {
      private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private checkpointDoor!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      private coinsCollected = 0;
      private coinsText!: Phaser.GameObjects.Text;
      private score = 100;
      
      constructor() {
        super({ key: 'PlatformerScene' });
      }

      preload() {
        // Load basic assets dynamically using standard canvas grids
        this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
        this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
        this.load.image('coin', 'https://labs.phaser.io/assets/sprites/spiny.png');
        this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', {
          frameWidth: 32,
          frameHeight: 48,
        });
        this.load.image('door', 'https://labs.phaser.io/assets/sprites/block.png');
      }

      create() {
        // Sky
        this.add.image(400, 300, 'sky');

        // Platforms physics grid
        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');

        // Player Dude
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
          key: 'left',
          frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: 'turn',
          frames: [{ key: 'dude', frame: 4 }],
          frameRate: 20,
        });
        this.anims.create({
          key: 'right',
          frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1,
        });

        this.cursors = this.input.keyboard!.createCursorKeys();

        // Checkpoint door gate (barring the exit)
        this.checkpointDoor = this.physics.add.sprite(700, 500, 'door');
        this.checkpointDoor.setImmovable(true);

        // Colliders
        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(this.checkpointDoor, platforms);

        // Physics overlap for gate
        this.physics.add.collider(this.player, this.checkpointDoor, () => {
          this.triggerCheckpointGate();
        });

        // Coins HUD
        this.coinsText = this.add.text(16, 16, 'Coins: 0', {
          fontSize: '24px',
          color: '#eab308',
          fontStyle: 'bold',
        });
      }

      update() {
        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-160);
          this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(160);
          this.player.anims.play('right', true);
        } else {
          this.player.setVelocityX(0);
          this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
          this.player.setVelocityY(-330);
        }
      }

      private triggerCheckpointGate() {
        // Pause current update loop
        this.scene.pause();
        
        // Throw React custom event
        window.dispatchEvent(
          new CustomEvent('phaser-checkpoint-gate', {
            detail: { question: questionsList[0] },
          })
        );
      }

      // Method invoked by React component on question resolution
      public resumeLevel(isCorrect: boolean) {
        this.scene.resume();
        if (isCorrect) {
          // Grant speed buff and delete block barrier
          this.checkpointDoor.destroy();
          this.player.setVelocityY(-350);
          
          // Complete game after 1 second delay
          this.time.delayedCall(1200, () => {
            window.dispatchEvent(new CustomEvent('phaser-level-complete'));
          });
        } else {
          // Bounce player back
          this.player.x -= 80;
          this.player.setVelocityX(-150);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: canvasRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300, x: 0 },
          debug: false,
        },
      },
      scene: [PlatformerScene],
    };

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // React Listeners
    const handlePhaserCheckpoint = (e: any) => {
      setActiveQuestion(e.detail.question);
    };

    const handleLevelComplete = async () => {
      // Send results to backend
      try {
        const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const res = await api.post('/game/complete-level', {
          levelId,
          sessionToken,
          score: scoreRef.current,
          timeSpentSeconds,
          answers: answersLogRef.current,
        });

        // Grant rewards
        const { rewards, wallet } = res.data.data;
        updateWallet(wallet);
        onComplete(rewards);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Verification failed.');
      }
    };

    window.addEventListener('phaser-checkpoint-gate', handlePhaserCheckpoint);
    window.addEventListener('phaser-level-complete', handleLevelComplete);

    return () => {
      window.removeEventListener('phaser-checkpoint-gate', handlePhaserCheckpoint);
      window.removeEventListener('phaser-level-complete', handleLevelComplete);
    };
  }, [sessionToken, levelDetails, levelId]);

  // React submits validation answer
  const submitAnswer = async () => {
    if (selectedOption === null || !activeQuestion) return;
    setSubmittingAnswer(true);

    let isCorrect = false;
    let explanation = '';

    if (activeQuestion.correctAnswer !== undefined) {
      isCorrect = String(selectedOption) === String(activeQuestion.correctAnswer);
      const correctText = activeQuestion.options?.[parseInt(activeQuestion.correctAnswer)] || activeQuestion.correctAnswer;
      explanation = isCorrect 
        ? 'Great job! You unlocked the door.' 
        : `The correct answer is: ${correctText}`;
    } else {
      try {
        const res = await api.post('/curriculum/validate-answer', {
          questionId: activeQuestion._id,
          answer: selectedOption,
        });
        isCorrect = res.data.data.isCorrect;
        explanation = res.data.data.explanation || 'Keep going!';
      } catch (err) {
        isCorrect = true;
        explanation = 'Well done!';
      }
    }

    // Add to anti-cheat telemetry log
    answersLogRef.current.push({
      questionId: activeQuestion._id,
      answer: selectedOption,
      isCorrect,
    });

    if (!isCorrect) {
      scoreRef.current = Math.max(0, scoreRef.current - 20);
    }

    setFeedbackState(isCorrect ? 'correct' : 'incorrect');
    setAiExplanation(explanation);
    setSubmittingAnswer(false);
  };

  const handleNext = () => {
    // Resume Phaser scene
    const game = gameInstanceRef.current;
    if (game) {
      const scene = game.scene.keys.PlatformerScene as any;
      scene.resumeLevel(feedbackState === 'correct');
    }

    // Reset overlay state
    setActiveQuestion(null);
    setSelectedOption(null);
    setFeedbackState('none');
    setAiExplanation('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[650px]">
        {/* Left Side: Phaser Canvas */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden" ref={canvasRef}>
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-gold"></div>
              <p className="text-slate-400 text-xs">Generating Session Token...</p>
            </div>
          )}
          {sessionError && (
            <div className="text-center p-4">
              <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-400 font-bold">{sessionError}</p>
              <button onClick={onClose} className="btn-outline text-xs mt-4 px-4 py-2">
                Close Map
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Quiz checkpoint gates (React UI overlay overlaying Phaser canvas) */}
        {activeQuestion && (
          <div className="w-full md:w-80 bg-slate-950/80 border-l border-slate-800 p-6 flex flex-col justify-between backdrop-blur-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-accent-gold font-extrabold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" /> Checkpoint Gate
              </div>
              <h3 className="font-bold text-slate-200 text-sm leading-relaxed">{activeQuestion.questionText}</h3>

              {feedbackState === 'none' ? (
                <div className="flex flex-col gap-2 mt-2">
                  {activeQuestion.options.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(String(idx))}
                      className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all ${
                        selectedOption === String(idx)
                          ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      feedbackState === 'correct'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-accent-emerald'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    <span className="font-extrabold block mb-1">
                      {feedbackState === 'correct' ? '🎉 CORRECT!' : '❌ INCORRECT'}
                    </span>
                    {aiExplanation}
                  </div>
                </div>
              )}
            </div>

            {feedbackState === 'none' ? (
              <button
                onClick={submitAnswer}
                disabled={selectedOption === null || submittingAnswer}
                className="btn-gold w-full flex items-center justify-center gap-2 text-xs py-3 mt-4"
              >
                {submittingAnswer ? 'Validating...' : 'Submit Answer'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-gold w-full flex items-center justify-center gap-2 text-xs py-3 mt-4"
              >
                {feedbackState === 'correct' ? 'Unlock Gate' : 'Try Again'} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
