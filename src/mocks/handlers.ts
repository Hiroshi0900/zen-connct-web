import { http, HttpResponse } from 'msw';

// ゼンコネクト APIのモックハンドラー
export const handlers = [
  // =============================================================================
  // 認証関連API
  // =============================================================================
  
  // ログイン
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    // テスト用の認証チェック
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'テストユーザー',
          avatar: null,
        },
        token: 'mock-jwt-token',
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),
  
  // ユーザー登録
  http.post('/api/auth/register', async ({ request }) => {
    const { name, email } = await request.json() as {
      name: string;
      email: string;
      password: string;
    };
    
    // 既存ユーザーのチェック（簡易）
    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    return HttpResponse.json({
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        avatar: null,
      },
      token: 'mock-jwt-token',
    });
  }),
  
  // ログアウト
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // =============================================================================
  // ユーザー関連API
  // =============================================================================
  
  // ユーザー情報取得
  http.get('/api/users/:userId', ({ params }) => {
    const { userId } = params;
    
    if (userId === '1') {
      return HttpResponse.json({
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
      });
    }
    
    return HttpResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }),
  
  // プロフィール更新
  http.put('/api/users/:userId', async ({ params, request }) => {
    const { userId } = params;
    const body = await request.json() as {
      name?: string;
      bio?: string;
      avatar?: string;
    };
    
    if (userId === '1') {
      return HttpResponse.json({
        id: '1',
        email: 'test@example.com',
        name: body.name || 'テストユーザー',
        bio: body.bio || '',
        avatar: body.avatar || null,
        updatedAt: new Date().toISOString(),
      });
    }
    
    return HttpResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }),
  
  // =============================================================================
  // 体験記録関連API
  // =============================================================================
  
  // 体験記録一覧取得
  http.get('/api/experiences', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId');
    
    // モックデータ
    const mockExperiences = [
      {
        id: '1',
        userId: '1',
        content: '今朝は公園のベンチで20分間の瞑想。鳥のさえずりと風の音が心地よく、普段の雑念がすっと消えていくのを感じました。呼吸に集中することで、今この瞬間の豊かさに気づけた素敵な時間でした。',
        location: '代々木公園',
        duration: 20,
        method: 'マインドフルネス',
        mood: ['落ち着いた', '穏やか'],
        tags: ['朝活', '自然'],
        visibility: 'public',
        createdAt: '2025-01-06T06:00:00Z',
        updatedAt: '2025-01-06T06:00:00Z',
        author: {
          id: '1',
          name: 'あきこ',
          avatar: null,
        },
        likes: 12,
        comments: 3,
      },
      {
        id: '2',
        userId: '2',
        content: '仕事のストレスで心が乱れていたので、久しぶりに長めの瞑想。40分間座り続けることで、内面の静けさを取り戻せました。感情を客観視する練習になり、明日からまた頑張れそうです。',
        location: '自宅の和室',
        duration: 40,
        method: 'ヴィパッサナー',
        mood: ['集中', 'リラックス'],
        tags: ['自宅', '夜'],
        visibility: 'public',
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
        visibility: 'public',
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
    
    // ユーザーIDでフィルタリング
    let filteredExperiences = mockExperiences;
    if (userId) {
      filteredExperiences = mockExperiences.filter(exp => exp.userId === userId);
    }
    
    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      experiences: paginatedExperiences,
      pagination: {
        page,
        limit,
        total: filteredExperiences.length,
        totalPages: Math.ceil(filteredExperiences.length / limit),
      },
    });
  }),
  
  // 体験記録詳細取得
  http.get('/api/experiences/:experienceId', ({ params }) => {
    const { experienceId } = params;
    
    if (experienceId === '1') {
      return HttpResponse.json({
        id: '1',
        userId: '1',
        content: '今朝は公園のベンチで20分間の瞑想。鳥のさえずりと風の音が心地よく、普段の雑念がすっと消えていくのを感じました。呼吸に集中することで、今この瞬間の豊かさに気づけた素敵な時間でした。',
        location: '代々木公園',
        duration: 20,
        method: 'マインドフルネス',
        mood: ['落ち着いた', '穏やか'],
        tags: ['朝活', '自然'],
        visibility: 'public',
        createdAt: '2025-01-06T06:00:00Z',
        updatedAt: '2025-01-06T06:00:00Z',
        author: {
          id: '1',
          name: 'あきこ',
          avatar: null,
        },
        likes: 12,
        comments: [
          {
            id: '1',
            userId: '2',
            content: '素敵な体験ですね！私も朝の瞑想を始めてみたいと思います。',
            createdAt: '2025-01-06T07:00:00Z',
            author: {
              id: '2',
              name: 'たかし',
              avatar: null,
            },
          },
        ],
      });
    }
    
    return HttpResponse.json(
      { error: 'Experience not found' },
      { status: 404 }
    );
  }),
  
  // 体験記録作成
  http.post('/api/experiences', async ({ request }) => {
    const body = await request.json() as {
      content: string;
      location?: string;
      duration?: number;
      method?: string;
      mood?: string[];
      tags?: string[];
      visibility: 'public' | 'private' | 'followers';
    };
    
    return HttpResponse.json({
      id: Math.random().toString(36).substr(2, 9),
      userId: '1',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: '1',
        name: 'テストユーザー',
        avatar: null,
      },
      likes: 0,
      comments: 0,
    });
  }),
  
  // 体験記録更新
  http.put('/api/experiences/:experienceId', async ({ params, request }) => {
    const { experienceId } = params;
    const body = await request.json() as {
      content?: string;
      location?: string;
      duration?: number;
      method?: string;
      mood?: string[];
      tags?: string[];
      visibility?: 'public' | 'private' | 'followers';
    };
    
    if (experienceId === '1') {
      return HttpResponse.json({
        id: '1',
        userId: '1',
        ...body,
        updatedAt: new Date().toISOString(),
      });
    }
    
    return HttpResponse.json(
      { error: 'Experience not found' },
      { status: 404 }
    );
  }),
  
  // 体験記録削除
  http.delete('/api/experiences/:experienceId', ({ params }) => {
    const { experienceId } = params;
    
    if (experienceId === '1') {
      return HttpResponse.json({ success: true });
    }
    
    return HttpResponse.json(
      { error: 'Experience not found' },
      { status: 404 }
    );
  }),
  
  // =============================================================================
  // その他のAPI（将来の拡張用）
  // =============================================================================
  
  // いいね機能
  http.post('/api/experiences/:experienceId/like', ({ params }) => {
    return HttpResponse.json({
      experienceId: params.experienceId,
      liked: true,
      likesCount: 13,
    });
  }),
  
  http.delete('/api/experiences/:experienceId/like', ({ params }) => {
    return HttpResponse.json({
      experienceId: params.experienceId,
      liked: false,
      likesCount: 11,
    });
  }),
  
  // コメント機能
  http.post('/api/experiences/:experienceId/comments', async ({ params, request }) => {
    const { content } = await request.json() as { content: string };
    
    return HttpResponse.json({
      id: Math.random().toString(36).substr(2, 9),
      experienceId: params.experienceId,
      userId: '1',
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: '1',
        name: 'テストユーザー',
        avatar: null,
      },
    });
  }),
];