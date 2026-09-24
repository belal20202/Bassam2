const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));

  await page.goto('http://localhost:8791/index.html');
  await page.waitForTimeout(500);

  // شاشة اختيار اللغة أول تشغيل
  const langVisible = await page.isVisible('#lang.show');
  console.log('lang screen visible on first run:', langVisible);
  await page.click('#langEn');
  await page.waitForTimeout(300);

  // شاشة القصة تظهر بعد اختيار اللغة (أول مرة)
  const storyVisible = await page.isVisible('#story.show');
  console.log('story screen visible after choosing language:', storyVisible);
  const storyText = await page.$eval('#storyText', el => el.textContent.slice(0, 20));
  console.log('story text sample:', JSON.stringify(storyText));

  // تخطّي القصة إلى القائمة
  await page.click('#storySkip');
  await page.waitForTimeout(300);
  const menuVisible = await page.isVisible('#menu.show');
  console.log('menu visible after skip:', menuVisible);
  const titleTxt = await page.$eval('.title', el => el.textContent);
  console.log('menu title text:', titleTxt);

  const back = () => page.click('.screen.show [data-back]');

  // المراحل
  await page.click('#mLevels');
  await page.waitForTimeout(200);
  const cellCount = await page.$$eval('.cell', els => els.length);
  console.log('level cells:', cellCount);
  await back();

  // المتجر
  await page.click('#mShop');
  await page.waitForTimeout(400);
  const skinCards = await page.$$eval('.skinCard', els => els.length);
  console.log('shop skin cards:', skinCards);
  // حاول شراء زي (يفشل غالباً لعدم توفر دنانير كافية، لكن يجب ألا يسبب خطأ)
  const buyButtons = await page.$$('.skinCard button');
  if (buyButtons.length > 1) { await buyButtons[1].click(); await page.waitForTimeout(150); }
  await back();

  // الإعدادات: تبديل اللغة إلى العربية ثم الرجوع إلى الإنجليزية
  await page.click('#mSettings');
  await page.waitForTimeout(150);
  await page.click('[data-lang="ar"]');
  await page.waitForTimeout(150);
  const arTitle = await page.$eval('.title', el => el.textContent);
  console.log('title after switching to Arabic:', arTitle);
  await page.click('[data-lang="en"]');
  await page.waitForTimeout(150);
  await page.click('.tg');
  await back();

  // القصة من القائمة + سياسة الخصوصية
  await page.click('#mAbout');
  await page.waitForTimeout(100);
  await page.click('#storySkip');
  await page.waitForTimeout(150);
  await page.click('#mPrivacy');
  await page.waitForTimeout(300);
  const frameOk = await page.$eval('#pFrame', f => !!f.src && f.src.includes('privacy.html'));
  console.log('privacy frame ok:', frameOk);
  await back();

  // اللعب
  await page.click('#mPlay');
  await page.waitForTimeout(300);
  const touchVisible = await page.isVisible('#touch:not(.hidden)');
  console.log('touch controls visible:', touchVisible);
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 200; i++) {
    if (i % 40 === 0) { await page.keyboard.down('ArrowUp'); await page.waitForTimeout(16); await page.keyboard.up('ArrowUp'); }
    await page.waitForTimeout(16);
  }
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: '/home/claude/bassam/tools/shot-play.png' });

  // إيقاف مؤقت -> قائمة
  await page.click('#bPause');
  await page.waitForTimeout(150);
  const pauseVisible = await page.isVisible('#pause.show');
  console.log('pause visible:', pauseVisible);
  await page.click('#pMenu');
  await page.waitForTimeout(300);

  // تأكيد الخروج (نلغي بدلاً من الخروج الفعلي لعدم إغلاق المتصفح)
  await page.click('#mExit');
  await page.waitForTimeout(150);
  const exitVisible = await page.isVisible('#exitConfirm.show');
  console.log('exit confirm visible:', exitVisible);
  await page.click('#exitCancel');
  await page.waitForTimeout(150);
  const backAtMenu = await page.isVisible('#menu.show');
  console.log('back at menu after cancel:', backAtMenu);
  await page.screenshot({ path: '/home/claude/bassam/tools/shot-menu.png' });

  // إعادة تحميل الصفحة والتحقق من بقاء الحفظ (لا تظهر شاشة اللغة أو القصة مجدداً)
  await page.reload();
  await page.waitForTimeout(600);
  const langVisible2 = await page.isVisible('#lang.show');
  const menuVisible2 = await page.isVisible('#menu.show');
  console.log('after reload -> lang shown again:', langVisible2, '| menu shown directly:', menuVisible2);

  console.log('---ERRORS---');
  errors.forEach(e => console.log(e));
  console.log('ERROR COUNT:', errors.length);

  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
