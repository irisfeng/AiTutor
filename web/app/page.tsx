'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBJECTS, DEFAULT_SUBJECT, SubjectType, getSubjectGreeting } from '@/lib/prompts/personas';
import { MODELS, DEFAULT_MODEL } from '@/config/models';
import { detectSubjectFromConversations, ConversationTurn } from '@/lib/subject-detector';
import { StepFunRealtimeClient } from '@/lib/stepfun-realtime';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface KnowledgeCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon?: string;
  highlighted?: boolean;
}

export default function UniversalKnowledgeTutor() {
  // 核心状态
  const [temperature, setTemperature] = useState(0.8);
  const [networkSearch, setNetworkSearch] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'cards' | 'graph'>('cards');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // API Key 状态
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // 学科状态
  const [currentSubject, setCurrentSubject] = useState<SubjectType>(DEFAULT_SUBJECT.id);
  const [greetingText, setGreetingText] = useState<string>('');

  // 知识卡片状态（初始为空，动态生成）
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [conversationTurns, setConversationTurns] = useState(0);

  // 模型和语音状态
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL);
  const [currentVoice, setCurrentVoice] = useState('qingchunshaonv');

  // 语音相关状态
  const [voiceState, setVoiceState] = useState<'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // AI响应追踪（用于判断是否是同一个response）
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const isAiRespondingRef = useRef(false);

  // Refs
  const clientRef = useRef<StepFunRealtimeClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const isActiveRef = useRef(false); // 用于在 initClient 回调中访问 isActive，避免依赖问题

  // 存储配置到 ref，避免 useEffect 依赖问题
  const configRef = useRef({
    voice: currentVoice,
    subject: currentSubject,
    model: currentModel,
  });

  // 同步配置到 ref
  useEffect(() => {
    configRef.current = {
      voice: currentVoice,
      subject: currentSubject,
      model: currentModel,
    };
  }, [currentVoice, currentSubject, currentModel]);

  // 从 localStorage 加载 API Key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('aitutor_apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // 同步 isActive 到 ref，避免 initClient 依赖问题
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // 保存 API Key 到 localStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('aitutor_apiKey', key);
  };

  // 自动检测学科（当对话更新时）
  useEffect(() => {
    if (messages.length >= 2) {
      // 将 Message 转换为 ConversationTurn
      const conversations: ConversationTurn[] = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
        .reduce((acc: ConversationTurn[], msg, i, arr) => {
          if (msg.role === 'user' && i + 1 < arr.length && arr[i + 1].role === 'assistant') {
            acc.push({
              userMessage: msg.content,
              aiResponse: arr[i + 1].content,
            });
          }
          return acc;
        }, []);

      if (conversations.length >= 1) {
        const detected = detectSubjectFromConversations(conversations);
        if (detected.confidence > 0.3 && detected.subject.id !== currentSubject) {
          setCurrentSubject(detected.subject.id);
        }
      }
    }
  }, [messages]);

  // 当 API Key 配置后，自动建立连接
  useEffect(() => {
    // 暂时移除自动初始化，改为在点击录音按钮时初始化
    // 避免初始化逻辑重复导致的问题
    if (apiKey) {
      console.log('📝 API Key loaded, waiting for user to click microphone button');
    }
  }, [apiKey]);

  // 获取学科提示词
  const getSubjectInstructions = (subject: SubjectType): string => {
    const { getPersonaInstructions } = require('@/lib/prompts/personas');
    return getPersonaInstructions(subject);
  };

  // 开始录音
  const startRecording = async () => {
    try {
      if (!apiKey) {
        setShowSettings(true);
        return;
      }

      setVoiceState('connecting');

      // 如果客户端未初始化，先初始化
      if (!clientRef.current) {
        console.log('📞 Client not initialized, creating new client...');
        const config = configRef.current;
        const client = new StepFunRealtimeClient({
          apiKey,
          voice: config.voice,
          instructions: getSubjectInstructions(config.subject),
          enableModelSelection: false,
          preferredModel: config.model.id as 'step-audio-2' | 'step-audio-2-mini',
          subject: config.subject,
          userLanguage: 'zh',
        });

        console.log('🔌 Connecting to StepFun API...');
        await client.connect(
          (state) => {
            console.log('📡 Voice state changed:', state);
            setVoiceState(state);
            setIsConnected(!!client);

            // 更新对话轮次（使用 ref 避免依赖问题）
            if (state === 'idle' && isActiveRef.current) {
              setConversationTurns(prev => prev + 1);
              // AI响应结束，重置响应标志
              isAiRespondingRef.current = false;
            }

            // 清除错误
            if (state === 'idle') {
              setErrorMessage('');
            }
          },
          (text) => {
            // AI 回答 - 累加到当前响应消息
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];

              // 如果最后一条是AI消息且正在响应中，累加文本
              if (lastMessage && lastMessage.role === 'assistant' && isAiRespondingRef.current) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    content: lastMessage.content + text,
                  },
                ];
              } else {
                // 创建新的AI消息
                isAiRespondingRef.current = true;
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: text,
                    timestamp: new Date().toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ];
              }
            });
          },
          async (audioData) => {
            await client.playAudio(audioData);
          },
          (error) => {
            console.error('❌ Client error:', error);
            setErrorMessage(error);
            setTimeout(() => setErrorMessage(''), 5000);
          },
          (userText) => {
            // 用户转写文本 - 创建用户消息
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'user',
                content: userText,
                timestamp: new Date().toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
          }
        );

        console.log('✅ Client connected successfully');
        clientRef.current = client;
      } else {
        console.log('♻️ Reusing existing client');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (clientRef.current && isRecordingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          clientRef.current.sendAudio(inputData);
        }
      };

      analyser.connect(processor);
      processor.connect(audioContext.destination);

      isRecordingRef.current = true;
      setIsActive(true);
      setVoiceState('listening');
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setVoiceState('idle');
      setErrorMessage('无法访问麦克风，请检查权限');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // 停止录音
  const stopRecording = () => {
    isRecordingRef.current = false;

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsActive(false);
    setVoiceState('idle');
    setIsConnected(false);
  };

  // 自动生成知识卡片（每3轮对话后）
  useEffect(() => {
    if (conversationTurns >= 3 && conversationTurns % 3 === 0) {
      handleGenerateKnowledgeCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationTurns]); // 只依赖 conversationTurns，避免循环

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理录音按钮点击
  const handleVoiceToggle = async () => {
    if (isActive) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // 清空对话
  const handleClearMessages = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setKnowledgeCards([]); // 清空知识卡片
    setConversationTurns(0); // 重置对话轮次
  };

  // 生成知识卡片
  const handleGenerateKnowledgeCards = useCallback(async () => {
    // 将 Message 转换为 ConversationTurn
    const conversations: ConversationTurn[] = messages
      .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
      .reduce((acc: ConversationTurn[], msg, i, arr) => {
        if (msg.role === 'user' && i + 1 < arr.length && arr[i + 1].role === 'assistant') {
          acc.push({
            userMessage: msg.content,
            aiResponse: arr[i + 1].content,
          });
        }
        return acc;
      }, []);

    if (conversations.length === 0) {
      setErrorMessage('请先进行对话再生成知识卡片');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsGeneratingCards(true);

    try {
      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversations,
          subject: currentSubject,
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();
      setKnowledgeCards(data.cards || []);
    } catch (error) {
      console.error('生成知识卡片失败:', error);
      setErrorMessage('生成知识卡片失败，请稍后重试');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsGeneratingCards(false);
    }
  }, [messages, currentSubject]); // 移除 currentPersona 依赖

  // 生成知识关系
  const handleGenerateRelations = () => {
    setErrorMessage('知识图谱功能即将推出');
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // 更新开场白（当学科切换时）
  useEffect(() => {
    const greeting = getSubjectGreeting(currentSubject);
    setGreetingText(greeting);
  }, [currentSubject]);

  // 初始化欢迎消息（使用开场白）
  useEffect(() => {
    if (messages.length === 0 && greetingText) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greetingText,
          timestamp: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }
  }, [greetingText]);

  // 当学科切换时，更新开场白消息（如果还没有用户消息）
  useEffect(() => {
    if (messages.length > 0 && messages[0].id === '1' && messages[0].role === 'assistant') {
      // 只有一条开场白消息，更新它
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greetingText,
          timestamp: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }
  }, [greetingText]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      {/* Error Message - 顶部固定提示 */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-50 border border-red-200 rounded-lg shadow-lg"
          >
            <p className="text-sm text-red-600">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-8 py-5 flex items-center justify-between">
          {/* Brand */}
          <div>
            <h1 className="text-2xl font-bold text-[#333333]">知识导师</h1>
            <p className="text-xs text-[#666666] mt-0.5">你的专属学习助手</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Subject Selector */}
            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value as SubjectType)}
              className="px-4 py-2.5 border-2 border-[#ff6600] rounded-lg text-sm text-[#333333] bg-white outline-none appearance-none pr-10 cursor-pointer"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </motion.select>

            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettings(true)}
              className="px-4 py-2.5 border border-[#cccccc] rounded-lg text-sm text-[#333333] bg-white hover:bg-gray-50"
            >
              ⚙️ 设置
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-5 grid grid-cols-12 gap-5 mt-5">
        {/* Left Column: Knowledge Base */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-3"
        >
          <div className="bg-white rounded-2xl p-8 h-[calc(100vh-140px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#333333]">知识库</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateRelations}
                className="bg-[#ff6600] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                ⭐ 生成关系
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedTab('cards')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedTab === 'cards'
                    ? 'bg-[#f0f0f0] text-[#333333]'
                    : 'border border-[#e0e0e0] text-[#666666]'
                }`}
              >
                知识卡片
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedTab('graph')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedTab === 'graph'
                    ? 'bg-[#f0f0f0] text-[#333333]'
                    : 'border border-[#e0e0e0] text-[#666666]'
                }`}
              >
                知识脑图
              </motion.button>
            </div>

            {/* Knowledge Cards */}
            <AnimatePresence>
              {isGeneratingCards ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-[#ff6600] border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-sm text-[#666666]">生成知识卡片中...</p>
                </div>
              ) : knowledgeCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-sm text-[#666666] mb-2">还没有知识卡片</p>
                  <p className="text-xs text-[#999999] mb-4">进行对话后自动生成，或点击下方按钮手动生成</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateKnowledgeCards}
                    className="bg-[#ff6600] text-white px-4 py-2 rounded-lg text-xs font-medium"
                  >
                    生成知识卡片
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-5">
                  {knowledgeCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`p-5 rounded-xl transition-all cursor-pointer ${
                        card.highlighted ? 'bg-[#fff5e6]' : 'bg-[#f0f0f0]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {card.icon && (
                          <span className="text-2xl">{card.icon}</span>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-[#333333] mb-2">{card.title}</h3>
                          <p className="text-xs text-[#666666] mb-3 leading-relaxed">{card.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {card.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 bg-white rounded-md text-xs text-[#666666]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Center Column: Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-6"
        >
          <div className="bg-white rounded-2xl p-8 h-[calc(100vh-140px)] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#333333]">内容由AI生成</p>
                {isConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearMessages}
                className="px-5 py-2 border border-[#e0e0e0] rounded-lg text-xs text-[#666666]"
              >
                🗑️ 清空对话
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 px-2">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[60%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'bg-[#f5f7fa] text-gray-800 shadow-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.role === 'assistant' && message.id !== '1' && (
                        <div className="mt-2 pt-2 border-t border-gray-200/50">
                          <p className="text-xs text-gray-400">内容由AI生成</p>
                        </div>
                      )}
                      <p className={`text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Button */}
            <div className="mt-8 flex justify-center flex-col items-center gap-4">

              {/* Voice Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceToggle}
                disabled={voiceState === 'connecting'}
                className={`flex items-center gap-4 px-12 py-4 rounded-full text-white font-medium transition-all ${
                  voiceState === 'connecting' ? 'bg-gray-400 cursor-not-allowed' :
                  isActive ? 'bg-[#e65c00] shadow-lg' : 'bg-[#ff6600]'
                }`}
              >
                <motion.div
                  animate={
                    isActive || voiceState === 'listening'
                      ? {
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                        }
                      : voiceState === 'connecting'
                      ? { rotate: 360 }
                      : {}
                  }
                  transition={{
                    repeat: (isActive || voiceState === 'listening' || voiceState === 'connecting') ? Infinity : 0,
                    duration: voiceState === 'connecting' ? 1 : 1.5
                  }}
                  className="relative w-5 h-5"
                >
                  <div className="absolute inset-0 border-2 border-white rounded-full" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white -translate-x-1/2" />
                </motion.div>
                {voiceState === 'connecting' ? '连接中...' :
                 voiceState === 'listening' ? '录音中...' :
                 voiceState === 'thinking' ? '思考中...' :
                 voiceState === 'speaking' ? '回复中...' :
                 '点击开启语音通话'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-3"
        >
          <div className="bg-white rounded-2xl p-8 h-[calc(100vh-140px)] overflow-y-auto">
            {/* Header */}
            <h2 className="text-xl font-bold text-[#ff6600] mb-8 flex items-center gap-2">
              ⚙️ 系统设置
            </h2>

            {/* Settings */}
            <div className="space-y-10">
              {/* Model Selection */}
              <div>
                <label className="text-sm text-[#333333] font-medium mb-3 block">
                  选择模型
                </label>
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={currentModel.id}
                  onChange={(e) => {
                    const model = MODELS.find(m => m.id === e.target.value);
                    if (model) setCurrentModel(model);
                  }}
                  className="w-full px-4 py-3 border-2 border-[#ff6600] rounded-lg text-sm text-[#333333] bg-white outline-none appearance-none cursor-pointer"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.recommended ? '推荐' : ''}
                    </option>
                  ))}
                </motion.select>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="text-sm text-[#333333] font-medium mb-3 block">
                  语音
                </label>
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={currentVoice}
                  onChange={(e) => setCurrentVoice(e.target.value)}
                  className="w-full px-4 py-3 border border-[#cccccc] rounded-lg text-sm text-[#333333] bg-white outline-none appearance-none cursor-pointer"
                >
                  <option value="qingchunshaonv">青春少女</option>
                  <option value="wenrounansheng">温柔男声</option>
                </motion.select>
              </div>

              {/* Temperature Slider */}
              <div>
                <label className="text-sm text-[#333333] font-medium mb-3 block">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#e0e0e0] rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#ff6600' }}
                  />
                  <motion.div
                    className="absolute top-2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-[#ff6600] rounded-full cursor-pointer shadow"
                    style={{ left: `calc(${temperature * 100}% - 8px)` }}
                    whileHover={{ scale: 1.2 }}
                  />
                </div>
              </div>

              {/* Network Search Toggle */}
              <div>
                <label className="text-sm text-[#333333] font-medium mb-3 block">
                  联网搜索 {networkSearch ? '(已开启)' : '(已关闭)'}
                </label>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNetworkSearch(!networkSearch)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    networkSearch ? 'bg-[#ff6600]' : 'bg-[#cccccc]'
                  }`}
                >
                  <motion.div
                    animate={{ left: networkSearch ? 4 : 'auto', right: networkSearch ? 'auto' : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>

              {/* Connection Status */}
              <div className="pt-6 border-t border-[#e0e0e0]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666666]">连接状态</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? '已连接' : '未连接'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Settings Panel Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Settings Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-[#ff6600] flex items-center gap-2">
                    ⚙️ 设置
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </motion.button>
                </div>

                {/* API Key Section */}
                <div>
                  <label className="text-sm text-[#333333] font-medium mb-3 block">
                    StepFun API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 border-2 border-[#ff6600] rounded-lg text-sm text-[#333333] bg-white outline-none"
                  />
                  <p className="text-xs text-[#999999] mt-2">
                    {apiKey ? '✅ API Key 已配置' : '请输入您的 StepFun API Key'}
                  </p>
                  {!apiKey && (
                    <p className="text-xs text-[#666666] mt-3">
                      获取 API Key：访问 <a href="https://platform.stepfun.com" target="_blank" rel="noopener noreferrer" className="text-[#ff6600] underline">StepFun 平台</a>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-xs text-[#666666]">Powered by StepFun Realtime API</p>
      </footer>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&display=swap');

        .font-sans {
          font-family: 'Noto Sans SC', sans-serif;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #ff6600;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #ff6600;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
      `}</style>
    </div>
  );
}
