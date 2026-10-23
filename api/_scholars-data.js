// Turath API — bundled scholar biographies.
// Served by GET /api/scholars when the `scholars` table is empty,
// and importable into the DB via POST /api/scholars?seed=builtin (curator).
// Underscore prefix => excluded from the Vercel serverless function count.

const SCHOLARS = [
  {
    slug: 'imam-malik', nameEn: 'Imam Malik ibn Anas', nameAr: 'الإمام مالك بن أنس',
    fullName: 'Malik ibn Anas ibn Malik al-Asbahi', era: '93 – 179 AH (711 – 795 CE)',
    birthYear: 711, deathYear: 795, field: 'Hadith & Law', region: 'Madinah',
    bioEn: 'The Imam of Madinah, where he taught for decades beside the Prophet\'s mosque. His Muwatta is among the earliest surviving compilations of hadith and law, and Imam ash-Shafi\'i called it the most truthful book after the Quran. He founded the Maliki school and taught ash-Shafi\'i among thousands of others.',
    bioAr: 'فقيه المدينة وإمام دار الهجرة، صاحب الموطأ من أقدم مدونات الحديث والفقه، مؤسس المذهب المالكي، تفقه على يديه الإمام الشافعي.',
    works: 'al-Muwatta', sourceUrl: ''
  },
  {
    slug: 'abu-hanifa', nameEn: 'Imam Abu Hanifa', nameAr: 'الإمام أبو حنيفة',
    fullName: 'Nu\'man ibn Thabit ibn Zuta al-Kufi', era: '80 – 150 AH (699 – 767 CE)',
    birthYear: 699, deathYear: 767, field: 'Law', region: 'Kufa / Baghdad',
    bioEn: 'The first of the four great imams of law and a pioneer of systematic legal reasoning. He taught in Kufa, where his circle of jurists — including Abu Yusuf and ash-Shaybani — developed the Hanafi school that spread across Iraq, Central Asia and the Ottoman world.',
    bioAr: 'أول الأئمة الأربعة وأحد أذكياء الأمة، فقيه الكوفة ورأس مدرسة الرأي، وإليه ينتسب المذهب الحنفي الذي انتشر في العراق وآسيا الوسطى.',
    works: 'Transmitted through al-Alimm wa-l-Mubin (attributed), teachings of Abu Yusuf & ash-Shaybani', sourceUrl: ''
  },
  {
    slug: 'ash-shafii', nameEn: 'Imam ash-Shafi\'i', nameAr: 'الإمام الشافعي',
    fullName: 'Muhammad ibn Idris ash-Shafi\'i', era: '150 – 204 AH (767 – 820 CE)',
    birthYear: 767, deathYear: 820, field: 'Law', region: 'Gaza / Makkah / Cairo',
    bioEn: 'A student of Malik in Madinah and the founder of the Shafi\'i school. His Risala was the first work to articulate the principles of legal theory (usul al-fiqh), and his classification of the sources of law shaped every school that followed.',
    bioAr: 'محمد بن إدريس الشافعي، تلميذ الإمام مالك وإمام المذهب الشافعي، صاحب الرسالة أول مصنف في أصول الفقه.',
    works: 'al-Risala, al-Umm, Diwan ash-Shafi\'i', sourceUrl: ''
  },
  {
    slug: 'ahmad-ibn-hanbal', nameEn: 'Imam Ahmad ibn Hanbal', nameAr: 'الإمام أحمد بن حنبل',
    fullName: 'Ahmad ibn Hanbal ash-Shaybani', era: '164 – 241 AH (780 – 855 CE)',
    birthYear: 780, deathYear: 855, field: 'Hadith & Law', region: 'Baghdad',
    bioEn: 'Founder of the Hanbali school and one of the most steadfast figures of Islamic history. During the Mihna, the inquisition demanding he profess the Quran as created, he endured imprisonment and flogging under three caliphs and never yielded. His Musnad arranges over 27,000 narrations by the first companion in each chain.',
    bioAr: 'إمام أهل السنة وصاحب المسند، ثبت في محنة خلق القرآن فنال رتبة الإمامة عند الخاص والعام، مؤسس المذهب الحنبلي.',
    works: 'al-Musnad, Kitab az-Zuhd', sourceUrl: ''
  },
  {
    slug: 'bukhari', nameEn: 'Imam al-Bukhari', nameAr: 'الإمام البخاري',
    fullName: 'Muhammad ibn Isma\'il al-Bukhari', era: '194 – 256 AH (810 – 870 CE)',
    birthYear: 810, deathYear: 870, field: 'Hadith', region: 'Bukhara, Central Asia',
    bioEn: 'The most celebrated hadith master in Islamic history. He spent sixteen years travelling across Khurasan, Iraq, the Hijaz, Syria and Egypt, learning from over a thousand teachers, and compiled his Sahih from roughly 600,000 narrations. Contemporaries called him "the Commander of the Faithful in Hadith".',
    bioAr: 'أمير المؤمنين في الحديث، صاحب الجامع الصحيح الذي هو أصح كتاب بعد كتاب الله، جمعه في ست عشرة سنة من نحو ستمائة ألف رواية.',
    works: 'Sahih al-Bukhari, al-Adab al-Mufrad, al-Tarikh al-Kabir', sourceUrl: ''
  },
  {
    slug: 'muslim', nameEn: 'Imam Muslim', nameAr: 'الإمام مسلم',
    fullName: 'Muslim ibn al-Hajjaj an-Naysaburi', era: '204 – 261 AH (815 – 875 CE)',
    birthYear: 815, deathYear: 875, field: 'Hadith', region: 'Nishapur, Persia',
    bioEn: 'A close student of al-Bukhari from Nishapur. His Sahih is admired for its precise arrangement — each chapter gathers every chain of the same hadith together — and he spent fifteen years on it, reviewing it with the scholars of Nishapur.',
    bioAr: 'تلميذ البخاري وصاحب الصحيح المرتب على أنفس الترتيب، جمع فيه طرق الحديث الواحد في موضع واحد، ومن كبار حفاظ نيسابور.',
    works: 'Sahih Muslim, al-Kuna wa-l-Asma', sourceUrl: ''
  },
  {
    slug: 'abu-dawud', nameEn: 'Imam Abu Dawud', nameAr: 'الإمام أبو داود',
    fullName: 'Sulayman ibn al-Ash\'ath as-Sijistani', era: '202 – 275 AH (817 – 889 CE)',
    birthYear: 817, deathYear: 889, field: 'Hadith', region: 'Sijistan, Persia',
    bioEn: 'A companion-student of Imam Ahmad. His Sunan gathers around 5,200 hadiths selected for their legal weight, arranged by fiqh chapters, and he openly flagged the weak narrations he included for a purpose. He was known for simplicity and detachment from the world.',
    bioAr: 'صاحب السنن المنتقاة من نحو نصف مليون حديث، رتبها على أبواب الفقه وأشار إلى الضعيف منها، من تلاميذ الإمام أحمد.',
    works: 'Sunan Abi Dawud, Kitab al-Marasil', sourceUrl: ''
  },
  {
    slug: 'at-tirmidhi', nameEn: 'Imam at-Tirmidhi', nameAr: 'الإمام الترمذي',
    fullName: 'Muhammad ibn Isa at-Tirmidhi', era: '209 – 279 AH (824 – 892 CE)',
    birthYear: 824, deathYear: 892, field: 'Hadith', region: 'Tirmidh, Transoxiana',
    bioEn: 'A student of al-Bukhari and Abu Dawud, blind in his later years. His Jami\' was the first collection to record each hadith together with the scholars\' grading and the fiqh derived from it, a bridge between hadith and law. His Shamail paints a portrait of the Prophet\'s ﷺ appearance and manner.',
    bioAr: 'صاحب الجامع، أول من جمع في كتابه الحديث مع بيان درجته وفقهه، وصاحب الشمائل المحمدية في وصف النبي ﷺ.',
    works: 'Jami\' at-Tirmidhi, ash-Shamail an-Nabawiyya, al-Ilal al-Kabir', sourceUrl: ''
  },
  {
    slug: 'an-nasai', nameEn: 'Imam an-Nasa\'i', nameAr: 'الإمام النسائي',
    fullName: 'Ahmad ibn Shu\'ayb an-Nasa\'i', era: '215 – 303 AH (829 – 915 CE)',
    birthYear: 829, deathYear: 915, field: 'Hadith', region: 'Nasa, Khurasan (died in Makkah)',
    bioEn: 'The last of the four great Sunan compilers and a master of hadith defects (ilal). He settled in Egypt, where students travelled from across the Muslim world to hear him. His Sunan al-Mujtaba is praised as the most carefully graded of the four Sunan.',
    bioAr: 'صاحب السنن الصغرى المجتباة، شيخ مصر في الحديث، ومن أعلم أهل زمانه بعلل الحديث.',
    works: 'as-Sunan al-Kubra, Sunan an-Nasa\'i (al-Mujtaba), Kitab al-Khasa\'is', sourceUrl: ''
  },
  {
    slug: 'ibn-majah', nameEn: 'Imam Ibn Majah', nameAr: 'الإمام ابن ماجه',
    fullName: 'Muhammad ibn Yazid ibn Majah al-Qazwini', era: '209 – 273 AH (824 – 887 CE)',
    birthYear: 824, deathYear: 887, field: 'Hadith', region: 'Qazvin, Persia',
    bioEn: 'A Persian scholar who travelled to Iraq, the Hijaz and Egypt in pursuit of hadith. His Sunan of about 4,300 narrations completed the canonical six books, and he also wrote one of the earliest books of hadith history (at-Tarikh).',
    bioAr: 'صاحب السنن التي أتمت الكتب الستة، من علماء قزوين، وله في التاريخ ورواة الحديث من أقدم المصنفات.',
    works: 'Sunan Ibn Majah, at-Tarikh, at-Tafsir', sourceUrl: ''
  },
  {
    slug: 'at-tabari', nameEn: 'Imam at-Tabari', nameAr: 'الإمام الطبري',
    fullName: 'Muhammad ibn Jarir at-Tabari', era: '224 – 310 AH (839 – 923 CE)',
    birthYear: 839, deathYear: 923, field: 'Tafsir & History', region: 'Amul, Tabaristan / Baghdad',
    bioEn: 'The imam of mufassirs and historians. His Tarikh ar-Rusul wa-l-Muluk narrates world history from creation to his own time, and his Jami\' al-Bayan remains the foundation of Quranic commentary. He wrote steadily for forty years, producing an estimated two pages a day.',
    bioAr: 'إمام المفسرين والمؤرخين، صاحب تاريخ الرسل والملوك وجامع البيان في تأويل القرآن، انتفع بتصانيفه علماء الإسلام قرونًا.',
    works: 'Tarikh ar-Rusul wa-l-Muluk, Jami\' al-Bayan, Tahdhib al-Athar', sourceUrl: ''
  },
  {
    slug: 'al-khwarizmi', nameEn: 'al-Khwarizmi', nameAr: 'الخوارزمي',
    fullName: 'Muhammad ibn Musa al-Khwarizmi', era: 'c. 164 – 232 AH (c. 780 – 850 CE)',
    birthYear: 780, deathYear: 850, field: 'Mathematics & Astronomy', region: 'Khwarazm / Baghdad',
    bioEn: 'The father of algebra. His Kitab al-Jabr wa-l-Muqabala gave the discipline its name and taught systematic problem-solving for six centuries; the word "algorithm" descends from his own. A 1347 illustrated copy of his Algebra is held in the Bodleian Library and features in this archive.',
    bioAr: 'أبو الجبر، صاحب المختصر في حساب الجبر والمقابلة، وإليه ترجع تسمية الخوارزميات، ونسخة مصورة من كتاب الجبر سنة 748هـ محفوظة بمكتبة بودليان.',
    works: 'al-Jabr wa-l-Muqabala, Zij as-Sindind, Kitab Surat al-Ard', sourceUrl: ''
  },
  {
    slug: 'ibn-sina', nameEn: 'Ibn Sina (Avicenna)', nameAr: 'ابن سينا',
    fullName: 'Abu Ali al-Husayn ibn Sina', era: '370 – 428 AH (980 – 1037 CE)',
    birthYear: 980, deathYear: 1037, field: 'Medicine & Philosophy', region: 'Bukhara / Persia',
    bioEn: 'The Sheikh ar-Ra\'is, philosopher-physician of the Islamic Golden Age. His al-Qanun fi-t-Tibb (Canon of Medicine) remained the standard medical textbook from Baghdad to Salerno for five centuries; a gilded Ottoman copy of its anatomy chapters is held in the Qatar National Library and features in this archive.',
    bioAr: 'الشيخ الرئيس، أشهر فلاسفة الإسلام وأطبائهم، كتابه القانون في الطب درس في جامعات الشرق والغرب قرونًا، ونسخة عثمانية مذهبة منه في مكتبة قطر الوطنية.',
    works: 'al-Qanun fi-t-Tibb, Kitab ash-Shifa, an-Najat', sourceUrl: ''
  },
  {
    slug: 'al-biruni', nameEn: 'al-Biruni', nameAr: 'البيروني',
    fullName: 'Abu ar-Rayhan Muhammad ibn Ahmad al-Biruni', era: '362 – 440 AH (973 – 1048 CE)',
    birthYear: 973, deathYear: 1048, field: 'Astronomy, Geography & Indology', region: 'Khwarazm / Ghazna',
    bioEn: 'One of the greatest universal scholars of any age: astronomer, geodesist, pharmacologist and master of Sanskrit. His study of India recorded its sciences and religions from within, and he measured the Earth\'s radius with remarkable accuracy six centuries before Europe.',
    bioAr: 'من أعظم علماء الإسلام، فلكي وجغرافي ولغوي، كتب تحقيق ما للهند من مقولات مقبولة في العقل أو مرذولة، وقاس محيط الأرض بدقة مدهشة.',
    works: 'Tahqiq ma li-l-Hind, al-Athar al-Baqiya, al-Qanun al-Mas\'udi', sourceUrl: ''
  },
  {
    slug: 'al-ghazali', nameEn: 'Imam al-Ghazali', nameAr: 'الإمام الغزالي',
    fullName: 'Abu Hamid Muhammad ibn Muhammad al-Ghazali', era: '450 – 505 AH (1058 – 1111 CE)',
    birthYear: 1058, deathYear: 1111, field: 'Theology, Law & Sufism', region: 'Tus, Khurasan / Baghdad',
    bioEn: 'Hujjat al-Islam, the Proof of Islam. A professor at the Nizamiyya of Baghdad, he abandoned his post for a decade of travel and retreat that transformed him; his Ihya Ulum ad-Din revived the religious sciences by joining law and theology with the purification of the heart.',
    bioAr: 'حجة الإسلام، درّس بالنظامية ببغداد ثم تركها إلى سياحة ومجاهدة، وألف إحياء علوم الدين فجمع بين الشريعة وحقائق القلوب.',
    works: 'Ihya Ulum ad-Din, Tahafut al-Falasifa, Ihya\' related tracts', sourceUrl: ''
  },
  {
    slug: 'al-hariri', nameEn: 'al-Hariri of Basra', nameAr: 'الحريري البصري',
    fullName: 'Abu Muhammad al-Qasim ibn Ali al-Hariri', era: '446 – 516 AH (1054 – 1122 CE)',
    birthYear: 1054, deathYear: 1122, field: 'Belles-lettres (Adab)', region: 'Basra, Iraq',
    bioEn: 'Author of the Maqamat, fifty tales of the eloquent trickster Abu Zayd that became the summit of classical Arabic prose. The 1237 Baghdad copy painted by Yahya al-Wasiti carries some of the finest illustrations of medieval Islamic art and features in this archive.',
    bioAr: 'أديب البصرة صاحب المقامات الخمسين، ذروة النثر الفني في العربية، ونسخة بغداد سنة 635هـ برسوم يحيى الواسطي من روائع التصوير الإسلامي.',
    match: ['al-Hariri', 'al-Hariri of Basra'],
    works: 'Maqamat al-Hariri, Durrat al-Ghawwas', sourceUrl: ''
  },
  {
    slug: 'ibn-rushd', nameEn: 'Ibn Rushd (Averroes)', nameAr: 'ابن رشد',
    fullName: 'Abu al-Walid Muhammad ibn Ahmad ibn Rushd', era: '520 – 595 AH (1126 – 1198 CE)',
    birthYear: 1126, deathYear: 1198, field: 'Philosophy, Law & Medicine', region: 'Cordoba, al-Andalus',
    bioEn: 'The great commentator of Aristotle, chief judge of Seville and physician of the Almohad court. His Fasl al-Maqal argued for the harmony of reason and revelation, and through Latin translations he became the teacher of medieval Europe\'s philosophers.',
    bioAr: 'فيلسوف قرطبة وشارح أرسطو، قاضي إشبيلية وطبيب بلاط الموحدين، صاحب فصل المقال في اتصال الحكمة بالشريعة.',
    works: 'Sharh Aristotle, Bidayat al-Mujtahid, Fasl al-Maqal, al-Kulliyyat fi-t-Tibb', sourceUrl: ''
  },
  {
    slug: 'an-nawawi', nameEn: 'Imam an-Nawawi', nameAr: 'الإمام النووي',
    fullName: 'Yahya ibn Sharaf an-Nawawi', era: '631 – 676 AH (1233 – 1277 CE)',
    birthYear: 1233, deathYear: 1277, field: 'Hadith & Law', region: 'Nawa, Syria / Damascus',
    bioEn: 'Sheikh al-Islam of later Damascus, who ate little and slept little, devoting two decades to teaching and writing. His Riyad as-Salihin arranges the Prophet\'s ﷺ guidance for daily character, and his Forty Hadith was said to cover half the religion.',
    bioAr: 'شيخ الإسلام في الشام، زاهد الدنيا مجتهد في العلم والتعليم، صاحب رياض الصالحين والأربعين النووية وشرح صحيح مسلم.',
    works: 'Riyad as-Salihin, al-Arba\'in an-Nawawiyya, Sharh Sahih Muslim, Minhaj at-Talibin', sourceUrl: ''
  },
  {
    slug: 'ibn-khaldun', nameEn: 'Ibn Khaldun', nameAr: 'ابن خلدون',
    fullName: 'Abd ar-Rahman ibn Khaldun al-Hadrami', era: '732 – 808 AH (1332 – 1406 CE)',
    birthYear: 1332, deathYear: 1406, field: 'Historiography & Sociology', region: 'Tunis / Cairo',
    bioEn: 'The founder of social science. His Muqaddimah — the introduction to his universal history — set out the rise and fall of civilisations, group solidarity (asabiyya) and the economics of states, centuries before similar European works. An Egyptian copy of the Muqaddimah of 1310 CE is in the Library of Congress and features in this archive.',
    bioAr: 'مؤسس علم العمران وصاحب المقدمة، وضع فيها قوانين صعود الدول وسقوطها والعصبية وعوامل الاقتصاد، ونسخة مصرية من المقدمة محفوظة في مكتبة الكونغرس.',
    works: 'al-Muqaddimah, Kitab al-Ibar', sourceUrl: ''
  },
  {
    slug: 'ibn-kathir', nameEn: 'Ibn Kathir', nameAr: 'ابن كثير',
    fullName: 'Ismail ibn Umar ibn Kathir ad-Dimashqi', era: '700 – 774 AH (c. 1301 – 1373 CE)',
    birthYear: 1301, deathYear: 1373, field: 'Tafsir & History', region: 'Damascus, Syria',
    bioEn: 'The Damascene mufassir and historian, a student of Ibn Taymiyya. His Tafsir al-Quran al-Azim is among the most widely read commentaries today, and his al-Bidaya wa-n-Nihaya narrates history from creation to the end of time.',
    bioAr: 'مفسر ومؤرخ دمشقي من تلاميذ ابن تيمية، صاحب تفسير القرآن العظيم والبداية والنهاية في التاريخ.',
    works: 'Tafsir al-Quran al-Azim, al-Bidaya wa-n-Nihaya, as-Sira an-Nabawiyya', sourceUrl: ''
  },
  {
    slug: 'ibn-hajar', nameEn: 'Ibn Hajar al-Asqalani', nameAr: 'ابن حجر العسقلاني',
    fullName: 'Ahmad ibn Ali ibn Hajar al-Asqalani', era: '773 – 852 AH (1372 – 1449 CE)',
    birthYear: 1372, deathYear: 1449, field: 'Hadith', region: 'Cairo, Egypt',
    bioEn: 'The hadith master of his age and chief judge of Egypt. His Fath al-Bari, the commentary on Sahih al-Bukhari, took about a quarter-century and is considered the crown of hadith scholarship; his honorific, Commander of the Faithful in Hadith, echoes al-Bukhari\'s own.',
    bioAr: 'أمير المؤمنين في الحديث في عصره وقاضي قضاة مصر، صاحب فتح الباري شرح صحيح البخاري وبلوغ المرام وإصلاح المنتبه.',
    works: 'Fath al-Bari, Bulugh al-Maram, Nuzhat an-Nazar', sourceUrl: ''
  },
  {
    slug: 'al-jazuli', nameEn: 'al-Jazuli', nameAr: 'الجزولي',
    fullName: 'Abu Abdallah Muhammad ibn Sulayman al-Jazuli', era: 'd. c. 870 AH (c. 1465 CE)',
    birthYear: null, deathYear: 1465, field: 'Sufism & Devotion', region: 'Morocco',
    bioEn: 'The Moroccan Sufi and author of Dalail al-Khayrat, the most widely copied book of blessings upon the Prophet ﷺ in the Muslim world, its litanies illuminating manuscripts from Morocco to Southeast Asia. An 1821 Dalail with illuminated Mecca diagrams is held by the New York Public Library and features in this archive.',
    bioAr: 'الصوفي المغربي صاحب دلائل الخيرات، أشهر كتب الصلاة على النبي ﷺ في العالم الإسلامي، ونسخة منه بمخططات مذهبة للحرمين محفوظة في مكتبة نيويورك العامة.',
    works: 'Dalail al-Khayrat', sourceUrl: ''
  }
];

module.exports = { SCHOLARS };
