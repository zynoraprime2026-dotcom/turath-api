// Turath API — full ʿIlm al-Rijāl (علم الرجال) dataset: narrators, the jarh
// wa ta'dil grade ladder, and the terminology of the science.
// Narrator grades follow Ibn Hajar's Taqrib at-Tahdhib (and similar classic
// authorities, cited per entry). Served by GET /api/rijal when the `rijal`
// table is empty; importable via POST /api/rijal?seed=builtin (curator).
// Underscore prefix => excluded from the Vercel function count.

// ---- The ladder of grades (jarh wa ta'dil), best to worst ----
const GRADES = [
  { code: 'sahabi', rank: 1, en: 'Sahabi — Companion', ar: 'صحابي',
    defEn: 'Companion of the Prophet ﷺ. The Ummah accepts every Companion as upright (ʿadil) by consensus; narrator criticism applies to later generations.',
    defAr: 'من لقي النبي ﷺ مؤمنا به ومات على الإسلام، والصحابة كلهم عدول بإجماع، والنقد إنما يجري فيمن بعدهم.' },
  { code: 'thiqah_hafiz', rank: 2, en: 'Thiqah, hafiz — utmost reliability', ar: 'ثقة حافظ / ثقة ثقة',
    defEn: 'Fully reliable with complete mastery (dabt). The highest grade after the Companions; Bukhari and Muslim build their Sahih on such narrators.',
    defAr: 'ثقة ثبت ضابط متقن، أعلى مراتب التوثيق بعد الصحابة، وعليها مدار شرط الصحيحين.' },
  { code: 'thiqah', rank: 3, en: 'Thiqah — reliable', ar: 'ثقة',
    defEn: 'Trustworthy and precise. His reports are accepted as evidence without hesitation.',
    defAr: 'موصوف بالعدالة والضبط، تقبل روايته حجة بلا توقف.' },
  { code: 'saduq', rank: 4, en: 'Saduq — truthful', ar: 'صدوق',
    defEn: 'Truthful with minor slips; hadith is written and generally accepted, sometimes with support (mutabaʿah).',
    defAr: 'لا بأس به، يكتب حديثه ويقبل، وقد يحتاج إلى المتابعة في مواضع.' },
  { code: 'layyin', rank: 5, en: 'Saduq, prone to error', ar: 'صدوق يهم / سيئ الحفظ',
    defEn: 'Truthful but the memory is weak (sayyi al-hifz). Reports are accepted only with support; used for consideration, not proof.',
    defAr: 'صدوق كثير الوهم، لا تقبل روايته إلا بالمتابعة، ويُعتبر به ولا يُحتج به.' },
  { code: 'mastur', rank: 6, en: 'Mastur — concealed', ar: 'مستور',
    defEn: 'Identity known but reliability unestablished; acceptable with support, weak alone (per most critics).',
    defAr: 'مستور الحال: عُينت عينه ولم تقوم بينة عدالته، يقبل بالمتابعة ويضعف انفراده عند جمهور النقاد.' },
  { code: 'majhul', rank: 7, en: 'Majhul — unknown', ar: 'مجهول',
    defEn: 'Unknown identity or no verified teacher; his lone report cannot stand as evidence.',
    defAr: 'من لم تُعرف عينه أو لم يرو عنه إلا راو واحد مجهول، فلا تُقبل روايته منفردة.' },
  { code: 'daif', rank: 8, en: 'Daʿif — weak', ar: 'ضعيف',
    defEn: 'Rejected as evidence: failing memory, unresolved criticism, or sin. Weakness ranges from light to severe.',
    defAr: 'سقطت روايته عن درجة الاحتجاج لخلل في ضبطه أو جرح لم يقبل توضيحه، والضعف يتفاوت.' },
  { code: 'matruk', rank: 9, en: 'Matruk — abandoned', ar: 'متروك',
    defEn: 'Abandoned: severe criticism — accused of lying, fabrications, or major error. Reports discarded outright.',
    defAr: 'تركوا حديثه لفسقه أو كذبه أو وهمه الكثير، فروايته ساقطة رأسا.' },
  { code: 'kadhdhab', rank: 10, en: 'Kadhdhab — accused of fabrication', ar: 'كذاب / متهم بالوضع',
    defEn: 'Accused of lying or inventing hadith. The imams exposed such narrators so no report of theirs survives scrutiny.',
    defAr: 'اتهمه النقاد بالكذب أو الوضع على رسول الله ﷺ، وكشف الأئمة أحوالهم صيانة للسنة.' }
];

// ---- Terminology of the science ----
const TERMS = [
  { term: 'Ilm al-Rijal', ar: 'علم الرجال', defEn: 'The science of evaluating hadith narrators — their identities, reliability and eras — the distinctive apparatus that authenticates the Sunnah.', defAr: 'علم يُعرف به حال روة الحديث من حيث القبول والرد، وهو أعظم خصائص هذه الأمة في حفظ السنة.' },
  { term: 'Isnad', ar: 'الإسناد', defEn: 'The chain of narrators linking a text back to the Prophet ﷺ. "Whoever wants to hear without isnad is like a wood-gatherer at night."', defAr: 'سلسلة الرواة الموصلة للمتن إلى النبي ﷺ، وبهذا الإسناد امتازت هذه الأمة.' },
  { term: 'Matn', ar: 'المتن', defEn: 'The text of the hadith itself, as distinct from its chain.', defAr: 'نص الحديث المنتهي إليه السند.' },
  { term: 'Jarh wa Taʿdil', ar: 'الجرح والتعديل', defEn: 'Wounding and validating: the critics\' verdicts on a narrator — declaring him reliable (taʿdil) or criticized (jarh) — governed by strict rules of justice and evidence.', defAr: 'بحث في أحوال الرواة: تعديل ببيان عدالته وضبطه، أو جرح ببيان خلله وسببه، بشروط وضوابط.' },
  { term: 'ʿAdl', ar: 'العدالة', defEn: 'Uprightness: a narrator\'s Islam, maturity, freedom from open sin and from practices that dishonor.', defAr: 'استقامة الراوي في دينه وسلامته من الفسق وخوارم المروءة.' },
  { term: 'Dabt', ar: 'الضبط', defEn: 'Precision: accurate memory in recall or writing — the second pillar of a sahih narration after ʿadl.', defAr: 'إتقان الراوي لما يرويه حفظا في صدره أو ضبطا في كتابه.' },
  { term: 'Tabaqah', ar: 'الطبقة', defEn: 'Generation: peers who share teachers and students — Companions, Successors (Tabiʿin), their followers, and so on, century by century.', defAr: 'جماعة اشتركوا في اللقاء والأخذ عن المشايخ والرواية عنهم، كالصحابة ثم التابعين وأتباعهم.' },
  { term: 'Mudallis / Tadlis', ar: 'المدلس والتدليس', defEn: 'One who narrates from a contemporary he never actually met, wording it deceptively ("from so-and-so"). Only his explicit hearings ("I heard") are accepted.', defAr: 'من روى عمن عاصره ولم يلقه بلفظ محتمل، فلا يقبل إلا ما صرح فيه بالسماع كحدثنا وسمعت.' },
  { term: 'Ikhtilat', ar: 'الاختلاط', defEn: 'Confusion: deterioration of memory in old age or after trauma; reports from the confused period are dropped, earlier ones kept.', defAr: 'اختلال ضبط الراوي بكبر أو ذهاب كتبه، فتحمل رواية المتقدمين عنه وتترك المتأخرة.' },
  { term: 'Shadhdh', ar: 'الشذوذ', defEn: 'Anomaly: a reliable narrator contradicts someone firmer; the anomalous report is discarded even if its chain looks clean.', defAr: 'مخالفة الثقة لمن هو أوثق منه أو أكثر عددا، فترد رواية الشاذ وإن صح إسنادها ظاهرا.' },
  { term: 'Iʿtibar', ar: 'الاعتبار', defEn: 'Corroboration test: gathering a narrator\'s parallels to see if others transmit the same report (mutabaʿah) or support its chain (shawahid).', defAr: 'جمع طرق الحديث لمتابعاته وشواهده لترجيح قبوله أو رده.' },
  { term: 'Mursal', ar: 'المرسل', defEn: 'A Successor\'s report that omits the Companion link ("The Prophet ﷺ said..."); most critics treat it as defective unless supported.', defAr: 'ما سقط من إسناده من روى عنه الراوي للنبي ﷺ، كإرسال التابعي، ويحتج به الحنفية والمالكية بشرط.' },
  { term: 'Sahih / Hasan / Daʿif', ar: 'الصحيح والحسن والضعيف', defEn: 'Hadith grades: sahih (fully authentic chain, no defect), hasan (reliable but slightly lesser precision), daʿif (failing the conditions).', defAr: 'درجات الحديث بعد نقد إسناده ومتنه: الصحيح والحسن والضعيف.' },
  { term: 'Thiqah, thiqa', ar: 'ثقة ثقة', defEn: 'The doubled form — utmost reliability, the grade of the golden chains like Nafiʿ and Malik.', defAr: 'صيغة التوكيد في التوثيق، كوصف نافع بثقة ثقة.' }
];

