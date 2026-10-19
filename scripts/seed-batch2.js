#!/usr/bin/env node
// Seed batch 2: 18 new manuscripts for the Turath archive (global coverage).
// digitalUrl values verified live in a real browser on 2026-10-19
// (Gallica / Digital Bodleian / Google Arts & Culture; LoC item pages verified
// via the loc.gov search API + search-engine index).
// Idempotent: skips a title if it already exists in the archive.

const BASE = process.env.TURATH_API_BASE || 'https://turath-api.vercel.app';
const KEY = process.env.TURATH_API_KEY || 'turath_b0e400ec9d4e0bd994761ec18dd65052';
const PASS = process.env.TURATH_ADMIN_PASS || '';
const H = { 'x-api-key': KEY, 'x-admin-pass': PASS, 'Content-Type': 'application/json' };

const MS = [
  {
    title: 'Maqamat al-Hariri', titleAr: 'مقامات الحريري',
    author: 'Abu Muhammad al-Qasim al-Hariri (paintings by Yahya al-Wasiti)',
    dateWritten: 'c. 635 AH / 1237 CE (illustrated copy)', century: 7,
    language: 'Arabic', script: 'Naskh', subject: 'Belles-lettres (Adab)', region: 'Basra / Baghdad',
    holding: 'Bibliothèque nationale de France (MS. Arabe 5847)',
    description: 'Fifty witty tales of the trickster Abu Zayd al-Suruji, the summit of classical Arabic prose. The 1237 Baghdad copy painted by Yahya al-Wasiti carries some of the finest illustrations of medieval Islamic art, a vivid window into 13th-century life.',
    descriptionAr: 'خمسون مقامة بديعة في أدب العربية، من عيون النثر الكلاسيكي، صاغها الحريري في البصرة. ونسخة بغداد سنة 635هـ برسوم يحيى الواسطي من أروع مصورات الفن الإسلامي في القرن السابع الهجري.',
    sources: 'Étienvre & Mokri (eds), Hariri, Maqamat; BnF Arabe 5847 catalogue',
    digitalUrl: 'https://gallica.bnf.fr/ark:/12148/btv1b8422965p'
  },
  {
    title: 'Kalila wa Dimna', titleAr: 'كليلة ودمنة',
    author: 'Abd Allah ibn al-Muqaffa',
    dateWritten: 'c. 710 AH / 1310 CE (illustrated Egyptian copy)', century: 8,
    language: 'Arabic', script: 'Naskh', subject: 'Fables & Statecraft', region: 'Egypt, Cairo',
    holding: 'Library of Congress',
    description: 'The great mirror-of-princes fable collection that travelled from India (Panchatantra) through Persian into Arabic, teaching kingship, ethics and statecraft through animal tales. It became one of the most widely translated books in world history.',
    descriptionAr: 'مجموعة الحكم والأمثال الشهيرة التي انتقلت من الهند إلى الفارسية ثم إلى العربية على يد ابن المقفع، تعلّم السياسة والأخلاق وإدارة الملك عبر حكايات الحيوان، وصارت من أكثر الكتب ترجمة في التاريخ.',
    sources: 'Ibn al-Muqaffa, Kalila wa Dimna (LoC 2021667224)',
    digitalUrl: 'https://www.loc.gov/item/2021667224/'
  },
  {
    title: 'Al-Muqaddimah (Prolegomena to History)', titleAr: 'المقدمة',
    author: 'Abd al-Rahman ibn Khaldun',
    dateWritten: 'c. 779 AH / 1377 CE', century: 8,
    language: 'Arabic', script: 'Naskh', subject: 'Historiography & Sociology', region: 'Tunis / Cairo',
    holding: 'Lifetime copies survive in Istanbul libraries (Süleymaniye, Topkapı)',
    description: 'The introduction to Ibn Khaldun\'s Kitab al-Ibar, and the founding work of the science of civilisation (ilm al-umran): society, economics, politics and the rise and fall of dynasties analysed with a rigour centuries ahead of its time.',
    descriptionAr: 'مقدمة ابن خلدون لكتاب العبر، وهي المؤسس لعلم العمران البشري: تحليل المجتمع والاقتصاد والسياسة وصعود الدول وسقوطها بدقة سبقت عصرها بقرون. نُسخ بلغت في حياة المؤلف محفوظة في مكتبات إستانبول.',
    sources: 'Ibn Khaldun, Kitab al-Ibar; F. Rosenthal, The Muqaddimah: An Introduction to History', digitalUrl: ''
  },
  {
    title: 'Rihla (Tuhfat al-Nuzzar fi Gharaib al-Amsar)', titleAr: 'تحفة النظار في غرائب الأمصار وعجائب الأسفار',
    author: 'Shams al-Din Ibn Battuta',
    dateWritten: 'c. 757 AH / 1356 CE (dictated in Fez)', century: 8,
    language: 'Arabic', script: 'Maghribi / Naskh', subject: 'Travel', region: 'Tangier, Morocco',
    holding: 'Multiple recensions; scholarly editions based on the Fez recension',
    description: 'The travels of Ibn Battuta: 120,000 km across Africa, the Middle East, India, Southeast Asia and China over 29 years. The greatest travel account of the pre-modern world, and a first-hand record of the 14th-century Dar al-Islam.',
    descriptionAr: 'رحلات ابن بطوطة عبر 120 ألف كيلومتر من إفريقية إلى الهند والصين على مدى تسعة وعشرين عاما، أوسع رحالة في العالم قبل العصر الحديث، وسجل مباشر لديار الإسلام في القرن الثامن الهجري.',
    sources: 'Ibn Battuta, Rihla (ed. & trans. H.A.R. Gibb)', digitalUrl: ''
  },
  {
    title: 'Nuzhat al-Mushtaq (Tabula Rogeriana)', titleAr: 'نزهة المشتاق في اختراق الآفاق',
    author: 'Abu Abd Allah al-Idrisi',
    dateWritten: 'c. 548 AH / 1154 CE', century: 6,
    language: 'Arabic', script: 'Naskh', subject: 'Geography', region: 'Palermo, Sicily',
    holding: 'Bodleian Library, Oxford (MS. Pococke 375, Cairo 1553 copy)',
    description: 'Commissioned by Roger II of Sicily, al-Idrisi\'s world geography divided the known world into seventy climate zones and mapped them with unprecedented accuracy — the most detailed geography of the 12th century, East or West.',
    descriptionAr: 'جغرافية العالم التي كلف بها الملك روجر الثاني في صقلية، قسّمت المعمورة إلى سبعين إقليما ورسمتها بدقة لم يبلغها أحد في القرن السادس الهجري، شرقا وغربا.',
    sources: 'Al-Idrisi, Nuzhat al-Mushtaq; Bodleian MS. Pococke 375',
    digitalUrl: 'https://digital.bodleian.ox.ac.uk/objects/ced0d8bd-1019-4af2-9086-e411115f1507/'
  },
  {
    title: 'Suwar al-Kawakib al-Thabita (Book of Fixed Stars)', titleAr: 'صور الكواكب الثابتة',
    author: 'Abd al-Rahman al-Sufi',
    dateWritten: 'c. 373 AH / 984 CE (oldest dated copy 400 AH / 1009)', century: 4,
    language: 'Arabic', script: 'Naskh', subject: 'Astronomy', region: 'Isfahan / Rayy, Persia',
    holding: 'Bodleian Library, Oxford (MS. Marsh 144)',
    description: 'Al-Sufi corrected Ptolemy\'s star catalogue from his own observations and painted each constellation twice, as seen in the sky and reversed on a celestial globe. His magnitudes and star names passed into European astronomy through the Latin translations.',
    descriptionAr: 'صحّح الصوفي جداول بطليموس بمشاهداته، ورسم كل برج مرتين: كما يبدو في السماء ومعكوسا على الكرة السماوية. انتقلت مقاديره وأسماؤه النجمية إلى الفلك الأوروبي عبر الترجمات اللاتينية.',
    sources: 'Al-Sufi, Kitab Suwar al-Kawakib; Bodleian MS. Marsh 144; Kunitzsch studies',
    digitalUrl: 'https://digital.bodleian.ox.ac.uk/objects/c1caa84c-f6d2-483f-9eb4-2439cccdc801/'
  },
  {
    title: 'Kitab al-Tasrif (The Method of Medicine)', titleAr: 'التصريف لمن عجز عن التأليف',
    author: 'Abu al-Qasim al-Zahrawi (Abulcasis)',
    dateWritten: 'c. 400 AH / 1000 CE', century: 4,
    language: 'Arabic', script: 'Naskh', subject: 'Medicine & Surgery', region: 'Cordoba, al-Andalus',
    holding: 'Escorial and Bodleian copies; Latin translations across medieval Europe',
    description: 'Thirty books of medicine from al-Andalus, the last of which — on surgery — illustrated over 200 instruments and remained Europe\'s surgical authority for five centuries. Al-Zahrawi introduced catgut sutures, forceps and the syringe.',
    descriptionAr: 'ثلاثون كتابا في الطب من الأندلس، أعظمها مقالة الجراحة التي رسمت أكثر من مائتي أداة جراحية، وظلت مرجع أوروبا في الجراحة خمسة قرون. أدخل الزهراوي خياطة الأمعاء بالكتان والكلاليب والمحقن.',
    sources: 'Al-Zahrawi, al-Tasrif; Spink & Lewis, Albucasis on Surgery', digitalUrl: ''
  },
  {
    title: 'Baburnama (Memoirs of Babur)', titleAr: 'بابر نامہ',
    author: 'Zahir al-Din Muhammad Babur',
    dateWritten: 'c. 937 AH / 1530 CE', century: 10,
    language: 'Chagatai Turkic', script: 'Nastaliq', subject: 'Memoirs & History', region: 'Fergana / Agra',
    holding: 'Walters Art Museum, Baltimore (W.596)',
    description: 'The candid autobiography of the founder of the Mughal Empire — battles, gardens, poetry, melons and honest self-assessment — written in elegant Chagatai Turkic and later translated into Persian at Akbar\'s court.',
    descriptionAr: 'سيرة ذاتية صادقة لمؤسس الإمبراطورية المغولية الهندية: حروبه وبساتينه وشعره وتأملاته، كتبها بالتركية الجغتائية ثم تُرجمت إلى الفارسية في بلاط أكبر.',
    sources: 'Babur, Baburnama (trans. A.S. Beveridge; W.M. Thackston); Walters W.596', digitalUrl: ''
  },
  {
    title: 'Masnavi Ma\'navi (Spiritual Couplets)', titleAr: 'مثنوي معنوي',
    author: 'Jalal al-Din Rumi',
    dateWritten: 'c. 669 AH / 1270 CE (15th-century complete copy at LoC)', century: 7,
    language: 'Persian', script: 'Nastaliq', subject: 'Sufi Poetry', region: 'Konya, Anatolia',
    holding: 'Library of Congress',
    description: 'Six books and 25,000 couplets — Rumi called it "the shop of love". The Masnavi became the Qur\'an of Sufism in Persian, teaching through stories within stories the soul\'s journey back to its Beloved.',
    descriptionAr: 'ستة دواوين في نحو خمسة وعشرين ألف بيت، سماها مولانا "دكان العشق": أشهر منظومة صوفية بالفارسية، تعلّم عبر القصص داخل القصص رحلة النفس إلى محبوبها.',
    sources: 'Rumi, Masnavi (trans. R.A. Nicholson); LoC 2012498861',
    digitalUrl: 'https://www.loc.gov/item/2012498861/'
  },
  {
    title: 'Khamsa of Nizami (Makhzan al-Asrar)', titleAr: 'مخزن الأسرار',
    author: 'Nizami Ganjavi',
    dateWritten: 'c. 575–600 AH / 1180–1200 CE', century: 6,
    language: 'Persian', script: 'Nastaliq', subject: 'Poetry', region: 'Ganja / Herat',
    holding: 'Library of Congress',
    description: 'The five masterpieces of Nizami — including Layla Majnun, Khusrau Shirin and the Seven Beauties — which fixed the Persian romantic epic for eight centuries and fed the ateliers of Mughal and Ottoman painters.',
    descriptionAr: 'خمس قصائد عظمى لشيخ الشعر الفارسي نظامي، منها ليلى ومجنون وخسرو وشيرين وسبع beauties، رسّخت الملحمة الغنائية الفارسية ثمانية قرون وألهبت ريشة مصوري المغول والعثمانيين.',
    sources: 'Nizami, Khamsa (trans. C.E. Wilson); LoC 2015481278',
    digitalUrl: 'https://www.loc.gov/item/2015481278/'
  },
  {
    title: 'Tarikh al-Sudan (History of the Sudan)', titleAr: 'تاريخ السودان',
    author: 'Abd al-Rahman al-Sa\'di',
    dateWritten: 'completed 1066 AH / 1656 CE', century: 11,
    language: 'Arabic', script: 'Sahelian (Sudani) script', subject: 'History', region: 'Timbuktu',
    holding: 'Ahmed Baba Institute, Timbuktu',
    description: 'Written by Timbuktu\'s qadi, the chronicle narrates the Songhai Empire, its scholars and saints, and the city\'s place in the wider Muslim world — one of the great histories of Africa, written in Africa.',
    descriptionAr: 'تأليف قاضي تِنبكتُو عبد الرحمن السعدي: سجل إمبراطورية سنغاي وعلمائها وأوليائها ومكانة المدينة في العالم الإسلامي، من أ عظم تواريخ إفريقيا المكتوبة في إفريقيا.',
    sources: 'Al-Sa\'di, Tarikh al-Sudan (trans. O. Houdas); Google Arts & Culture, Timbuktu\'s Written Heritage',
    digitalUrl: 'https://artsandculture.google.com/story/timbuktu-s-written-heritage/mQWRqt8Tw-vmWg'
  },
  {
    title: 'Tarikh al-Fattash (Chronicle of the Seeker)', titleAr: 'تاريخ الفتاش',
    author: 'Mahmud Kati (completed by his grandson Ibn al-Mukhtar)',
    dateWritten: 'compiled to 1077 AH / 1666 CE', century: 11,
    language: 'Arabic', script: 'Sahelian (Sudani) script', subject: 'History', region: 'Timbuktu / Songhai',
    holding: 'Ahmed Baba Institute, Timbuktu',
    description: 'A chronicle of the Songhai Empire and the great empires of the West African Sudan before it, from Ghana to Mali. Alongside the Tarikh al-Sudan it is a foundational source for pre-colonial West African history.',
    descriptionAr: 'سجل إمبراطورية سنغاي وما قبلها من ممالك السودان الغربي من غانا إلى مالي، ومع تاريخ السودان يُعد من المصادر الأساسية لتاريخ غرب إفريقيا قبل الاستعمار.',
    sources: 'Kati, Tarikh al-Fattash (trans. O. Houdas & M. Delafosse)',
    digitalUrl: 'https://artsandculture.google.com/story/timbuktu-s-written-heritage/mQWRqt8Tw-vmWg'
  },
  {
    title: 'Nayl al-Ibtihaj (Biographical Dictionary of the Sudan)', titleAr: 'نيل الابتهاج بتطريز الديباج',
    author: 'Ahmed Baba al-Timbukti',
    dateWritten: 'c. 1005 AH / 1596 CE', century: 10,
    language: 'Arabic', script: 'Sahelian (Sudani) script', subject: 'Biography & Scholarship', region: 'Timbuktu',
    holding: 'Ahmed Baba Institute, Timbuktu',
    description: 'The biographical dictionary of West Africa\'s greatest scholar — hundreds of lives of the ulama of the Sudan — written a year after his return from exile in Morocco, mapping the intellectual world of the Sahel.',
    descriptionAr: 'معجم التراجم لأكبر علماء غرب إفريقيا أحمد بابا التمبكتي: مئات التراجم لعلماء السودان، كتبه بعد عودته من منفاه بالمغرب، فرسم خريطة العالم العلمي في الساحل الإفريقي.',
    sources: 'Ahmed Baba, Nayl al-Ibtihaj; John Hunwick studies', digitalUrl: ''
  },
  {
    title: 'Tedzkirat al-Nisyan (Memoir of Forgetfulness)', titleAr: 'تذكرة النسيان',
    author: 'Anonymous (18th-century Timbuktu chronicler)',
    dateWritten: 'c. 1130 AH / 1718 CE', century: 12,
    language: 'Arabic', script: 'Sahelian (Sudani) script', subject: 'History', region: 'Timbuktu',
    holding: 'Ahmed Baba Institute, Timbuktu',
    description: 'The third of Timbuktu\'s great chronicles: an anonymous account of the Moroccan pashalik of Timbuktu (1612–1750), recording governors, scholars and everyday life under Arma rule.',
    descriptionAr: 'ثالث سجلات تِنبكتُو الكبرى: أخبار مجهولة المؤلف عن باشوية المغرب في تمبكتو من 1612 إلى 1750، تسجل الولاة والعلماء والحياة اليومية في عهد الأرما.',
    sources: 'Tedzkiret en-Nisian (trans. O. Houdas)', digitalUrl: ''
  },
  {
    title: 'Nur al-Albab (Didactic Poems of the Sokoto Revival)', titleAr: 'نور الألباب',
    author: 'Nana Asma\'u bint Usman dan Fodio',
    dateWritten: 'c. 1256 AH / 1840 CE', century: 13,
    language: 'Arabic (with Fulfulde & Hausa verses)', script: 'Naskh', subject: 'Education & Poetry', region: 'Sokoto Caliphate',
    holding: 'Arewa House and private collections, Nigeria',
    description: 'The poet-scholar daughter of the Sokoto caliph\'s founder wrote didactic verse that trained a generation of women teachers (jajis), carrying learning through the Caliphate in Arabic, Fulfulde and Hausa — a landmark of African Islamic scholarship.',
    descriptionAr: 'أشعار تعليمية لبنت الشيخ عثمان بن فودي، العالمَة الشاعرة التي أعدت جيلا من المعلمات "الجاجيات" لنشر العلم في الخلافة بالعربية والفلانية والهوسية، من أعلام العلم الإسلامي الإفريقي.',
    sources: 'Beverly Mack & Jean Boyd, One Woman\'s Jihad; WKKS corpus', digitalUrl: ''
  },
  {
    title: 'Ajaib al-Makhluqat (Wonders of Creation)', titleAr: 'عجائب المخلوقات وغرائب الموجودات',
    author: 'Zakariya ibn Muhammad al-Qazwini',
    dateWritten: 'c. 660 AH / 1262 CE', century: 7,
    language: 'Arabic', script: 'Naskh', subject: 'Cosmography', region: 'Baghdad',
    holding: 'Numerous illustrated copies (Met, British Library, Bibliothèque nationale de France)',
    description: 'The beloved cosmography of the medieval world: heavens, angels, peoples, animals and marvels, painted in hundreds of illustrated copies from Turkey to India. For centuries it was the popular encyclopaedia of the natural world in Islam.',
    descriptionAr: 'كوسموغرافيا العصور الوسطى المحببة: السماء والملائكة والأمم والحيوان والعجائب، نُسخت بالتصوير مئات المرات من تركيا إلى الهند، وظلت قرونا موسوعة الطبيعة الشعبية في الإسلام.',
    sources: 'Al-Qazwini, Ajaib al-Makhluqat (trans. H. Ethé)', digitalUrl: ''
  },
  {
    title: 'Al-Muwatta (The Well-Trodden Path)', titleAr: 'الموطأ',
    author: 'Imam Malik ibn Anas',
    dateWritten: 'c. 148 AH / 765 CE', century: 2,
    language: 'Arabic', script: 'Hijazi / early Naskh', subject: 'Hadith & Fiqh', region: 'Medina',
    holding: 'Early Maghribi recensions (Mālikī transmission); fragments among the oldest Qur\'anic finds',
    description: 'The earliest surviving compendium of law and hadith, the book of Medina: Imam Malik\'s Muwatta arranged the practice of the Prophet and the people of Medina into the path that would bear the name of a madhhab across Africa and al-Andalus.',
    descriptionAr: 'أقدم مدونة فقهية وصلتنا، كتاب المدينة: رتّب الإمام مالك فيه عمل النبي وعلماء المدينة في "الموطأ" الذي صار منهج مالك في إفريقية والأندلس، وأول عرش السند في الحديث.',
    sources: 'Malik, al-Muwatta (trans. Aisha Bewley)', digitalUrl: ''
  },
  {
    title: 'Kitab al-Aghani (Book of Songs)', titleAr: 'كتاب الأغاني',
    author: 'Abu al-Faraj al-Isfahani',
    dateWritten: 'c. 360 AH / 970 CE', century: 4,
    language: 'Arabic', script: 'Naskh', subject: 'Music & Belles-lettres', region: 'Baghdad',
    holding: 'Bodleian Library and Bibliothèque nationale de France copies',
    description: 'Twenty volumes collecting songs from the Umayyad court to Baghdad\'s golden age — the melodies, poets, singers and gossip of four centuries of Islamic music, and an inexhaustible mine of Arabic poetry and history.',
    descriptionAr: 'عشرون مجلدا تجمع الأغاني من بني أمية إلى عصر بغداد الذهبي: أنغامها وشعرها ومغنييها وأخبارها، ومنجم لا ينضب من الشعر العربي وتاريخه.',
    sources: 'Abu al-Faraj al-Isfahani, Kitab al-Aghani', digitalUrl: ''
  }
];

(async () => {
  const list = await (await fetch(`${BASE}/api/manuscripts?region=`, { headers: H })).json();
  const existing = new Set((list.manuscripts || []).map(m => m.title.toLowerCase()));
  let added = 0, skipped = 0;
  for (const m of MS) {
    if (existing.has(m.title.toLowerCase())) { console.log(`SKIP (exists): ${m.title}`); skipped++; continue; }
    const r = await fetch(`${BASE}/api/manuscripts`, { method: 'POST', headers: H, body: JSON.stringify(m) });
    const d = await r.json();
    if (r.ok) { added++; console.log(`ADD #${d.manuscript.id}: ${m.title}`); }
    else { console.log(`ERR ${m.title}: ${d.error}`); }
  }
  console.log(`done: ${added} added, ${skipped} skipped`);
})().catch(e => { console.error('SEED FAILED:', e.message); process.exit(1); });
