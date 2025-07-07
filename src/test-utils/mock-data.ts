// zen-connect用のテストデータ定義

// ユーザーデータ
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'テストユーザー',
  bio: '瞑想を始めて3年になります。毎日の習慣として取り入れています。',
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  stats: {
    totalSessions: 120,
    totalMinutes: 2400,
    streak: 7,
  },
};

// 体験記録データ
export const mockExperience = {
  id: '1',
  userId: '1',
  content: '今朝は公園のベンチで20分間の瞑想。鳥のさえずりと風の音が心地よく、普段の雑念がすっと消えていくのを感じました。呼吸に集中することで、今この瞬間の豊かさに気づけた素敵な時間でした。',
  location: '代々木公園',
  duration: 20,
  method: 'マインドフルネス',
  mood: ['落ち着いた', '穏やか'],
  tags: ['朝活', '自然'],
  visibility: 'public' as const,
  createdAt: '2025-01-06T06:00:00Z',
  updatedAt: '2025-01-06T06:00:00Z',
  author: {
    id: '1',
    name: 'あきこ',
    avatar: null,
  },
  likes: 12,
  comments: 3,
};

// 複数の体験記録データ
export const mockExperiences = [
  mockExperience,
  {
    id: '2',
    userId: '2',
    content: '仕事のストレスで心が乱れていたので、久しぶりに長めの瞑想。40分間座り続けることで、内面の静けさを取り戻せました。感情を客観視する練習になり、明日からまた頑張れそうです。',
    location: '自宅の和室',
    duration: 40,
    method: 'ヴィパッサナー',
    mood: ['集中', 'リラックス'],
    tags: ['自宅', '夜'],
    visibility: 'public' as const,
    createdAt: '2025-01-05T21:00:00Z',
    updatedAt: '2025-01-05T21:00:00Z',
    author: {
      id: '2',
      name: 'たかし',
      avatar: null,
    },
    likes: 8,
    comments: 1,
  },
  {
    id: '3',
    userId: '3',
    content: '海岸での歩行瞑想。波の音と足裏の感覚に意識を向けながら、ゆっくりと歩きました。普段は急いでばかりいるけれど、こうして自分のペースで歩くことの大切さを改めて実感。',
    location: '湘南海岸',
    duration: 30,
    method: '歩行瞑想',
    mood: ['平穏', '気づき'],
    tags: ['自然', '海'],
    visibility: 'public' as const,
    createdAt: '2025-01-04T16:30:00Z',
    updatedAt: '2025-01-04T16:30:00Z',
    author: {
      id: '3',
      name: 'みほ',
      avatar: null,
    },
    likes: 15,
    comments: 5,
  },
];

// コメントデータ
export const mockComment = {
  id: '1',
  userId: '2',
  content: '素敵な体験ですね！私も朝の瞑想を始めてみたいと思います。',
  createdAt: '2025-01-06T07:00:00Z',
  author: {
    id: '2',
    name: 'たかし',
    avatar: null,
  },
};

// ページネーションデータ
export const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

// API レスポンスのファクトリー関数

// 体験記録一覧のレスポンス
export const createMockExperiencesResponse = (experiences = mockExperiences) => ({
  experiences,
  pagination: mockPagination,
});

// 体験記録詳細のレスポンス
export const createMockExperienceResponse = (experience = mockExperience) => ({
  ...experience,
  comments: [mockComment],
});

// ユーザー情報のレスポンス
export const createMockUserResponse = (user = mockUser) => user;

// 認証レスポンス
export const createMockAuthResponse = (user = mockUser) => ({
  user,
  token: 'mock-jwt-token',
});

// フォーム入力データ
export const mockFormData = {
  login: {
    email: 'test@example.com',
    password: 'password123',
  },
  register: {
    name: 'テストユーザー',
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  },
  experience: {
    content: '今日の瞑想体験をテストで記録します。',
    location: 'テスト会場',
    duration: 15,
    method: 'マインドフルネス',
    mood: ['集中', '穏やか'],
    tags: ['テスト', '練習'],
    visibility: 'public' as const,
  },
  profile: {
    name: '更新されたテストユーザー',
    bio: '更新されたプロフィール説明文です。',
    avatar: 'https://example.com/avatar.jpg',
  },
};

// エラーレスポンス
export const mockErrorResponse = {
  invalidCredentials: {
    error: 'Invalid credentials',
  },
  userExists: {
    error: 'User already exists',
  },
  notFound: {
    error: 'Not found',
  },
  unauthorized: {
    error: 'Unauthorized',
  },
  validationError: {
    error: 'Validation failed',
    details: [
      { field: 'email', message: 'Valid email is required' },
      { field: 'password', message: 'Password must be at least 6 characters' },
    ],
  },
};

// 瞑想法のオプション
export const meditationMethods = [
  'マインドフルネス',
  'ヴィパッサナー',
  '歩行瞑想',
  '慈悲の瞑想',
  '呼吸瞑想',
  'ボディスキャン',
  'その他',
];

// 心の状態のオプション
export const moodOptions = [
  '落ち着いた',
  '穏やか',
  '集中',
  'リラックス',
  '平穏',
  '気づき',
  'エネルギッシュ',
  '感謝',
  'その他',
];

// タグのオプション
export const tagOptions = [
  '朝活',
  '自然',
  '自宅',
  '夜',
  '海',
  '公園',
  '寺院',
  'ヨガ',
  '初心者',
  '上級者',
];

// 公開設定のオプション
export const visibilityOptions = [
  { value: 'public', label: '公開' },
  { value: 'followers', label: 'フォロワーのみ' },
  { value: 'private', label: '非公開' },
] as const;