// ---- Narrators ----
const RIJAL = [
  // ===== Companions (anchor points of the isnad tree) =====
  {
    slug: 'abu-hurayrah', nameEn: 'Abu Hurayrah', nameAr: 'أبو هريرة',
    fullName: 'Abd ar-Rahman ibn Sakhr ad-Dawsi', generation: 'Sahabi', deathYear: 57,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابي عدل بإجماع' },
    teachers: [], students: ['Saʿid ibn al-Musayyib', 'Abu Salih', 'Hasan al-Basri'],
    region: 'Madinah',
    bioEn: 'The most prolific Companion narrator (over 5,000 hadiths); kept constant company with the Prophet ﷺ for about three years.',
    bioAr: 'أكثر الصحابة رواية للحديث، لازم النبي ﷺ نحو ثلاث سنين.',
    source: 'Companion'
  },
  {
    slug: 'abdullah-ibn-umar', nameEn: 'Abdullah ibn Umar', nameAr: 'عبد الله بن عمر',
    fullName: 'Abdullah ibn Umar ibn al-Khattab', generation: 'Sahabi', deathYear: 73,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابي عدل بإجماع' },
    teachers: [], students: ['Nafiʿ', 'Salim ibn Abdillah', 'Hasan al-Basri'],
    region: 'Madinah',
    bioEn: 'Son of Umar and among the strictest followers of the Sunnah; the golden chain (Ibn Umar → Nafiʿ → Malik) begins with him.',
    bioAr: 'أشد الصحابة اتباعا للسنة، ومنه تبدأ السلسلة الذهبية: ابن عمر عن نافع عن مالك.',
    source: 'Companion'
  },
  {
    slug: 'aishah', nameEn: 'Aishah bint Abi Bakr', nameAr: 'عائشة بنت أبي بكر',
    fullName: 'Aishah bint Abi Bakr as-Siddiq, Mother of the Believers', generation: 'Sahabiyyah', deathYear: 58,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابية عدل بإجماع' },
    teachers: [], students: ['Urwah ibn az-Zubayr', 'Amrah bint Abd ar-Rahman', 'Al-Qasim ibn Muhammad'],
    region: 'Madinah',
    bioEn: 'Mother of the Believers, among the most learned of the Ummah in fiqh, medicine and hadith; about 2,210 hadiths are narrated from her.',
    bioAr: 'أم المؤمنين من أفقه نساء الأمة، روي عنها نحو ألفين ومائة حديث.',
    source: 'Companion'
  },
  {
    slug: 'abdullah-ibn-abbas', nameEn: 'Abdullah ibn Abbas', nameAr: 'عبد الله بن عباس',
    fullName: 'Abdullah ibn al-Abbas, cousin of the Prophet ﷺ', generation: 'Sahabi', deathYear: 68,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابي عدل بإجماع' },
    teachers: [], students: ['Ikrimah', 'Saʿid ibn Jubayr', 'Mujahid', 'Ataʿ'],
    region: 'Madinah / Taʿif',
    bioEn: 'The "Interpreter of the Quran" whose gatherings produced a generation of leading Successors.',
    bioAr: 'ترجمان القرآن وحبر الأمة، أخرج مجالسه صفوة كبار التابعين.',
    source: 'Companion'
  },
  {
    slug: 'anas-ibn-malik', nameEn: 'Anas ibn Malik', nameAr: 'أنس بن مالك',
    fullName: 'Anas ibn Malik al-Ansari', generation: 'Sahabi', deathYear: 93,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابي عدل بإجماع' },
    teachers: [], students: ['Hasan al-Basri', 'Qatadah', 'Az-Zuhri', 'Zayd ibn Aslam'],
    region: 'Madinah / Basra',
    bioEn: 'Served the Prophet ﷺ for ten years, then taught in Basra to Hasan, Qatadah and others.',
    bioAr: 'خدم النبي ﷺ عشر سنين ثم أقرأ البصرة، فروى عنه الحسن وقتادة.',
    source: 'Companion'
  },
  {
    slug: 'jabir-ibn-abdillah', nameEn: 'Jabir ibn Abdillah', nameAr: 'جابر بن عبد الله',
    fullName: 'Jabir ibn Abdillah al-Ansari as-Sulami', generation: 'Sahabi', deathYear: 78,
    grade: { code: 'sahabi', en: 'Companion (upright by consensus)', ar: 'صحابي عدل بإجماع' },
    teachers: [], students: ['Amr ibn Dinar', 'Ataʿ ibn Abi Rabah'],
    region: 'Madinah',
    bioEn: 'Ansari Companion among the most prolific narrators; present at the Pledge of Aqabah as a boy.',
    bioAr: 'صحابي أنصاري من المكثرين، شهد بيعة العقبة غلاما.',
    source: 'Companion'
  },

  // ===== Successors — Madinah =====
  {
    slug: 'said-ibn-al-musayyib', nameEn: 'Saʿid ibn al-Musayyib', nameAr: 'سعيد بن المسيب',
    fullName: 'Saʿid ibn al-Musayyib al-Makhzumi', generation: 'Tabiʿi', deathYear: 94,
    grade: { code: 'thiqah', en: 'Thiqah — imam', ar: 'ثقة إمام' },
    teachers: ['Abu Hurayrah', 'Abdullah ibn Umar', 'Aishah'], students: ['Az-Zuhri', 'Yahya ibn Saʿid al-Ansari'],
    region: 'Madinah',
    bioEn: 'Leader of the Successors of Madinah (sayyid at-tabiʿin). Ibn Hajar: "Thiqah, imam".',
    bioAr: 'سيد التابعين بالمدينة، قال ابن حجر: ثقة إمام.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'urwah-ibn-az-zubayr', nameEn: 'Urwah ibn az-Zubayr', nameAr: 'عروة بن الزبير',
    fullName: 'Urwah ibn az-Zubayr ibn al-Awwam', generation: 'Tabiʿi', deathYear: 94,
    grade: { code: 'thiqah', en: 'Thiqah — imam', ar: 'ثقة إمام' },
    teachers: ['Aishah (his aunt)', 'Abdullah ibn Umar'], students: ['Az-Zuhri', 'Hisham ibn Urwah (his son)'],
    region: 'Madinah',
    bioEn: 'Nephew of Aishah, one of the seven jurists of Madinah, and the principal conduit of her hadiths.',
    bioAr: 'ابن أخت عائشة أحد فقهاء المدينة السبعة، وعنه انتشر حديثها.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'salim-ibn-abdillah', nameEn: 'Salim ibn Abdillah', nameAr: 'سالم بن عبد الله',
    fullName: 'Salim ibn Abdillah ibn Umar ibn al-Khattab', generation: 'Tabiʿi', deathYear: 106,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Umar (his father)'], students: ['Az-Zuhri', 'Nafiʿ'],
    region: 'Madinah',
    bioEn: 'Grandson of Umar; Bukhari placed the chain Salim → his father among the most authentic of all.',
    bioAr: 'حفيد عمر، ثقة، وسالم عن أبيه من أصح الأسانيد عند البخاري.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ali-ibn-al-husayn', nameEn: 'Ali ibn al-Husayn (Zayn al-Abidin)', nameAr: 'علي بن الحسين زين العابدين',
    fullName: 'Ali ibn al-Husayn ibn Ali ibn Abi Talib', generation: 'Tabiʿi', deathYear: 94,
    grade: { code: 'thiqah', en: 'Thiqah — worshipful', ar: 'ثقة زاهد' },
    teachers: ['Ali ibn Abi Talib (his grandfather)'], students: ['Az-Zuhri'],
    region: 'Madinah',
    bioEn: 'Grandson of Ali, famed for worship (hence "Zayn al-Abidin"); narrated from his grandfather and the senior Companions\' families.',
    bioAr: 'علي بن الحسين سبط علي بن أبي طالب، المعروف بزين العابدين لعبادته، ثقة زاهد.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'amrah-bint-abd-ar-rahman', nameEn: 'Amrah bint Abd ar-Rahman', nameAr: 'عمرة بنت عبد الرحمن',
    fullName: 'Amrah bint Abd ar-Rahman al-Ansariyyah', generation: 'Tabiʿiyyah', deathYear: 98,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Aishah'], students: ['Az-Zuhri', 'Abu az-Zinad'],
    region: 'Madinah',
    bioEn: 'A foremost student of Aishah; Malik said of reports through her: "sound, from the soundest".',
    bioAr: 'من أعلام تلاميذ عائشة، قال مالك عن حديثها: صحيح من الصحيح.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'nafi-mawla-ibn-umar', nameEn: 'Nafiʿ (mawla of Ibn Umar)', nameAr: 'نافع مولى ابن عمر',
    fullName: 'Nafiʿ ibn Abi Nuʿaym al-Madani', generation: 'Tabiʿi', deathYear: 117,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah, thiqa', ar: 'ثقة ثقة' },
    teachers: ['Abdullah ibn Umar'], students: ['Malik ibn Anas', 'Ayyub as-Sakhtiyani', 'Ubayd Allah ibn Umar'],
    region: 'Madinah',
    bioEn: 'Middle link of the golden chain (Ibn Umar → Nafiʿ → Malik), which Bukhari called the most authentic of all chains.',
    bioAr: 'الحلقة الوسطى من السلسلة الذهبية: ابن عمر عن نافع عن مالك، أصح الأسانيد عند البخاري.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'al-araj', nameEn: 'Al-Aʿraj (Abd ar-Rahman ibn Hurmuz)', nameAr: 'الأعرج عبد الرحمن بن هرمز',
    fullName: 'Abd ar-Rahman ibn Hurmuz al-Aʿraj', generation: 'Tabiʿi', deathYear: 117,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abu Hurayrah', 'Abdullah ibn Abbas'], students: ['Abu az-Zinad', 'Malik ibn Anas'],
    region: 'Madinah / Egypt',
    bioEn: 'The learned Madinan who anchors the famous chain Abu Hurayrah → al-Aʿraj → Abu az-Zinad → Malik.',
    bioAr: 'ثقة، حلقة السلسلة المشهورة: أبو هريرة عن الأعرج عن أبي الزناد عن مالك.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'muhammad-ibn-al-munkadir', nameEn: 'Muhammad ibn al-Munkadir', nameAr: 'محمد بن المنكدر',
    fullName: 'Muhammad ibn al-Munkadir ibn Abdillah al-Jumahi', generation: 'Tabiʿi', deathYear: 130,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Jabir ibn Abdillah', 'Anas ibn Malik'], students: ['Malik ibn Anas'],
    region: 'Madinah',
    bioEn: 'One of the masters of Madinah; Malik said the like of Ibn al-Munkadir had not remained in Madinah.',
    bioAr: 'من أئمة المدينة، ثقة، أثنى عليه مالك.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'rabiah-ar-ray', nameEn: 'Rabiʿah ar-Raʿy', nameAr: 'ربيعة الرأي',
    fullName: 'Rabiʿah ibn Abi Abd ar-Rahman al-Madani', generation: 'Tabiʿi', deathYear: 136,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Anas ibn Malik', 'Saʿid ibn al-Musayyib'], students: ['Malik ibn Anas'],
    region: 'Madinah',
    bioEn: 'Master-jurist of Madinah before Malik, whose legal reasoning gave him his title ("of opinion"); Malik\'s teacher.',
    bioAr: 'فقيه المدينة قبل مالك وشيخه، ثقة فقيه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'zayd-ibn-aslam', nameEn: 'Zayd ibn Aslam', nameAr: 'زيد بن أسلم',
    fullName: 'Zayd ibn Aslam al-Adawi', generation: 'Tabiʿi', deathYear: 136,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Anas ibn Malik', 'Ibn Umar'], students: ['Malik ibn Anas', 'Abdullah ibn Dinar'],
    region: 'Madinah',
    bioEn: 'Madinan jurist and exegete; Malik would cite his explanations of the Quran.',
    bioAr: 'فقيه المدينة ومفسرها، كان مالك يذكر تفسيره.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'umar-ibn-abd-al-aziz', nameEn: 'Umar ibn Abd al-Aziz', nameAr: 'عمر بن عبد العزيز',
    fullName: 'Umar ibn Abd al-Aziz ibn Marwan, Umayyad caliph', generation: 'Tabiʿi', deathYear: 101,
    grade: { code: 'thiqah', en: 'Thiqah — hafiz, mujahid caliph', ar: 'ثقة حافظ مجاهد' },
    teachers: ['Anas ibn Malik', 'As-Saʿib ibn Yazid'], students: ['Az-Zuhri', 'Yahya ibn Saʿid al-Ansari'],
    region: 'Madinah / Damascus',
    bioEn: 'The righteous Umayyad caliph (r. 99–101 AH), ranked by many with the Rashidun; he had met Companions and is counted among the jurist Successors.',
    bioAr: 'الخليفة الأموي العادل، ثقة حافظ فقيه مجاهد، يعد عند كثير من العلماء خامس الخلفاء الراشدين.',
    source: 'Taqrib at-Tahdhib'
  },

  // ===== Successors — Makkah =====
  {
    slug: 'ata-ibn-abi-rabah', nameEn: 'Ataʿ ibn Abi Rabah', nameAr: 'عطاء بن أبي رباح',
    fullName: 'Ataʿ ibn Abi Rabah al-Makki', generation: 'Tabiʿi', deathYear: 114,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Jabir ibn Abdillah', 'Abdullah ibn Abbas'], students: ['Ibn Juraij'],
    region: 'Makkah',
    bioEn: 'Mufti of Makkah, of Nubian origin; Ibn Abbas entrusted him with answering pilgrims\' questions.',
    bioAr: 'مفتي مكة، ثقة فقيه، كان ابن عباس يوليه فتاوى أهل مكة.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'mujahid-ibn-jabr', nameEn: 'Mujahid ibn Jabr', nameAr: 'مجاهد بن جبر',
    fullName: 'Mujahid ibn Jabr al-Makki', generation: 'Tabiʿi', deathYear: 104,
    grade: { code: 'thiqah', en: 'Thiqah — imam of tafsir', ar: 'ثقة إمام في التفسير' },
    teachers: ['Abdullah ibn Abbas'], students: ['Al-Aʿmash'],
    region: 'Makkah',
    bioEn: 'Bukhari\'s standard bearer of tafsir: he read the entire Quran before Ibn Abbas three times, asking about every verse.',
    bioAr: 'ثقة، أعلم التابعين بالتفسير، قرأ القرآن على ابن عباس ثلاثا وقفا على كل آية.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ikrimah', nameEn: 'Ikrimah', nameAr: 'عكرمة',
    fullName: 'Ikrimah, mawla of Ibn Abbas', generation: 'Tabiʿi', deathYear: 104,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Abbas'], students: ['Saʿid ibn Jubayr', 'Ataʿ'],
    region: 'Madinah / Makkah',
    bioEn: 'Freed slave and leading student of Ibn Abbas; the imams answered the allegations raised against him.',
    bioAr: 'مولى ابن عباس وأبرز تلاميذه، ثقة، أجاب الأئمة عمن تكلم فيه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'taus-al-yamani', nameEn: 'Taʿus ibn Kaysan', nameAr: 'طاوس بن كيسان',
    fullName: 'Taʿus ibn Kaysan al-Hamdani al-Yamani', generation: 'Tabiʿi', deathYear: 106,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Abbas', 'Abdullah ibn Amr ibn al-As'], students: ['His son Abdillah', 'Amr ibn Dinar'],
    region: 'Makkah / Yemen',
    bioEn: 'Yemeni master and ascetic; Malik said "Taʿus is the imam of the Yemenis".',
    bioAr: 'ثقة إمام زاهد، قال مالك: طاوس إمام أهل اليمن.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'amr-ibn-dinar', nameEn: 'Amr ibn Dinar', nameAr: 'عمرو بن دينار',
    fullName: 'Amr ibn Dinar al-Jumahi al-Makki', generation: 'Tabiʿi', deathYear: 126,
    grade: { code: 'thiqah', en: 'Thiqah — imam, mufti of the Haram', ar: 'ثقة إمام مفتي الحرم' },
    teachers: ['Jabir ibn Abdillah', 'Anas ibn Malik'], students: ['Ibn Juraij', 'Sufyan ibn Uyaynah'],
    region: 'Makkah',
    bioEn: 'Mufti of Makkah in his time, among the most prolific of the Successors.',
    bioAr: 'مفتي مكة في زمانه، ثقة إمام كثير الرواية.',
    source: 'Taqrib at-Tahdhib'
  },

  // ===== Successors — Kufa =====
  {
    slug: 'alqamah-ibn-qays', nameEn: 'Alqamah ibn Qays', nameAr: 'علقمة بن قيس',
    fullName: 'Alqamah ibn Qays an-Nakhaʿi', generation: 'Tabiʿi', deathYear: 62,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Masʿud', 'Aishah'], students: ['Ibrahim an-Nakhaʿi'],
    region: 'Kufa',
    bioEn: 'Great Kufan jurist of the generation right after the Companions; al-Aswad and Ibrahim followed his fiqh.',
    bioAr: 'فقيه الكوفة الكبير، ثقة، كان إبراهيم النخعي يأخذ عن فقهه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'masruq-ibn-al-ajda', nameEn: 'Masruq ibn al-Ajdaʿ', nameAr: 'مسروق بن الأجدع',
    fullName: 'Masruq ibn al-Ajdaʿ ibn Malik al-Hamdani', generation: 'Tabiʿi', deathYear: 63,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Masʿud', 'Aishah', 'Abu ad-Darda'], students: ['Ibrahim an-Nakhaʿi'],
    region: 'Kufa',
    bioEn: 'Kufan jurist who travelled to Aishah\'s house for fatwas; among the leaders of the Successors in worship and knowledge.',
    bioAr: 'فقيه كوفي، ثقة، كان يفد إلى عائشة في مسائلها، من سادات التابعين عبادة وعلما.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abu-wail', nameEn: 'Abu Waʿil Shaqiq ibn Salamah', nameAr: 'أبو وائل شقيق بن سلمة',
    fullName: 'Shaqiq ibn Salamah al-Hamdani al-Kufi', generation: 'Tabiʿi', deathYear: 82,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abdullah ibn Masʿud', 'Uthman ibn Affan'], students: ['Ibrahim an-Nakhaʿi', 'Aswan ibn Ubayd'],
    region: 'Kufa',
    bioEn: 'Senior Kufan Tabiʿi who met Uthman and Ibn Masʿud; his reports anchor many Kufan chains.',
    bioAr: 'شيخ الكوفة، ثقة، أدرك عثمان وابن مسعود وأكثر عنهما.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ibrahim-an-nakhai', nameEn: 'Ibrahim an-Nakhaʿi', nameAr: 'إبراهيم النخعي',
    fullName: 'Ibrahim ibn Yazid an-Nakhaʿi', generation: 'Tabiʿi', deathYear: 96,
    grade: { code: 'thiqah', en: 'Thiqah — imam', ar: 'ثقة إمام' },
    teachers: ['Alqamah ibn Qays', 'Masruq'], students: ['Hammad ibn Abi Sulayman', 'Al-Aʿmash'],
    region: 'Kufa',
    bioEn: 'The leading jurist of Kufa after the Companions; his fiqh passed to Abu Hanifa through Hammad.',
    bioAr: 'فقيه الكوفة بعد الصحابة، وصل فقهه إلى أبي حنيفة بواسطة حماد.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'said-ibn-jubayr', nameEn: 'Saʿid ibn Jubayr', nameAr: 'سعيد بن جبير',
    fullName: 'Saʿid ibn Jubayr al-Asadi al-Kufi', generation: 'Tabiʿi', deathYear: 95,
    grade: { code: 'thiqah', en: 'Thiqah — imam, martyr', ar: 'ثقة إمام شهيد' },
    teachers: ['Abdullah ibn Abbas'], students: ['Al-Aʿmash', 'Hammad ibn Abi Sulayman'],
    region: 'Kufa / Makkah',
    bioEn: 'Quranic exegete and jurist, martyred by the governor al-Hajjaj in 95 AH — "killed every jurist\'s heart with him".',
    bioAr: 'ثقة إمام مفسر، قتله الحجاج سنة 95 هـ، فقُتل به علم كثير.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hammad-ibn-abi-sulayman', nameEn: 'Hammad ibn Abi Sulayman', nameAr: 'حماد بن أبي سليمان',
    fullName: 'Hammad ibn Abi Sulayman al-Ashʿari', generation: 'Tabiʿi', deathYear: 120,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Ibrahim an-Nakhaʿi'], students: ['Abu Hanifa', 'Hammad ibn Salamah'],
    region: 'Kufa',
    bioEn: 'The Kufan fiqh master whose seat Abu Hanifa inherited after twenty years at his circle.',
    bioAr: 'فقيه الكوفة، ثقة، جلس إليه أبو حنفة عشرين سنة ثم خلفه في حلقته.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abu-ishak-as-sabii', nameEn: 'Abu Ishaq as-Sabiʿi', nameAr: 'أبو إسحاق السبيعي',
    fullName: 'Amr ibn Abdillah as-Sabiʿi al-Hamdani', generation: 'Tabiʿi', deathYear: 127,
    grade: { code: 'thiqah', en: 'Thiqah — became mixed in old age', ar: 'ثقة اختلط بأخره' },
    teachers: ['Al-Baraʿ ibn Azib', 'Zayd ibn Arqam'], students: ['Al-Aʿmash', 'Sufyan ath-Thawri', 'Shuʿbah'],
    region: 'Kufa',
    bioEn: 'Senior Kufan narrator whose hearing failed in old age; reports of the early transmitters from him remain dependable.',
    bioAr: 'شيخ الكوفة، ثقة، اختلط سمعه بكبره فتُعد رواية الأقدمين عنه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'mansur-ibn-al-mutamir', nameEn: 'Mansur ibn al-Muʿtamir', nameAr: 'منصور بن المعتمر',
    fullName: 'Mansur ibn al-Muʿtamir as-Sulami', generation: 'Atbaʿ at-Tabiʿin', deathYear: 132,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: ['Ibrahim an-Nakhaʿi'], students: ['Sufyan ath-Thawri', 'Shuʿbah'],
    region: 'Kufa',
    bioEn: 'The most precise Kufan of his era; the imams said no one\'s reports through Ibrahim match Mansur\'s for authenticity.',
    bioAr: 'أثبت أهل الكوفة في زمانه، قال الأئمة: أصح الأسانيد إبراهيم عن منصور.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'layth-ibn-abi-sulaym', nameEn: 'Layth ibn Abi Sulaym', nameAr: 'ليث بن أبي سليم',
    fullName: 'Layth ibn Abi Sulaym al-Muradi', generation: 'Tabiʿi', deathYear: 132,
    grade: { code: 'daif', en: 'Daʿif — weak', ar: 'ضعيف' },
    teachers: ['Mujahid', 'Ikrimah'], students: ['Shuʿbah', 'Hammad ibn Salamah'],
    region: 'Kufa',
    bioEn: 'Pious Kufan preacher whose memory failed; the imams praised his worship yet rejected his hadith as evidence.',
    bioAr: 'واعظ الكوفة، ضعفوه مع الثناء على صلاحه وعبادته.',
    source: 'Taqrib at-Tahdhib'
  },

  // ===== Successors — Basra & Yemen =====
  {
    slug: 'hasan-al-basri', nameEn: 'Hasan al-Basri', nameAr: 'الحسن البصري',
    fullName: 'al-Hasan ibn Abi al-Hasan Yasar al-Basri', generation: 'Tabiʿi', deathYear: 110,
    grade: { code: 'thiqah', en: 'Thiqah — imam, may occasionally err', ar: 'ثقة إمام ربما وهم' },
    teachers: ['Abu Hurayrah', 'Anas ibn Malik'], students: ['Ayyub as-Sakhtiyani', 'Yunus ibn Ubayd', 'Qatadah'],
    region: 'Basra',
    bioEn: 'Imam of the Successors in Basra — eloquent, austere, tireless in counsel; the faces of the imams changed when his name was mentioned.',
    bioAr: 'إمام التابعين بالبصرة، ثقة فصيح زاهد، كان ذكره يقشعر له جلد التابعين.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'muhammad-ibn-sirin', nameEn: 'Muhammad ibn Sirin', nameAr: 'محمد بن سيرين',
    fullName: 'Muhammad ibn Sirin al-Ansari al-Basri', generation: 'Tabiʿi', deathYear: 110,
    grade: { code: 'thiqah', en: 'Thiqah — imam, may occasionally err', ar: 'ثقة إمام ربما وهم' },
    teachers: ['Abu Hurayrah', 'Anas ibn Malik'], students: ['Ayyub as-Sakhtiyani', 'Hisham ibn Hassaan', 'Ibn Awn'],
    region: 'Basra',
    bioEn: 'Freed slave of Anas, hadith master of Basra, and father of dream-interpretation literature; the standard by which Basran precision was measured with Hasan.',
    bioAr: 'مولى أنس، ثقة إمام، أحد أعلام البصرة علما وعبادة وتعبيرا.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hafsah-bint-sirin', nameEn: 'Hafsah bint Sirin', nameAr: 'حفصة بنت سيرين',
    fullName: 'Hafsah bint Sirin al-Ansariyyah', generation: 'Tabiʿiyyah', deathYear: 101,
    grade: { code: 'thiqah', en: 'Thiqah — devout', ar: 'ثقة عابدة' },
    teachers: ['Umm Atiyyah al-Ansariyyah', 'Ar-Rubayyiʿ bint Muʿawwidh'], students: ['Hisham ibn Hassaan'],
    region: 'Basra',
    bioEn: 'Sister of Muhammad ibn Sirin, Quran reciter and worshipper; the men of Basra sat at her Qur\'anic exposition.',
    bioAr: 'أخت محمد بن سيرين، ثقة عابدة قارئة، كان المحدثون يقرؤون عليها.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'qatadah', nameEn: 'Qatadah ibn Diʿamah', nameAr: 'قتادة بن دعامة',
    fullName: 'Qatadah ibn Diʿamah as-Sadusi', generation: 'Tabiʿi', deathYear: 118,
    grade: { code: 'thiqah', en: 'Thiqah — known tadlis', ar: 'ثقة مدلس' },
    teachers: ['Anas ibn Malik', 'Hasan al-Basri'], students: ['Saʿid ibn Abi Aruba', 'Shuʿbah', 'Hammad ibn Salamah'],
    region: 'Basra',
    bioEn: 'Blind from birth, yet the mufassir of the Successors; hadith poured from him with a memory the imams called a wonder.',
    bioAr: 'أعمى مفسر التابعين، ثقة، حافظ لم يكن له نظير في الضبط.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'wahb-ibn-munabbih', nameEn: 'Wahb ibn Munabbih', nameAr: 'وهب بن منبه',
    fullName: 'Wahb ibn Munabbih ibn Kamil as-Sanʿani', generation: 'Tabiʿi', deathYear: 110,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Abu Hurayrah'], students: ['Hammam ibn Munabbih (his brother)'],
    region: 'Yemen (Sanʿa)',
    bioEn: 'Yemeni master of earlier scriptures\' lore (Israʿiliyyat) and tafsir; his narrations entered the books of tafsir widely.',
    bioAr: 'عالم اليمن في أخبار الأوائل والتفسير، ثقة ربما وهم.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ayyub-as-sakhtiyani', nameEn: 'Ayyub as-Sakhtiyani', nameAr: 'أيوب السختياني',
    fullName: 'Ayyub ibn Abi Tamimah Kaysan al-Basri', generation: 'Tabiʿi', deathYear: 131,
    grade: { code: 'thiqah', en: 'Thiqah — steadfast imam', ar: 'ثقة ثبت إمام' },
    teachers: ['Hasan al-Basri', 'Muhammad ibn Sirin', 'Nafiʿ'], students: ['Malik ibn Anas', 'Hammad ibn Zayd', 'Ismaʿil ibn Ulayyah'],
    region: 'Basra',
    bioEn: 'Imam of Basra in hadith and scruple; Ibn Uyaynah said Hasan\'s reports are safe with Ayyub. Ahmad marvelled at his precision.',
    bioAr: 'إمام البصرة، ثقة ثبت، قال سفيان بن عيينة: حديث الحسن صحيح مع أيوب.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hisham-ibn-hassaan', nameEn: 'Hisham ibn Hassaan', nameAr: 'هشام بن حسان',
    fullName: 'Hisham ibn Hassaan al-Basri', generation: 'Atbaʿ at-Tabiʿin', deathYear: 148,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Muhammad ibn Sirin', 'Hasan al-Basri', 'Hafsah bint Sirin'], students: [],
    region: 'Basra',
    bioEn: 'Basran narrator whose reports of Ibn Sirin and Hasan anchor many chains in the Six Books.',
    bioAr: 'ثقة بصري، ممن صحح عليه حديث ابن سيرين والحسن.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ibn-awn', nameEn: 'Ibn Awn', nameAr: 'ابن عون',
    fullName: 'Abdullah ibn Awn ibn Jablan al-Muzani', generation: 'Atbaʿ at-Tabiʿin', deathYear: 151,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Muhammad ibn Sirin', 'Hasan al-Basri'], students: [],
    region: 'Basra',
    bioEn: 'Basran worshipper-narrator, peer of Ayyub; the imams trusted his reports from Ibn Sirin.',
    bioAr: 'ثقة عابد بصري، زميل أيوب، صحح الأئمة حديثه عن ابن سيرين.',
    source: 'Taqrib at-Tahdhib'
  },

  // ===== Followers of the Successors (Atbaʿ at-Tabiʿin) =====
  {
    slug: 'az-zuhri', nameEn: 'Ibn Shihab az-Zuhri', nameAr: 'ابن شهاب الزهري',
    fullName: 'Muhammad ibn Muslim ibn Ubaydillah az-Zuhri', generation: 'Atbaʿ at-Tabiʿin', deathYear: 124,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, foremost of his era', ar: 'ثقة حافظ أوحد عصره' },
    teachers: ['Saʿid ibn al-Musayyib', 'Urwah ibn az-Zubayr', 'Salim ibn Abdillah', 'Ali ibn al-Husayn'], students: ['Malik ibn Anas', 'Al-Awzaʿi', 'Yunus ibn Yazid', 'Uqayl ibn Khalid'],
    region: 'Madinah / Damascus',
    bioEn: 'The greatest hadith authority before the compilations; the four imams — Malik, al-Awzaʿi, ath-Thawri and al-Layth — all learned at his door.',
    bioAr: 'ثقة حافظ، أعلم أهل زمانه بالحديث، جلس على بابه الأئمة الأربعة: مالك والأوزاعي والثوري والليث.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abu-az-zinad', nameEn: 'Abu az-Zinad', nameAr: 'أبو الزناد',
    fullName: 'Abdullah ibn Dhakwan al-Madani', generation: 'Atbaʿ at-Tabiʿin', deathYear: 131,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Amrah bint Abd ar-Rahman', 'Saʿid ibn al-Musayyib', 'Al-Aʿraj'], students: ['Malik ibn Anas'],
    region: 'Madinah / Iraq',
    bioEn: 'Madinan scribe whose chain Abu az-Zinad → al-Aʿraj → Abu Hurayrah is among the most authentic of all.',
    bioAr: 'ثقة فقيه، وسنده عن الأعرج عن أبي هريرة من أصح الأسانيد.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ubayd-allah-ibn-umar', nameEn: 'Ubayd Allah ibn Umar al-Umari', nameAr: 'عبيد الله بن عمر العمري',
    fullName: 'Ubayd Allah ibn Umar ibn Hafs al-Umari', generation: 'Atbaʿ at-Tabiʿin', deathYear: 147,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Nafiʿ', 'Al-Qasim ibn Muhammad', 'Salim ibn Abdillah'], students: ['Malik ibn Anas', 'Sufyan ath-Thawri', 'Ismaʿil ibn Ulayyah'],
    region: 'Madinah',
    bioEn: 'Among the "Abdillah three" whose Medinan fiqh-with-hadith Bukhari prized above all contemporaries.',
    bioAr: 'ثقة فقيه، أحد العبادلة الثلاثة فقهاء المدينة، عليهم كان شرط البخاري.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hisham-ibn-urwah', nameEn: 'Hisham ibn Urwah', nameAr: 'هشام بن عروة',
    fullName: 'Hisham ibn Urwah ibn az-Zubayr', generation: 'Atbaʿ at-Tabiʿin', deathYear: 146,
    grade: { code: 'thiqah', en: 'Thiqah — most sound from his father', ar: 'ثقة وأصحه عن أبيه' },
    teachers: ['Urwah ibn az-Zubayr (his father)'], students: ['Malik ibn Anas', 'Sufyan ibn Uyaynah', 'Abu Usamah'],
    region: 'Madinah / Baghdad',
    bioEn: 'Principal transmitter of his father\'s vast reports from Aishah; late-life reports from Baghdad are treated more carefully by the critics.',
    bioAr: 'ثقة، راوية أحاديث أبيه عن عائشة، وتكلموا في روايته ببغداد بآخره.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'al-amash', nameEn: 'Al-Aʿmash', nameAr: 'الأعمش',
    fullName: 'Sulayman ibn Mihran al-Aʿmash al-Asadi', generation: 'Atbaʿ at-Tabiʿin', deathYear: 148,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, mudallis', ar: 'ثقة حافظ مدلس' },
    teachers: ['Abu Ishaq as-Sabiʿi', 'Ibrahim an-Nakhaʿi', 'Mujahid'], students: ['Sufyan ath-Thawri', 'Shuʿbah', 'Hammad ibn Salamah'],
    region: 'Kufa',
    bioEn: 'Kufan hafiz whose exposition of Ibrahim\'s fiqh is the soundest; Ahmad said "Al-Aʿmash is more beloved to us than a thousand".',
    bioAr: 'ثقة حافظ مدلس، كان أحمد يقدمه ويقول: الأعمش أحب إلينا من ألف.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ibn-juraij', nameEn: 'Ibn Juraij', nameAr: 'ابن جريج',
    fullName: 'Abd al-Malik ibn Abd al-Aziz ibn Juraij al-Makki', generation: 'Atbaʿ at-Tabiʿin', deathYear: 150,
    grade: { code: 'saduq', en: 'Saduq — mudallis', ar: 'صدوق مدلس' },
    teachers: ['Amr ibn Dinar', 'Ataʿ ibn Abi Rabah'], students: ['Sufyan ibn Uyaynah'],
    region: 'Makkah',
    bioEn: 'Among the very first to compose a written hadith book in Makkah; accepted where he states hearing, scrutinized where he alludes.',
    bioAr: 'صدوق، من أوائل من صنف الحديث بمكة، يقبل منه المصرح بالسماع ويتوقف في المعنعن.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'ibn-ishaq', nameEn: 'Ibn Ishaq', nameAr: 'ابن إسحاق',
    fullName: 'Muhammad ibn Ishaq ibn Yasar al-Madani', generation: 'Atbaʿ at-Tabiʿin', deathYear: 151,
    grade: { code: 'saduq', en: 'Saduq — mudallis in Maghazi', ar: 'صدوق يدلس في المغازي' },
    teachers: ['Az-Zuhri', 'Asim ibn Umar ibn Qatadah'], students: ['Ziyad al-Bakkaʿi'],
    region: 'Madinah / Baghdad',
    bioEn: 'Author of the earliest comprehensive Sirah, preserved via Ibn Hisham; the imams accept his narrations where he states his hearing.',
    bioAr: 'صاحب أقدم كتاب في السيرة وصل برواية ابن هشام، صدوق يدلس، وثقوه مع كلامهم في تدليسه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'muhammad-ibn-saib-al-kalbi', nameEn: 'Muhammad ibn Saʿib al-Kalbi', nameAr: 'محمد بن السائب الكلبي',
    fullName: 'Muhammad ibn Saʿib ibn Bishr al-Kalbi', generation: 'Atbaʿ at-Tabiʿin', deathYear: 146,
    grade: { code: 'matruk', en: 'Matruk — accused of fabrication', ar: 'متروك اتهم بالوضع' },
    teachers: ['Abu Salih'], students: [],
    region: 'Kufa',
    bioEn: 'Genealogist and narrator of Israʿiliyyat; Ahmad said "his hadith is not written down". A lesson in how the critics protect the Sunnah.',
    bioAr: 'نسابة راوي الإسرائيليات، قال أحمد: لا يكتب حديثه، متروك.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'mughirah-ibn-said', nameEn: 'Mughirah ibn Saʿid', nameAr: 'مغيرة بن سعيد',
    fullName: 'Mughirah ibn Saʿid al-Kufi', generation: 'Atbaʿ at-Tabiʿin', deathYear: 137,
    grade: { code: 'kadhdhab', en: 'Kadhdhab — accused of fabrication', ar: 'كذاب متهم بالوضع' },
    teachers: [], students: [],
    region: 'Kufa',
    bioEn: 'Kufan narrator the imams accused of fabricating hadith; Bukhari and the critics branded him a liar.',
    bioAr: 'رماه الأئمة بالكذب والوضع، تركه النقاد صيانة للسنة.',
    source: 'Mizan al-Iʿtidal'
  },
  {
    slug: 'muqatil-ibn-sulayman', nameEn: 'Muqatil ibn Sulayman', nameAr: 'مقاتل بن سليمان',
    fullName: 'Muqatil ibn Sulayman al-Azdi', generation: '2nd century AH', deathYear: 150,
    grade: { code: 'matruk', en: 'Matruk — accused of fabrication', ar: 'متروك اتهم بالوضع' },
    teachers: [], students: [],
    region: 'Kufa / Marw',
    bioEn: 'Early tafsir transmitter of imaginative reports; Ahmad said "Muqatil is a liar", and the critics abandoned his hadith.',
    bioAr: 'مفسر نقل أخبارا لا أصل لها، قال أحمد: مقاتل كذاب، متروك الحديث.',
    source: 'Mizan al-Iʿtidal'
  },

  // ===== Masters of the 2nd century AH =====
  {
    slug: 'al-awzai', nameEn: 'Al-Awzaʿi', nameAr: 'الأوزاعي',
    fullName: 'Abd ar-Rahman ibn Amr al-Awzaʿi', generation: '2nd century AH', deathYear: 157,
    grade: { code: 'thiqah', en: 'Thiqah — imam, mujtahid', ar: 'ثقة إمام مجتهد' },
    teachers: ['Az-Zuhri', 'Yahya ibn Abi Kathir'], students: ['Al-Walid ibn Muslim'],
    region: 'Beirut / Sham',
    bioEn: 'Mujtahid imam of the Levant; his school prevailed in Sham and al-Andalus before the Maliki fiqh spread there.',
    bioAr: 'ثقة إمام مجتهد الشام، انتشر مذهبه بالشام والأندلس ثم غلب عليه المالكي.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'al-layth-ibn-sad', nameEn: 'Al-Layth ibn Saʿd', nameAr: 'الليث بن سعد',
    fullName: 'Al-Layth ibn Saʿd al-Fihri al-Misri', generation: '2nd century AH', deathYear: 175,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam', ar: 'ثقة حافظ إمام' },
    teachers: ['Az-Zuhri', 'Nafiʿ', 'Yahya ibn Saʿid al-Ansari'], students: ['Abdullah ibn Wahb', 'Ash-Shafiʿi'],
    region: 'Egypt',
    bioEn: 'Egypt\'s imam — wealthier than princes yet famously ascetic; ash-Shafiʿi said "al-Layth was a stronger jurist than Malik", and his fatwas circulated across the Ummah.',
    bioAr: 'ثقة حافظ إمام فقيه مصر، قال الشافعي: الليث أفقه من مالك، وكان جوادا زاهدا.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hammad-ibn-salamah', nameEn: 'Hammad ibn Salamah', nameAr: 'حماد بن سلمة',
    fullName: 'Hammad ibn Salamah ibn Dinar az-Zayyat', generation: '2nd century AH', deathYear: 167,
    grade: { code: 'thiqah', en: 'Thiqah — worshipful, slight err; mixed at end', ar: 'ثقة عابد ربما وهم واختلط بآخره' },
    teachers: ['Ayyub as-Sakhtiyani', 'Qatadah'], students: ['Abdullah ibn al-Mubarak'],
    region: 'Basra',
    bioEn: 'Basran ascetic and hadith master; Ahmad said the soundest chain of the era is Hammad → Thabit → Anas.',
    bioAr: 'ثقة عابد، قال أحمد: أصح الأسانيد حماد عن ثابت عن أنس.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'shubah-ibn-al-hajjaj', nameEn: 'Shuʿbah ibn al-Hajjaj', nameAr: 'شعبة بن الحجاج',
    fullName: 'Shuʿbah ibn al-Hajjaj az-Zayyat al-Wasiti', generation: '2nd century AH', deathYear: 160,
    grade: { code: 'thiqah', en: 'Thiqah — scrutinizer', ar: 'ثقة متثبت' },
    teachers: ['Qatadah', 'Abu Ishaq as-Sabiʿi', 'Ayyub as-Sakhtiyani'], students: ['Yahya ibn Saʿid al-Qattan', 'Abd ar-Rahman ibn Mahdi'],
    region: 'Basra',
    bioEn: '"Amir al-Muʿminin fil-hadith" of his age; he said "I never omitted a letter of a chain except I dropped the whole hadith" — the model of itqan.',
    bioAr: 'ثقة أمير المؤمنين في الحديث في زمانه، قال: ما نقصت حرفا من الإسناد إلا أسقطت الحديث كله.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'sufyan-ath-thawri', nameEn: 'Sufyan ath-Thawri', nameAr: 'سفيان الثوري',
    fullName: 'Sufyan ibn Saʿid ibn Masruq ath-Thawri', generation: '2nd century AH', deathYear: 161,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam of the Muslims', ar: 'ثقة حافظ إمام' },
    teachers: ['Mansur ibn al-Muʿtamir', 'Al-Aʿmash', 'Ayyub as-Sakhtiyani'], students: ['Abdullah ibn al-Mubarak', 'Abdur-Razzaq'],
    region: 'Kufa',
    bioEn: '"Amir al-Muʿminin fil-fiqh wal-hadith"; mujtahid imam of Kufa whose school survives within hadith methodology.',
    bioAr: 'ثقة حافظ فقيه إمام، أمير المؤمنين في الحديث والفقه، إمام أهل الكوفة.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'isamil-ibn-ayyash', nameEn: 'Ismaʿil ibn Ayyash', nameAr: 'إسماعيل بن عياش',
    fullName: 'Ismaʿil ibn Ayyash al-Himsi', generation: '2nd century AH', deathYear: 181,
    grade: { code: 'saduq', en: 'Saduq in Sham reports; weak elsewhere', ar: 'صدوق في أهل الشام ضعيف في غيرهم' },
    teachers: ['Al-Awzaʿi'], students: [],
    region: 'Hims (Sham)',
    bioEn: 'Shami transmitter whose reports from his own Levantine teachers are sound, but whose narrations from Hijazis and Iraqis — recited from memory after his books were lost — are weak: a textbook case of regional dabt.',
    bioAr: 'صدوق في روايته عن أهل الشام، ضعيف في روايته عن غيرهم لذهاب كتبه، درس في تفاوت الضبط.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abdullah-ibn-lahiah', nameEn: 'Abdullah ibn Lahiʿah', nameAr: 'عبد الله بن لهيعة',
    fullName: 'Abdullah ibn Lahiʿah al-Hadrami al-Misri', generation: '2nd century AH', deathYear: 174,
    grade: { code: 'saduq', en: 'Saduq — confused after his books burned', ar: 'صدوق خلط بعد احتراق كتبه' },
    teachers: ['Amr ibn Dinar'], students: ['Abdullah ibn Wahb', 'Al-Layth ibn Saʿd'],
    region: 'Egypt',
    bioEn: 'Egypt\'s qadi for forty years; his books burned and his hearing changed, so the imams accepted only the reports transmitted by the sound from his pre-burning readings (Ibn al-Mubarak, Ibn Wahb, al-Layth).',
    bioAr: 'قاضي مصر، احترقت كتبه فاختلط، فقبلوا رواية العبادلة عنه خاصة.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'al-walid-ibn-muslim', nameEn: 'Al-Walid ibn Muslim', nameAr: 'الوليد بن مسلم',
    fullName: 'Al-Walid ibn Muslim al-Qurasni ad-Dimashqi', generation: '2nd century AH', deathYear: 195,
    grade: { code: 'saduq', en: 'Saduq — much tadlis and substitution', ar: 'صدوق كثير التدليس والتبديل' },
    teachers: ['Al-Awzaʿi'], students: [],
    region: 'Damascus',
    bioEn: 'Damascus mufti whose habit of naming teachers vaguely ("the shaykh") and improving chains made the critics insist on his explicit hearings.',
    bioAr: 'مفتي دمشق، صدوق كثير التدليس، لا يقبل منه إلا ما صرح بالسماع.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'hammad-ibn-zayd', nameEn: 'Hammad ibn Zayd', nameAr: 'حماد بن زيد',
    fullName: 'Hammad ibn Zayd ibn Dirham al-Azdi', generation: '2nd century AH', deathYear: 179,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Ayyub as-Sakhtiyani'], students: ['Yahya ibn Saʿid al-Qattan'],
    region: 'Basra',
    bioEn: 'Basran hafiz-judge; his chain Hammad → Ayyub → Ibn Sirin → Abu Hurayrah runs through the Sahih again and again.',
    bioAr: 'ثقة فقيه قاضي البصرة، سنده عن أيوب عن ابن سيرين عن أبي هريرة من أعمدة الصحيح.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'malik-ibn-anas', nameEn: 'Imam Malik ibn Anas', nameAr: 'الإمام مالك بن أنس',
    fullName: 'Malik ibn Anas ibn Malik al-Asbahi', generation: '2nd century AH', deathYear: 179,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam, hujjah', ar: 'ثقة حافظ إمام حجة' },
    teachers: ['Nafiʿ', 'Az-Zuhri', 'Ayyub as-Sakhtiyani', 'Rabiʿah ar-Raʿy'], students: ['Ash-Shafiʿi', 'Abdullah ibn Wahb', 'Al-Qaʿnabi'],
    region: 'Madinah',
    bioEn: 'The Imam of Madinah. As a narrator he anchors the most authentic chains (Aishah → Urwah → az-Zuhri → Malik); as a jurist his Muwattaʿ and school shaped the Ummah.',
    bioAr: 'إمام دار الهجرة، ثقة حافظ إمام حجة، عليه مدار أصح الأسانيد، وصاحب الموطأ.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abdullah-ibn-al-mubarak', nameEn: 'Abdullah ibn al-Mubarak', nameAr: 'عبد الله بن المبارك',
    fullName: 'Abdullah ibn al-Mubarak ibn Wadhih al-Hanzali', generation: '2nd century AH', deathYear: 181,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam, mujahid', ar: 'ثقة حافظ إمام مجاهد' },
    teachers: ['Sufyan ath-Thawri', 'Malik ibn Anas'], students: ['Ali ibn al-Madini'],
    region: 'Merv (Khurasan)',
    bioEn: 'The hadith hafiz, mujahid on the Byzantine frontier and generous patron of scholars; his verdicts on narrators carried great weight with the critics.',
    bioAr: 'ثقة حافظ إمام مجاهد، فارس أهل العلم والجهاد والسخاء.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'al-fudayl-ibn-iyad', nameEn: 'Al-Fudayl ibn Iyad', nameAr: 'الفضيل بن عياض',
    fullName: 'Al-Fudayl ibn Iyad ibn Masʿud at-Tamimi', generation: '2nd century AH', deathYear: 188,
    grade: { code: 'thiqah', en: 'Thiqah — worshipful', ar: 'ثقة عابد' },
    teachers: ['Mansur ibn al-Muʿtamir'], students: [],
    region: 'Kufa / Makkah',
    bioEn: 'The ex-highwayman of Kufa who repented and became "Shaykh al-Islam" of his age; reports of him run through the Sunan.',
    bioAr: 'ثقة عابد زاهد، تائب من قطع الطريق صار شيخ الإسلام في زمانه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'waki-ibn-al-jarrah', nameEn: 'Wakiʿ ibn al-Jarrah', nameAr: 'وكيع بن الجراح',
    fullName: 'Wakiʿ ibn al-Jarrah ibn Malik ar-Ruʿasi', generation: '2nd century AH', deathYear: 197,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: ['Al-Aʿmash', 'Hisham ibn Urwah', 'Sufyan ath-Thawri'], students: ['Ahmad ibn Hanbal', 'Ali ibn al-Madini', 'Yahya ibn Maʿin'],
    region: 'Kufa',
    bioEn: 'Kufan hafiz whose lecture drew the three future giants — Ahmad, Ibn Maʿin and Ibn al-Madini — before each became a criterion of the Sunnah.',
    bioAr: 'ثقة حافظ، جلس إليه أحمد وابن معين وابن المديني في حلقته بالكوفة.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'isamil-ibn-ulayyah', nameEn: 'Ismaʿil ibn Ulayyah', nameAr: 'إسماعيل بن علية',
    fullName: 'Ismaʿil ibn Ibrahim ibn Ulayyah al-Basri', generation: '2nd century AH', deathYear: 193,
    grade: { code: 'thiqah', en: 'Thiqah', ar: 'ثقة' },
    teachers: ['Ayyub as-Sakhtiyani', 'Hisham ibn Hassaan'], students: ['Ahmad ibn Hanbal'],
    region: 'Basra / Baghdad',
    bioEn: 'Basran master whose precision made the critics treat his hearings as a criterion; Ahmad called him "the imam of the age in his precision".',
    bioAr: 'ثقة ثبت من أثبات أهل البصرة، كان أحمد يثني على ضبطه.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'sufyan-ibn-uyaynah', nameEn: 'Sufyan ibn Uyaynah', nameAr: 'سفيان بن عيينة',
    fullName: 'Sufyan ibn Uyaynah ibn Maymun al-Hilali', generation: '2nd century AH', deathYear: 198,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz; mixed late', ar: 'ثقة حافظ اختلط بآخره' },
    teachers: ['Amr ibn Dinar', 'Az-Zuhri', 'Hisham ibn Urwah'], students: ['Ash-Shafiʿi', 'Abd ar-Rahman ibn Mahdi'],
    region: 'Makkah',
    bioEn: 'Makkan hafiz of the Haram; ash-Shafiʿi said "but for Sufyan the reports of the Hijaz would have gone". Late-life reports are treated gently by the critics.',
    bioAr: 'ثقة حافظ، قال الشافعي: لولا سفيان ذهب حديث الحجاز، واختلط بآخره.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'yahya-ibn-said-al-qattan', nameEn: 'Yahya ibn Saʿid al-Qattan', nameAr: 'يحيى بن سعيد القطان',
    fullName: 'Yahya ibn Saʿid ibn Farrukh al-Qattan al-Basri', generation: '2nd century AH', deathYear: 198,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam of the critics', ar: 'ثقة حافظ إمام النقاد' },
    teachers: ['Shuʿbah ibn al-Hajjaj', 'Sufyan ath-Thawri'], students: ['Ahmad ibn Hanbal', 'Yahya ibn Maʿin', 'Ali ibn al-Madini'],
    region: 'Basra',
    bioEn: 'The father of formal narrator-criticism: Ahmad, Ibn Maʿin and Ibn al-Madini all learned at his door, and his verdicts still govern the books of rijal.',
    bioAr: 'ثقة حافظ إمام، مؤسس المنهج في نقد الرواة، أخذ عنه أحمد وابن معين وابن المديني.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abd-ar-rahman-ibn-mahdi', nameEn: 'Abd ar-Rahman ibn Mahdi', nameAr: 'عبد الرحمن بن مهدي',
    fullName: 'Abd ar-Rahman ibn Mahdi ibn Hassan al-Luʿluʿi', generation: '2nd century AH', deathYear: 198,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam', ar: 'ثقة حافظ إمام' },
    teachers: ['Shuʿbah ibn al-Hajjaj', 'Sufyan ath-Thawri'], students: ['Ahmad ibn Hanbal'],
    region: 'Basra',
    bioEn: 'The critic who first codified the conditions for a Sahih book — the very framework Bukhari later executed.',
    bioAr: 'ثقة حافظ إمام ناقد، أول من رسم شرط الصحيح الذي أخذه البخاري.',
    source: 'Taqrib at-Tahdhib'
  },
  {
    slug: 'abdullah-ibn-wahb', nameEn: 'Abdullah ibn Wahb', nameAr: 'عبد الله بن وهب',
    fullName: 'Abdullah ibn Wahb ibn Muslim al-Fihri al-Misri', generation: '2nd century AH', deathYear: 197,
    grade: { code: 'thiqah', en: 'Thiqah — jurist', ar: 'ثقة فقيه' },
    teachers: ['Malik ibn Anas', 'Al-Layth ibn Saʿd'], students: [],
    region: 'Egypt',
    bioEn: 'Malik\'s chief Egyptian transmitter; through his Muwattaʿ and Mudawwana-transmissions the Maliki school entered Ifriqiyya and al-Andalus.',
    bioAr: 'ثقة فقيه، تلميذ مالك المصري، وبه دخل مذهب مالك إلى المغرب والأندلس.',
    source: 'Taqrib at-Tahdhib'
  },

  // ===== The great critics & compilers — 3rd century AH =====
  {
    slug: 'ali-ibn-al-madini', nameEn: 'Ali ibn al-Madini', nameAr: 'علي بن المديني',
    fullName: 'Ali ibn Abdillah ibn Jaʿfar al-Madini', generation: '3rd century AH', deathYear: 234,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz; imam of ilal', ar: 'ثقة حافظ إمام في العلل' },
    teachers: ['Wakiʿ ibn al-Jarrah', 'Yahya ibn Saʿid al-Qattan', 'Abd ar-Rahman ibn Mahdi', 'Sufyan ibn Uyaynah'], students: ['Al-Bukhari', 'Muslim'],
    region: 'Basra / Baghdad',
    bioEn: '"The imam of the critics": teacher of Bukhari and Muslim and founder of the science of hidden defects (ilal). Ahmad said no one knows hadith defects like him.',
    bioAr: 'ثقة حافظ إمام النقاد، شيخ البخاري ومسلم، أرسى قواعد علم العلل، قال أحمد: ما أعلم أحدا أعلم بعلة الحديث منه.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'yahya-ibn-main', nameEn: 'Yahya ibn Maʿin', nameAr: 'يحيى بن معين',
    fullName: 'Yahya ibn Maʿin ibn Awn al-Baghdadi', generation: '3rd century AH', deathYear: 233,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz; master of jarh', ar: 'ثقة حافظ إمام الجرح والتعديل' },
    teachers: ['Yahya ibn Saʿid al-Qattan', 'Wakiʿ ibn al-Jarrah'], students: ['Al-Bukhari', 'Muslim'],
    region: 'Baghdad',
    bioEn: 'The Baghdad critic of critics — "a sea of knowledge" per his peers; his terse verdicts on thousands of narrators anchor the rijal literature.',
    bioAr: 'ثقة حافظ، إمام الجرح والتعديل، أحكامه على الرواة عمدة في كتب الرجال.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'ahmad-ibn-hanbal', nameEn: 'Imam Ahmad ibn Hanbal', nameAr: 'الإمام أحمد بن حنبل',
    fullName: 'Ahmad ibn Hanbal ibn Hilal ash-Shaybani', generation: '3rd century AH', deathYear: 241,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam of the Sunnah', ar: 'ثقة حافظ إمام السنة' },
    teachers: ['Sufyan ibn Uyaynah', 'Wakiʿ ibn al-Jarrah', 'Abdullah ibn al-Mubarak', 'Abd ar-Rahman ibn Mahdi'], students: ['Al-Bukhari', 'Muslim', 'Abu Dawud'],
    region: 'Baghdad',
    bioEn: 'Imam of Ahl as-Sunnah and hero of the mihnah; his Musnad and his narrator-verdicts are pillars of the science.',
    bioAr: 'ثقة حافظ إمام أهل السنة، صابر المحنة، صاحب المسند، أقواله في الرجال عمدة.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'ishaq-ibn-rahawaih', nameEn: 'Ishaq ibn Rahawaih', nameAr: 'إسحاق بن راهويه',
    fullName: 'Ishaq ibn Ibrahim ibn Makhlad al-Hanzali', generation: '3rd century AH', deathYear: 238,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, imam', ar: 'ثقة حافظ إمام' },
    teachers: ['Abdullah ibn al-Mubarak', 'Sufyan ibn Uyaynah'], students: ['Al-Bukhari', 'Muslim', 'At-Tirmidhi'],
    region: 'Nishapur / Marw',
    bioEn: 'Khurasan\'s hafiz-mujtahid; Bukhari said "the like of Ishaq has not appeared in twenty years", and the compilers sought his verdicts on chains.',
    bioAr: 'ثقة حافظ إمام مجتهد، قال البخاري: ما رأيت مثل ابن راهويه منذ عشرين سنة.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'al-bukhari', nameEn: 'Imam al-Bukhari', nameAr: 'الإمام البخاري',
    fullName: 'Muhammad ibn Ismaʿil ibn Ibrahim al-Bukhari', generation: '3rd century AH', deathYear: 256,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, Amir al-Muʿminin fil-hadith', ar: 'ثقة حافظ أمير المؤمنين في الحديث' },
    teachers: ['Ishaq ibn Rahawaih', 'Al-Humaydi'], students: ['At-Tirmidhi'],
    region: 'Bukhara',
    bioEn: 'Author of the Sahih — the strictest verification of authenticity ever applied to any corpus; his criteria govern ʿilm ar-rijal to this day.',
    bioAr: 'ثقة حافظ، صاحب الجامع الصحيح أصح كتاب بعد كتاب الله، وضوابطه أصل في نقد الأسانيد.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'muslim', nameEn: 'Imam Muslim', nameAr: 'الإمام مسلم',
    fullName: 'Muslim ibn al-Hajjaj ibn Muslim an-Naysaburi', generation: '3rd century AH', deathYear: 261,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: ['Ishaq ibn Rahawaih'], students: ['Ibn Khuzaymah'],
    region: 'Nishapur',
    bioEn: 'Author of as-Sahih, unrivalled for the elegance of its isnad-matn architecture; his Introduction states his narrator-grading methodology openly.',
    bioAr: 'ثقة حافظ، صاحب الصحيح الذي بدين بحسن السياق، ومقدمته بيان لمنهجه في الرواة.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'abu-dawud', nameEn: 'Imam Abu Dawud', nameAr: 'الإمام أبو داود',
    fullName: 'Sulayman ibn al-Ashʿath ibn Ishaq as-Sijistani', generation: '3rd century AH', deathYear: 275,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: ['Ahmad ibn Hanbal'], students: [],
    region: 'Sijistan / Basra',
    bioEn: 'Compiler of as-Sunan, the legal-hadith reference; his letter to the people of Makkah is a manual of his narrator-grading within the book.',
    bioAr: 'ثقة حافظ، صاحب السنن في أحاديث الأحكام، ورسالته لأهل مكة تشرح مراتب رجاله.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'at-tirmidhi', nameEn: 'Imam at-Tirmidhi', nameAr: 'الإمام الترمذي',
    fullName: 'Muhammad ibn Isa ibn Sawrah at-Tirmidhi', generation: '3rd century AH', deathYear: 279,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: ['Al-Bukhari', 'Abu Dawud'], students: [],
    region: 'Tirmidh / Nishapur',
    bioEn: 'Author of al-Jamiʿ, the first book to grade every hadith (sahih, hasan, gharib) with its defect-analysis; a standing school of ʿilm al-rijal on its own. Blind in his final years.',
    bioAr: 'ثقة حافظ، صاحب الجامع أول من شهر درجات الحديث وعلله، أعمي في آخر عمره.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'ibn-majah', nameEn: 'Imam Ibn Majah', nameAr: 'الإمام ابن ماجه',
    fullName: 'Muhammad ibn Yazid ibn Majah al-Qazvini', generation: '3rd century AH', deathYear: 273,
    grade: { code: 'thiqah', en: 'Thiqah (tawthiq of ad-Daraqutni)', ar: 'ثقة، وثقه الدارقطني' },
    teachers: [], students: [],
    region: 'Qazvin',
    bioEn: 'Author of as-Sunan and at-Tafsir; some early critics debated isolated reports of his, and ad-Daraqutni declared him thiqah. His Sunan completes the Six Books.',
    bioAr: 'صاحب السنن والتفسير، وثقه الدارقطني، وبسنانه تتم الكتب الستة.',
    source: 'Tadhkirat al-Huffaz'
  },
  {
    slug: 'an-nasai', nameEn: 'Imam an-Nasaʿi', nameAr: 'الإمام النسائي',
    fullName: 'Ahmad ibn Shuʿayb ibn Ali an-Nasaʿi', generation: '3rd century AH', deathYear: 303,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz', ar: 'ثقة حافظ' },
    teachers: [], students: [],
    region: 'Nasa (Khurasan) / Egypt / Makkah',
    bioEn: 'Author of as-Sunan and of Kitab ad-Duʿafa — a dedicated catalogue of weak narrators, the crowning genre of jarh literature among the six compilers.',
    bioAr: 'ثقة حافظ، صاحب السنن وكتاب الضعفاء والمجروحين، آخر حفاظ أصحاب الكتب الستة.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'abu-zurah-ar-razi', nameEn: 'Abu Zurʿah ar-Razi', nameAr: 'أبو زرعة الرازي',
    fullName: 'Ubaydullah ibn Abd al-Karim ibn Yazid ar-Razi', generation: '3rd century AH', deathYear: 264,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, critic', ar: 'ثقة حافظ ناقد' },
    teachers: ['Masters of Iraq and Sham'], students: ['Muslim'],
    region: 'Rayy',
    bioEn: 'The Rayy hafiz whose memory held hundreds of thousands of hadiths; his verdicts on narrators, recorded by his student Muslim, still decide questions of authenticity.',
    bioAr: 'ثقة حافظ ناقد، حفظ مئات الألوف من الأحاديث، وأثبت مسلم أحكامه في الرجال.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'abu-hatim-ar-razi', nameEn: 'Abu Hatim ar-Razi', nameAr: 'أبو حاتم الرازي',
    fullName: 'Muhammad ibn Idris ibn al-Mundhir al-Hanzali', generation: '3rd century AH', deathYear: 277,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, critic', ar: 'ثقة حافظ ناقد' },
    teachers: ['Masters of Iraq, Sham and the Hijaz'], students: ['Abd ar-Rahman (his son, author of al-Jarh wat-Taʿdil)'],
    region: 'Rayy',
    bioEn: 'Rayy critic whose verdicts, preserved by his son in al-Jarh wat-Taʿdil, give the strictest surviving register of narrator-grading.',
    bioAr: 'ثقة حافظ ناقد، نقل ولده عبد الرحمن أحكامه في كتاب الجرح والتعديل.',
    source: 'Siyar Aʿlam an-Nubala'
  },
  {
    slug: 'ibn-khuzaymah', nameEn: 'Ibn Khuzaymah', nameAr: 'ابن خزيمة',
    fullName: 'Muhammad ibn Ishaq ibn Khuzaymah as-Sulami', generation: '3rd century AH', deathYear: 311,
    grade: { code: 'thiqah_hafiz', en: 'Thiqah — hafiz, Imam of the Muslims', ar: 'ثقة حافظ إمام المسلمين' },
    teachers: ['Muslim'], students: ['Ibn Hibban'],
    region: 'Nishapur',
    bioEn: '"Imam of the Muslims" — his Sahih (Mukhtasar) accepts only what the topmost narrators transmitted, the strictest Sahih after Bukhari and Muslim.',
    bioAr: 'ثقة حافظ إمام المسلمين، صاحب الصحيح الذي لا يروي إلا عن أهل الثقة.',
    source: 'Tadhkirat al-Huffaz'
  }
];

module.exports = { RIJAL, GRADES, TERMS };
