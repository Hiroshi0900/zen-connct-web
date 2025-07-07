export default function Home() {
  return (
    <div className="min-h-screen bg-primary-dark text-primary-light overflow-x-hidden">
      {/* ヘッダー */}
      <header className="fixed top-0 w-full bg-primary-dark/95 backdrop-blur-sm z-50 border-b border-accent-teal/5">
        <nav className="max-w-6xl mx-auto px-5 py-5 flex justify-between items-center">
          <a href="#" className="text-2xl font-semibold text-accent-teal">
            zen-connect
          </a>
          <ul className="hidden md:flex gap-8">
            <li><a href="#features" className="text-primary-light hover:text-accent-teal transition-colors">機能</a></li>
            <li><a href="#community" className="text-primary-light hover:text-accent-teal transition-colors">コミュニティ</a></li>
            <li><a href="#about" className="text-primary-light hover:text-accent-teal transition-colors">について</a></li>
          </ul>
          <a href="#" className="border-2 border-accent-teal text-accent-teal px-5 py-2 rounded-lg font-medium hover:bg-accent-teal hover:text-primary-dark transition-all">
            ログイン
          </a>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-20">
        {/* ヒーローセクション */}
        <section className="text-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/8 via-accent-coral/6 to-accent-teal/8 rounded-3xl mx-10 my-10"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-5">
            <h1 className="text-5xl md:text-6xl font-bold mb-5 -tracking-wider">
              瞑想体験を<br />共有しよう
            </h1>
            <p className="text-xl text-gray-400 mb-10 font-light">
              一人ひとりの瞑想体験を記録し、仲間と共有する<br />
              新しいマインドフルネス・コミュニティ
            </p>
            <div className="flex gap-5 justify-center flex-wrap">
              <a href="#" className="bg-accent-teal text-primary-dark px-8 py-4 rounded-xl font-semibold text-lg uppercase tracking-wider hover:shadow-lg hover:shadow-accent-teal/30 hover:-translate-y-0.5 transition-all">
                今すぐ始める
              </a>
              <a href="#" className="border-2 border-accent-coral text-accent-coral px-8 py-4 rounded-xl font-medium text-lg hover:bg-accent-coral hover:text-primary-dark hover:-translate-y-0.5 transition-all">
                詳しく見る
              </a>
            </div>
          </div>
        </section>

        {/* フィーチャーセクション */}
        <section id="features" className="py-20 bg-gray-900/30">
          <div className="max-w-6xl mx-auto px-5">
            <h2 className="text-4xl font-semibold text-center mb-15">zen-connectの特徴</h2>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-gray-700/60 p-10 rounded-2xl text-center border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 hover:shadow-xl transition-all backdrop-blur-sm">
                <div className="w-15 h-15 bg-gradient-to-br from-accent-teal to-zen-indigo rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">
                  🧘
                </div>
                <h3 className="text-2xl mb-4 text-accent-teal">体験記録</h3>
                <p className="text-gray-400 leading-relaxed">瞑想の場所、時間、心の状態を記録。あなたの瞑想ジャーニーを可視化します。</p>
              </div>
              <div className="bg-gray-700/60 p-10 rounded-2xl text-center border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 hover:shadow-xl transition-all backdrop-blur-sm">
                <div className="w-15 h-15 bg-gradient-to-br from-accent-teal to-zen-indigo rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">
                  👥
                </div>
                <h3 className="text-2xl mb-4 text-accent-teal">コミュニティ</h3>
                <p className="text-gray-400 leading-relaxed">同じ志を持つ仲間と繋がり、お互いの体験を共有し合える温かなコミュニティ。</p>
              </div>
              <div className="bg-gray-700/60 p-10 rounded-2xl text-center border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 hover:shadow-xl transition-all backdrop-blur-sm">
                <div className="w-15 h-15 bg-gradient-to-br from-accent-teal to-zen-indigo rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">
                  🌿
                </div>
                <h3 className="text-2xl mb-4 text-accent-teal">気づきの共有</h3>
                <p className="text-gray-400 leading-relaxed">瞑想で得た気づきや感覚を言葉にして共有。新しい発見と成長の機会。</p>
              </div>
            </div>
          </div>
        </section>

        {/* 体験記録サンプル */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-5">
            <h2 className="text-4xl font-semibold text-center mb-15">みんなの瞑想体験</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-700/40 p-8 rounded-2xl border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 transition-all">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                      A
                    </div>
                    <span>あきこ</span>
                  </div>
                  <span className="text-gray-400 text-sm">2時間前</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">マインドフルネス</span>
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">朝活</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">
                  今朝は公園のベンチで20分間の瞑想。鳥のさえずりと風の音が心地よく、普段の雑念がすっと消えていくのを感じました。呼吸に集中することで、今この瞬間の豊かさに気づけた素敵な時間でした。
                </p>
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  📍 代々木公園 | ⏰ 06:00-06:20
                </div>
              </div>

              <div className="bg-gray-700/40 p-8 rounded-2xl border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 transition-all">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                      T
                    </div>
                    <span>たかし</span>
                  </div>
                  <span className="text-gray-400 text-sm">5時間前</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">ヴィパッサナー</span>
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">自宅</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">
                  仕事のストレスで心が乱れていたので、久しぶりに長めの瞑想。40分間座り続けることで、内面の静けさを取り戻せました。感情を客観視する練習になり、明日からまた頑張れそうです。
                </p>
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  📍 自宅の和室 | ⏰ 21:00-21:40
                </div>
              </div>

              <div className="bg-gray-700/40 p-8 rounded-2xl border border-gray-600/10 hover:-translate-y-1 hover:border-accent-teal/30 transition-all">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                      M
                    </div>
                    <span>みほ</span>
                  </div>
                  <span className="text-gray-400 text-sm">1日前</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">歩行瞑想</span>
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">自然</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">
                  海岸での歩行瞑想。波の音と足裏の感覚に意識を向けながら、ゆっくりと歩きました。普段は急いでばかりいるけれど、こうして自分のペースで歩くことの大切さを改めて実感。
                </p>
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  📍 湘南海岸 | ⏰ 16:30-17:00
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-20 text-center mx-5">
          <div className="bg-gradient-to-br from-accent-teal/8 via-accent-coral/6 to-accent-teal/8 rounded-3xl py-20 px-5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-semibold mb-5">今すぐ始めませんか？</h2>
              <p className="text-xl text-gray-400 mb-10">あなたの瞑想体験を記録し、素敵なコミュニティに参加しましょう</p>
              <a href="#" className="bg-accent-teal text-primary-dark px-8 py-4 rounded-xl font-semibold text-lg uppercase tracking-wider hover:shadow-lg hover:shadow-accent-teal/30 hover:-translate-y-0.5 transition-all inline-block">
                無料で始める
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-600/10 py-10 text-center mt-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex justify-center gap-8 mb-5">
            <a href="#" className="text-gray-400 hover:text-accent-teal transition-colors">プライバシーポリシー</a>
            <a href="#" className="text-gray-400 hover:text-accent-teal transition-colors">利用規約</a>
            <a href="#" className="text-gray-400 hover:text-accent-teal transition-colors">お問い合わせ</a>
            <a href="#" className="text-gray-400 hover:text-accent-teal transition-colors">ヘルプ</a>
          </div>
          <p className="text-gray-400">&copy; 2025 zen-connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}