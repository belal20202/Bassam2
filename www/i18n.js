'use strict';
/* بسام — i18n.js: كل نصوص الواجهة بالعربي والإنجليزي + أدوات التبديل بينهما */
const I18N = (() => {
  let lang = 'ar';
  const DICT = {
    ar: {
      gameTitleMain: 'بسام', gameTitleSub: 'الرافدين',
      madeIn: 'صُنع في العراق', madeInEn: 'Made in Iraq',
      btnPlay: 'ابدأ اللعب', btnLevels: 'المراحل', btnShop: 'المتجر', btnSettings: 'الإعدادات',
      btnPrivacy: 'سياسة الخصوصية', btnAbout: 'القصة', btnExit: 'خروج', btnRoll: 'دحرجة', btnJump: 'قفز',
      back: 'رجوع', version: 'الإصدار',
      chooseLevel: 'اختر المرحلة', settingsTitle: 'الإعدادات', aboutTitle: 'القصة',
      privacyTitle: 'سياسة الخصوصية', shopTitle: 'المتجر',
      sfx: 'المؤثرات الصوتية', music: 'الموسيقى', haptic: 'الاهتزاز',
      ctrlSize: 'حجم أزرار التحكم', small: 'صغير', medium: 'وسط', large: 'كبير',
      resetAll: 'مسح كل التقدم', reset: 'مسح', resetConfirm: 'سيتم مسح كل تقدمك في اللعبة. متابعة؟',
      language: 'اللغة', langAr: 'العربية', langEn: 'English',
      chooseLangTitle: 'اختر اللغة', chooseLangSub: 'Choose your language', continue: 'متابعة',
      storyBody:
        'في أرضٍ يجري فيها نهران قديمان قدم الحكاية، وُلد فتى اسمه «بسام» في قرية صغيرة قرب الأهوار. '
        + 'كان بسام يسمع من جدّه حكايات عن مدن عظيمة بُنيت بالطين والحلم: بابل بأبراجها، وأور بزقوراتها، وبغداد بقبابها الذهبية. '
        + 'وفي ليلة عاصفة، سُرقت كنوز الرافدين العشرة من متاحف المدن العشر، وتفرّقت في دروب محفوفة بالأشواك والعقارب وحرّاس غامضين. '
        + 'نهض بسام، شدّ شماغه، ولبس حذاء الركض، وقرر أن يعبر المدن العشر واحدة تلو الأخرى ليستعيد الكنوز ويعيد الأمل إلى أرض الرافدين. '
        + 'هذه رحلتك أنت الآن — اركض، اقفز، تدحرج، واجمع الدنانير... والمغامرة تبدأ من هنا.',
      startGame: 'ابدأ اللعبة', skip: 'تخطّي',
      exitConfirmTitle: 'الخروج من اللعبة', exitConfirmBody: 'هل تريد الخروج من علّوش... من بسام الآن؟',
      exitYes: 'نعم، خروج', exitCancel: 'إلغاء',
      exitFallback: 'يمكنك إغلاق التطبيق من زر الرجوع في جهازك',
      wallet: 'الدنانير', owned: 'مملوك', equipped: 'مُفعّل', equip: 'تفعيل', buy: 'شراء',
      notEnough: 'دنانير غير كافية',
      pauseTitle: 'إيقاف مؤقت', resume: 'متابعة', retryLevel: 'إعادة المرحلة', mainMenu: 'القائمة الرئيسية',
      resultDone: 'تمّت المرحلة', resultBoss: 'هُزم الزعيم!', time: 'الزمن', coins: 'الدنانير',
      enemies: 'الأعداء', score: 'النقاط', newRecord: 'رقم قياسي جديد!', nextLevel: 'المرحلة التالية',
      retry: 'إعادة', levelsBtn: 'المراحل', share: 'مشاركة',
      overTitle: 'انتهت المحاولات', overBody: 'لا بأس، حاول من جديد وستعرف الطريق.', tryAgain: 'حاول مجدداً',
      rotatePrompt: 'أدِر الجهاز إلى الوضع الأفقي',
      titles: ['مبتدئ', 'مستكشف', 'محارب', 'بطل الرافدين', 'أسطورة عراقية'],
      aboutBody:
        '<p><b>بسام</b> — لعبة ركض وقفز سريعة، بطلها ابن الرافدين بيشماغه وعقاله. يمرّ عبر 10 عوالم من العراق: '
        + 'بابل، أور، الأهوار، بغداد، البصرة، سامراء، أربيل، الحضر، السليمانية والموصل — 100 مرحلة، وفي نهاية كل عالم زعيم.</p>'
        + '<h3>طريقة اللعب</h3><ul>'
        + '<li><b>◀ ▶</b> للحركة. كلما ركضت أكثر زادت سرعتك، والمنحدرات تعطيك دفعة إضافية.</li>'
        + '<li><b>قفز</b>: اضغط أكثر لقفزة أعلى. القفز على الأعداء يقتلهم.</li>'
        + '<li><b>دحرجة</b>: اضغط أثناء الركض لتتدحرج وتهاجم. وأنت واقف ثبّت الزر ثم اتركه للانطلاق السريع.</li>'
        + '<li>الأشواك لا تُقتل: اقفز فوقها.</li>'
        + '<li>الدنانير تحميك: إذا أصبت وأنت تحمل دنانير تخسرها كلها، وإذا أصبت بدونها تخسر محاولة. لديك 3 محاولات لكل مرحلة، وما تجمعه يُضاف إلى محفظتك لشراء أزياء جديدة من المتجر.</li>'
        + '</ul><h3>النجوم والرتب</h3><ul>'
        + '<li>نجمة: إنهاء المرحلة.</li><li>نجمتان: الإنهاء ضمن الزمن المحدد.</li>'
        + '<li>ثلاث نجوم: جمع 75% من الدنانير أو أكثر بدون أن تخسر أي محاولة.</li>'
        + '<li>الرتبة S: ثلاث نجوم مع زمن أسرع من المحدد.</li></ul>'
        + '<p class="fine">الإصدار 1.0.2 — صُنع في العراق. اللعبة تعمل بدون إنترنت ولا تجمع أي بيانات شخصية.</p>',
      hintMove: '◀ ▶  للحركة', hintJumpPit: 'اضغط «قفز» فوق الحفر', hintRollKill: 'القفز والدحرجة تقتلان الأعداء',
      hintCoinsShield: 'الدنانير تحميك من الضرر', hintSpinDash: 'ثبّت «دحرجة» وأنت واقف ثم اترك للانطلاق',
      hintSpikes: 'الأشواك: اقفز فوقها ولا تلمسها',
      shareText: n => `أنهيت المرحلة ${n} في «بسام» — صُنع في العراق 🇮🇶`,
      copied: 'تم نسخ النص للمشاركة',
    },
    en: {
      gameTitleMain: 'Bassam', gameTitleSub: 'of Mesopotamia',
      madeIn: 'صُنع في العراق', madeInEn: 'Made in Iraq',
      btnPlay: 'Play', btnLevels: 'Levels', btnShop: 'Shop', btnSettings: 'Settings',
      btnPrivacy: 'Privacy Policy', btnAbout: 'Story', btnExit: 'Exit', btnRoll: 'Roll', btnJump: 'Jump',
      back: 'Back', version: 'Version',
      chooseLevel: 'Choose a Level', settingsTitle: 'Settings', aboutTitle: 'Story',
      privacyTitle: 'Privacy Policy', shopTitle: 'Shop',
      sfx: 'Sound Effects', music: 'Music', haptic: 'Vibration',
      ctrlSize: 'Control Button Size', small: 'Small', medium: 'Medium', large: 'Large',
      resetAll: 'Reset All Progress', reset: 'Reset', resetConfirm: 'This will erase all your game progress. Continue?',
      language: 'Language', langAr: 'العربية', langEn: 'English',
      chooseLangTitle: 'اختر اللغة', chooseLangSub: 'Choose your language', continue: 'Continue',
      storyBody:
        'In a land where two rivers older than memory still flow, a boy named Bassam was born in a small village near the marshes. '
        + 'His grandfather told him tales of great cities built from clay and dreams: Babylon with its towers, Ur with its ziggurats, '
        + 'and Baghdad with its golden domes. One stormy night, the Ten Treasures of Mesopotamia were stolen from the museums of the ten cities, '
        + 'scattered along paths guarded by spikes, scorpions, and mysterious guardians. Bassam rose, tied his shemagh, laced his running shoes, '
        + 'and decided to cross the ten cities one by one to reclaim the treasures and bring hope back to the land between the rivers. '
        + 'This is your journey now — run, jump, roll, and collect the coins... the adventure starts here.',
      startGame: 'Start Game', skip: 'Skip',
      exitConfirmTitle: 'Exit Game', exitConfirmBody: 'Do you want to exit Bassam now?',
      exitYes: 'Yes, Exit', exitCancel: 'Cancel',
      exitFallback: 'You can close the app using your device\u2019s back button',
      wallet: 'Coins', owned: 'Owned', equipped: 'Equipped', equip: 'Equip', buy: 'Buy',
      notEnough: 'Not enough coins',
      pauseTitle: 'Paused', resume: 'Resume', retryLevel: 'Retry Level', mainMenu: 'Main Menu',
      resultDone: 'Level Complete', resultBoss: 'Boss Defeated!', time: 'Time', coins: 'Coins',
      enemies: 'Enemies', score: 'Score', newRecord: 'New Record!', nextLevel: 'Next Level',
      retry: 'Retry', levelsBtn: 'Levels', share: 'Share',
      overTitle: 'Out of Tries', overBody: 'No worries — try again, you\u2019ll know the way.', tryAgain: 'Try Again',
      rotatePrompt: 'Rotate your device to landscape mode',
      titles: ['Beginner', 'Explorer', 'Warrior', 'Hero of Mesopotamia', 'Iraqi Legend'],
      aboutBody:
        '<p><b>Bassam</b> is a fast running-and-jumping platformer starring a son of Mesopotamia in his shemagh and agal. '
        + 'He crosses 10 worlds of Iraq: Babylon, Ur, the Marshes, Baghdad, Basra, Samarra, Erbil, Hatra, Sulaymaniyah and Mosul — '
        + '100 levels, with a boss at the end of each world.</p>'
        + '<h3>How to Play</h3><ul>'
        + '<li><b>◀ ▶</b> to move. The longer you run, the faster you go, and slopes give you extra speed.</li>'
        + '<li><b>Jump</b>: hold longer for a higher jump. Jumping on enemies defeats them.</li>'
        + '<li><b>Roll</b>: press while running to roll and attack. While standing, hold then release to spin-dash.</li>'
        + '<li>Spikes can\u2019t be defeated: jump over them.</li>'
        + '<li>Coins protect you: get hit while holding coins and you lose them all; get hit with none and you lose a try. '
        + 'You have 3 tries per level, and everything you collect is added to your wallet to buy new outfits in the Shop.</li>'
        + '</ul><h3>Stars &amp; Ranks</h3><ul>'
        + '<li>1 star: finish the level.</li><li>2 stars: finish within the target time.</li>'
        + '<li>3 stars: collect 75% or more of the coins without losing a single try.</li>'
        + '<li>S Rank: 3 stars with a time faster than the target.</li></ul>'
        + '<p class="fine">Version 1.0.2 — Made in Iraq. The game works offline and collects no personal data.</p>',
      hintMove: '\u25c0 \u25b6  Move', hintJumpPit: 'Press "Jump" over pits', hintRollKill: 'Jumping and rolling defeat enemies',
      hintCoinsShield: 'Coins shield you from damage', hintSpinDash: 'Hold "Roll" while standing, then release to dash',
      hintSpikes: 'Spikes: jump over them, don\u2019t touch',
      shareText: n => `I finished level ${n} in "Bassam" — Made in Iraq 🇮🇶`,
      copied: 'Share text copied',
    }
  };
  const t = k => (DICT[lang] && DICT[lang][k] !== undefined) ? DICT[lang][k] : (DICT.ar[k] !== undefined ? DICT.ar[k] : k);
  function set(l) { lang = (l === 'en') ? 'en' : 'ar'; document.documentElement.lang = lang; document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl'; }
  function get() { return lang; }
  return {t, set, get, DICT};
})();
