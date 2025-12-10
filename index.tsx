// FIX: Removed unused `LiveServerMessage` and `Blob` imports from `@google/genai` which are for the Live API and not used here.
import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";

// --- TYPE DEFINITIONS ---
interface BadgeState {
    unlocked: boolean;
    count?: number;
}

interface Question {
    id: string;
    question: string;
    options: string[];
    answer: string;
    passage?: string;
    type?: 'listening';
    audioText?: string;
    imagePrompt?: string;
    imageBase64?: string;
    userAnswer?: string | null;
}

interface ComicPanel {
    panel_number: number;
    visual_description: string;
    caption: string;
    imageBase64: string | null;
}

interface GameState {
    targetScore: string | null;
    points: number;
    streak: number;
    longestStreak: number;
    lastLoginDate: string | null;
    badges: {
        'grammar-master': BadgeState & { count: number };
        'word-ninja': BadgeState & { count: number };
        'persistent': BadgeState;
    };
    wrongAnswers: Question[];
    completedPlanDays: number[];
    generatedComics: Record<string, ComicPanel[]>; // Cache for comics
}

interface Quiz {
    name: string;
    questions: Question[];
    type: 'weekly' | 'mock';
    topic?: string;
    weeklyTopics?: string[];
    day?: number;
}

interface LearningContent {
    title: string;
    introduction: string;
    keyPoints: any[]; // Define more strictly if possible
    summaryTip: string;
    // Add other fields from your JSON structure
}

// Updated SmartMemo Interface: Detailed List
interface SmartMemo {
    topic: string;
    concept: string; 
    checkpoints: { title: string; detail: string }[]; // Structured points
    trap: string; 
}

// --- ICONS ---
const ICONS = {
    points: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2h4z" /></svg>`,
    streak: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>`,
    grammarMaster: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>`,
    wordNinja: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2.25l.24.03.23.06.24.09.22.12.23.15.21.17.22.2.2.21.15.23.12.22.09.24.06.23.03.24V6l-.03.24-.06.23-.09.24-.12.22-.15.23-.17.21-.2.22-.21.2-.23.15-.22.12-.24.09-.23.06-.24.03L12 9l-.24-.03-.23-.06-.24-.09-.22-.12-.23-.15-.21-.17-.22-.2-.2.21-.15-.23-.12-.22-.09-.24-.06-.23L6 6l.03-.24.06-.23.09-.24.12-.22.15-.23.17-.21.2-.22.21-.2.23-.15.22-.12.24-.09.23-.06.24-.03L12 2.25zM12 2.25l-.24.03-.23.06-.24.09-.22.12-.23-.15-.21-.17-.22.2-.2.21L6 6v12l6-3.6 6 3.6V6l-5.75-3.45z" /><circle cx="12" cy="12" r="2.25" /></svg>`,
    aiTutor: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5m0 14v-1M5.636 5.636l-.707-.707M19.071 19.071l-.707-.707M18.364 5.636l.707-.707M4.929 19.071l.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
    playAudio: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`,
    target: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`,
    cross: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 017.072 0l-.707.707M12 21V11a5 5 0 0110 0v5a5 5 0 01-10 0z" /></svg>`,
    practice: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
    remove: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
    memo: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
    comic: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
};

// --- GEMINI SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- HELPER FUNCTIONS ---
function cleanAndParseJSON(str: string): any {
    try {
        // First try standard parse
        return JSON.parse(str);
    } catch (e) {
        // Cleaning: Remove markdown code blocks and whitespace
        let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
        // Sometimes models add explanatory text at start or end, try to find the JSON object/array
        const firstOpenBrace = cleaned.indexOf('{');
        const firstOpenBracket = cleaned.indexOf('[');
        const lastCloseBrace = cleaned.lastIndexOf('}');
        const lastCloseBracket = cleaned.lastIndexOf(']');
        
        let start = -1; 
        let end = -1;

        if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
            start = firstOpenBrace;
            end = lastCloseBrace;
        } else if (firstOpenBracket !== -1) {
            start = firstOpenBracket;
            end = lastCloseBracket;
        }

        if (start !== -1 && end !== -1) {
            cleaned = cleaned.substring(start, end + 1);
        }

        return JSON.parse(cleaned);
    }
}


// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const app = document.getElementById('app');
    const screens = {
        welcome: document.getElementById('welcome-screen'),
        plan: document.getElementById('plan-screen'),
        learning: document.getElementById('learning-screen'),
        quiz: document.getElementById('quiz-screen'),
        feedback: document.getElementById('feedback-screen'),
        profile: document.getElementById('profile-screen'),
        'mock-test': document.getElementById('mock-test-screen'),
        weakness: document.getElementById('weakness-screen'),
        flashcard: document.getElementById('flashcard-screen'),
    };
    const nav = {
        points: document.getElementById('nav-points'),
        streak: document.getElementById('nav-streak'),
        pointsMobile: document.getElementById('nav-points-mobile'),
        streakMobile: document.getElementById('nav-streak-mobile'),
    };
    const aiModal = {
        container: document.getElementById('ai-modal'),
        title: document.getElementById('ai-modal-title'),
        explanation: document.getElementById('ai-explanation'),
        practiceArea: document.getElementById('ai-practice-area'),
        closeBtn: document.getElementById('close-ai-modal-btn'),
    };
    const memoModal = {
        container: document.getElementById('smart-memo-modal'),
        content: document.getElementById('memo-content'),
        closeBtn: document.getElementById('close-memo-btn'),
    };
    

    // --- STATE MANAGEMENT ---
    let gameState: GameState;
    let currentQuiz: Quiz = { name: '', questions: [], type: 'weekly' };
    let timerInterval: number | null = null;
    let currentLearningDay: number | null = null;
    let currentTopic: string = ''; // Track active topic
    let outputAudioContext: AudioContext | null = null;
    let preloadedAudioBuffers = new Map<string, AudioBuffer>();
    let currentScreenId: string = '';
    let displayedDate = new Date();
    let shuffledWrongAnswers: Question[] = [];
    let currentFlashcardIndex: number = 0;
    

    const defaultState: GameState = {
        targetScore: null,
        points: 0,
        streak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        badges: {
            'grammar-master': { unlocked: false, count: 0 },
            'word-ninja': { unlocked: false, count: 0 },
            'persistent': { unlocked: false }
        },
        wrongAnswers: [],
        completedPlanDays: [],
        generatedComics: {},
    };

    function saveState() {
        localStorage.setItem('toeicGameState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('toeicGameState');
        const state: any = savedState ? JSON.parse(savedState) : { ...defaultState };

        for (const key of Object.keys(defaultState) as Array<keyof GameState>) {
            if (!(key in state)) {
                state[key] = defaultState[key];
            }
        }
        if (!state.badges) {
            state.badges = {};
        }
        for (const badgeKey of Object.keys(defaultState.badges) as Array<keyof typeof defaultState.badges>) {
            if (!(badgeKey in state.badges)) {
                 state.badges[badgeKey] = defaultState.badges[badgeKey];
            }
        }
        if (!state.generatedComics) {
            state.generatedComics = {};
        }
        
        gameState = state as GameState;
        
        handleStreak();
        updateNavbar();
    }

    function handleStreak() {
        const today = new Date().toISOString().slice(0, 10);
        if (gameState.lastLoginDate === today) return;

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        
        if (gameState.lastLoginDate === yesterday) {
            gameState.streak++;
        } else {
            gameState.streak = 1;
        }
        
        if (gameState.streak > gameState.longestStreak) {
            gameState.longestStreak = gameState.streak;
        }
        
        gameState.lastLoginDate = today;
        checkAndUnlockBadges();
        saveState();
    }

    // --- UI & NAVIGATION ---
    function showScreen(screenId) {
        if (currentScreenId === screenId) return;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const currentScreen = screens[currentScreenId];
        if (currentScreen) {
            currentScreen.classList.remove('screen-active');
            setTimeout(() => currentScreen.classList.add('hidden'), 400); // Hide after transition
        }
        
        const nextScreen = screens[screenId];
        if (nextScreen) {
            nextScreen.classList.remove('hidden');
            // Use a timeout to allow the DOM to update before adding the active class for the transition
            setTimeout(() => {
                nextScreen.classList.add('screen-active');
                window.scrollTo(0, 0);
            }, 50);
        }
        
        currentScreenId = screenId;
    }

    function updateNavbar() {
        const pointsTextDesktop = `${ICONS.points} <span class="hidden lg:inline">積分:</span> ${gameState.points}`;
        const streakTextDesktop = `${ICONS.streak} <span class="hidden lg:inline">連續</span> ${gameState.streak} <span class="hidden lg:inline">天</span>`;
        const pointsTextMobile = `${ICONS.points} 積分: ${gameState.points}`;
        const streakTextMobile = `${ICONS.streak} 連續 ${gameState.streak} 天`;
        nav.points.innerHTML = pointsTextDesktop;
        nav.streak.innerHTML = streakTextDesktop;
        nav.pointsMobile.innerHTML = pointsTextMobile;
        nav.streakMobile.innerHTML = streakTextMobile;
    }

    function typewriterEffect(element, text, callback) {
        let i = 0;
        element.innerHTML = '';
        const typing = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
                if (callback) callback();
            }
        }, 80);
    }
    
    function showConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#a3e635', '#f97316', '#ec4899', '#38bdf8', '#facc15'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    function showCongratsAnimation() {
        const modal = document.getElementById('congrats-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    const loadingMessages = [
        'AI 智慧助教正在為您生成專屬教材...',
        '分析您的學習弱點...',
        '客製化專屬教材中...',
        '建構知識模型...',
        '為您打造最佳學習路徑...',
        '考官出題中，請稍候...'
    ];

    function getLoaderHTML(customMessage = '') {
        const message = customMessage || loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        return `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="loading-animation">
                    <div class="orbit"></div>
                    <div class="orbit"></div>
                    <div class="orbit"></div>
                </div>
                <p class="mt-6 text-slate-400 text-center">${message}</p>
            </div>`;
    }


    function init() {
        loadState();
        if (!gameState.targetScore) {
            showScreen('welcome');
            const welcomeTitle = document.getElementById('welcome-title');
            const titleText = '歡迎來到多益智慧學習夥伴';
            typewriterEffect(welcomeTitle, titleText, null);
        } else {
            renderPlan();
            showScreen('plan');
        }
        setupEventListeners();
        try {
            outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch(e) {
            console.error("Web Audio API is not supported in this browser");
        }
    }

    // --- DATA ---
    const studyTopics_550 = [
        { topic: '辦公室情境單字', prompt: 'TOEIC常見的辦公室用品與設備相關單字', type: 'vocabulary' },
        { topic: '現在簡單式 vs. 現在進行式', prompt: '現在簡單式與現在進行式在多益文法題中的區別與應用', type: 'grammar' },
        { topic: '基本介係詞 (in, on, at)', prompt: '時間與地點介係詞 in, on, at 的基本用法', type: 'grammar' },
        { topic: '人事相關單字', prompt: 'TOEIC常見的招聘、職位、部門相關單字', type: 'vocabulary' },
        { topic: '過去簡單式', prompt: '過去簡單式的動詞變化與時間副詞搭配', type: 'grammar' },
        { topic: 'WH-疑問句聽力技巧', prompt: '如何在聽力測驗中快速掌握WH問句的關鍵字', type: 'listening' },
        { topic: '餐飲與餐廳單字', prompt: '點餐、預約、用餐相關的多益單字', type: 'vocabulary' },
        { topic: '未來簡單式 (will vs. be going to)', prompt: 'will 與 be going to 在表達未來計畫與預測時的區別', type: 'grammar' },
        { topic: '可數與不可數名詞', prompt: '分辨可數與不可數名詞，以及搭配的量詞 (many, much, a few, a little)', type: 'grammar' },
        { topic: '購物與消費單字', prompt: '關於詢價、付款、退貨的多益單字', type: 'vocabulary' },
        { topic: '主格與受格代名詞', prompt: 'I/me, he/him, she/her 等主格與受格代名詞的正確用法', type: 'grammar' },
        { topic: 'Part 1 照片描述題技巧', prompt: '多益聽力 Part 1 中，如何根據照片中的人、事、物來判斷正確答案', type: 'listening' },
        { topic: '旅行與交通單字', prompt: '關於機場、飯店、交通工具的多益單字', type: 'vocabulary' },
        { topic: '情態助動詞 (can, could, should)', prompt: 'can, could, should 等情態助動詞在表達能力、可能性、建議時的用法', type: 'grammar' },
        { topic: '形容詞比較級與最高級', prompt: '形容詞比較級 (-er/more) 與最高級 (-est/most) 的規則與不規則變化', type: 'grammar' },
        { topic: '健康與醫療單字', prompt: '關於預約看診、描述症狀、藥物的多益單字', type: 'vocabulary' },
        { topic: '基本連接詞 (and, but, or, so)', prompt: '使用 and, but, or, so 等連接詞來串連句子', type: 'grammar' },
        { topic: 'Part 5 句子填空題基礎策略', prompt: '多益閱讀 Part 5 中，如何從詞性與語意判斷正確答案', type: 'reading' },
        { topic: '日常生活單字', prompt: '描述每日例行公事、家事、休閒活動的相關單字', type: 'vocabulary' },
        { topic: '所有格形容詞與代名詞', prompt: '分辨 my/mine, your/yours 等所有格形容詞與代名詞的用法', type: 'grammar' },
        { topic: '冠詞 (a, an, the)', prompt: '冠詞 a, an, the 的基本用法與常見錯誤', type: 'grammar' },
        { topic: '天氣與季節單字', prompt: '描述天氣狀況與四季的相關單字', type: 'vocabulary' },
        { topic: '頻率副詞', prompt: 'always, usually, sometimes, never 等頻率副詞的位置與用法', type: 'grammar' },
        { topic: '短文訊息閱讀', prompt: '如何快速閱讀多益 Part 7 中的簡訊、即時訊息等短文並找到關鍵資訊', type: 'reading' }
    ];

    const studyTopics_650 = [
        { topic: '會議與協商單字', prompt: '關於安排會議、提出意見、協商條款的TOEIC單字', type: 'vocabulary' },
        { topic: '現在完成式', prompt: '現在完成式 (has/have + p.p.) 的用法與常考時機', type: 'grammar' },
        { topic: '動名詞 vs. 不定詞', prompt: '分辨動詞後應接動名詞(V-ing)還是不定詞(to V)', type: 'grammar' },
        { topic: '形容詞與副詞', prompt: '形容詞與副詞的詞性、位置與用法辨析', type: 'grammar' },
        { topic: '行銷與銷售單字', prompt: '關於廣告、市場、銷售策略的TOEIC單字', type: 'vocabulary' },
        { topic: 'Part 2 聽力應答策略', prompt: '多益聽力 Part 2 (應答問題) 的常見陷阱與應對技巧', type: 'listening' },
        { topic: '企業組織與架構單字', prompt: '關於總部、分公司、部門職稱的TOEIC單字', type: 'vocabulary' },
        { topic: '過去完成式', prompt: '過去完成式 (had + p.p.) 的用法，以及與過去簡單式的比較', type: 'grammar' },
        { topic: '被動語態', prompt: '主動語態與被動語態的轉換與應用時機', type: 'grammar' },
        { topic: '科技與設備單字', prompt: '關於電腦軟硬體、辦公設備操作的TOEIC單字', type: 'vocabulary' },
        { topic: '關係代名詞 (who, whom, whose)', prompt: '關係子句中，分辨何時使用 who, whom, whose', type: 'grammar' },
        { topic: 'Part 3 短對話聽力策略', prompt: '多益聽力 Part 3 中，如何從對話中找到三人對話的關鍵資訊', type: 'listening' },
        { topic: '銀行與金融單字', prompt: '關於開戶、轉帳、貸款、投資的TOEIC單字', type: 'vocabulary' },
        { topic: '未來進行式', prompt: '未來進行式 (will be + V-ing) 的用法，強調未來某個時間點正在發生的動作', type: 'grammar' },
        { topic: '條件句 (第一類型)', prompt: '與未來事實相關的條件句 (If + S + V(現在式), S + will + V)', type: 'grammar' },
        { topic: '客戶服務單字', prompt: '關於處理客訴、提供售後服務的TOEIC單字', type: 'vocabulary' },
        { topic: '分詞作形容詞', prompt: '現在分詞(-ing)與過去分詞(-ed)作為形容詞修飾名詞的用法區別 (e.g., interesting vs. interested)', type: 'grammar' },
        { topic: 'Part 6 短文填空策略', prompt: '多益閱讀 Part 6 中，如何根據上下文選擇正確的單字、片語或句子', type: 'reading' },
        { topic: '供應鏈與物流單字', prompt: '關於訂購、庫存、運送的TOEIC單字', type: 'vocabulary' },
        { topic: '間接問句', prompt: '將直接問句轉換為禮貌的間接問句的句型結構', type: 'grammar' },
        { topic: '使役動詞 (make, have, let)', prompt: 'make, have, let 後面接原形動詞的特殊用法', type: 'grammar' },
        { topic: '商務旅行單字', prompt: '關於預訂機票、住宿、安排行程的TOEIC單字', type: 'vocabulary' },
        { topic: '假設語氣 (與現在事實相反)', prompt: '與現在事實相反的假設語氣 (If + S + V-ed, S + would/could + V)', type: 'grammar' },
        { topic: 'Part 7 單篇文章閱讀策略', prompt: '多益閱讀 Part 7 中，如何使用掃讀(skimming)和尋讀(scanning)技巧快速解題', type: 'reading' }
    ];

    const studyTopics_750 = [
        { topic: '財務與預算單字', prompt: '關於預算、發票、投資、會計的TOEIC進階單字', type: 'vocabulary' },
        { topic: '關係代名詞 (who, which, that)', prompt: '關係子句的用法，以及如何選擇正確的關係代名詞', type: 'grammar' },
        { topic: '假設語氣 (If-clauses)', prompt: '現在與過去的假設語氣(條件句)結構與應用', type: 'grammar' },
        { topic: 'Part 3&4 聽力圖表題', prompt: '結合圖表資訊的多益聽力 Part 3 & 4 題型解題技巧', type: 'listening' },
        { topic: '商業書信閱讀', prompt: '分析多益 Part 7 中常見的商業書信(投訴、詢問、通知)結構與常用語句', type: 'reading' },
        { topic: '分詞構句', prompt: '現在分詞(V-ing)與過去分詞(p.p.)當形容詞的用法與簡化子句的技巧', type: 'grammar' },
        { topic: '房地產單字', prompt: '關於租賃、買賣、設施的TOEIC單字', type: 'vocabulary' },
        { topic: '混合條件句', prompt: '混合過去與現在的假設語氣，例如 "If I had studied harder, I would be a doctor now."', type: 'grammar' },
        { topic: '名詞子句', prompt: 'that, wh-疑問詞, if/whether 引導的名詞子句當主詞、受詞、補語的用法', type: 'grammar' },
        { topic: '保險相關單字', prompt: '關於保單、理賠、保險種類的TOEIC單字', type: 'vocabulary' },
        { topic: '強調句型 (It is...that...)', prompt: '使用 It is...that... 的分裂句型來強調句中的特定部分', type: 'grammar' },
        { topic: 'Part 4 短獨白聽力策略', prompt: '多益聽力 Part 4 中，如何根據獨白類型(如電話留言、廣播)預測問題', type: 'listening' },
        { topic: '人力資源單字', prompt: '關於績效評估、員工福利、內部訓練的進階單字', type: 'vocabulary' },
        { topic: '倒裝句 (否定副詞)', prompt: 'Not only, Never, Seldom 等否定副詞放句首時的倒裝結構', type: 'grammar' },
        { topic: '平行結構', prompt: '使用 and, but, or 連接詞性或結構相同的字、片語或子句', type: 'grammar' },
        { topic: '製造業單字', prompt: '關於生產線、品質控管、工廠的TOEIC單字', type: 'vocabulary' },
        { topic: '讓步子句 (Although, even though)', prompt: '使用 although, though, even though 來表達「雖然、儘管」的語意', type: 'grammar' },
        { topic: 'Part 7 雙篇文章閱讀策略', prompt: '多益閱讀 Part 7 中，如何交叉比對兩篇文章的資訊來找出答案', type: 'reading' },
        { topic: '資訊科技單字', prompt: '關於網路安全、數據分析、雲端運算的進階單字', type: 'vocabulary' },
        { topic: '複雜主詞動詞一致', prompt: '處理由 a number of, the number of, one of the... 等片語引導的複雜主詞動詞一致問題', type: 'grammar' },
        { topic: '省略', prompt: '在對等子句或比較結構中省略重複的單字', type: 'grammar' },
        { topic: '法律相關單字', prompt: '關於合約、訴訟、專利的基礎法律詞彙', type: 'vocabulary' },
        { topic: '商業場合的慣用語', prompt: '學習如 "get the ball rolling", "on the same page" 等商業慣用語', type: 'vocabulary' },
        { topic: '推論作者語氣與目的', prompt: '從文章の用詞與結構，推斷作者的寫作目的與態度', type: 'reading' }
    ];

    const studyTopics_850 = [
        { topic: '合約與法律詞彙', prompt: '關於合約條款、法律義務、智慧財產權的TOEIC高階單字', type: 'vocabulary' },
        { topic: '倒裝句', prompt: '否定副詞、假設語氣等引發的倒裝句型結構與用法', type: 'grammar' },
        { topic: '多篇閱讀解題策略', prompt: '高效處理多益 Part 7 雙篇與三篇閱讀的資訊對照與推論技巧', type: 'reading' },
        { topic: '使役動詞與感官動詞', prompt: 'make, have, let, see, hear 等動詞的特殊文法結構', type: 'grammar' },
        { topic: '經濟與市場趨勢單字', prompt: '描述經濟趨勢、市場分析、企業併購的TOEIC高階單字', type: 'vocabulary' },
        { topic: '聽力中的推論題', prompt: '如何從對話語氣和上下文推斷多益聽力題的隱含意義', type: 'listening' },
        { topic: '企業併購詞彙', prompt: '關於收購、合併、融資的高階商業單字', type: 'vocabulary' },
        { topic: '進階連接詞', prompt: 'not only...but also, as well as, no sooner...than 等進階連接詞的用法', type: 'grammar' },
        { topic: '進階被動語態', prompt: 'It is said that... / He is said to... 等特殊被動語態結構', type: 'grammar' },
        { topic: '研發與創新詞彙', prompt: '關於專利、原型、突破性技術的高階單字', type: 'vocabulary' },
        { topic: '懸垂修飾語', prompt: '辨識並修正句子中邏輯主詞不一致的懸垂修飾語 (dangling modifiers)', type: 'grammar' },
        { topic: '聽力中辨識說話者態度', prompt: '從說話者的語調、重音和用字，判斷其贊成、反對、懷疑等態度', type: 'listening' },
        { topic: '股市與投資詞彙', prompt: '關於股票、債券、股息、市場指數的高階財經單字', type: 'vocabulary' },
        { topic: '商業書信中的片語動詞', prompt: '學習 look into, draw up, follow up 等在商業情境中常用的片語動詞', type: 'vocabulary' },
        { topic: '標點符號用法', prompt: '分號、冒號、破折號在正式寫作中的精確用法', type: 'grammar' },
        { topic: '企業倫理詞彙', prompt: '關於利益衝突、企業社會責任、透明度的單字', type: 'vocabulary' },
        { topic: '精辨易混淆單字', prompt: '分辨 affect/effect, ensure/insure/assure, principal/principle 等易混淆單字', type: 'vocabulary' },
        { topic: '閱讀中的隱含資訊', prompt: '練習在多益閱讀中找出並非直接陳述，而是透過文意暗示的資訊', type: 'reading' },
        { topic: '全球化詞彙', prompt: '關於跨國企業、外包、國際貿易的單字', type: 'vocabulary' },
        { topic: '複雜句構分析', prompt: '拆解包含多個子句的長句，理解其結構與語意', type: 'grammar' },
        { topic: '語氣連貫詞', prompt: '精確使用 however, therefore, moreover, in contrast 等詞語來建立文章的邏輯關係', type: 'grammar' },
        { topic: '環保政策詞彙', prompt: '關於永續發展、碳足跡、再生能源的單字', type: 'vocabulary' },
        { topic: '細微語氣與風格', prompt: '辨識正式與非正式、客觀與主觀等不同寫作風格的細微差異', type: 'reading' },
        { topic: '分析閱讀中的論點', prompt: '找出文章中的主要論點、支持性證據以及潛在的假設', type: 'reading' }
    ];
    
    const studyPlans = {
        '550': Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const week = Math.floor(i / 7) + 1;
            if (day % 7 === 0) return { day, type: 'quiz', topic: `第 ${week} 週複習測驗` };
            const studyDayIndex = i - Math.floor(i / 7);
            const { topic, prompt, type } = studyTopics_550[studyDayIndex];
            return { day, type: 'study', topic: topic, promptTopic: prompt, learningType: type };
        }),
        '650': Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const week = Math.floor(i / 7) + 1;
            if (day % 7 === 0) return { day, type: 'quiz', topic: `第 ${week} 週複習測驗` };
            const studyDayIndex = i - Math.floor(i / 7);
            const { topic, prompt, type } = studyTopics_650[studyDayIndex];
            return { day, type: 'study', topic: topic, promptTopic: prompt, learningType: type };
        }),
        '750': Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const week = Math.floor(i / 7) + 1;
            if (day % 7 === 0) return { day, type: 'quiz', topic: `第 ${week} 週複習測驗` };
            const studyDayIndex = i - Math.floor(i / 7);
            const { topic, prompt, type } = studyTopics_750[studyDayIndex];
            return { day, type: 'study', topic: topic, promptTopic: prompt, learningType: type };
        }),
        '850+': Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const week = Math.floor(i / 7) + 1;
            if (day % 7 === 0) return { day, type: 'quiz', topic: `第 ${week} 週複習測驗` };
            const studyDayIndex = i - Math.floor(i / 7);
            const { topic, prompt, type } = studyTopics_850[studyDayIndex];
            return { day, type: 'study', topic: topic, promptTopic: prompt, learningType: type };
        }),
    };
    
    const badgesData = {
        'grammar-master': { name: '文法大師', description: '測驗全對 5 次', icon: ICONS.grammarMaster },
        'word-ninja': { name: '單字忍者', description: '完成 10 個單字學習', icon: ICONS.wordNinja },
        'persistent': { name: '持之以恆', description: '連續簽到 7 天', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>` },
    };


    // --- CORE LOGIC FUNCTIONS ---
    function renderCalendar() {
        const calendarBody = document.getElementById('calendar-body');
        const monthYearEl = document.getElementById('calendar-month-year');
        if (!calendarBody || !monthYearEl) return;

        const year = displayedDate.getFullYear();
        const month = displayedDate.getMonth();
        
        monthYearEl.textContent = `${year}年 ${month + 1}月`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        calendarBody.innerHTML = '';
        const plan = studyPlans[gameState.targetScore] || studyPlans['550'];
        const today = new Date();
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarBody.innerHTML += `<div class="p-1"></div>`;
        }

        for (let day = 1; day <= 28; day++) { // The plan is always 28 days
            const planItem = plan.find(item => item.day === day);
            const isCompleted = gameState.completedPlanDays.includes(day);
            // This logic assumes the plan starts on the 1st day of the current month view.
            // For this app's 28-day structure, we show the 28 days regardless of actual month days.
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            let dayClasses = 'relative p-1.5 h-16 rounded-md flex flex-col justify-start items-start text-sm transition-colors duration-200';
            let dayContent = `<span class="font-semibold">${day}</span>`;
            
            if (planItem) {
                dayClasses += ' cursor-pointer hover:bg-slate-700/50';
                
                const taskIndicator = `<div class="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ${planItem.type === 'quiz' ? 'bg-fuchsia-500' : 'bg-lime-500'}"></div>`;

                if (isCompleted) {
                    dayClasses += ' bg-slate-800 text-slate-500 line-through';
                    dayContent += `<div class="absolute inset-0 flex items-center justify-center text-emerald-500 opacity-40">${ICONS.check.replace('h-6 w-6', 'h-8 w-8').replace('stroke-width="3"', 'stroke-width="2"')}</div>`;
                } else {
                     dayClasses += ' bg-slate-800/50 border border-slate-700';
                }
                 dayContent += taskIndicator;
            } else {
                dayClasses += ' text-slate-600'; // Should not happen with 28-day logic
            }
            
            if (isToday) { // For simplicity, we'll highlight the plan day that matches today's date
                 dayClasses += ' border-2 border-lime-400';
            }
            
            if (day > daysInMonth) {
                // If the 28-day plan spills into the next month visual, grey it out slightly
                // For this implementation, we will just render the 28 days as if they are in one block.
                // The month navigation is for show, the core is the 28 day plan.
            }


            calendarBody.innerHTML += `<div class="${dayClasses}" ${planItem ? `data-day="${day}"` : ''}>${dayContent}</div>`;
        }
    }

    function renderPlan() {
        const planTitle = document.getElementById('plan-title');
        const planGrid = document.getElementById('plan-grid');
        planTitle.innerHTML = `你的 <span class="text-lime-400">[${gameState.targetScore}分]</span> 學習計畫`;
        planGrid.innerHTML = ''; 

        renderCalendar();

        const plan = studyPlans[gameState.targetScore] || studyPlans['550'];

        plan.forEach(item => {
            const isQuiz = item.type === 'quiz';
            const isCompleted = gameState.completedPlanDays.includes(item.day);
            const card = document.createElement('div');
            
            const baseCardClasses = 'p-4 rounded-lg border transition-all duration-300 flex flex-col justify-between transform';
            const completedClasses = 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:-translate-y-1';
            const studyClasses = 'bg-gray-900/60 backdrop-blur-sm border-slate-700 hover:border-lime-400 hover:-translate-y-1 glow-on-hover';
            const quizClasses = 'bg-gray-900/60 backdrop-blur-sm border-2 border-fuchsia-500 quiz-glow transform hover:-translate-y-1';

            card.className = `${baseCardClasses} ${isCompleted ? completedClasses : (isQuiz ? quizClasses : studyClasses)}`;
            card.style.setProperty('--glow-color', isQuiz ? 'rgba(217, 70, 239, 0.4)' : 'rgba(163, 230, 53, 0.4)');
            
            const baseButtonClasses = "plan-action-btn flex-1 text-white font-semibold py-2 px-3 rounded-lg transition-transform transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm";
            let buttonContent = '';
            let buttonClasses = '';

            if (isCompleted) {
                buttonContent = `${ICONS.target.replace('h-6 w-6', 'h-5 w-5')} ${isQuiz ? '再次測驗' : '重新觀看'}`;
                buttonClasses = 'bg-slate-600 hover:bg-slate-500';
            } else {
                buttonContent = isQuiz ? '開始測驗' : '開始學習';
                buttonClasses = isQuiz ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-lime-700 hover:bg-lime-600';
            }
            
            // Add Smart Memo button for Study days
            let smartMemoBtn = '';
            if (!isQuiz) {
                smartMemoBtn = `
                    <button 
                        data-topic="${item.topic}"
                        data-prompt="${item.promptTopic}"
                        class="smart-memo-btn bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1 shadow-lg" title="重點速記">
                        ${ICONS.memo}
                    </button>
                `;
            }

            card.innerHTML = `
                <div>
                    <p class="font-bold text-sm text-slate-400">第 ${item.day} 天</p>
                    <h3 class="font-semibold mt-1 ${isCompleted ? 'text-slate-300' : 'text-slate-100'}">${item.topic}</h3>
                </div>
                <div class="mt-4 flex gap-2">
                    <button 
                        data-day="${item.day}"
                        data-type="${item.type}" 
                        data-topic="${item.topic}"
                        class="${baseButtonClasses} ${buttonClasses}">
                        ${buttonContent}
                    </button>
                    ${smartMemoBtn}
                </div>
            `;
            planGrid.appendChild(card);
        });
    }
    
    // --- SMART MEMO FUNCTIONS (UPDATED) ---
    async function generateSmartMemo(topic: string, promptTopic: string) {
        memoModal.container.classList.remove('hidden');
        memoModal.content.innerHTML = getLoaderHTML('AI 正在為您整理超詳細的重點清單...');
        
        // Detailed, Structured Prompt with Schema for robustness
        const prompt = `你是一位專業的多益(TOEIC)老師。請針對主題「${topic}」(重點：${promptTopic})，為學生製作一張「條列式重點清單」(Structured Study Guide)。
        
        **要求：**
        1. 內容要非常詳細，不要只寫關鍵字，請用完整的句子解釋。
        2. 請使用繁體中文清楚說明，語氣親切易懂。
        3. 確保「核心觀念」能讓學生秒懂。
        4. 「常見陷阱」必須具體指出錯誤用法。
        5. checkpoints 陣列中的內容請詳細列出至少 3 個重點。`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            concept: { type: Type.STRING },
                            checkpoints: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        detail: { type: Type.STRING }
                                    },
                                    required: ["title", "detail"]
                                }
                            },
                            trap: { type: Type.STRING }
                        },
                        required: ["topic", "concept", "checkpoints", "trap"]
                    }
                }
            });
            
            const memoData: SmartMemo = JSON.parse(response.text);
            renderSmartMemo(memoData);
        } catch (error) {
            console.error("Failed to generate Smart Memo:", error);
            memoModal.content.innerHTML = `<div class="text-center p-8"><p class="text-rose-500">抱歉，速記卡生成失敗。</p><p class="text-slate-400 mt-2">請稍後再試。</p></div>`;
        }
    }

    function renderSmartMemo(data: SmartMemo) {
        // Redesigned: Larger text, better readability
        const html = `
            <div class="space-y-6">
                <!-- Concept Card -->
                <div class="text-center pb-5 border-b border-slate-600">
                    <p class="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-3">CORE CONCEPT</p>
                    <p class="text-xl font-bold text-white leading-snug">${data.concept}</p>
                </div>

                <!-- Checkpoints List -->
                <div>
                     <p class="text-slate-400 text-xs font-extrabold uppercase tracking-widest mb-4 pl-1">CHECKPOINTS</p>
                    <ul class="space-y-4">
                        ${data.checkpoints.map((item, index) => `
                            <li class="bg-slate-900 rounded-xl p-4 border border-slate-600 flex items-start gap-4">
                                <div class="bg-amber-500 text-gray-900 font-bold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">${index + 1}</div>
                                <div>
                                    <p class="text-emerald-300 font-bold text-base mb-2">${item.title}</p>
                                    <p class="text-slate-300 text-base leading-relaxed">${item.detail}</p>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Mistake Warning -->
                ${data.trap ? `
                <div class="bg-rose-950/40 p-5 rounded-xl border border-rose-900/50">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-rose-500">${ICONS.cross.replace('h-6 w-6', 'h-5 w-5')}</span>
                        <span class="text-rose-500 text-xs font-extrabold uppercase">COMMON TRAP</span>
                    </div>
                    <p class="text-slate-200 text-base font-medium pl-7 leading-relaxed">${data.trap}</p>
                </div>
                ` : ''}
            </div>
        `;
        memoModal.content.innerHTML = html;
    }


    function renderLearningContentFromJSON(data: LearningContent, container: HTMLElement) {
        let html = '';
        if (data.introduction) {
            html += `<p class="mb-8 text-lg">${data.introduction}</p>`;
        }
        if (data.keyPoints) {
            data.keyPoints.forEach(point => {
                let explanationHTML = point.explanation
                    .replace(/🎯 \*\*(.*?)\*\*/g, `<h4 class="text-xl font-bold text-slate-100 mb-3 flex items-start gap-3">${ICONS.target}<span>$1</span></h4>`)
                    .replace(/✔ \*\*(.*?)\*\*/g, `<h5 class="text-lg font-semibold text-emerald-400 mt-4 mb-2 flex items-center gap-2">${ICONS.check.replace('stroke-width="3"', 'stroke-width="2"')}<span>$1</span></h5>`)
                    .replace(/❌ \*\*(.*?)\*\*/g, `<h5 class="text-lg font-semibold text-rose-400 mt-4 mb-2 flex items-center gap-2">${ICONS.cross.replace('stroke-width="3"', 'stroke-width="2"')}<span>$1</span></h5>`);

                html += `
                    <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-6 border-l-4 border-lime-500">
                        ${explanationHTML}
                `;

                if (point.examples && point.examples.length > 0) {
                    html += '<div class="space-y-3 mt-4">';
                    point.examples.forEach(example => {
                        if (example.type === 'vocab' && example.word) {
                            html += `
                                <div class="border-t border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div class="md:col-span-1">
                                    ${example.imageBase64 ? `<img src="data:image/png;base64,${example.imageBase64}" alt="${example.word}" class="rounded-lg w-full h-auto object-cover aspect-square">` : '<div class="bg-slate-700 rounded-lg w-full aspect-square"></div>'}
                                    </div>
                                    <div class="md:col-span-2">
                                        <p><strong class="text-lime-400 font-semibold text-lg">${example.word}</strong> <span class="text-sm text-slate-400">(${example.pos})</span>: ${example.translation}</p>
                                        <p class="text-slate-300 text-sm mt-1 italic">"${example.sentence}"</p>
                                        ${example.sentence_translation ? `<p class="text-slate-400 text-xs mt-1">(${example.sentence_translation})</p>` : ''}
                                    </div>
                                </div>
                            `;
                        } else if (example.sentence) { // Grammar example
                            const isCorrect = example.type === 'correct';
                            const bgColor = isCorrect ? 'bg-emerald-900/50 border-emerald-700' : 'bg-rose-900/50 border-rose-700';
                            const icon = isCorrect ? ICONS.check.replace('h-6 w-6', 'h-5 w-5') : ICONS.cross.replace('h-6 w-6', 'h-5 w-5');
                            html += `
                                <div class="p-4 rounded-lg border ${bgColor} space-y-2">
                                    <div class="flex items-start gap-3">
                                        <span class="mt-1 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">${icon}</span>
                                        <p class="flex-1">${example.sentence}</p>
                                    </div>
                                    ${example.explanation ? `<p class="text-sm text-slate-300 border-t border-slate-700 pt-2 mt-2">${example.explanation}</p>` : ''}
                                </div>`;
                        }
                    });
                    html += '</div>';
                }
                html += '</div>'; // close card
            });
        }
        
        // Comic Strip Section Container
        html += `
            <div id="comic-strip-section" class="mt-8 mb-8 bg-gray-900/80 p-6 rounded-lg border border-indigo-500/30">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                     <div>
                        <h3 class="text-xl font-bold text-white flex items-center gap-2">🎨 AI 英語四格漫畫</h3>
                        <p class="text-slate-400 text-sm mt-1">AI 全英語漫畫，沉浸式學習今日文法。(內容將永久保存)</p>
                     </div>
                     <button id="generate-comic-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition shadow-lg flex items-center gap-2 whitespace-nowrap">
                        ${ICONS.comic} 查看/生成漫畫
                     </button>
                </div>
                <div id="comic-display-area" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            </div>
        `;

        if (data.summaryTip) {
            html += `
                <div class="bg-sky-900/50 border-l-4 border-sky-600 text-sky-300 p-4 rounded-r-lg mt-8">
                    <p class="font-bold flex items-center gap-2">${ICONS.lightbulb} 學習小提示</p>
                    <p class="mt-2">${data.summaryTip}</p>
                </div>
            `;
        }
        container.innerHTML = html;
        
        // Add event listener for comic button after HTML injection
        const comicBtn = document.getElementById('generate-comic-btn');
        if (comicBtn) {
            comicBtn.addEventListener('click', () => handleGenerateComic(currentTopic));
        }
    }
    
    // --- COMIC STRIP GENERATION (UPDATED WITH ROOT OBJECT SCHEMA & ROBUSTNESS) ---
    async function handleGenerateComic(topic: string) {
        const displayArea = document.getElementById('comic-display-area');
        const btn = document.getElementById('generate-comic-btn') as HTMLButtonElement;
        
        if (!displayArea || !btn) return;
        
        // CHECK CACHE FIRST
        if (gameState.generatedComics[topic]) {
            displayArea.classList.remove('hidden');
            renderCachedComic(gameState.generatedComics[topic], displayArea);
            btn.innerHTML = `${ICONS.check} 已載入漫畫`;
            btn.disabled = true;
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="audio-loader"></span> 繪製中...`;
        displayArea.classList.remove('hidden');
        displayArea.innerHTML = getLoaderHTML('AI 漫畫家正在構思全英語劇本...');
        
        try {
            // 1. Generate Storyboard using Gemini Flash with ResponseSchema
            const storyboardPrompt = `You are a creative English teacher and comic scriptwriter.
            Create a 4-panel comic strip script to illustrate the grammar/topic: "${topic}".
            
            Requirements:
            1. Ensure the 4 panels tell a continuous, coherent story with a clear beginning, middle, and end.
            2. "caption" MUST be in English only. No Chinese.
            3. "visual_description" must be a descriptive prompt for an image generator (e.g., "A cartoon style illustration of..."). Keep it simple and focused on the action.
            `;
            
            // Using a random seed for variety
            const seed = Math.floor(Math.random() * 1000000);

            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: storyboardPrompt,
                config: { 
                    responseMimeType: "application/json",
                    // Wrap array in an object for better JSON mode stability
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            panels: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        panel_number: { type: Type.INTEGER },
                                        visual_description: { type: Type.STRING },
                                        caption: { type: Type.STRING }
                                    },
                                    required: ["panel_number", "visual_description", "caption"]
                                }
                            }
                        }
                    },
                    seed: seed
                }
            });
            
            const json = JSON.parse(textResponse.text);
            const panels: ComicPanel[] = json.panels;
            
            if (!Array.isArray(panels) || panels.length === 0) {
                throw new Error("Invalid comic script format returned by AI.");
            }

            // 2. Generate Images in Parallel
            displayArea.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center p-8">
                    <p class="text-indigo-400 font-bold text-lg mb-4">腳本完成，正在繪製 4 張插圖...</p>
                    <div class="grid grid-cols-2 gap-4 opacity-50">
                         <div class="aspect-square bg-slate-800 rounded animate-pulse"></div>
                         <div class="aspect-square bg-slate-800 rounded animate-pulse"></div>
                         <div class="aspect-square bg-slate-800 rounded animate-pulse"></div>
                         <div class="aspect-square bg-slate-800 rounded animate-pulse"></div>
                    </div>
                </div>
            `;

            const imagePromises = panels.map(async (panel, index) => {
                try {
                    // Add a tiny random delay to prevent hitting rate limits perfectly simultaneously
                    await new Promise(r => setTimeout(r, index * 100 + Math.random() * 200));

                    const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image', 
                        contents: { parts: [{ text: panel.visual_description + ", american comic style, colorful, flat vector art, high quality, textless" }] },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
                    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    return {
                        ...panel,
                        imageBase64: imagePart ? imagePart.inlineData.data : null
                    };
                } catch (e) {
                    console.error("Image gen failed for panel", panel.panel_number, e);
                    // Return panel without image instead of failing completely
                    return { ...panel, imageBase64: null };
                }
            });

            const results = await Promise.all(imagePromises);
            
            // SAVE TO CACHE
            gameState.generatedComics[topic] = results;
            saveState();
            
            // 3. Render
            renderCachedComic(results, displayArea);
            btn.innerHTML = `${ICONS.check} 完成`;

        } catch (error) {
            console.error("Comic generation error:", error);
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            displayArea.innerHTML = `
                <div class="col-span-1 md:col-span-2 p-4 bg-rose-900/30 border border-rose-700 rounded-lg text-center">
                    <p class="text-rose-400 font-bold">漫畫生成遇到問題</p>
                    <p class="text-slate-400 text-sm mt-1">AI 忙碌中或網路不穩，請稍後再試。</p>
                    <p class="text-slate-500 text-xs mt-2">${errorMsg}</p>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = `${ICONS.comic} 重試生成`;
        }
    }
    
    function renderCachedComic(panels: ComicPanel[], container: HTMLElement) {
        let gridHtml = '';
        panels.forEach(panel => {
                gridHtml += `
                <div class="comic-panel rounded-lg overflow-hidden flex flex-col relative group">
                    <div class="aspect-square bg-slate-800 w-full relative">
                            ${panel.imageBase64 
                            ? `<img src="data:image/png;base64,${panel.imageBase64}" class="w-full h-full object-cover" alt="Panel ${panel.panel_number}">`
                            : `<div class="flex items-center justify-center h-full text-slate-500 flex-col"><p>圖片生成失敗</p><p class="text-xs">(${panel.visual_description.substring(0, 20)}...)</p></div>`
                            }
                            <div class="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                            #${panel.panel_number}
                            </div>
                    </div>
                    <div class="comic-caption-box p-4 flex-grow flex flex-col justify-center text-center border-t-2 border-black">
                        <p class="text-lg font-bold leading-tight text-slate-900 font-sans">"${panel.caption}"</p>
                    </div>
                </div>
                `;
        });
        container.innerHTML = gridHtml;
    }


    async function generateAndDisplayLearningContent(day) {
        const plan = studyPlans[gameState.targetScore] || studyPlans['550'];
        const item = plan.find(p => p.day === day);
        if (!item) return;

        currentLearningDay = day;
        currentTopic = item.topic; 

        document.getElementById('learning-title').textContent = item.topic;
        const contentDiv = document.getElementById('learning-content');
        
        showScreen('learning');
        contentDiv.innerHTML = getLoaderHTML();
        
        try {
            const learningData = await generateLearningContent(item.topic, item.promptTopic, day);
            document.getElementById('learning-title').textContent = learningData.title || item.topic;
            renderLearningContentFromJSON(learningData, contentDiv);
        } catch (error) {
            console.error("Gemini API Error or JSON parsing error:", error);
            contentDiv.innerHTML = `<div class="text-center p-8"><p class="text-rose-500">抱歉，教材生成失敗。</p><p class="text-slate-400 mt-2">可能是 AI 回傳格式有誤或網路連線問題，請稍後再試。</p></div>`;
        }
    }

    async function generateLearningContent(topic: string, promptTopic: string, day: number): Promise<LearningContent> {
        const prompt = `你是一位專業的多益(TOEIC)老師，正在為一位目標分數 [${gameState.targetScore}] 的台灣高中生準備教材。
        今日主題是：「${topic}」。
        請針對「${promptTopic}」這個核心，生成一份簡潔、生動、且易於理解的教學內容。

        **重要：** 請嚴格以 JSON 格式回傳，不要包含任何 JSON 區塊標記(e.g., \`\`\`json ... \`\`\`)。
        在 "explanation" 欄位中，請使用以下的 Markdown-like 標記來豐富排版：
        - "🎯 **標題**" 來標示核心觀念。

        **JSON 結構必須如下：**
        {
          "title": "今日主題的標題",
          "introduction": "對今日主題的簡短介紹，約2-3句話。",
          "keyPoints": [
            {
              "subtitle": "知識點一的子標題",
              "explanation": "對這個知識點的詳細解釋。請在此處使用上述的特殊標記來排版，例如：'🎯 **現在簡單式用法**'。",
              "examples": [
                { "type": "correct", "sentence": "一個文法正確的範例句子。", "explanation": "針對此句的簡短中文說明。" },
                { "type": "incorrect", "sentence": "一個文法錯誤的範例句子，用來對比。", "explanation": "針對此錯誤的簡短中文說明。" }
              ]
            },
            {
              "subtitle": "相關單字學習",
              "explanation": "關於這些單字的簡短說明。",
              "examples": [
                { "type": "vocab", "word": "vocabulary", "pos": "n.", "translation": "詞彙", "sentence": "Expanding your vocabulary is crucial for the TOEIC test.", "sentence_translation": "擴充你的詞彙量對於多益考試至關重要。", "imagePrompt": "A single, clear photograph of a dictionary open to a page with illustrated words, clean studio lighting." }
              ]
            }
          ],
          "summaryTip": "一段總結性的學習小提示，幫助學生記住今日重點。"
        }

        請確保內容有足夠的深度，並使用繁體中文。對於 'vocab' 類型的 example，請務必加上 'imagePrompt' 欄位，內容為一句簡短的、用於 AI 生成圖片的英文描述。對於文法 example，請務必加上 'explanation' 欄位，簡短說明該範例的重點。`;
        
        const scoreNumber = parseInt(String(gameState.targetScore).replace('+', ''));
        const seed = scoreNumber * 100 + day;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                seed: seed,
                temperature: 0.2,
            }
        });
        const learningData = cleanAndParseJSON(response.text);

        if (learningData.keyPoints) {
            const vocabItems = learningData.keyPoints
                .flatMap(kp => kp.examples || [])
                .filter(ex => ex.type === 'vocab' && ex.imagePrompt);

            const imageGenerationPromises = vocabItems.map(async (item) => {
                try {
                    const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: item.imagePrompt }] },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
                    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (imagePart) {
                        item.imageBase64 = imagePart.inlineData.data;
                    }
                } catch (imgError) {
                    console.error(`Failed to generate image for prompt: "${item.imagePrompt}"`, imgError);
                }
            });
            await Promise.all(imageGenerationPromises);
        }
        return learningData;
    }

    async function generateQuizFromAI(topic: string, weeklyTopics: string[]) {
        const topicsString = weeklyTopics.map(t => `- ${t}`).join('\n');

        const prompt = `你是一位專業的多益(TOEIC)出題老師，正在為一位目標分數 [${gameState.targetScore}] 的台灣高中生設計一份每週複習測驗。
        測驗主題是：「${topic}」。

        這份測驗的目的是複習本週所學的內容。請根據以下本週學習過的幾個主題來出題：
        ${topicsString}

        **測驗要求：**
        1.  **題目數量：** 請生成一份包含 5 道題目的測驗。
        2.  **內容相關性：** 所有題目都必須與上述提供的本週學習主題緊密相關。
        3.  **題型混合：** 測驗中必須包含**聽力題**和**閱讀題**。請確保至少有 1 題聽力題和 1 題閱讀題。剩下的題目可以是文法或單字題。
        
        **JSON 格式與結構要求 (極度重要)：**
        - 請嚴格以 JSON 格式回傳一個包含 5 個問題物件的陣列，不要包含任何 JSON 區塊標記 (e.g., \`\`\`json ... \`\`\`)。
        - 每個問題物件都必須包含 'id' (格式為'q'加上數字和類型，例如 'q1_gram'), 'question', 'options' (一個包含4個字串的陣列), 和 'answer' (正確答案的字串)。
        - **聽力題 (Listening):** 聽力題物件必須額外包含 'type':'listening' 和 'audioText' (朗讀的文本) 欄位。
        - **閱讀題 (Reading):** 閱讀題物件必須額外包含一個 'passage' 欄位，內容為一篇與本週主題相關的簡短商業書信、公告或廣告。問題必須與文章內容相關。

        **JSON 結構範例:**
        [
          { "id": "q1_gram", "question": "與本週主題相關的文法題...", "options": ["A", "B", "C", "D"], "answer": "B" },
          { "id": "q2_listen", "type": "listening", "audioText": "與本週主題相關的對話或獨白...", "question": "What are the speakers discussing?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "answer": "Option 1" },
          { "id": "q3_read", "passage": "與本週主題相關的短文...", "question": "What is the purpose of this memo?", "options": ["To announce...", "To introduce...", "To inform...", "To schedule..."], "answer": "To inform..." }
        ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let questions: Question[] = cleanAndParseJSON(response.text);

        const imageGenerationPromises = questions
            .filter(q => q.imagePrompt)
            .map(async (q) => {
                try {
                     const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: q.imagePrompt }] },
                        config: {
                            responseModalities: [Modality.IMAGE],
                        },
                    });
                    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (imagePart) {
                        q.imageBase64 = imagePart.inlineData.data;
                    }
                } catch (imgError) {
                    console.error(`Failed to generate image for prompt: "${q.imagePrompt}"`, imgError);
                }
                return q;
            });
            
        await Promise.all(imageGenerationPromises);
        questions.filter(q => q.type === 'listening').forEach(q => preloadAudio(q.id, q.audioText));
        return questions;
    }

    async function startQuiz(topic, weeklyTopics, day) {
        currentQuiz = { name: topic, questions: [], type: 'weekly', topic: topic, weeklyTopics: weeklyTopics, day: day };
        currentTopic = topic; // Update context
        
        const quizForm = document.getElementById('quiz-form');
        const quizHeader = document.getElementById('quiz-header');

        quizHeader.innerHTML = `<h2 class="text-2xl font-bold text-slate-100 mb-4">${topic}</h2>`;
        showScreen('quiz');
        
        quizForm.innerHTML = getLoaderHTML('AI 考官正在為您生成專屬測驗...');
        (document.getElementById('submit-quiz-btn') as HTMLButtonElement).disabled = true;

        try {
            const questions = await generateQuizFromAI(topic, weeklyTopics);
            if (questions && questions.length > 0) {
                currentQuiz.questions = questions;
                renderQuizForm(quizForm, currentQuiz);
            } else {
                throw new Error("AI did not return any questions.");
            }
        } catch (error) {
            console.error("Quiz generation failed:", error);
            quizForm.innerHTML = `<div class="text-center p-8"><p class="text-rose-500">抱歉，測驗生成失敗。</p><p class="text-slate-400 mt-2">請稍後再試。</p></div>`;
        } finally {
            (document.getElementById('submit-quiz-btn') as HTMLButtonElement).disabled = false;
        }
    }


    function renderQuizForm(formElement, quiz) {
        formElement.innerHTML = '';
        quiz.questions.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'mb-6 p-4 border border-slate-700 rounded-lg bg-gray-900/50';
            
            let questionContent = '';
            if (q.passage) {
                questionContent += `<div class="mb-4 p-3 bg-gray-900 border border-slate-700 rounded-md text-slate-300 whitespace-pre-wrap">${q.passage}</div>`;
            }
            if (q.imageBase64) {
                 questionContent += `<div class="mb-4"><img src="data:image/png;base64,${q.imageBase64}" alt="Quiz image" class="rounded-lg max-w-sm mx-auto"></div>`;
            }

            let questionHeader = `<p class="font-semibold mb-2 text-slate-100">${index + 1}. ${q.question}</p>`;
            if (q.type === 'listening' && q.audioText) {
                questionHeader = `
                    <div class="flex items-center space-x-3 mb-2">
                        <button type="button" class="play-audio-btn p-2 rounded-full bg-lime-600 hover:bg-lime-500 text-white transition" data-question-id="${q.id}" data-audio-text="${q.audioText}">
                            <span class="button-icon">${ICONS.playAudio}</span>
                        </button>
                        <p class="font-semibold text-slate-100">${index + 1}. ${q.question}</p>
                    </div>
                `;
            }

            const optionsHTML = q.options.map(option => `
                <label class="flex items-center space-x-3 p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-lime-400 transition cursor-pointer bg-gray-800/50">
                    <input type="radio" name="question-${q.id}" value="${option}" class="text-lime-500 focus:ring-lime-500 bg-slate-700 border-slate-600" required>
                    <span>${option}</span>
                </label>
            `).join('');
            
            questionEl.innerHTML = questionContent + questionHeader + `<div class="space-y-2 mt-3">${optionsHTML}</div>`;
            formElement.appendChild(questionEl);
        });
    }

    function checkAnswers(formElement: HTMLFormElement, quiz: Quiz) {
        let score = 0;
        const wrongQuestionsInfo: Question[] = [];
        
        quiz.questions.forEach(q => {
            const selectedOption = formElement.querySelector(`input[name="question-${q.id}"]:checked`) as HTMLInputElement;
            const userAnswer = selectedOption ? selectedOption.value : null;

            if (userAnswer === q.answer) {
                score++;
            } else {
                wrongQuestionsInfo.push({ ...q, userAnswer });
                // Add to passive wrongAnswers list
                if (!gameState.wrongAnswers.some(wq => wq.id === q.id)) {
                    gameState.wrongAnswers.push(q);
                }
            }
        });
        
        const pointsEarned = score * (quiz.type === 'mock' ? 10 : 5); 
        gameState.points += pointsEarned;
        
        if (score === quiz.questions.length) {
            gameState.badges['grammar-master'].count = (gameState.badges['grammar-master'].count || 0) + 1;
        }

        const isPlanComplete = handleDayCompletion(quiz.day);
        
        const total = quiz.questions.length;
        
        // Only show feedback screen if the whole plan is not complete
        if (!isPlanComplete) {
            showFeedback(score, total, wrongQuestionsInfo, quiz.name, quiz.topic, quiz.weeklyTopics);
        }
    }
    
    // Unified function to handle completion of any day (study or quiz)
    function handleDayCompletion(day: number | null): boolean {
        if (day !== null && !gameState.completedPlanDays.includes(day)) {
            gameState.points += 10;
            
            const plan = studyPlans[gameState.targetScore] || studyPlans['550'];
            const item = plan.find(p => p.day === day);
            if (item && item.type === 'study' && item.learningType === 'vocabulary') {
                gameState.badges['word-ninja'].count = (gameState.badges['word-ninja'].count || 0) + 1;
            }

            gameState.completedPlanDays.push(day);
            checkAndUnlockBadges();
            saveState();
            updateNavbar();
            showConfetti();

            if (gameState.completedPlanDays.length >= 28) {
                setTimeout(() => {
                    showCongratsAnimation();
                }, 500);
                return true; // Plan is complete
            }
        }
        return false; // Plan is not complete
    }

    function showFeedback(score, total, wrongQuestionsInfo, quizName, topic, weeklyTopics) {
        document.getElementById('feedback-title').textContent = `${quizName} 結果`;
        const scoreDisplay = document.getElementById('score-display');
        const feedbackMessage = document.getElementById('feedback-message');
        const wrongAnswersReview = document.getElementById('wrong-answers-review');

        scoreDisplay.textContent = `${score} / ${total}`;
        scoreDisplay.className = `text-5xl font-bold mb-4 text-center ${score / total >= 0.8 ? 'text-emerald-400' : 'text-rose-500'}`;
        const points = score * (quizName === '迷你多益測驗' ? 10 : 5);
        feedbackMessage.innerHTML = score / total >= 0.8 ? 
            `<p class="font-bold">太棒了！</p><p>你掌握得很好，獲得了 ${points} 積分。繼續保持！</p>` :
            `<p class="font-bold">別灰心！</p><p>這次你獲得了 ${points} 積分。錯題已加入「錯題本」，記得去鞏固喔！</p>`;

        wrongAnswersReview.innerHTML = '';
        if(wrongQuestionsInfo.length > 0) {
            const reviewHeader = document.createElement('h3');
            reviewHeader.className = 'text-xl font-bold text-slate-100 mb-4';
            reviewHeader.textContent = '錯題分析';
            wrongAnswersReview.appendChild(reviewHeader);

            wrongQuestionsInfo.forEach(q => {
                const div = document.createElement('div');
                div.className = 'p-4 border-l-4 border-rose-500 bg-rose-900/40 mb-4 rounded-r-lg';
                div.innerHTML = `
                    <p class="font-semibold text-slate-200">${q.question}</p>
                    <p class="text-sm text-rose-300">你的答案: ${q.userAnswer || '未作答'}</p>
                    <p class="text-sm text-emerald-400">正確答案: ${q.answer}</p>
                    <button data-question-id="${q.id}" data-user-answer="${q.userAnswer || '未作答'}" class="ai-tutor-btn mt-2 bg-lime-700 hover:bg-lime-600 text-white text-sm font-semibold py-1 px-3 rounded-md flex items-center gap-2 transition">${ICONS.aiTutor} 為什麼錯了？</button>
                `;
                wrongAnswersReview.appendChild(div);
            });
        }
        
        const retakeBtn = document.getElementById('retake-quiz-btn');
        if (quizName === '迷你多益測驗') {
            retakeBtn.textContent = '返回模擬測驗主頁';
            retakeBtn.onclick = () => {
                document.getElementById('mock-test-intro').classList.remove('hidden');
                document.getElementById('mock-test-main').classList.add('hidden');
                showScreen('mock-test');
            };
        } else {
            retakeBtn.textContent = '重新測驗';
            retakeBtn.onclick = () => startQuiz(topic, weeklyTopics, currentQuiz.day);
        }

        showScreen('feedback');
    }
    
    async function getAIExplanation(questionObject, userAnswer) {
        aiModal.container.classList.remove('hidden');
        aiModal.practiceArea.classList.add('hidden');
        aiModal.practiceArea.innerHTML = '';
        aiModal.explanation.classList.remove('hidden');
        aiModal.title.innerHTML = `${ICONS.aiTutor} AI 助教`;
        aiModal.explanation.innerHTML = getLoaderHTML('AI 助教思考中，請稍候...');
        
        const prompt = `你是一位專業的多益(TOEIC)老師，請用繁體中文、高中生能懂的語氣，為以下錯題提供一個**極度簡潔**的條列式重點分析。

        **錯題資訊:**
        - **題目:** "${questionObject.question}"
        - **學生答案:** "${userAnswer}"
        - **正確答案:** "${questionObject.answer}"

        **輸出要求 (極度重要):**
        - **不要**寫任何問候語或前言。
        - **必須**嚴格使用以下 HTML 格式回傳，且**只回傳 HTML**。
        - 每一點說明都**只能有一句簡短的話**，直指核心。

        **HTML 格式範本:**
        <ul>
            <li class="mb-2"><strong class="text-rose-400">核心錯誤：</strong> [一句話點出學生觀念不清的地方]</li>
            <li class="mb-2"><strong class="text-emerald-400">正確觀念：</strong> [一句話解釋正確的文法/單字用法]</li>
            <li><strong class="text-sky-400">記憶技巧：</strong> [提供一個實用的簡短記憶法或提示]</li>
        </ul>
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            aiModal.explanation.innerHTML = response.text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            aiModal.explanation.innerHTML = '<p class="text-rose-500">抱歉，AI 助教目前無法連線，請稍後再試。</p>';
        }
    }

    async function generateAndShowSimilarQuestion(questionId: string) {
        const questionObject = gameState.wrongAnswers.find(q => q.id === questionId);
        if (!questionObject) return;

        aiModal.container.classList.remove('hidden');
        aiModal.explanation.classList.add('hidden');
        aiModal.practiceArea.classList.remove('hidden');
        aiModal.title.innerHTML = `${ICONS.practice} 小試身手`;
        aiModal.practiceArea.innerHTML = getLoaderHTML('正在為您生成相似練習題...');

        const prompt = `你是一位專業的多益(TOEIC)出題老師。根據以下這道學生答錯的題目，請生成一道全新的、題目文字不同、但考點完全相同的練習題。
        
        **錯誤題目範本:**
        - 題目: "${questionObject.question}"
        ${questionObject.passage ? `- 文章: "${questionObject.passage.replace(/"/g, "'")}"` : ''}
        - 選項: [${questionObject.options.join(', ')}]
        - 正確答案: "${questionObject.answer}"

        **要求:**
        1.  **考點一致:** 新題目必須測試與範本題完全相同的文法概念、單字用法或閱讀/聽力技巧。
        2.  **內容原創:** 請勿直接改寫範本題的句子。請創造一個新的情境與句子。
        3.  **格式嚴謹:** 請嚴格以 JSON 格式回傳，不要包含任何 JSON 區塊標記。JSON 結構必須如下：
            {
              "question": "新的問題文字",
              "options": ["選項A", "選項B", "選項C", "選項D"],
              "answer": "正確答案の文字",
              "explanation": "對新題目考點的簡短中文解釋。"
            }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });
            const practiceQ = cleanAndParseJSON(response.text);

            const optionsHTML = practiceQ.options.map((option) => `
                <label class="practice-option-label flex items-center space-x-3 p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-lime-400 transition cursor-pointer bg-gray-800/50">
                    <input type="radio" name="practice-question" value="${option}" class="text-lime-500 focus:ring-lime-500 bg-slate-700 border-slate-600">
                    <span>${option}</span>
                </label>
            `).join('');

            aiModal.practiceArea.innerHTML = `
                <div class="space-y-3">
                    <p class="font-semibold mb-2">${practiceQ.question}</p>
                    <div id="practice-options" class="space-y-2">${optionsHTML}</div>
                </div>
                <button id="check-practice-btn" class="mt-4 bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 px-4 rounded-lg transition">檢查答案</button>
                <div id="practice-feedback" class="mt-4 p-3 rounded-lg hidden"></div>
            `;
            
            document.getElementById('check-practice-btn').addEventListener('click', () => {
                const selectedOption = (aiModal.practiceArea.querySelector('input[name="practice-question"]:checked') as HTMLInputElement);
                if (!selectedOption) {
                    alert('請選擇一個答案！');
                    return;
                }

                const userAnswer = selectedOption.value;
                const isCorrect = userAnswer === practiceQ.answer;
                const feedbackDiv = document.getElementById('practice-feedback');
                
                feedbackDiv.innerHTML = `
                    <p class="font-bold">${isCorrect ? '答對了！' : '再試一次！'}</p>
                    <p>${practiceQ.explanation}</p>
                    <p class="mt-1">正確答案是: <strong>${practiceQ.answer}</strong></p>
                `;
                feedbackDiv.className = `mt-4 p-3 rounded-lg ${isCorrect ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-rose-900/50 text-rose-300 border border-rose-700'}`;
                feedbackDiv.classList.remove('hidden');

                (document.getElementById('check-practice-btn') as HTMLButtonElement).disabled = true;
                aiModal.practiceArea.querySelectorAll('input[name="practice-question"]').forEach(input => (input as HTMLInputElement).disabled = true);
                
                aiModal.practiceArea.querySelectorAll('.practice-option-label').forEach(label => {
                    const input = label.querySelector('input') as HTMLInputElement;
                    if(input.value === practiceQ.answer) {
                        label.classList.add('bg-emerald-900/50', 'border-emerald-700');
                    }
                    if(input.checked && !isCorrect) {
                         label.classList.add('bg-rose-900/50', 'border-rose-700');
                    }
                });

            }, { once: true });

        } catch (error) {
            console.error("Practice question generation failed:", error);
            aiModal.practiceArea.innerHTML = '<p class="text-rose-500">抱歉，練習題生成失敗，請稍後再試。</p>';
        }
    }


    function renderProfile() {
        document.getElementById('profile-goal').textContent = gameState.targetScore || '尚未設定';
        document.getElementById('profile-points').textContent = String(gameState.points);
        document.getElementById('profile-streak').textContent = `${gameState.longestStreak} 天`;

        const wall = document.getElementById('badges-wall');
        wall.innerHTML = '';
        for (const id in badgesData) {
            const badge = badgesData[id as keyof typeof badgesData];
            const state = gameState.badges[id as keyof typeof gameState.badges];
            const isUnlocked = state && state.unlocked;
            const div = document.createElement('div');
            div.className = `p-4 rounded-xl text-center flex flex-col items-center justify-center transition border ${isUnlocked ? 'bg-amber-900/40 border-amber-700/50' : 'bg-gray-800/50 border-slate-700 badge-locked'}`;
            div.innerHTML = `
                <div class="mb-2 w-16 h-16 flex items-center justify-center ${isUnlocked ? 'text-amber-400' : 'text-slate-500'}">${badge.icon}</div>
                <p class="font-bold text-slate-100">${badge.name}</p>
                <p class="text-sm text-slate-400">${badge.description}</p>
            `;
            if (isUnlocked) {
                 div.classList.add('glow-on-hover');
                 div.style.setProperty('--glow-color', 'rgba(251, 191, 36, 0.4)');
            }
            wall.appendChild(div);
        }
    }
    
    function checkAndUnlockBadges() {
        if (!gameState.badges['grammar-master'].unlocked && gameState.badges['grammar-master'].count >= 5) {
            gameState.badges['grammar-master'].unlocked = true;
            gameState.points += 50;
            alert("恭喜！你已解鎖「文法大師」徽章，並獲得 50 積分！");
        }
        if (!gameState.badges['word-ninja'].unlocked && gameState.badges['word-ninja'].count >= 10) {
            gameState.badges['word-ninja'].unlocked = true;
            gameState.points += 50;
             alert("恭喜！你已解鎖「單字忍者」徽章，並獲得 50 積分！");
        }
        if (!gameState.badges['persistent'].unlocked && gameState.streak >= 7) {
            gameState.badges['persistent'].unlocked = true;
            gameState.points += 100;
             alert("恭喜！你已解鎖「持之以恆」徽章，並獲得 100 積分！");
        }
        saveState();
        updateNavbar();
    }

    async function generateMockTestFromAI(): Promise<Question[]> {
        const prompt = `你是一位專業的多益(TOEIC)出題老師，請為一位目標分數 [${gameState.targetScore}] の台灣高中生設計一份包含 20 題的綜合迷你模擬測驗。

        **重要：** 請嚴格以 JSON 格式回傳一個包含 20 個問題物件的陣列，不要包含任何 JSON 區塊標記。
        每個問題物件都必須包含 'id', 'question', 'options' (4個選項), 和 'answer'。

        **題型分佈要求 (請盡量符合)：**
        - **文法題:** 6 題
        - **單字題:** 6 題
        - **閱讀題:** 4 題 (2 篇短文，每篇 2 題)。閱讀題物件需包含 'passage' 欄位。
        - **聽力題:** 4 題。聽力題物件需包含 'type':'listening' 和 'audioText' 欄位。

        請確保題目涵蓋不同難度，且內容不重複。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        const questions: Question[] = cleanAndParseJSON(response.text);
        // Preload audio for listening questions
        questions.filter(q => q.type === 'listening').forEach(q => preloadAudio(q.id, q.audioText));
        return questions;
    }

    async function startMockTest() {
        document.getElementById('mock-test-intro').classList.add('hidden');
        document.getElementById('mock-test-main').classList.remove('hidden');
        
        currentTopic = "全真模擬測驗"; // Context

        const formEl = document.getElementById('mock-test-form');
        const submitBtn = document.getElementById('submit-mock-test-btn') as HTMLButtonElement;

        formEl.innerHTML = getLoaderHTML('AI 考官正在為您生成全真模擬測驗...');
        submitBtn.disabled = true;

        try {
            const questions = await generateMockTestFromAI();
            currentQuiz = { name: '迷你多益測驗', questions: questions, type: 'mock' };
            renderQuizForm(formEl, currentQuiz);

            let timeLeft = 30 * 60;
            const timerEl = document.getElementById('timer');
            timerEl.textContent = `30:00`;
            
            clearInterval(timerInterval);
            timerInterval = window.setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    alert("時間到！");
                    checkAnswers(formEl as HTMLFormElement, currentQuiz);
                }
            }, 1000);

        } catch (error) {
            console.error("Mock test generation failed:", error);
            formEl.innerHTML = `<div class="text-center p-8"><p class="text-rose-500">抱歉，測驗生成失敗。</p><p class="text-slate-400 mt-2">返回主頁再試一次。</p></div>`;
        } finally {
            submitBtn.disabled = false;
        }
    }


    function renderWeaknessBank() {
        const container = document.getElementById('weakness-content');
        const header = document.getElementById('weakness-header');
        header.innerHTML = '';
        container.innerHTML = '';

        if (gameState.wrongAnswers.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-400 p-8 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-slate-700"><p class="font-semibold text-lg text-slate-100">太棒了！</p><p>你的錯題本是空的。</p></div>`;
            return;
        }

        header.innerHTML = `
            <div class="bg-gray-900/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 class="text-xl font-bold text-slate-100">你有 ${gameState.wrongAnswers.length} 道錯題</h3>
                    <p class="text-slate-400">使用閃卡模式來鞏固你的弱點！</p>
                </div>
                <button id="start-flashcard-review-btn" class="bg-lime-600 hover:bg-lime-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 glow-on-hover w-full sm:w-auto">
                    開始閃卡複習
                </button>
            </div>
        `;

        gameState.wrongAnswers.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-900/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700';
            div.innerHTML = `
                <p class="font-semibold text-slate-100 mb-2">${index + 1}. ${q.question}</p>
                <p class="text-sm text-emerald-400 mb-3">正確答案: ${q.answer}</p>
                <div class="flex flex-wrap gap-2">
                    <button data-question-id="${q.id}" data-user-answer="N/A" class="ai-tutor-btn bg-lime-700 hover:bg-lime-600 text-white text-sm font-semibold py-1 px-3 rounded-md transition flex items-center gap-2">${ICONS.aiTutor} AI 助教</button>
                    <button data-question-id="${q.id}" class="generate-practice-btn bg-lime-700 hover:bg-lime-600 text-white text-sm font-semibold py-1 px-3 rounded-md transition flex items-center gap-2">${ICONS.practice} 生成練習題</button>
                    <button data-question-id="${q.id}" class="remove-weakness-btn bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold py-1 px-3 rounded-md transition flex items-center gap-2">${ICONS.remove} 從錯題本移除</button>
                </div>`;
            container.appendChild(div);
        });
    }

    // --- FLASHCARD FUNCTIONS ---
    function startFlashcardReview() {
        if (gameState.wrongAnswers.length === 0) return;
        
        currentTopic = "錯題複習"; // Context
        shuffledWrongAnswers = [...gameState.wrongAnswers].sort(() => Math.random() - 0.5);
        currentFlashcardIndex = 0;
        
        renderCurrentFlashcard();
        showScreen('flashcard');
    }

    function renderCurrentFlashcard() {
        const container = document.getElementById('flashcard-container');
        const progressEl = document.getElementById('flashcard-progress');
        const prevBtn = document.getElementById('flashcard-prev-btn') as HTMLButtonElement;
        const nextBtn = document.getElementById('flashcard-next-btn') as HTMLButtonElement;

        if (shuffledWrongAnswers.length === 0 || !container || !progressEl || !prevBtn || !nextBtn) {
            return;
        }

        const q = shuffledWrongAnswers[currentFlashcardIndex];
        
        const optionsHTML = q.options.map(opt => `<li class="p-2 rounded bg-slate-900/50 border border-slate-700">${opt}</li>`).join('');
        
        const cardHTML = `
            <div class="flashcard h-full w-full cursor-pointer">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        ${q.passage ? `<div class="text-sm text-slate-400 mb-4 p-2 border border-slate-600 rounded-md max-h-24 overflow-y-auto">${q.passage}</div>` : ''}
                        <h3 class="text-xl font-semibold text-center flex-grow flex items-center">${q.question}</h3>
                        <ul class="list-none p-0 mt-4 space-y-2 w-full max-w-sm text-left text-sm">
                            ${optionsHTML}
                        </ul>
                        <p class="absolute bottom-4 text-xs text-slate-500">點擊卡片查看答案</p>
                    </div>
                    <div class="flashcard-back">
                        <h3 class="text-lg font-semibold text-slate-300 mb-4">正確答案</h3>
                        <p class="text-3xl font-bold text-lime-400 text-center p-4 bg-lime-900/50 border border-lime-700 rounded-lg">${q.answer}</p>
                         <p class="absolute bottom-4 text-xs text-slate-500">點擊卡片返回題目</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = cardHTML;
        
        progressEl.textContent = `${currentFlashcardIndex + 1} / ${shuffledWrongAnswers.length}`;
        
        prevBtn.disabled = currentFlashcardIndex === 0;
        nextBtn.disabled = currentFlashcardIndex === shuffledWrongAnswers.length - 1;
    }

    // --- AUDIO FUNCTIONS ---
    function encode(bytes: Uint8Array) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function decode(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }
    
    async function preloadAudio(questionId: string, text: string) {
        if (!outputAudioContext || !text || preloadedAudioBuffers.has(questionId)) {
            return;
        }
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) throw new Error("No audio data received for preloading.");
            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);
            preloadedAudioBuffers.set(questionId, audioBuffer);
        } catch (err) {
            console.error(`Failed to preload audio for QID ${questionId}:`, err);
        }
    }


    async function playAudio(questionId: string, text: string, button: HTMLButtonElement) {
        if (!outputAudioContext) {
            alert('您的瀏覽器不支援音訊播放機能。');
            return;
        }

        const iconSpan = button.querySelector('.button-icon');
        button.disabled = true;

        // Try to play from preloaded buffer first
        if (preloadedAudioBuffers.has(questionId)) {
            const audioBuffer = preloadedAudioBuffers.get(questionId);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start();
            source.onended = () => { button.disabled = false; };
            return;
        }

        // Fallback to on-demand generation if not preloaded
        iconSpan.innerHTML = '<div class="audio-loader"></div>';
        try {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) throw new Error("No audio data received.");

            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);
            preloadedAudioBuffers.set(questionId, audioBuffer); // Cache it for next time

            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start();
            source.onended = () => {
                iconSpan.innerHTML = ICONS.playAudio;
                button.disabled = false;
            }
        } catch(err) {
            console.error("Error generating or playing audio:", err);
            alert("抱歉，無法播放音訊。");
            iconSpan.innerHTML = ICONS.playAudio;
            button.disabled = false;
        }
    }

    // --- EVENT HANDLING & LISTENERS ---
    
    function handleReset() {
        if (confirm('您確定要返回主畫面並重新選擇目標分數嗎？這將會清除您目前的讀書計畫進度，但積分與徽章會被保留。')) {
            gameState.targetScore = null;
            gameState.completedPlanDays = [];
            // Do NOT clear points, badges etc.
            saveState();
            const welcomeTitle = document.getElementById('welcome-title');
            const titleText = '歡迎來到多益智慧學習夥伴';
            typewriterEffect(welcomeTitle, titleText, null);
            showScreen('welcome');
        }
    };


    function setupEventListeners() {
        // A single, robust, delegated event listener for all primary interactions
        app.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Global Logo Button to go to Welcome or Plan
            const homeBtn = target.closest('#home-btn');
            if (homeBtn) {
                if (gameState.targetScore) {
                    renderPlan();
                    showScreen('plan');
                } else {
                    showScreen('welcome');
                }
                return;
            }

            // Navigation buttons in the header
            const navBtn = target.closest('.nav-btn');
            if (navBtn) {
                const targetScreen = (navBtn as HTMLElement).dataset.target;
                const screenId = targetScreen.replace('-screen', '');

                if (screenId === 'mock-test') {
                    document.getElementById('mock-test-intro').classList.remove('hidden');
                    document.getElementById('mock-test-main').classList.add('hidden');
                    if (timerInterval) clearInterval(timerInterval);
                }

                if(screenId === 'profile') renderProfile();
                if(screenId === 'weakness') renderWeaknessBank();
                if(screenId === 'plan' && !gameState.targetScore) {
                    alert('請先在主頁設定目標分數！');
                    showScreen('welcome');
                    return;
                }
                if (screenId === 'plan' && gameState.targetScore) {
                    renderPlan();
                }
                showScreen(screenId);
                return;
            }

            // Goal Setting Buttons on Welcome Screen
            const goalBtn = target.closest('.goal-btn');
            if(goalBtn) {
                gameState.targetScore = (goalBtn as HTMLElement).dataset.score;
                saveState();
                renderPlan();
                showScreen('plan');
                return;
            }

            // Plan Action Buttons (Start Study/Quiz)
            const actionBtn = target.closest('.plan-action-btn') as HTMLButtonElement;
            if (actionBtn && !actionBtn.disabled) {
                const { type, topic, day } = actionBtn.dataset;
                if (type === 'quiz') {
                    const currentPlan = studyPlans[gameState.targetScore] || studyPlans['550'];
                    const dayNum = parseInt(day);
                    const startDay = dayNum - 6;
                    const endDay = dayNum - 1;

                    const weeklyTopics = currentPlan
                        .filter(item => item.day >= startDay && item.day <= endDay && item.type === 'study')
                        .map(item => item.topic);

                    startQuiz(topic, weeklyTopics, dayNum);
                } else { 
                    generateAndDisplayLearningContent(parseInt(day));
                }
                return;
            }
            
            // Smart Memo Button
            const smartMemoBtn = target.closest('.smart-memo-btn');
            if (smartMemoBtn) {
                const { topic, prompt } = (smartMemoBtn as HTMLElement).dataset;
                generateSmartMemo(topic, prompt);
                return;
            }

            // Back to Plan Buttons
            const backToPlanBtn = target.closest('.back-to-plan-btn');
            if (backToPlanBtn) {
                renderPlan();
                showScreen('plan');
                return;
            }

            // AI Tutor & Practice Buttons
            const tutorBtn = target.closest('.ai-tutor-btn');
            if (tutorBtn) {
                const { questionId, userAnswer } = (tutorBtn as HTMLElement).dataset;
                const question = currentQuiz.questions.find(q => q.id === questionId) || gameState.wrongAnswers.find(q => q.id === questionId);
                if (question) {
                    getAIExplanation(question, userAnswer);
                }
                return;
            }
            const practiceBtn = target.closest('.generate-practice-btn');
            if (practiceBtn) {
                const { questionId } = (practiceBtn as HTMLElement).dataset;
                generateAndShowSimilarQuestion(questionId);
                return;
            }

            // Play Audio Button
            const audioBtn = target.closest('.play-audio-btn') as HTMLButtonElement;
            if(audioBtn) {
                playAudio(audioBtn.dataset.questionId, audioBtn.dataset.audioText, audioBtn);
                return;
            }
            
            // Remove weakness button
            const removeBtn = target.closest('.remove-weakness-btn');
            if (removeBtn) {
                const { questionId } = (removeBtn as HTMLElement).dataset;
                gameState.wrongAnswers = gameState.wrongAnswers.filter(q => q.id !== questionId);
                saveState();
                renderWeaknessBank();
                return;
            }

            // Calendar Navigation
            const prevMonthBtn = target.closest('#prev-month-btn');
            if (prevMonthBtn) {
                displayedDate.setMonth(displayedDate.getMonth() - 1);
                renderCalendar();
                return;
            }

            const nextMonthBtn = target.closest('#next-month-btn');
            if (nextMonthBtn) {
                displayedDate.setMonth(displayedDate.getMonth() + 1);
                renderCalendar();
                return;
            }

            // Calendar Day Click
            const calendarDay = target.closest('#calendar-body [data-day]');
            if (calendarDay) {
                const day = (calendarDay as HTMLElement).dataset.day;
                const planGrid = document.getElementById('plan-grid');
                const targetCard = planGrid.querySelector(`.plan-action-btn[data-day="${day}"]`)?.closest('div');
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('calendar-highlight');
                    setTimeout(() => targetCard.classList.remove('calendar-highlight'), 1500);
                }
                return;
            }

            // Flashcard actions
            const startFlashcardBtn = target.closest('#start-flashcard-review-btn');
            if (startFlashcardBtn) {
                startFlashcardReview();
                return;
            }

            const flashcard = target.closest('.flashcard');
            if (flashcard) {
                flashcard.classList.toggle('is-flipped');
                return;
            }

            const flashcardNextBtn = target.closest('#flashcard-next-btn');
            if (flashcardNextBtn && !(flashcardNextBtn as HTMLButtonElement).disabled) {
                if (currentFlashcardIndex < shuffledWrongAnswers.length - 1) {
                    currentFlashcardIndex++;
                    renderCurrentFlashcard();
                }
                return;
            }

            const flashcardPrevBtn = target.closest('#flashcard-prev-btn');
            if (flashcardPrevBtn && !(flashcardPrevBtn as HTMLButtonElement).disabled) {
                if (currentFlashcardIndex > 0) {
                    currentFlashcardIndex--;
                    renderCurrentFlashcard();
                }
                return;
            }
        });

        // Specific Button/Form Listeners that are not suited for delegation
        document.getElementById('complete-study-btn').addEventListener('click', () => {
             const isPlanComplete = handleDayCompletion(currentLearningDay);
             if (!isPlanComplete) {
                renderPlan();
                setTimeout(() => showScreen('plan'), 100);
             }
             currentLearningDay = null;
        });
        
        document.getElementById('submit-quiz-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if ((document.getElementById('quiz-form') as HTMLFormElement).checkValidity()) {
                checkAnswers(document.getElementById('quiz-form') as HTMLFormElement, currentQuiz);
            } else {
                alert('請完成所有題目！');
            }
        });
        
        document.getElementById('start-mock-test-btn').addEventListener('click', startMockTest);
        
        document.getElementById('submit-mock-test-btn').addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            if ((document.getElementById('mock-test-form') as HTMLFormElement).checkValidity()) {
                checkAnswers(document.getElementById('mock-test-form') as HTMLFormElement, currentQuiz);
            } else {
                 alert('請完成所有題目！');
            }
        });
        
        aiModal.closeBtn.addEventListener('click', () => aiModal.container.classList.add('hidden'));
        aiModal.container.addEventListener('click', (e) => {
            if (e.target === aiModal.container) {
                 aiModal.container.classList.add('hidden');
            }
        });
        
        memoModal.closeBtn.addEventListener('click', () => memoModal.container.classList.add('hidden'));
        memoModal.container.addEventListener('click', (e) => {
            if (e.target === memoModal.container) {
                 memoModal.container.classList.add('hidden');
            }
        });
        
        document.getElementById('close-congrats-btn').addEventListener('click', () => {
            document.getElementById('congrats-modal').classList.add('hidden');
            renderPlan();
            showScreen('plan');
        });
    }

    // --- LET'S GO ---
    init();
});