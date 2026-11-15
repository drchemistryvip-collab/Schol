// =========================================================================
// Educational Data Engine & Synchronization (UPDATED)
// Manages: 
// 1. Grades (KG to 12) & Student Chosen Grades Filter
// 2. Comprehensive Curriculum Subjects (Chemistry, Physics, Biology, Math, etc.)
// 3. Multi-Format Malzama Uploads & Viewing (PowerPoint, HTML, Image, PDF)
// 4. Strict Language-Based Filtering (Badini, Sorani, Arabic, English)
// 5. Teachers Registry sorted by Views & Admin Approval Workflow
// =========================================================================

var SUPER_ADMIN_EMAIL = window.SUPER_ADMIN_EMAIL || "hussein.zebary.chemistry96@gmail.com";

const GRADES_CONFIG = [
    { id: 'kg', name: 'باخچەی ساوایان', shortName: 'باخچە', level: 'kindergarten', icon: 'fa-shapes', color: '#ff7b54' },
    { id: '1', name: 'پۆلا ١ (ئێکێ)', shortName: 'پۆلا ١', level: 'primary', icon: 'fa-child', color: '#4d96ff' },
    { id: '2', name: 'پۆلا ٢ (دووێ)', shortName: 'پۆلا ٢', level: 'primary', icon: 'fa-pencil-alt', color: '#6bc670' },
    { id: '3', name: 'پۆلا ٣ (سێیێ)', shortName: 'پۆلا ٣', level: 'primary', icon: 'fa-book-reader', color: '#ffb26b' },
    { id: '4', name: 'پۆلا ٤ (چارێ)', shortName: 'پۆلا ٤', level: 'primary', icon: 'fa-lightbulb', color: '#9d4edd' },
    { id: '5', name: 'پۆلا ٥ (پێنجێ)', shortName: 'پۆلا ٥', level: 'primary', icon: 'fa-atom', color: '#00b4d8' },
    { id: '6', name: 'پۆلا ٦ (شەشێ)', shortName: 'پۆلا ٦', level: 'primary', icon: 'fa-calculator', color: '#e76f51' },
    { id: '7', name: 'پۆلا ٧ (حەفتێ)', shortName: 'پۆلا ٧', level: 'middle', icon: 'fa-compass', color: '#2a9d8f' },
    { id: '8', name: 'پۆلا ٨ (هەشتێ)', shortName: 'پۆلا ٨', level: 'middle', icon: 'fa-microscope', color: '#e63946' },
    { id: '9', name: 'پۆلا ٩ (نەهێ)', shortName: 'پۆلا ٩', level: 'middle', icon: 'fa-graduation-cap', color: '#457b9d' },
    { id: '10', name: 'پۆلا ١٠ (دەهێ)', shortName: 'پۆلا ١٠', level: 'high', icon: 'fa-school', color: '#8A2BE2' },
    { id: '11', name: 'پۆلا ١١ (یازدێ)', shortName: 'پۆلا ١١', level: 'high', icon: 'fa-flask', color: '#007BFF' },
    { id: '12', name: 'پۆلا ١٢ (دوازدێ)', shortName: 'پۆلا ١٢', level: 'high', icon: 'fa-award', color: '#28a745' },
    { id: 'univ', name: 'قۆناغا زانکۆیێ و پەیمانگەکان', shortName: 'زانکۆ', level: 'university', icon: 'fa-university', color: '#7209b7', customUrl: 'university.html' }
];

// =========================================================================
// UNIVERSITY COLLEGES & DEPARTMENTS DATASET (کۆلێژ و بەشەکانی زانکۆ و معەدل)
// =========================================================================
const UNIVERSITY_DEPARTMENTS = [
    // 1. کۆمەڵەی پزیشکی (Medical & Healthcare)
    {
        id: 'med_general',
        nameKu: 'پزیشکیی گشتی (کۆلێژی پزیشکی)',
        nameEn: 'General Medicine (M.B.Ch.B)',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی',
        branch: 'scientific',
        minScoreGeneral: 97.4,
        minScoreParallel: 95.8,
        minScorePrivate: 85.0,
        durationYears: 6,
        icon: 'fa-user-md',
        color: '#e63946',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی هەولێری پزیشکی', 'زانکۆی سلێمانی', 'زانکۆی سەلاحەدین'],
        description: 'بەرزترین بەشی زانستی بۆ پێگەیاندنی پزیشکانی گشتی، نەشتەرگەری و چارەسەرکردنی نەخۆشییەکان.',
        careerFields: 'نەخۆشخانەکانی کەرتی گشتی و تایبەت، کلینیک، سەنتەرەکانی توێژینەوەی پزیشکی'
    },
    {
        id: 'med_dentistry',
        nameKu: 'پزیشکیی ددان',
        nameEn: 'Dentistry (B.D.S)',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی',
        branch: 'scientific',
        minScoreGeneral: 95.8,
        minScoreParallel: 94.2,
        minScorePrivate: 82.0,
        durationYears: 5,
        icon: 'fa-tooth',
        color: '#00b4d8',
        universities: ['زانکۆی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی سلێمانی'],
        description: 'چارەسەرکردن و جوانکاری و نەشتەرگەریی ددان و پووک و دەم و چەناگە.',
        careerFields: 'کلینیکی تایبەت، نەخۆشخانەکان، سەنتەرەکانی چاندن و جوانکاریی ددان'
    },
    {
        id: 'med_pharmacy',
        nameKu: 'دەرمانسازی',
        nameEn: 'Pharmacy (B.Pharm)',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی',
        branch: 'scientific',
        minScoreGeneral: 94.6,
        minScoreParallel: 93.0,
        minScorePrivate: 80.0,
        durationYears: 5,
        icon: 'fa-pills',
        color: '#2a9d8f',
        universities: ['زانکۆی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی سلێمانی'],
        description: 'زانستی ئامادەکردن، پشکنین و شیکاریی پێکهاتەی دەرمانەکان و ڕێنمایی چارەسەری.',
        careerFields: 'دەرمانخانە، کۆمپانیاکانی دەرمان، کۆگاکانی دەرمان، تاقیگەی پیشەسازیی دەرمان'
    },
    {
        id: 'med_anesthesia',
        nameKu: 'بێهۆشکاری و سڕکردن (تەخدیر)',
        nameEn: 'Anesthesia Technology',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی و تەندروستی',
        branch: 'scientific',
        minScoreGeneral: 87.4,
        minScoreParallel: 85.0,
        minScorePrivate: 68.0,
        durationYears: 4,
        icon: 'fa-syringe',
        color: '#7209b7',
        universities: ['زانکۆی دهۆک', 'زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'بەڕێوەبردنی سڕکردنی نەخۆش لە هۆڵەکانی نەشتەرگەری و چاودێریی ورد (ICU).',
        careerFields: 'هۆڵەکانی نەشتەرگەری، سەنتەری چاودێری چڕ، نەخۆشخانەکانی فریاکەوتن'
    },
    {
        id: 'med_analysis',
        nameKu: 'شیکاریی نەخۆشییەکان (تاقیگە)',
        nameEn: 'Medical Laboratory Analysis',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی و تەندروستی',
        branch: 'scientific',
        minScoreGeneral: 86.0,
        minScoreParallel: 83.5,
        minScorePrivate: 65.0,
        durationYears: 4,
        icon: 'fa-microscope',
        color: '#f77f00',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'ئەنجامدانی پشکنینی کیمیایی، مۆلیکولەر، باکتریۆلۆجی و خوێن بۆ دەستنیشانکردنی نەخۆشییەکان.',
        careerFields: 'تاقیگەکانی نەخۆشخانە، تاقیگەی تایبەت، بانکی خوێن، سەنتەری توێژینەوە'
    },
    {
        id: 'med_nursing',
        nameKu: 'پەرستاریی گشتی',
        nameEn: 'General Nursing',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی و تەندروستی',
        branch: 'scientific',
        minScoreGeneral: 85.2,
        minScoreParallel: 82.0,
        minScorePrivate: 65.0,
        durationYears: 4,
        icon: 'fa-heartbeat',
        color: '#e63946',
        universities: ['زانکۆی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی سلێمانی', 'زانکۆی زاخۆ'],
        description: 'چاودێریکردنی تەندروستیی نەخۆش و دابینکردنی خزمەتگوزارییە تەندروستییە سەرەکییەکان.',
        careerFields: 'نەخۆشخانەکان، نۆڕینگەکان، بنکە تەندروستییەکان، سەنتەرەکانی فریاکەوتن'
    },
    {
        id: 'med_radiology',
        nameKu: 'تیشک و سۆنار (تەکنەلۆژیای تیشک)',
        nameEn: 'Radiology & Medical Imaging',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی و تەندروستی',
        branch: 'scientific',
        minScoreGeneral: 84.8,
        minScoreParallel: 82.0,
        minScorePrivate: 66.0,
        durationYears: 4,
        icon: 'fa-x-ray',
        color: '#4361ee',
        universities: ['زانکۆی دهۆک', 'زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'وێنەگرتنی تیشکی (X-ray, MRI, CT Scan, Ultrasound) بۆ پشکنینی ناوەوەی لەش.',
        careerFields: 'بەشەکانی تیشک لە نەخۆشخانە و سەنتەرە تایبەتەکان'
    },
    {
        id: 'med_physiotherapy',
        nameKu: 'چارەسەری سروشتی (فیزۆتێراپی)',
        nameEn: 'Physiotherapy',
        category: 'medical',
        categoryKu: 'کۆلێژێن پزیشکی و تەندروستی',
        branch: 'scientific',
        minScoreGeneral: 83.5,
        minScoreParallel: 80.5,
        minScorePrivate: 65.0,
        durationYears: 4,
        icon: 'fa-running',
        color: '#2ec4b6',
        universities: ['زانکۆی دهۆک', 'زانکۆی هەولێری پزیشکی', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'شیاندنەوە و چارەسەرکردنی نەخۆشییەکانی جومگە و دەمار و ماسولکە بەبێ دەرمان.',
        careerFields: 'سەنتەری چارەسەری سروشتی، یانە وەرزشییەکان، نەخۆشخانەکان'
    },

    // 2. ئەندازیاری (Engineering)
    {
        id: 'eng_software',
        nameKu: 'ئەندازیاری پرۆگرامسازی و کۆمپیوتەر',
        nameEn: 'Software & Computer Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 88.5,
        minScoreParallel: 85.0,
        minScorePrivate: 68.0,
        durationYears: 4,
        icon: 'fa-laptop-code',
        color: '#3a0ca3',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی', 'زانکۆی زاخۆ', 'زانکۆی پۆلیتەکنیکی دهۆک'],
        description: 'دیزاین و پەرەپێدانی سیستمە زیرەکەکان، نەرمەواڵە، ئەپڵیکەیشن و تۆڕەکانی کۆمپیوتەر.',
        careerFields: 'کۆمپانیاکانی تەکنەلۆژیا، بانکەکان، کۆمپانیاکانی نەوت، پەرەپێدەری سەربەخۆ'
    },
    {
        id: 'eng_architecture',
        nameKu: 'ئەندازیاریی تەلارسازی (دیزاین و تەلار)',
        nameEn: 'Architectural Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 86.0,
        minScoreParallel: 82.5,
        minScorePrivate: 65.0,
        durationYears: 5,
        icon: 'fa-drafting-compass',
        color: '#e76f51',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'دیزاینکردنی باڵەخانە، پڕۆژە نیشتەجێبوونەکان و پلانە ئەندازیارییە مۆدێرنەکان.',
        careerFields: 'نووسینگەی ئەندازیاری، کۆمپانیاکانی بەڵێندەرایەتی و وەبەرهێنان'
    },
    {
        id: 'eng_petroleum',
        nameKu: 'ئەندازیاریی نەوت و سامانە سروشتییەکان',
        nameEn: 'Petroleum & Natural Gas Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 82.5,
        minScoreParallel: 79.0,
        minScorePrivate: 65.0,
        durationYears: 4,
        icon: 'fa-oil-well',
        color: '#264653',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی پۆلیتەکنیکی دهۆک'],
        description: 'هەڵکەندن، دەرهێنان و بەرهەمهێنانی نەوتی خاو و گازی سروشتی بە شێوازی سەردەمیانە.',
        careerFields: 'کۆمپانیا جیهانی و خۆماڵییەکانی نەوت، کێڵگە نەوتییەکان، پاڵاوگەکان'
    },
    {
        id: 'eng_civil',
        nameKu: 'ئەندازیاریی شارستانی (مەدەنی)',
        nameEn: 'Civil & Structural Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 81.0,
        minScoreParallel: 77.0,
        minScorePrivate: 62.0,
        durationYears: 4,
        icon: 'fa-building',
        color: '#457b9d',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'دروستکردنی پرد، ڕێگاوبان، بەنداو، باڵەخانە و سەرپەرشتیکردنی پڕۆژە بیناسازییەکان.',
        careerFields: 'کەرتی بیناسازی، فەرمانگەکانی شارەوانی، کۆمپانیاکانی پرۆژەی گشتی'
    },
    {
        id: 'eng_electrical',
        nameKu: 'ئەندازیاریی کارەبا و ئەلیکترۆنیک',
        nameEn: 'Electrical & Electronic Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 77.0,
        minScoreParallel: 73.0,
        minScorePrivate: 60.0,
        durationYears: 4,
        icon: 'fa-bolt',
        color: '#e63946',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'سیستمەکانی بەرهەمهێنان، گواستنەوە و دابەشکردنی وزەی کارەبا و کۆنترۆڵ.',
        careerFields: 'وێستگەکانی کارەبا، کۆمپانیاکانی پەیوەندی، فەرمانگەی وزە'
    },
    {
        id: 'eng_mechanical',
        nameKu: 'ئەندازیاریی میکانیک',
        nameEn: 'Mechanical Engineering',
        category: 'engineering',
        categoryKu: 'کۆلێژێن ئەندازیاری',
        branch: 'scientific',
        minScoreGeneral: 75.5,
        minScoreParallel: 71.0,
        minScorePrivate: 60.0,
        durationYears: 4,
        icon: 'fa-cogs',
        color: '#6c757d',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'دیزاین و بەرهەمهێنانی ئامێر، ماتۆڕ، سیستمەکانی ساردکەرەوە و گەرمکەرەوە.',
        careerFields: 'کارگەکان، کارگەی ئۆتۆمبێل، فڕۆکەوانی، بەرهەمهێنانی پیشەسازی'
    },

    // 3. زانست و کۆمپیوتەر (Science & IT)
    {
        id: 'sci_cs',
        nameKu: 'زانستی کۆمپیوتەر (Computer Science)',
        nameEn: 'Computer Science (B.Sc)',
        category: 'science',
        categoryKu: 'کۆلێژێن زانست و کۆمپیوتەر',
        branch: 'scientific',
        minScoreGeneral: 76.0,
        minScoreParallel: 72.0,
        minScorePrivate: 60.0,
        durationYears: 4,
        icon: 'fa-code',
        color: '#0077b6',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی', 'زانکۆی پۆلیتەکنیکی دهۆک'],
        description: 'فێربوونی ئەلگۆریزم، زیرەکیی دەستکرد (AI)، داتابەیس و پەرەپێدانی سیستم و وێب.',
        careerFields: 'پرۆگرامەر، ئەندازیاری داتا، بەرپرسی پاراستنی زانیاری (Cybersecurity)'
    },
    {
        id: 'sci_chemistry',
        nameKu: 'کیمیای گشتی و پزیشکی',
        nameEn: 'Pure & Applied Chemistry',
        category: 'science',
        categoryKu: 'کۆلێژێن زانست',
        branch: 'scientific',
        minScoreGeneral: 72.0,
        minScoreParallel: 68.0,
        minScorePrivate: 58.0,
        durationYears: 4,
        icon: 'fa-flask',
        color: '#00b4d8',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'لێکۆڵینەوە لە پێکهاتە، کارلێک و تایبەتمەندییە کیمیاییەکانی ماددە و تێکەڵەکان.',
        careerFields: 'کۆمپانیاکانی نەوت، پشکنینی کۆنتڕۆڵی جۆری، تاقیگە، مامۆستایی زانکۆ و قوتابخانە'
    },
    {
        id: 'sci_biology',
        nameKu: 'زیندەوەرزانی و بایۆلۆجی',
        nameEn: 'Biology & Biotechnology',
        category: 'science',
        categoryKu: 'کۆلێژێن زانست',
        branch: 'scientific',
        minScoreGeneral: 73.0,
        minScoreParallel: 69.0,
        minScorePrivate: 58.0,
        durationYears: 4,
        icon: 'fa-dna',
        color: '#2a9d8f',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'لێکۆڵینەوە لە زیندەوەران، مایکڕۆب، بۆماوەزانی (Genetics) و ژینگەزانی.',
        careerFields: 'تاقیگە، سەنتەری توێژینەوەی کشتوکاڵ، وەزارەتی تەندروستی و ژینگە'
    },
    {
        id: 'sci_physics',
        nameKu: 'فیزیا و فیزیای پزیشکی',
        nameEn: 'Physics & Medical Physics',
        category: 'science',
        categoryKu: 'کۆلێژێن زانست',
        branch: 'scientific',
        minScoreGeneral: 68.0,
        minScoreParallel: 65.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-atom',
        color: '#7209b7',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'یاساکانی گەردوون، کارەبا، جوولە، کوانتەم و فیزیای تیشکی پزیشکی.',
        careerFields: 'مامۆستایی، سەنتەرەکانی تیشک، دەزگاکانی پێوانەسازی و پیشەسازی'
    },
    {
        id: 'sci_math',
        nameKu: 'بیرکاری و ئامار (Data Science)',
        nameEn: 'Mathematics & Statistics',
        category: 'science',
        categoryKu: 'کۆلێژێن زانست',
        branch: 'scientific',
        minScoreGeneral: 66.0,
        minScoreParallel: 63.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-square-root-alt',
        color: '#f77f00',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'شیکاریی ژمارەیی، ئەگەرزانی، داتا و مۆدێلسازیی بیرکارییانە.',
        careerFields: 'شیکەرەوەی داتا، کۆمپانیاکانی بیمە، بانکەکان، مامۆستایی'
    },

    // 4. کارگێڕی، ئابووری و یاسا (Business, Economics & Law)
    {
        id: 'law',
        nameKu: 'یاسا (کۆلێژی یاسا)',
        nameEn: 'Law & Jurisprudence (LL.B)',
        category: 'business',
        categoryKu: 'کۆلێژێن یاسا و کارگێڕی',
        branch: 'both',
        minScoreGeneral: 78.0,
        minScoreParallel: 74.0,
        minScorePrivate: 60.0,
        durationYears: 4,
        icon: 'fa-balance-scale',
        color: '#8b5cf6',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'یاسای مەدەنی، سزایی، نێودەوڵەتی، دەستوور و بەڕێوەبردنی دادپەروەری.',
        careerFields: 'پارێزەر، دادوەر، لێکۆڵەری دادوەری، ڕاوێژکاری یاسایی لە کۆمپانیاکان'
    },
    {
        id: 'bus_accounting',
        nameKu: 'ژمێریاری (Accounting)',
        nameEn: 'Accounting & Auditing',
        category: 'business',
        categoryKu: 'کۆلێژێن کارگێڕی و ئابووری',
        branch: 'both',
        minScoreGeneral: 68.0,
        minScoreParallel: 64.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-file-invoice-dollar',
        color: '#10b981',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی', 'زانکۆی پۆلیتەکنیکی دهۆک'],
        description: 'بەڕێوەبردنی تۆمارە داراییەکان، باج، ووردبینی (Auditing) و شیکاریی داهات.',
        careerFields: 'ژمێریاری بانک، کۆمپانیاکان، وەزارەتی دارایی، وردبینیکاری سەربەخۆ'
    },
    {
        id: 'bus_finance',
        nameKu: 'دارایی و بانک (Finance & Banking)',
        nameEn: 'Finance & Banking',
        category: 'business',
        categoryKu: 'کۆلێژێن کارگێڕی و ئابووری',
        branch: 'both',
        minScoreGeneral: 68.5,
        minScoreParallel: 65.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-university',
        color: '#0ea5e9',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'بەڕێوەبردنی سەرمایە، بازاڕی دارایی (Stock Market) و کارووباری بانکی سەردەمیانە.',
        careerFields: 'بانکە بازرگانی و ئەهلییەکان، کۆمپانیاکانی وەبەرهێنان، بۆرسە'
    },
    {
        id: 'bus_admin',
        nameKu: 'کارگێڕیی کار (Business Administration)',
        nameEn: 'Business Administration (BBA)',
        category: 'business',
        categoryKu: 'کۆلێژێن کارگێڕی و ئابووری',
        branch: 'both',
        minScoreGeneral: 65.0,
        minScoreParallel: 62.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-briefcase',
        color: '#f59e0b',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی', 'زانکۆی پۆلیتەکنیکی دهۆک'],
        description: 'ستراتیژی بازرگانی، سەرکردایەتی، بەبازاڕکردن (Marketing) و سەرچاوە مرۆییەکان (HR).',
        careerFields: 'بەڕێوەبەری کۆمپانیا، بەشی سەرچاوە مرۆییەکان، کۆمپانیاکانی بەبازاڕکردن'
    },
    {
        id: 'bus_international',
        nameKu: 'پەیوەندییە نێودەوڵەتییەکان و زانستە سیاسییەکان',
        nameEn: 'International Relations & Diplomacy',
        category: 'business',
        categoryKu: 'کۆلێژێن زانستی سیاسی',
        branch: 'both',
        minScoreGeneral: 67.0,
        minScoreParallel: 63.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-globe-americas',
        color: '#6366f1',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'دیپلۆماسی، سیاسەتی دەرەوە، پەیوەندی نێوان دەوڵەتان و ڕێکخراوە جیهانییەکان.',
        careerFields: 'کونسوڵخانە، وەزارەتی دەرەوە، ڕێکخراوە ناحکومییەکان (NGO)، میدیا'
    },

    // 5. زمان، پەروەردە و ئاداب (Languages & Education)
    {
        id: 'lang_english',
        nameKu: 'زمانی ئینگلیزی (وەرگێڕان و ئەدەب)',
        nameEn: 'English Language & Translation',
        category: 'arts',
        categoryKu: 'کۆلێژێن زمان و پەروەردە',
        branch: 'both',
        minScoreGeneral: 75.0,
        minScoreParallel: 71.0,
        minScorePrivate: 58.0,
        durationYears: 4,
        icon: 'fa-language',
        color: '#ec4899',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'فێربوونی پرۆفیشناڵی زمانی ئینگلیزی، ئەدەب، زمانەوانی و تەکنیکەکانی وەرگێڕانی هاوکات.',
        careerFields: 'وەرگێڕی کۆمپانیا و ڕێکخراوەکان، مامۆستای زمانی ئینگلیزی، میدیا'
    },
    {
        id: 'edu_basic',
        nameKu: 'کۆلێژی پەروەردەی بنەڕەت',
        nameEn: 'College of Basic Education',
        category: 'arts',
        categoryKu: 'کۆلێژێن پەروەردە',
        branch: 'both',
        minScoreGeneral: 70.0,
        minScoreParallel: 66.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-chalkboard-teacher',
        color: '#14b8a6',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'پەروەردەکردن و ئامادەکردنی مامۆستایانی پسپۆڕ بۆ فێرکردنی قۆناغەکانی بنەڕەتی.',
        careerFields: 'مامۆستای قوتابخانە حکومی و ئەهلییەکان، بەڕێوەبەرایەتی پەروەردە'
    },
    {
        id: 'lang_kurdish',
        nameKu: 'زمان و ئەدەبی کوردی',
        nameEn: 'Kurdish Language & Literature',
        category: 'arts',
        categoryKu: 'کۆلێژێن زمان و ئاداب',
        branch: 'both',
        minScoreGeneral: 64.0,
        minScoreParallel: 60.0,
        minScorePrivate: 50.0,
        durationYears: 4,
        icon: 'fa-feather-alt',
        color: '#f97316',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'ڕێزمان، ئەدەب، فۆلکلۆر و زمانەوانی کوردی (کرمانجی و سۆرانی).',
        careerFields: 'مامۆستایی، دامەزراوە ڕۆشنبیرییەکان، دەزگاکانی چاپ و بڵاوکردنەوە'
    },
    {
        id: 'lang_arabic',
        nameKu: 'زمان و ئەدەبی عەرەبی',
        nameEn: 'Arabic Language & Literature',
        category: 'arts',
        categoryKu: 'کۆلێژێن زمان و ئاداب',
        branch: 'both',
        minScoreGeneral: 64.0,
        minScoreParallel: 60.0,
        minScorePrivate: 50.0,
        durationYears: 4,
        icon: 'fa-book-open',
        color: '#0284c7',
        universities: ['زانکۆی دهۆک', 'زانکۆی زاخۆ', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'زانستی بەلاغە، ڕێزمان، زمانەوانی و مێژووی ئەدەبی عەرەبی.',
        careerFields: 'مامۆستای زمانی عەرەبی، وەرگێڕان، ناوەندە ئەکادیمییەکان'
    },
    {
        id: 'arts_media',
        nameKu: 'ڕاگەیاندن و ڕۆژنامەوانی (Media)',
        nameEn: 'Media & Digital Journalism',
        category: 'arts',
        categoryKu: 'کۆلێژێن ئاداب و ڕاگەیاندن',
        branch: 'both',
        minScoreGeneral: 65.0,
        minScoreParallel: 61.0,
        minScorePrivate: 55.0,
        durationYears: 4,
        icon: 'fa-video',
        color: '#d946ef',
        universities: ['زانکۆی دهۆک', 'زانکۆی سەلاحەدین', 'زانکۆی سلێمانی'],
        description: 'میدیای دیجیتاڵ، کاری ڕۆژنامەوانی، بەرهەمهێنانی تەلەفزیۆنی و پێوەندییە گشتییەکان.',
        careerFields: 'کەناڵەکانی تەلەفزیۆن، دەزگاکانی هەواڵ، بەشی ڕاگەیاندنی کۆمپانیا و وەزارەتەکان'
    },

    // 6. پەیمانگە تەکنیکییەکان و پۆلیتەکنیک (Polytechnic & Technical Institutes)
    {
        id: 'inst_medical_tech',
        nameKu: 'پەیمانگەی تەکنیکی - تاقیگەی پزیشکی',
        nameEn: 'Technical Institute - Medical Lab',
        category: 'polytechnic',
        categoryKu: 'پەیمانگە تەکنیکییەکان',
        branch: 'scientific',
        minScoreGeneral: 78.0,
        minScoreParallel: 74.0,
        minScorePrivate: 58.0,
        durationYears: 2,
        icon: 'fa-vial',
        color: '#059669',
        universities: ['زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی پۆلیتەکنیکی هەولێر', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'خوێندنی کرداری بۆ فێربوونی تەکنیک و ئامێرەکانی پشکنینی تاقیگەیی لە ماوەی ٢ ساڵدا.',
        careerFields: 'یاریدەدەری تاقیگە لە نەخۆشخانە و تاقیگە تەندروستییەکان'
    },
    {
        id: 'inst_it',
        nameKu: 'پەیمانگەی تەکنیکی - تەکنەلۆژیای زانیاری (IT)',
        nameEn: 'Technical Institute - Information Technology',
        category: 'polytechnic',
        categoryKu: 'پەیمانگە تەکنیکییەکان',
        branch: 'both',
        minScoreGeneral: 66.0,
        minScoreParallel: 62.0,
        minScorePrivate: 55.0,
        durationYears: 2,
        icon: 'fa-desktop',
        color: '#2563eb',
        universities: ['زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی پۆلیتەکنیکی هەولێر', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'چاودێریکردنی تۆڕ، چاککردنەوەی کۆمپیوتەر و ئەپلیکەیشنە پراکتیکییەکان لە ماوەی ٢ ساڵدا.',
        careerFields: 'پشتیوانی تەکنیکی (IT Support)، بەڕێوەبەری تۆڕ لە کۆمپانیاکان'
    },
    {
        id: 'inst_petroleum',
        nameKu: 'پەیمانگەی تەکنیکی - تەکنەلۆژیای نەوت و وزە',
        nameEn: 'Technical Institute - Petroleum Technology',
        category: 'polytechnic',
        categoryKu: 'پەیمانگە تەکنیکییەکان',
        branch: 'scientific',
        minScoreGeneral: 67.0,
        minScoreParallel: 63.0,
        minScorePrivate: 55.0,
        durationYears: 2,
        icon: 'fa-gas-pump',
        color: '#d97706',
        universities: ['زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی پۆلیتەکنیکی هەولێر', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'تەکنیکی کرداری کێڵگە نەوتییەکان، کارپێکردنی پاڵاوگە و ئامێرە نەوتییەکان.',
        careerFields: 'تەکنیکاری نەوت لە کێڵگە نەوتییەکان و کۆمپانیاکانی وزە'
    },
    {
        id: 'inst_admin',
        nameKu: 'پەیمانگەی تەکنیکی - ژمێریاری و کارگێڕی',
        nameEn: 'Technical Institute - Accounting & Admin',
        category: 'polytechnic',
        categoryKu: 'پەیمانگە تەکنیکییەکان',
        branch: 'both',
        minScoreGeneral: 60.0,
        minScoreParallel: 57.0,
        minScorePrivate: 50.0,
        durationYears: 2,
        icon: 'fa-clipboard-list',
        color: '#4b5563',
        universities: ['زانکۆی پۆلیتەکنیکی دهۆک', 'زانکۆی پۆلیتەکنیکی هەولێر', 'زانکۆی پۆلیتەکنیکی سلێمانی'],
        description: 'کارگێڕیی نووسینگە، ژمێریاری بازرگانی و بەڕێوەبردنی بەڵگەنامەکان.',
        careerFields: 'کارمەندی ئیداری و ژمێریاری لە کەرتی تایبەت و حکومی'
    }
];

// Language configurations mapping
const SUPPORTED_LANGS = {
    ku_ba: { id: 'ku_ba', name: 'باهدینی', flag: 'badge-ba' },
    ku_so: { id: 'ku_so', name: 'سۆرانی', flag: 'badge-so' },
    ar: { id: 'ar', name: 'عەرەبی', flag: 'badge-ar' },
    en: { id: 'en', name: 'ئینگلیزی', flag: 'badge-en' }
};

// =========================================================================
// CURRICULUM SUBJECTS (وەک کیمیا، فیزیا، زیندەوەر، بیرکاری، عەرەبی، کوردی، ئاین، ئینگلێزی، کۆمپیوتەر)
// =========================================================================
const CURRICULUM_SUBJECTS = [
    {
        id: 'chem',
        name: 'کیمیا',
        nameEn: 'Chemistry',
        nameAr: 'الكيمياء',
        icon: 'fa-flask',
        color: '#00b4d8',
        gradient: 'linear-gradient(135deg, #0077b6, #00b4d8)',
        keywords: ['کیمیا', 'chemistry', 'كيمياء', 'کیمیا (chemistry)', 'chem'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'phys',
        name: 'فیزیا',
        nameEn: 'Physics',
        nameAr: 'الفيزياء',
        icon: 'fa-atom',
        color: '#7209b7',
        gradient: 'linear-gradient(135deg, #560bad, #b5179e)',
        keywords: ['فیزیا', 'physics', 'فيزياء', 'فیزیا (physics)', 'phys'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'bio',
        name: 'زیندەوەر',
        nameEn: 'Biology',
        nameAr: 'الأحياء',
        icon: 'fa-dna',
        color: '#2a9d8f',
        gradient: 'linear-gradient(135deg, #264653, #2a9d8f)',
        keywords: ['زیندەوەر', 'زیندەوەرزانی', 'biology', 'أحياء', 'احياء', 'bio'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'math',
        name: 'بیرکاری',
        nameEn: 'Mathematics',
        nameAr: 'الرياضيات',
        icon: 'fa-calculator',
        color: '#f77f00',
        gradient: 'linear-gradient(135deg, #d62828, #f77f00)',
        keywords: ['بیرکاری', 'mathematics', 'math', 'رياضيات', 'بيركاري'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'ar',
        name: 'عەرەبی',
        nameEn: 'Arabic Language',
        nameAr: 'اللغة العربية',
        icon: 'fa-book-open',
        color: '#023e8a',
        gradient: 'linear-gradient(135deg, #03045e, #0077b6)',
        keywords: ['عەرەبی', 'عربی', 'arabic', 'عربية', 'اللغة العربية'],
        grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'ku',
        name: 'کوردی',
        nameEn: 'Kurdish Language',
        nameAr: 'اللغة الكردية',
        icon: 'fa-feather-alt',
        color: '#e63946',
        gradient: 'linear-gradient(135deg, #b5179e, #e63946)',
        keywords: ['کوردی', 'زمانی کوردی', 'kurdish', 'کوردی (kurdish)', 'الكردية'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'islam',
        name: 'ئاین',
        nameEn: 'Islamic Education',
        nameAr: 'التربية الإسلامية',
        icon: 'fa-quran',
        color: '#1b4332',
        gradient: 'linear-gradient(135deg, #2d6a4f, #52b788)',
        keywords: ['ئاین', 'ئیسلامی', 'پەروەردەی ئیسلامی', 'islamic', 'دين', 'التربية الإسلامية', 'اسلامی'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'en',
        name: 'ئینگلێزی',
        nameEn: 'English Language',
        nameAr: 'اللغة الإنجليزية',
        icon: 'fa-globe',
        color: '#4361ee',
        gradient: 'linear-gradient(135deg, #3f37c9, #4895ef)',
        keywords: ['ئینگلێزی', 'ئینگلیزی', 'english', 'english sunrise', 'إنجليزية', 'انجليزية'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'comp',
        name: 'کۆمپیوتەر',
        nameEn: 'Computer Science',
        nameAr: 'الحاسوب والبرمجة',
        icon: 'fa-laptop-code',
        color: '#3a0ca3',
        gradient: 'linear-gradient(135deg, #3a0ca3, #4cc9f0)',
        keywords: ['کۆمپیوتەر', 'کومپیوتەر', 'computer', 'حاسوب', 'it', 'تەکنەلۆژیا', 'برمجة'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'sci',
        name: 'زانست',
        nameEn: 'General Science',
        nameAr: 'العلوم العامة',
        icon: 'fa-microscope',
        color: '#38b000',
        gradient: 'linear-gradient(135deg, #007200, #70e000)',
        keywords: ['زانست', 'science', 'علوم', 'العلوم العامة'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    },
    {
        id: 'social',
        name: 'کۆمەڵایەتی',
        nameEn: 'Social Studies',
        nameAr: 'الاجتماعيات',
        icon: 'fa-landmark',
        color: '#bc6c25',
        gradient: 'linear-gradient(135deg, #dda15e, #bc6c25)',
        keywords: ['کۆمەڵایەتی', 'مێژوو', 'جوگرافیا', 'social', 'اجتماعيات', 'تاريخ', 'جغرافيا'],
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12']
    }
];

// Initial pre-seeded teachers categorized by language & subjects
const DEFAULT_TEACHERS = [
    // --- BAHDINI TEACHERS (ku_ba) ---
    {
        id: 't_hussein',
        name: 'م. حسێن ئەکرەم زێباری',
        subject: 'کیمیا (Chemistry)',
        email: 'Hussein.zebary.chemistry96@gmail.com',
        phone: '0750 000 0000',
        bio: 'مامۆستایێ شارەزا یێ بابەتا کیمیایێ بۆ قۆناغێن ئامادەیی و بنەڕەتی ب شێوەزاری باهدینی',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        viewsCount: 4250,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000000000
    },
    {
        id: 't_sidad',
        name: 'م. سياد عبدالقادر',
        subject: 'کیمیا (Chemistry)',
        email: 'sidad.chemistry@gmail.com',
        phone: '0750 111 2233',
        bio: 'مامۆستایێ بابەتا کیمیایێ بۆ پۆلێن ١٠، ١١، ١٢ ب زمانی کوردی (باهدینی)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3510,
        grades: ['10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000001000
    },
    {
        id: 't_dilshad',
        name: 'م. دلشاد احمد بارزانی',
        subject: 'بیرکاری (Mathematics)',
        email: 'dilshad.math@gmail.com',
        phone: '0750 333 4455',
        bio: 'مامۆستایێ بیرکاریێ بۆ قۆناغا ئامادەیی و بنەڕەتی ب شێوەزاری باهدینی',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2840,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002000
    },
    {
        id: 't_newzad_phys',
        name: 'م. نەوزاد بێکەس دهۆکی',
        subject: 'فیزیا (Physics)',
        email: 'newzad.physics@gmail.com',
        phone: '0750 222 9988',
        bio: 'مامۆستایێ فیزیا بۆ پۆلێن ئامادەیی، ڕوونکردنەوەیا یاسایێن جوولە و کارەبا ب باهدینی',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3100,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002100
    },
    {
        id: 't_dilvin_bio',
        name: 'م. دڵڤین شێروانی',
        subject: 'زیندەوەر (Biology)',
        email: 'dilvin.biology@gmail.com',
        phone: '0750 444 1122',
        bio: 'مامۆستایا زیندەوەرزانی و زانست بۆ پۆلێن ئامادەیی ب شێوازەکێ ئەکادیمی',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2950,
        grades: ['10', '11', '12', '9', '8'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002200
    },
    {
        id: 't_rebwar_ku',
        name: 'م. ڕێبوار ئامێدی',
        subject: 'کوردی (Kurdish)',
        email: 'rebwar.kurdish@gmail.com',
        phone: '0750 777 3344',
        bio: 'مامۆستایێ ئەدەب و ڕێزمانی کوردی بۆ پۆلێن ١٠، ١١، ١٢',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2750,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002300
    },
    {
        id: 't_salah_ar',
        name: 'م. سەڵاحەدین دهۆکی',
        subject: 'عەرەبی (Arabic)',
        email: 'salah.arabic@gmail.com',
        phone: '0750 888 5566',
        bio: 'مامۆستایێ زمانی عەرەبی (قواعد، نصوص، بلاغة) بۆ پۆلێن ئامادەیی',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2600,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002400
    },
    {
        id: 't_mala_ahmad',
        name: 'مامۆستا مەلا ئەحمەد زێباری',
        subject: 'ئاین (Islamic Education)',
        email: 'mala.ahmad@gmail.com',
        phone: '0750 999 1100',
        bio: 'مامۆستایێ پەروەردەیا ئیسلامی و تەفسیر و ئەحکام بۆ قۆناغێن خواندنێ',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2480,
        grades: ['10', '11', '12', '9', '8', '7'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002500
    },
    {
        id: 't_rebin_comp',
        name: 'م. ڕێبین ئاکرەیی',
        subject: 'کۆمپیوتەر (Computer Science)',
        email: 'rebin.computer@gmail.com',
        phone: '0750 555 4433',
        bio: 'مامۆستایێ کۆمپیوتەر و زانستی تەکنەلۆژیا بۆ قوتابیێن پۆلێن ٧ تا ١٢',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2310,
        grades: ['10', '11', '12', '9', '8', '7'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002600
    },
    {
        id: 't_hevi_ba',
        name: 'م. هێڤی زاخۆیی (English Sunrise)',
        subject: 'ئینگلێزی (English Language)',
        email: 'hevi.english@gmail.com',
        phone: '0750 444 5566',
        bio: 'ڕێزمانی ئینگلیزی و پرۆگرامی Sunrise بۆ پۆلێن ئامادەیی و بنەڕەتی',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3950,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002700
    },
    {
        id: 't_kawa_social',
        name: 'م. کاوە زێباری',
        subject: 'کۆمەڵایەتی (Social Studies)',
        email: 'kawa.social@gmail.com',
        phone: '0750 678 1234',
        bio: 'مامۆستایێ مێژوو و جوگرافیا و کۆمەڵایەتی بۆ قۆناغێن بنەڕەتی و ئامادەیی ب باهدینی',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2210,
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002800
    },

    // --- SORANI TEACHERS (ku_so) ---
    {
        id: 't_aras',
        name: 'م. ئاراس کەرکووکی',
        subject: 'فیزیا (Physics)',
        email: 'aras.physics@gmail.com',
        phone: '0750 555 6677',
        bio: 'مامۆستای فیزیای پۆلەکانی ١٠، ١١، ١٢ بە شێوەزاری سۆرانی پاراو',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3890,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000004000
    },
    {
        id: 't_karwan',
        name: 'م. کاروان سلێمانی',
        subject: 'کیمیا (Chemistry)',
        email: 'karwan.chem@gmail.com',
        phone: '0770 123 4567',
        bio: 'مامۆستای کیمیای پۆلی ١٢ ی ئامادەیی و شیکاری پرسیارە وزارییەکان بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3120,
        grades: ['10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000005000
    },
    {
        id: 't_sozan',
        name: 'م. سۆزان مەحمود',
        subject: 'زیندەوەر (Biology)',
        email: 'sozan.bio@gmail.com',
        phone: '0750 666 7788',
        bio: 'مامۆستای زیندەوەرزانی و زانست بۆ پۆلەکانی بنەڕەتی و ئامادەیی بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2680,
        grades: ['5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006000
    },
    {
        id: 't_bryar_math',
        name: 'م. بڕیار عەلی چەمچەماڵی',
        subject: 'بیرکاری (Mathematics)',
        email: 'bryar.math@gmail.com',
        phone: '0770 555 1122',
        bio: 'مامۆستای بیرکاری پۆلی ١٢ ی زانستی و وێژەیی بە شێوازی سەردەمیانە',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2980,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006100
    },
    {
        id: 't_pakhshan_ku',
        name: 'م. پەخشان شێخانی',
        subject: 'کوردی (Kurdish)',
        email: 'pakhshan.kurdish@gmail.com',
        phone: '0750 333 8899',
        bio: 'مامۆستای زمانی کوردی و ئەدەبیاتی کوردی پۆلەکانی دواناوەندی بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2450,
        grades: ['10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006200
    },
    {
        id: 't_shaho_comp',
        name: 'م. شاهۆ ئەحمەد هەڵەبجەیی',
        subject: 'کۆمپیوتەر (Computer Science)',
        email: 'shaho.comp@gmail.com',
        phone: '0770 999 4433',
        bio: 'مامۆستای زانستی کۆمپیوتەر و پڕۆگرامسازی بۆ پۆلەکانی ٧ بۆ ١٢ بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2120,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006300
    },
    {
        id: 't_ahmad_islam',
        name: 'م. مەلا کامەران سلێمانی',
        subject: 'ئاین (Islamic Education)',
        email: 'kameran.islam@gmail.com',
        phone: '0770 333 8811',
        bio: 'مامۆستای پەروەردەی ئیسلامی و تەفسیری قورئان بە زمانی کوردی سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2350,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006400
    },
    {
        id: 't_rebaz_social',
        name: 'م. ڕێباز گەرمیانی',
        subject: 'کۆمەڵایەتی (Social Studies)',
        email: 'rebaz.social@gmail.com',
        phone: '0770 444 9900',
        bio: 'مامۆستای کۆمەڵایەتی، مێژوو و جوگرافیای کوردستان و جیهان بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2190,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006500
    },
    {
        id: 't_tara_en',
        name: 'م. تارا عەزیز',
        subject: 'ئینگلێزی (English Language)',
        email: 'tara.english@gmail.com',
        phone: '0770 666 2233',
        bio: 'مامۆستای زمانی ئینگلیزی پرۆگرامی Sunrise بە شێوازی تێگەیشتنی خێرا',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2840,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006600
    },
    {
        id: 't_dara_ar',
        name: 'م. دارا مەحوی',
        subject: 'عەرەبی (Arabic)',
        email: 'dara.arabic@gmail.com',
        phone: '0770 888 1122',
        bio: 'مامۆستای زمانی عەرەبی (قواعد و ڕێزمان و خوێندنەوە) بۆ قۆناغی دواناوەندی',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2510,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006700
    },

    // --- ARABIC TEACHERS (ar) ---
    {
        id: 't_ahmed',
        name: 'د. أحمد خالد العبيدي',
        subject: 'الكيمياء (Chemistry)',
        email: 'ahmed.chem.ar@gmail.com',
        phone: '0770 987 6543',
        bio: 'مدرس مادة الكيمياء للمراحل الثانوية والإعدادية باللغة العربية مع حلول الأسئلة الوزارية',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3340,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000007000
    },
    {
        id: 't_omar',
        name: 'أ. عمر فاضل السامرائي',
        subject: 'الفيزياء (Physics)',
        email: 'omar.math.ar@gmail.com',
        phone: '0780 112 2334',
        bio: 'شروحات مبسطة لمنهاج الفيزياء للمراحل الإعدادية والثانوية باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2540,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008000
    },
    {
        id: 't_tariq_math',
        name: 'أ. طارق التميمي',
        subject: 'الرياضيات (Mathematics)',
        email: 'tariq.math@gmail.com',
        phone: '0780 334 5566',
        bio: 'مدرس الرياضيات المتقدمة للصف الثاني عشر والشهادة الوزارية',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2890,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008100
    },
    {
        id: 't_marwan_bio',
        name: 'أ. مروان الحديثي',
        subject: 'الأحياء (Biology)',
        email: 'marwan.bio@gmail.com',
        phone: '0770 445 6677',
        bio: 'مدرس علم الأحياء والوراثة للمرحلة الإعدادية والوزارية',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2620,
        grades: ['10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008200
    },
    {
        id: 't_haider_comp',
        name: 'أ. حيدر التقني',
        subject: 'الحاسوب والبرمجة (Computer)',
        email: 'haider.comp@gmail.com',
        phone: '0780 778 9900',
        bio: 'مدرس مادة الحاسوب ونظم المعلومات والبرمجة باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2190,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008300
    },
    {
        id: 't_zeid_islam',
        name: 'الشيخ زيد الدليمي',
        subject: 'التربية الإسلامية (Islamic)',
        email: 'zeid.islam@gmail.com',
        phone: '0780 223 3445',
        bio: 'مدرس التربية الإسلامية وأحكام التلاوة للمرحلة المتوسطة والإعدادية',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2410,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008400
    },
    {
        id: 't_samira_en',
        name: 'أ. سميرة البغدادي',
        subject: 'اللغة الإنجليزية (English)',
        email: 'samira.english@gmail.com',
        phone: '0770 119 8877',
        bio: 'مدرسة اللغة الإنجليزية وقواعد اللغة للمراحل الوزارية',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2780,
        grades: ['10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008500
    },
    {
        id: 't_falah_social',
        name: 'أ. فلاح الشمري',
        subject: 'الاجتماعيات (Social Studies)',
        email: 'falah.social@gmail.com',
        phone: '0780 998 7766',
        bio: 'مدرس مواد التاريخ والجغرافيا والتربية الوطنية باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2130,
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008600
    },

    // --- ENGLISH TEACHERS (en) ---
    {
        id: 't_hevi',
        name: 'م. هێڤی زاخۆیی (English Sunrise)',
        subject: 'English Language',
        email: 'hevi.english@gmail.com',
        phone: '0750 444 5566',
        bio: 'English Sunrise curriculum instructor for all primary and secondary grades in English',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3950,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000003000
    },
    {
        id: 't_david',
        name: 'Mr. David Miller',
        subject: 'Chemistry',
        email: 'david.science@gmail.com',
        phone: '0750 999 8877',
        bio: 'Certified International Science & Chemistry Teacher for High School Curriculum in English',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2280,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009000
    },
    {
        id: 't_john_phys',
        name: 'Mr. John Edwards',
        subject: 'Physics',
        email: 'john.physics@gmail.com',
        phone: '0750 123 7890',
        bio: 'Senior Physics educator covering mechanics, electromagnetism and modern physics in English',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2420,
        grades: ['10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009100
    },
    {
        id: 't_alex_comp',
        name: 'Mr. Alex Cooper',
        subject: 'Computer Science',
        email: 'alex.computer@gmail.com',
        phone: '0750 456 1234',
        bio: 'Computer Science & Software Engineering Instructor for Secondary and High School levels',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2150,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009200
    },
    {
        id: 't_sarah_bio',
        name: 'Dr. Sarah Jenkins',
        subject: 'Biology',
        email: 'sarah.biology@gmail.com',
        phone: '0750 678 4321',
        bio: 'Doctorate in Molecular Biology, lecturing 12th Grade Advanced Biology in English',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2340,
        grades: ['10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009300
    },
    {
        id: 't_robert_math',
        name: 'Prof. Robert Vance',
        subject: 'Mathematics',
        email: 'robert.math@gmail.com',
        phone: '0750 890 1234',
        bio: 'Calculus, Trigonometry and Algebra educator for Cambridge and National curricula',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2610,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009400
    }
];

// Initial Videos with Subject & Language property
const DEFAULT_VIDEOS = [
    // Badini - Chemistry
    {
        id: 'v_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: تێکڕای کارلێکێن کیمیایی',
        title: 'وانا ١: دەستپێک لسەر بەندی ئێکێ و خێراییا کارلێکی',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1650,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700001000000
    },
    {
        id: 'v_102',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: ترش و تفت',
        title: 'شیکارکرنا پسیارێن وزاری یێن ترش و تەفتان ب کوردی باهدینی',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1240,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700002000000
    },
    // Badini - Math
    {
        id: 'v_103',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: نەخشە و وێنەکرن',
        title: 'شیکارییا نەخشەیێن بنەڕەتی و چەمان بۆ پۆلا دوازدێ',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 920,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003000000
    },
    // Badini - Physics
    {
        id: 'v_104',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: تەزوویێ کارەبایی و موگناتیسی',
        title: 'وانا فیزیا پۆلا دوازدێ: یاسایێن کیرشۆف و ئەپڵیکەیشنێن کارەبا',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1180,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003100000
    },
    // Badini - Biology
    {
        id: 'v_105',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: مایتۆسیس و مایۆسیس و کەرتبوونا خانێ',
        title: 'وانا زیندەوەر پۆلا دوازدێ: دابەشبوونا خانەیان و پەیڕەوا DNA',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1040,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003200000
    },
    // Badini - Kurdish
    {
        id: 'v_106',
        teacherId: 't_rebwar_ku',
        teacherName: 'م. ڕێبوار ئامێدی',
        grade: '12',
        subject: 'کوردی',
        chapter: 'بەندی ١: ئەدەبیاتی کوردی و شاعیرێن کلاسیک',
        title: 'وانا ئەدەبێ کوردی: مەلایێ جزیری و شێوازی هۆنراوەیا کلاسیک',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 890,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003300000
    },
    // Badini - Arabic
    {
        id: 'v_107',
        teacherId: 't_salah_ar',
        teacherName: 'م. سەڵاحەدین دهۆکی',
        grade: '12',
        subject: 'عەرەبی',
        chapter: 'بەندی ١: اسلوب الاستفهام والاعراب',
        title: 'شیکاری یاسایێن اعرابا ناڤێن پرسیارێ ب شێوازەکێ زۆر ساناهی',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 940,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003400000
    },
    // Badini - Religion / Islam
    {
        id: 'v_108',
        teacherId: 't_mala_ahmad',
        teacherName: 'مامۆستا مەلا ئەحمەد زێباری',
        grade: '12',
        subject: 'ئاین',
        chapter: 'بەندی ١: عەقیدە و باوەرییا ئیسلامی',
        title: 'وانا پەروەردەیا ئیسلامی: ڕەوشت و مامەلە د قورئانا پیرۆز دا',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1120,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003500000
    },
    // Badini - Computer
    {
        id: 'v_109',
        teacherId: 't_rebin_comp',
        teacherName: 'م. ڕێبین ئاکرەیی',
        grade: '12',
        subject: 'کۆمپیوتەر',
        chapter: 'بەندی ١: داتابەیس و مایکرۆسۆفت ئەکسێس',
        title: 'وانا کۆمپیوتەرێ پۆلا دوازدێ: چێکرنا خشتە و پەیوەندییێن Database',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 870,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003600000
    },
    // Badini - English
    {
        id: 'v_110',
        teacherId: 't_hevi_ba',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'ئینگلێزی',
        chapter: 'Unit 1: Passive Voice & Conditionals',
        title: 'وانا ئینگلیزی پۆلا ١٢: یاسایێن ڕێزمانی و شیکاریا پرسیارێن وزاری',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1540,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003700000
    },

    // Sorani
    {
        id: 'v_201',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزی کارەبایی و بواری کارەبا',
        title: 'وانەی یەکەم: یاسای کۆڵۆم و پۆتەنشیاڵی کارەبایی (سۆرانی)',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1820,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700004000000
    },
    {
        id: 'v_202',
        teacherId: 't_karwan',
        teacherName: 'م. کاروان سلێمانی',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٢: هاوسەنگی کیمیایی',
        title: 'وانەی دووەم: بنەمای لۆشاتلییە و شیکاری پرسیاری وزاری پۆلی ١٢',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1490,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005000000
    },
    {
        id: 'v_203',
        teacherId: 't_bryar_math',
        teacherName: 'م. بڕیار عەلی چەمچەماڵی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: تەواوکاری و داتاشین',
        title: 'شیکاری پرسیاری وزاری تەواوکاری و داتاشینی پۆلی ١٢ بە سۆرانی',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1380,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005100000
    },
    {
        id: 'v_204',
        teacherId: 't_sozan',
        teacherName: 'م. سۆزان مەحمود',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ١: خانە و هەناسەدانی خانەیی',
        title: 'وانەی زیندەوەرزانی پۆلی دوازدەهەمی زانستی بە سۆرانی پاراو',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1250,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005200000
    },

    // Arabic
    {
        id: 'v_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'الفصل الأول: سرعة التفاعل والاتزان الكيميائي',
        title: 'الدرس الأول: مفهوم سرعة التفاعل والعوامل المؤثرة (شرح عربي)',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1350,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006000000
    },
    {
        id: 'v_302',
        teacherId: 't_omar',
        teacherName: 'أ. عمر فاضل السامرائي',
        grade: '12',
        subject: 'الفيزياء',
        chapter: 'الفصل الأول: المتسعات والدوائر الكهربائية',
        title: 'شرح شامل لقوانين ربط المتسعات على التوالي والتوازي للمرحلة الإعدادية',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1290,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006100000
    },
    {
        id: 'v_303',
        teacherId: 't_tariq_math',
        teacherName: 'أ. طارق التميمي',
        grade: '12',
        subject: 'الرياضيات',
        chapter: 'الفصل الثالث: تطبيقات التفاضل والتكامل',
        title: 'حل المسائل الوزارية لمادة الرياضيات للصف الثاني عشر العلمي',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1410,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006200000
    },

    // English
    {
        id: 'v_401',
        teacherId: 't_hevi',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'English',
        chapter: 'Unit 1: Language and Communication',
        title: 'Grade 12 English Sunrise: Grammar Mastery & Reading Passages',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1980,
        lang: 'en',
        status: 'approved',
        createdAt: 1700007000000
    },
    {
        id: 'v_402',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chapter 1: Chemical Kinetics',
        title: 'Reaction Rates, Collision Theory & Activation Energy in English',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1110,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008000000
    },
    {
        id: 'v_403',
        teacherId: 't_john_phys',
        teacherName: 'Mr. John Edwards',
        grade: '12',
        subject: 'Physics',
        chapter: 'Unit 2: Electromagnetic Fields',
        title: 'Electric Potential, Gauss Law and Capacitance Step-by-Step Tutorial',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1220,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008100000
    },
    {
        id: 'v_404',
        teacherId: 't_alex_comp',
        teacherName: 'Mr. Alex Cooper',
        grade: '12',
        subject: 'Computer Science',
        chapter: 'Module 1: Relational Database Systems',
        title: 'SQL Fundamentals, Relational Architecture and Database Normalization',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 990,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008200000
    }
];

// Initial Quizzes with Subject & Language property
const DEFAULT_QUIZZES = [
    // Badini - Chemistry
    {
        id: 'q_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: تێکڕای کارلێک',
        question: 'ئەگەر پلەیا گەرمییێ زێدە ببیتن، تێکڕایێ کارلێکی چ لێ دهێت؟',
        options: ['زێدە دبیت', 'کێم دبیت', 'ناگوهۆڕیت', 'سفر دبیت'],
        correctIndex: 0,
        explanation: 'زێدەبوونا پلەیا گەرمیێ وزەیا جوولێ یا گەردان زێدە دکەت و بەریەککەفتنێن باندۆر پتر لێ دکەت.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700010000000
    },
    {
        id: 'q_102',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: ترش و تفت',
        question: 'بهایێ pH بۆ گیراوەیەکێ دەولەمەند ب ترش چەندە؟',
        options: ['ژ ٧ کێمترە', 'ژ ٧ پترە', 'ڕێک ٧ یە', '١٤ یە'],
        correctIndex: 0,
        explanation: 'گیراوەیێن ترش بهایێ وان یێ pH کێمترە ژ ٧.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011000000
    },
    // Badini - Physics
    {
        id: 'q_103',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزا کارەبا',
        question: 'یەکەی پێڤانا بەرگرییا کارەبایی د سیستەمێ نێڤدەولەتی دا چییە؟',
        options: ['ئۆم (Ω)', 'ڤۆڵت (V)', 'ئەمپێر (A)', 'تێسلا (T)'],
        correctIndex: 0,
        explanation: 'بەرگرییا کارەبایی ب یەکا ئۆم (Ohm) دهێتە پێڤان ل دوویف یاسایا ئۆمی R = V / I.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011100000
    },
    // Badini - Math
    {
        id: 'q_104',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: داتاشین',
        question: 'داتاشراوا نەخشەیا f(x) = x³ چەندە؟',
        options: ['3x²', 'x²', '3x', '3'],
        correctIndex: 0,
        explanation: 'ل دوویف یاسایا داتاشینا هێزێ: d/dx(xⁿ) = n·xⁿ⁻¹، ئانکو 3x².',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011200000
    },
    // Badini - Biology
    {
        id: 'q_105',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: زیندەوەرزانییا خانەیی',
        question: 'کیش بەشێ خانێ بەرپرسە ژ بەرهەمهێنانا وزەیێ (ATP)؟',
        options: ['مایتۆکۆندریا', 'ناوک (ناڤک)', 'دەزگای گۆڵجی', 'ڕایبۆسۆم'],
        correctIndex: 0,
        explanation: 'مایتۆکۆندریا کارگەی وزەیێ یە د خانێ دا ب ڕێکا کرداری هەناسەدانا خانەیی.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011300000
    },
    // Badini - Computer
    {
        id: 'q_106',
        teacherId: 't_rebin_comp',
        teacherName: 'م. ڕێبین ئاکرەیی',
        grade: '12',
        subject: 'کۆمپیوتەر',
        chapter: 'بەندی ١: پایگەی دراوە (Database)',
        question: 'مفایێ سەرەکی یێ کلیلا سەرەکی (Primary Key) چییە د خشتەیێن داتابەیسێ دا؟',
        options: ['ڕێگری دکەت ژ دووبارەبوونا تۆماران و ناسنامەکا بێهاوتایە', 'تەنێ بۆ جوانکارییێ یە', 'داتایان ژناڤ دبەت', 'قەبارەی فایلێ کێم دکەت'],
        correctIndex: 0,
        explanation: 'Primary Key کلیلا سەرەکییە و ناکرێت دووبارە ببێتەوە یان بەتاڵ بێت.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011400000
    },

    // Sorani
    {
        id: 'q_201',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: بواری کارەبا',
        question: 'یەکەی پێوانی بواری کارەبایی (E) لە سیستەمی نێودەوڵەتیدا چییە؟',
        options: ['N/C (نیوتن/کۆڵۆم)', 'Joule (جووڵ)', 'Watt (وات)', 'Volt (ڤۆڵت)'],
        correctIndex: 0,
        explanation: 'بواری کارەبایی یەکسانە بە هێز بەسەر بارگە، کە دەکاتە N/C.',
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700012000000
    },

    // Arabic
    {
        id: 'q_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'الفصل الأول: الاتزان الكيميائي',
        question: 'ما هو تأثير إضافة العامل المساعد على موضع الاتزان الكيميائي؟',
        options: ['لا يؤثر على موضع الاتزان إطلاقاً', 'يزيح الاتزان نحو اليمين', 'يزيح الاتزان نحو اليسار', 'يغير قيمة ثابت الاتزان'],
        correctIndex: 0,
        explanation: 'العامل المساعد يزيد من سرعة التفاعلين الأمامي والخلفي بنفس النسبة فلا يؤثر على موضع الاتزان.',
        lang: 'ar',
        status: 'approved',
        createdAt: 1700013000000
    },

    // English
    {
        id: 'q_401',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chapter 1: Chemical Equilibrium',
        question: 'What is the effect of increasing temperature on an endothermic reaction at equilibrium?',
        options: ['Shifts equilibrium to products (right)', 'Shifts equilibrium to reactants (left)', 'Has no effect', 'Decreases rate of reaction'],
        correctIndex: 0,
        explanation: 'For endothermic reactions (absorbing heat), heat acts as a reactant; increasing it shifts equilibrium forward.',
        lang: 'en',
        status: 'approved',
        createdAt: 1700014000000
    }
];

// Initial Multi-Format Malzamas (PowerPoint, HTML, Image, PDF)
const DEFAULT_MALZAMAS = [
    // 1. PDF (Badini - Chemistry)
    {
        id: 'm_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'پوختەیا بەندی ئێکێ و دووێ',
        title: 'مەلزەما تێروتەسەل یا کیمیایا پۆلا ١٢ (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'kimiya_pola12_hussein.pdf',
        fileSize: '4.8 MB',
        description: 'کورتە و یاسایێن کیمیایا پۆلا دوازدێ ب شێوازی PDF یێ تێروتەسەل دگەل نموونەیێن وزاری.',
        views: 2150,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700020000000
    },
    // 2. PowerPoint (.pptx) (Badini - Chemistry)
    {
        id: 'm_102',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: سلاک و پرێزنتەیشن',
        title: 'سلايدێن پاوەرپوینت یێن تێکڕای کارلێکێن کیمیایی (PowerPoint PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'chem_reaction_rates_slides.pptx',
        fileSize: '3.4 MB',
        description: 'سلایدێن فەرمی یێن وانێ ب پاوەرپوینت بۆ مامۆستا و قوتابیان بۆ داتاشۆ و پیشاندانێ ب شێوەیەکێ ئەنیمەیشن.',
        views: 1890,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700021000000
    },
    // 3. HTML Interactive Document (Badini - Chemistry)
    {
        id: 'm_103',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: پوختەی ئینتەرئەکتیڤ',
        title: 'پوختە و جەدوەلی کارلێکێن کیمیایی (پەڕەی ئینتەرئەکتیڤ HTML)',
        fileType: 'html',
        fileUrl: '',
        htmlContent: `<!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:25px;background:#f8f9fa;color:#222;line-height:1.7;}h2{color:#007bff;border-bottom:2px solid #007bff;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ccc;padding:10px;text-align:right;}th{background:#007bff;color:#fff;}.highlight{background:#e7f1ff;padding:10px;border-radius:8px;font-weight:bold;margin:15px 0;}</style></head><body><h2>خشتەی ترش و تفتێن سەرەکی - پۆلا دوازدێ</h2><div class="highlight">💡 تێبینییا زێڕین: هێزا ترشێ پشت ب ڕادەیێ هەڵوەشینێ دەبەستیت، نە خەستییا گیراوەی.</div><table><tr><th>ترش یان تفت</th><th>جۆر</th><th>هاوکێشەی کارلێک</th><th>pH</th></tr><tr><td>ترشێ هایدرۆکلۆریک (HCl)</td><td>ترشێ بەهێز</td><td>HCl + H2O → H3O+ + Cl-</td><td>&lt; 2</td></tr><tr><td>ترشێ هایدرۆفلۆریک (HF)</td><td>ترشێ لاواز</td><td>HF + H2O ⇌ H3O+ + F-</td><td>3 - 5</td></tr><tr><td>هایدرۆکسیدی سۆدیۆم (NaOH)</td><td>تفتی بەهێز</td><td>NaOH → Na+ + OH-</td><td>&gt; 12</td></tr></table><p style="text-align:center;color:#666;font-size:0.85rem;">ئامادەکردنی: م. سياد عبدالقادر - وانەی کیمیای پۆلی ١٢</p></body></html>`,
        fileName: 'interactive_chemistry_guide.html',
        fileSize: '18 KB',
        description: 'پەڕەیەکی ڕێبەری هەمەلایەنە بە شێوازی HTML کە ڕاستەوخۆ دەتوانیت لەناو ماڵپەڕ بخوێنیتەوە و خشتەکانی کارلێک لێکبدەیتەوە.',
        views: 1420,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700022000000
    },
    // 4. Image Diagram / Summary (Badini - Chemistry)
    {
        id: 'm_104',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'وێنە و دیاگرامێن وزاری',
        title: 'وێنەیا ڕوون یێن هێلکاریا تیشک و پەیكەری گەردیلێ (Image)',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
        fileName: 'chemistry_orbital_diagram.jpg',
        fileSize: '1.2 MB',
        description: 'هێڵکاریی ورد و ڕوونکردنەوەی وێنەیی بۆ شێوازی پەیوەستبوونی گەردیلەکان و ئەلیکترۆنەکان بە کوالیتی بەرز.',
        views: 1670,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023000000
    },
    // 5. PowerPoint (.pptx) (Badini - Physics)
    {
        id: 'm_105',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزی کارەبایی',
        title: 'پرێزنتەیشنی پاوەرپوینت یاسایێن فیزیا پۆلا دوازدێ (PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'physics_grade12_slides.pptx',
        fileSize: '4.2 MB',
        description: 'سلایدێن تەواوی وانەیا فیزیا پۆلا دوازدێ دگەل هاوکێشە و یاسایان.',
        views: 1510,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023100000
    },
    // 6. PDF (Badini - Math)
    {
        id: 'm_106',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: نەخشە و داتاشین',
        title: 'مەلزەما بیرکاری پۆلا دوازدێ یا زانستی (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'math_grade12_dilshad.pdf',
        fileSize: '5.1 MB',
        description: 'پوختەی یاساکانی داتاشین و تەواوکاری و شیکاری تەواوی پرسیارە وزارییەکان.',
        views: 1820,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023200000
    },
    // 7. HTML Interactive (Badini - Biology)
    {
        id: 'm_107',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: ڕێبەری هێڵکاری خانە',
        title: 'ڕێبەری ئینتەرئەکتیڤی خانەی زیندەوەر و شیکاری DNA (HTML)',
        fileType: 'html',
        fileUrl: '',
        htmlContent: `<!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:25px;background:#f4f9f4;color:#222;line-height:1.7;}h2{color:#2a9d8f;border-bottom:2px solid #2a9d8f;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ccc;padding:10px;text-align:right;}th{background:#2a9d8f;color:#fff;}.box{background:#e8f5e9;padding:12px;border-radius:8px;font-weight:bold;margin:15px 0;}</style></head><body><h2>بەراوردکردنی خانەی رووەکی و گیانەوەری</h2><div class="box">🧬 تایبەتمەندی دیواری خانە تەنها لە خانەی رووەکیدا هەیە و لە ڕەقبوونی سلۆلۆز پێکهاتووە.</div><table><tr><th>بەشێ خانێ</th><th>خانەی گیانەوەری</th><th>خانەی رووەکی</th></tr><tr><td>دیواری خانە</td><td>نییە</td><td>هەیە (سلۆلۆز)</td></tr><tr><td>کلۆرۆپلاست</td><td>نییە</td><td>هەیە (بۆ رۆشنەپێکهاتن)</td></tr><tr><td>مایتۆکۆندریا</td><td>هەیە</td><td>هەیە</td></tr></table><p style="text-align:center;color:#666;">ئامادەکردنی: م. دڵڤین شێروانی</p></body></html>`,
        fileName: 'biology_cell_interactive.html',
        fileSize: '15 KB',
        description: 'پەڕەیەکی خوێندنەوەی بەراوردکاری خانە بۆ پۆلی ١٢ بە شێوەی ئینتەرئەکتیڤ.',
        views: 1390,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023300000
    },

    // Sorani Malzamas
    {
        id: 'm_201',
        teacherId: 't_karwan',
        teacherName: 'م. کاروان سلێمانی',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'پوختەی کیمیای پۆلی ١٢',
        title: 'کورتکراوە و یاساکانی کیمیای وزاری پۆلی ١٢ (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'kimiya_sorani_pola12.pdf',
        fileSize: '5.2 MB',
        description: 'کورتەی سەرجەم بەندەکانی کیمیای دواناوەندی بە سۆرانی پاراو بە شێوازی PDF.',
        views: 1940,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700024000000
    },
    {
        id: 'm_202',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'سلایدەکانی فیزیا',
        title: 'سلايدەکانی پاوەرپۆینتی فیزیای وزاری (PowerPoint PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'physics_slides_sorani.pptx',
        fileSize: '4.1 MB',
        description: 'سلایدی تایبەت بە مامۆستایان و قوتابیان بۆ پیشاندانی یاساکانی فیزیا بە شێوەی پرێزنتەیشن.',
        views: 1610,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700025000000
    },

    // Arabic Malzamas
    {
        id: 'm_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'ملزمة الكيمياء الشاملة',
        title: 'ملزمة الكيمياء الوزارية للصف الثاني عشر العلمي (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'chemistry_ar_grade12.pdf',
        fileSize: '6.5 MB',
        description: 'ملخص شامل لجميع فصول الكيمياء مع حلول الأسئلة الوزارية والتمارين النموذجية باللغة العربية.',
        views: 1780,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700026000000
    },

    // English Malzamas
    {
        id: 'm_401',
        teacherId: 't_hevi',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'English',
        chapter: 'Grammar and Booklet',
        title: 'Grade 12 Complete English Sunrise Study Guide (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'english_sunrise_grade12.pdf',
        fileSize: '4.4 MB',
        description: 'Comprehensive study guide with grammar rules, reading comprehension, and national exam model answers.',
        views: 2210,
        lang: 'en',
        status: 'approved',
        createdAt: 1700028000000
    },
    {
        id: 'm_402',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics Slides',
        title: 'Reaction Kinetics & Energetics PowerPoint Slide Deck (PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'reaction_kinetics_deck.pptx',
        fileSize: '5.0 MB',
        description: 'Full animated presentation slides designed for interactive whiteboards and student self-review.',
        views: 1540,
        lang: 'en',
        status: 'approved',
        createdAt: 1700029000000
    }
];

// Default Sample Flashcards across subjects & languages
const DEFAULT_FLASHCARDS = [
    {
        id: 'fc_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەشی ١ - ترش و تفتەکان',
        front: 'پێناسەیا ترشێ برۆنشتد - لۆری چیە؟',
        back: 'هەر ماددەیەکە (گەرد یان ئایۆن) کو دکاریت پڕۆتۆنەکێ (H⁺) ببەخشیت بۆ ماددەیەکێ دی د کارلێکەکێ دا.',
        hint: 'پڕۆتۆن بەخش (H⁺ Donor)',
        lang: 'ku_ba',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031000000
    },
    {
        id: 'fc_102',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەشی ١ - هاوسەنگیا ئایۆنی',
        front: 'یاسایا پەیوەندی د ناڤبەرا pH و pOH ل پلا گەرمیا ٢٥°C چەندە؟',
        back: 'pH + pOH = 14\nهەروەسا [H₃O⁺] × [OH⁻] = 1.0 × 10⁻¹⁴',
        hint: 'کۆمکرنا وان دگەهیتە ١٤',
        lang: 'ku_ba',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031100000
    },
    {
        id: 'fc_103',
        teacherId: 't_karwan',
        teacherName: 'م. کاروان سالار',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەشی ١ - جوولەیا خولانەوە',
        front: 'یاسایا دوویێ یا نیوتنی بۆ جوولەیا خولانەوە چیە؟',
        back: 'τ = I · α\nتۆرک (Torque) یەکسانە ب زەبرا نەگۆڕینێ (I) لێکدای لەزاتیا گۆشەیی (α).',
        hint: 'هەڤبەرا F = m·a یە',
        lang: 'ku_ba',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031200000
    },
    {
        id: 'fc_104',
        teacherId: 't_lana',
        teacherName: 'م. لانا رێبەر',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'تەواوکاری و داتاشراو',
        front: 'داتاشراوێ نەخشەیا sin(ax) چیە؟',
        back: 'd/dx [sin(ax)] = a · cos(ax)',
        hint: 'ژ بیر نەکە ل داتاشراوێ گۆشێ لێک بدەی',
        lang: 'ku_ba',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031300000
    },
    {
        id: 'fc_105',
        teacherId: 't_sara',
        teacherName: 'م. سارا ئەحمەد',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەشی ١ - کۆئەندامێ بەرگریێ',
        front: 'فرمانا خانەیێن T یێن هاریکار (Helper T cells) چیە؟',
        back: 'چالاککرنا خانەیێن B بۆ بەرهەمئینانا دژەتەنان و چالاککرنا خانەیێن T یێن کوژەر.',
        hint: 'سەرکردەیا بەرگریێ نە',
        lang: 'ku_ba',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031400000
    },
    {
        id: 'fc_106',
        teacherId: 't_hevi',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'ئینگلێزی',
        chapter: 'Sunrise 12 - Passive Voice',
        front: 'How do we form Past Simple Passive?',
        back: 'Subject + was / were + Past Participle (V3)\nExample: The letter was written yesterday.',
        hint: 'was/were + V3',
        lang: 'en',
        type: 'flashcard',
        status: 'approved',
        createdAt: 1700031500000
    }
];

// Master Storage Class
class EducationalDataStore {
    constructor() {
        this.STORAGE_KEY_TEACHERS = 'app_learn_teachers_v5';
        this.STORAGE_KEY_VIDEOS = 'app_learn_videos_v5';
        this.STORAGE_KEY_QUIZZES = 'app_learn_quizzes_v5';
        this.STORAGE_KEY_MALZAMAS = 'app_learn_malzamas_v5';
        this.STORAGE_KEY_FLASHCARDS = 'app_learn_flashcards_v5';
        this.STORAGE_KEY_CURRENT_ROLE = 'app_learn_user_role';
        this.STORAGE_KEY_CURRENT_TEACHER = 'app_learn_current_teacher';
        this.STORAGE_KEY_STUDENT_GRADES = 'app_learn_student_grades';

        this.initLocalData();
        this.initFirestoreSync();
        this.syncServerData();
    }

    async syncServerData() {
        try {
            const [fcRes, qzRes] = await Promise.all([
                fetch('/api/flashcards').then(r => r.json()).catch(() => []),
                fetch('/api/quizzes').then(r => r.json()).catch(() => [])
            ]);
            if (Array.isArray(fcRes) && fcRes.length > 0) {
                const localCards = JSON.parse(localStorage.getItem(this.STORAGE_KEY_FLASHCARDS) || '[]');
                const merged = [...fcRes];
                localCards.forEach(lc => {
                    if (!merged.some(mc => mc.id === lc.id)) {
                        merged.push(lc);
                    }
                });
                localStorage.setItem(this.STORAGE_KEY_FLASHCARDS, JSON.stringify(merged));
            }
            if (Array.isArray(qzRes) && qzRes.length > 0) {
                const localQzs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]');
                const mergedQ = [...qzRes];
                localQzs.forEach(lq => {
                    if (!mergedQ.some(mq => mq.id === lq.id)) {
                        mergedQ.push(lq);
                    }
                });
                localStorage.setItem(this.STORAGE_KEY_QUIZZES, JSON.stringify(mergedQ));
            }
        } catch (e) {}
    }

    initLocalData() {
        const seedStorage = (key, defaultArray) => {
            let current = [];
            try {
                const stored = localStorage.getItem(key);
                if (stored) current = JSON.parse(stored);
            } catch (e) {
                current = [];
            }
            if (!Array.isArray(current) || current.length === 0) {
                localStorage.setItem(key, JSON.stringify(defaultArray));
                return;
            }
            // Auto-merge any missing defaults
            const currentIds = new Set(current.map(item => item.id));
            let merged = false;
            defaultArray.forEach(defItem => {
                if (!currentIds.has(defItem.id)) {
                    current.push(defItem);
                    merged = true;
                }
            });
            if (merged) {
                localStorage.setItem(key, JSON.stringify(current));
            }
        };

        seedStorage(this.STORAGE_KEY_TEACHERS, DEFAULT_TEACHERS);
        seedStorage(this.STORAGE_KEY_VIDEOS, DEFAULT_VIDEOS);
        seedStorage(this.STORAGE_KEY_QUIZZES, DEFAULT_QUIZZES);
        seedStorage(this.STORAGE_KEY_MALZAMAS, DEFAULT_MALZAMAS);
        seedStorage(this.STORAGE_KEY_FLASHCARDS, DEFAULT_FLASHCARDS);
    }

    async initFirestoreSync() {
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
        try {
            const db = window.db || firebase.firestore();
            if (!db) return;
            
            // Sync Teachers from Firestore
            db.collection('teachers').onSnapshot(snap => {
                if (!snap.empty) {
                    const firestoreTeachers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.mergeLocalWithRemote(this.STORAGE_KEY_TEACHERS, firestoreTeachers);
                    window.dispatchEvent(new CustomEvent('teachersUpdated', { detail: { teachers: firestoreTeachers } }));
                }
            }, err => console.log('Firestore teachers sync note:', err.message));

            // Sync Content
            db.collection('educational_content').onSnapshot(snap => {
                if (!snap.empty) {
                    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    const videos = items.filter(i => i.type === 'video');
                    const quizzes = items.filter(i => i.type === 'quiz');
                    const malzamas = items.filter(i => i.type === 'malzama');
                    const flashcards = items.filter(i => i.type === 'flashcard');
                    if (videos.length) this.mergeLocalWithRemote(this.STORAGE_KEY_VIDEOS, videos);
                    if (quizzes.length) this.mergeLocalWithRemote(this.STORAGE_KEY_QUIZZES, quizzes);
                    if (malzamas.length) this.mergeLocalWithRemote(this.STORAGE_KEY_MALZAMAS, malzamas);
                    if (flashcards.length) this.mergeLocalWithRemote(this.STORAGE_KEY_FLASHCARDS, flashcards);
                }
            }, err => console.log('Firestore content sync note:', err.message));
        } catch (e) {
            console.log('Firestore init note:', e.message);
        }
    }

    mergeLocalWithRemote(storageKey, remoteItems) {
        try {
            const local = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const map = new Map();
            local.forEach(i => map.set(i.id, i));
            remoteItems.forEach(i => map.set(i.id, i));
            localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));
        } catch (e) {}
    }

    // ==========================================
    // LANGUAGE SETTINGS & DISPATCH
    // ==========================================
    getActiveLanguage() {
        return localStorage.getItem('userLanguage') || 'ku_ba';
    }

    setActiveLanguage(lang) {
        let validLang = 'ku_ba';
        if (['ku_ba', 'ku_so', 'ar', 'en'].includes(lang)) {
            validLang = lang;
        }
        localStorage.setItem('userLanguage', validLang);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: validLang } }));
        return validLang;
    }

    getLanguageLabel(langCode) {
        switch(langCode) {
            case 'ku_ba': return 'باهدینی';
            case 'ku_so': return 'سۆرانی';
            case 'ar': return 'عەرەبی';
            case 'en': return 'English';
            default: return 'باهدینی';
        }
    }

    // ==========================================
    // CURRICULUM SUBJECTS HELPERS
    // ==========================================
    getSubjectsForGrade(gradeId) {
        const gid = String(gradeId || '12');
        return CURRICULUM_SUBJECTS.filter(s => s.grades.includes(gid) || s.grades.includes('all'));
    }

    getAllSubjects() {
        return CURRICULUM_SUBJECTS;
    }

    getSubjectById(subjectId) {
        return CURRICULUM_SUBJECTS.find(s => s.id === subjectId || s.key === subjectId) || null;
    }

    // Smart matching between a teacher/content subject string and a subject definition
    matchesSubject(subjectString, targetSubjectIdOrKey) {
        if (!subjectString || !targetSubjectIdOrKey) return true;
        if (targetSubjectIdOrKey === 'all') return true;

        const targetSubject = CURRICULUM_SUBJECTS.find(s => s.id === targetSubjectIdOrKey || s.key === targetSubjectIdOrKey);
        const subLower = String(subjectString).toLowerCase().trim();

        if (targetSubject) {
            if (subLower === targetSubject.id.toLowerCase() || subLower === targetSubject.name.toLowerCase()) return true;
            return targetSubject.keywords.some(kw => subLower.includes(kw.toLowerCase()));
        }

        return subLower.includes(String(targetSubjectIdOrKey).toLowerCase());
    }

    // ==========================================
    // STUDENT GRADE PREFERENCES (FOLLOWED GRADES)
    // ==========================================
    getStudentGrades() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_STUDENT_GRADES);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return null;
        } catch (e) {
            return null;
        }
    }

    setStudentGrades(gradesArray) {
        if (!Array.isArray(gradesArray) || gradesArray.length === 0) {
            gradesArray = ['10', '11', '12'];
        }
        localStorage.setItem(this.STORAGE_KEY_STUDENT_GRADES, JSON.stringify(gradesArray));
        window.dispatchEvent(new CustomEvent('studentGradesChanged', { detail: { grades: gradesArray } }));
    }

    clearStudentGrades() {
        localStorage.removeItem(this.STORAGE_KEY_STUDENT_GRADES);
        window.dispatchEvent(new CustomEvent('studentGradesChanged', { detail: { grades: null } }));
    }

    hasStudentChosenGrades() {
        return !!localStorage.getItem(this.STORAGE_KEY_STUDENT_GRADES);
    }

    // ==========================================
    // ROLE & TEACHER MANAGEMENT
    // ==========================================
    getUserRole() {
        return localStorage.getItem(this.STORAGE_KEY_CURRENT_ROLE) || null;
    }

    getCurrentUserRole() {
        return this.getUserRole();
    }

    setUserRole(role) {
        localStorage.setItem(this.STORAGE_KEY_CURRENT_ROLE, role);
        window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { role } }));
    }

    getCurrentTeacher() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY_CURRENT_TEACHER) || 'null');
        } catch (e) {
            return null;
        }
    }

    setCurrentTeacher(teacher) {
        localStorage.setItem(this.STORAGE_KEY_CURRENT_TEACHER, JSON.stringify(teacher));
    }

    isCurrentUserSuperAdmin() {
        const adminEmails = [
            'hussein.zebary.chemistry96@gmail.com',
            'drlo96chemistry@gmail.com',
            'dr.chemistry.vip@gmail.com'
        ];

        try {
            if (localStorage.getItem('parwarda_admin_unlocked') === 'true') {
                return true;
            }
            const cfUser = JSON.parse(localStorage.getItem('parwarda_cf_user') || 'null');
            if (cfUser && (cfUser.role === 'admin' || (cfUser.username && String(cfUser.username).trim().toLowerCase() === 'hussein23' && localStorage.getItem('is_admin_mode_active') === 'true'))) {
                return true;
            }
            const storedUser = JSON.parse(localStorage.getItem('app_logged_in_user') || 'null');
            if (storedUser && storedUser.isAdmin === true) {
                return true;
            }
        } catch (e) {}

        let userEmail = '';
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            userEmail = firebase.auth().currentUser.email || '';
        }
        if (!userEmail) {
            try {
                const storedUser = JSON.parse(localStorage.getItem('app_logged_in_user') || 'null');
                if (storedUser && storedUser.email) userEmail = storedUser.email;
            } catch(e) {}
        }
        if (!userEmail) {
            const currentTeacher = this.getCurrentTeacher();
            if (currentTeacher && currentTeacher.email) userEmail = currentTeacher.email;
        }

        if (userEmail && adminEmails.some(ae => ae.toLowerCase() === userEmail.trim().toLowerCase())) {
            return true;
        }
        
        // Normal registered users or guests are strictly NOT super admins
        return false;
    }

    // ==========================================
    // TEACHER PINNING (پین کرن داکو بهێتە ئەولی)
    // ==========================================
    getPinnedTeacherIds() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_PINNED_TEACHERS);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (e) {
            return [];
        }
    }

    isTeacherPinned(teacherId) {
        if (!teacherId) return false;
        return this.getPinnedTeacherIds().includes(String(teacherId));
    }

    togglePinTeacher(teacherId) {
        if (!teacherId) return { pinned: false, pinnedIds: [] };
        const idStr = String(teacherId);
        let pinnedIds = this.getPinnedTeacherIds();
        let pinned = false;
        if (pinnedIds.includes(idStr)) {
            pinnedIds = pinnedIds.filter(id => id !== idStr);
            pinned = false;
        } else {
            pinnedIds = [idStr, ...pinnedIds.filter(id => id !== idStr)];
            pinned = true;
        }
        try {
            localStorage.setItem(this.STORAGE_KEY_PINNED_TEACHERS, JSON.stringify(pinnedIds));
        } catch (e) {}
        try {
            window.dispatchEvent(new CustomEvent('teachersPinChanged', { detail: { teacherId: idStr, pinned, pinnedIds } }));
        } catch (e) {}
        return { pinned, pinnedIds };
    }

    sortTeachersWithPins(teachersList) {
        const pinnedIds = this.getPinnedTeacherIds();
        return [...(teachersList || [])].sort((a, b) => {
            const aIdx = pinnedIds.indexOf(String(a.id));
            const bIdx = pinnedIds.indexOf(String(b.id));
            const aPinned = aIdx !== -1;
            const bPinned = bIdx !== -1;
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            if (aPinned && bPinned) return aIdx - bIdx;
            return (b.viewsCount || 0) - (a.viewsCount || 0);
        });
    }

    // Teacher Management
    getAllTeachers(filterLang = null) {
        try {
            let list = JSON.parse(localStorage.getItem(this.STORAGE_KEY_TEACHERS) || '[]');
            if (!Array.isArray(list) || list.length === 0) {
                list = DEFAULT_TEACHERS;
            }
            if (filterLang) {
                list = list.filter(t => (t.lang || 'ku_ba') === filterLang);
            }
            return this.sortTeachersWithPins(list);
        } catch (e) {
            return DEFAULT_TEACHERS;
        }
    }

    getTeacherById(id) {
        const teachers = this.getAllTeachers();
        return teachers.find(t => t.id === id) || null;
    }

    getPendingTeachers() {
        return this.getAllTeachers().filter(t => t.status === 'pending');
    }

    approveTeacher(teacherId) {
        const teachers = this.getAllTeachers();
        const idx = teachers.findIndex(t => t.id === teacherId);
        if (idx >= 0) {
            teachers[idx].status = 'approved';
            teachers[idx].approvedAt = Date.now();
            localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
            const cur = this.getCurrentTeacher();
            if (cur && cur.id === teacherId) {
                this.setCurrentTeacher(teachers[idx]);
            }
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    const firestoreDb = (typeof window !== 'undefined' && window.db) ? window.db : firebase.firestore();
                    firestoreDb.collection('teachers').doc(teacherId).set({ status: 'approved', approvedAt: Date.now() }, { merge: true }).catch(() => {});
                } catch (e) {}
            }
            window.dispatchEvent(new CustomEvent('teachersUpdated', { detail: { teachers } }));
            return teachers[idx];
        }
        return null;
    }

    rejectTeacher(teacherId) {
        const teachers = this.getAllTeachers();
        const idx = teachers.findIndex(t => t.id === teacherId);
        if (idx >= 0) {
            teachers[idx].status = 'rejected';
            localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
            const cur = this.getCurrentTeacher();
            if (cur && cur.id === teacherId) {
                this.setCurrentTeacher(teachers[idx]);
            }
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    const firestoreDb = (typeof window !== 'undefined' && window.db) ? window.db : firebase.firestore();
                    firestoreDb.collection('teachers').doc(teacherId).set({ status: 'rejected' }, { merge: true }).catch(() => {});
                } catch (e) {}
            }
            window.dispatchEvent(new CustomEvent('teachersUpdated', { detail: { teachers } }));
            return teachers[idx];
        }
        return null;
    }

    saveTeacher(teacherData) {
        const teachers = this.getAllTeachers();
        const existingIndex = teachers.findIndex(t => t.id === teacherData.id || (teacherData.email && t.email && t.email.toLowerCase() === teacherData.email.toLowerCase()));
        
        let savedTeacher;
        if (existingIndex >= 0) {
            savedTeacher = { ...teachers[existingIndex], ...teacherData };
            teachers[existingIndex] = savedTeacher;
        } else {
            savedTeacher = {
                id: teacherData.id || 't_' + Date.now(),
                name: teacherData.name,
                subject: teacherData.subject || 'کیمیا',
                email: teacherData.email || '',
                phone: teacherData.phone || '',
                bio: teacherData.bio || 'مامۆستایێ شارەزا',
                avatar: teacherData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                viewsCount: teacherData.viewsCount || 10,
                grades: teacherData.grades || ['10', '11', '12'],
                lang: teacherData.lang || this.getActiveLanguage(),
                status: teacherData.status || 'approved',
                createdAt: Date.now()
            };
            teachers.push(savedTeacher);
        }

        localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        this.setCurrentTeacher(savedTeacher);

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const firestoreDb = (typeof window !== 'undefined' && window.db) ? window.db : firebase.firestore();
                const remoteDoc = { ...savedTeacher };
                if (remoteDoc.avatar && remoteDoc.avatar.length > 200000) {
                    remoteDoc.avatar = '';
                }
                firestoreDb.collection('teachers').doc(savedTeacher.id).set(remoteDoc, { merge: true }).catch(() => {});
            } catch (e) {}
        }
        return savedTeacher;
    }

    // Increment Teacher and Content View Count
    incrementViews(teacherId, contentId = null, contentType = null) {
        const teachers = this.getAllTeachers();
        const tIndex = teachers.findIndex(t => t.id === teacherId);
        if (tIndex >= 0) {
            teachers[tIndex].viewsCount = (teachers[tIndex].viewsCount || 0) + 1;
            localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    const firestoreDb = (typeof window !== 'undefined' && window.db) ? window.db : firebase.firestore();
                    firestoreDb.collection('teachers').doc(teacherId).update({
                        viewsCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(() => {});
                } catch(e) {}
            }
        }

        if (contentId && contentType) {
            let key = null;
            if (contentType === 'video') key = this.STORAGE_KEY_VIDEOS;
            else if (contentType === 'malzama') key = this.STORAGE_KEY_MALZAMAS;

            if (key) {
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    const idx = items.findIndex(i => i.id === contentId);
                    if (idx >= 0) {
                        items[idx].views = (items[idx].views || 0) + 1;
                        localStorage.setItem(key, JSON.stringify(items));
                    }
                } catch (e) {}
            }
        }
    }

    // Get Teachers for Grade STRICTLY filtered by selected Language & Optional Subject
    // Pinned teachers always come FIRST, then sorted by views descending!
    getTeachersForGrade(gradeId, customLang = null, subjectKey = null) {
        const targetLang = customLang || this.getActiveLanguage();
        let allTeachers = this.getAllTeachers().filter(t => (t.lang || 'ku_ba') === targetLang && t.status !== 'pending' && t.status !== 'rejected');
        
        const videos = this.getAllVideos(true, null, false, targetLang);
        const quizzes = this.getAllQuizzes(true, null, false, targetLang);
        const malzamas = this.getAllMalzamas(true, null, false, targetLang);
        const flashcards = this.getAllFlashcards(true, null, false, targetLang);

        const gradeTeachersMap = new Map();

        // 1. Teachers tagged for this grade
        allTeachers.forEach(t => {
            if (t.grades && (t.grades.includes(String(gradeId)) || t.grades.includes('all'))) {
                if (!subjectKey || subjectKey === 'all' || this.matchesSubject(t.subject, subjectKey)) {
                    gradeTeachersMap.set(t.id, t);
                }
            }
        });

        // 2. Teachers who published content in this grade
        const checkContent = (item) => {
            if (String(item.grade) === String(gradeId)) {
                if (!subjectKey || subjectKey === 'all' || this.matchesSubject(item.subject, subjectKey)) {
                    const teacher = this.getTeacherById(item.teacherId);
                    if (teacher && (teacher.lang || 'ku_ba') === targetLang && teacher.status !== 'pending' && teacher.status !== 'rejected') {
                        gradeTeachersMap.set(teacher.id, teacher);
                    }
                }
            }
        };
        videos.forEach(checkContent);
        quizzes.forEach(checkContent);
        malzamas.forEach(checkContent);
        flashcards.forEach(checkContent);

        // Fallback: If a specific subject was picked and no teachers mapped directly to this grade,
        // match ANY teacher in this language that teaches this subject
        if (gradeTeachersMap.size === 0 && subjectKey && subjectKey !== 'all') {
            allTeachers.forEach(t => {
                if (this.matchesSubject(t.subject, subjectKey)) {
                    gradeTeachersMap.set(t.id, t);
                }
            });
        }

        // Fallback: If no teacher in this exact grade for this language, and no specific subject filter
        if (gradeTeachersMap.size === 0 && (!subjectKey || subjectKey === 'all') && allTeachers.length > 0) {
            allTeachers.slice(0, 3).forEach(t => gradeTeachersMap.set(t.id, t));
        }

        // Return pinned teachers first, then sorted by student views descending
        return this.sortTeachersWithPins(Array.from(gradeTeachersMap.values()));
    }

    // ==========================================
    // CONTENT CRUD (VIDEOS, QUIZZES, MALZAMAS)
    // ==========================================
    getAllVideos(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]');
            if (filterLang) {
                videos = videos.filter(v => (v.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                videos = videos.filter(v => v.status === 'approved');
            } else if (teacherId) {
                videos = videos.filter(v => v.teacherId === teacherId);
            }
            return videos.sort((a, b) => (b.views || 0) - (a.views || 0));
        } catch (e) {
            return DEFAULT_VIDEOS;
        }
    }

    saveVideo(videoData) {
        const videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = videoData.lang || this.getActiveLanguage();

        const newVideo = {
            id: videoData.id || 'v_' + Date.now(),
            teacherId: videoData.teacherId,
            teacherName: videoData.teacherName,
            grade: String(videoData.grade),
            subject: videoData.subject || 'کیمیا',
            chapter: videoData.chapter || '',
            title: videoData.title,
            youtubeUrl: videoData.youtubeUrl,
            views: videoData.views || 0,
            lang: activeLang,
            type: 'video',
            status: isSuperAdmin ? 'approved' : (videoData.status || 'pending'),
            createdAt: Date.now()
        };

        const existingIdx = videos.findIndex(v => v.id === newVideo.id);
        if (existingIdx >= 0) {
            videos[existingIdx] = newVideo;
        } else {
            videos.unshift(newVideo);
        }

        localStorage.setItem(this.STORAGE_KEY_VIDEOS, JSON.stringify(videos));

        // 1. Sync to Firebase Firestore
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                firestoreDb.collection('educational_content').doc(newVideo.id).set({
                    ...newVideo,
                    type: 'video'
                }, { merge: true }).catch(err => console.warn('Firestore video sync:', err));
            } catch (e) {}
        }

        // 2. Auto-sync to Google Drive of the connected account
        if (window.GoogleDriveService && window.GoogleDriveService.getAccessToken()) {
            window.GoogleDriveService.backupEducationalItem(newVideo).catch(err => {
                console.warn('Google Drive auto-backup error for video:', err);
            });
        }

        return newVideo;
    }

    getAllQuizzes(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]');
            if (filterLang) {
                quizzes = quizzes.filter(q => (q.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                quizzes = quizzes.filter(q => q.status === 'approved');
            } else if (teacherId) {
                quizzes = quizzes.filter(q => q.teacherId === teacherId);
            }
            return quizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (e) {
            return DEFAULT_QUIZZES;
        }
    }

    saveQuiz(quizData) {
        const quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = quizData.lang || this.getActiveLanguage();

        const newQuiz = {
            id: quizData.id || ('q_' + Date.now() + '_' + Math.floor(Math.random() * 10000)),
            teacherId: quizData.teacherId || 't_hussein',
            teacherName: quizData.teacherName || 'ئەدمین',
            grade: String(quizData.grade || '12'),
            subject: quizData.subject || 'کیمیا',
            chapter: quizData.chapter || '',
            title: String(quizData.title || quizData.question || 'پرسیار').slice(0, 250),
            question: quizData.question,
            options: quizData.options,
            correctIndex: quizData.correctIndex,
            explanation: quizData.explanation || '',
            difficulty: quizData.difficulty || 'ناوەند',
            lang: activeLang,
            type: 'quiz',
            status: isSuperAdmin ? 'approved' : (quizData.status || 'pending'),
            createdAt: quizData.createdAt || Date.now()
        };

        const existingIdx = quizzes.findIndex(q => q.id === newQuiz.id);
        if (existingIdx >= 0) {
            quizzes[existingIdx] = newQuiz;
        } else {
            quizzes.unshift(newQuiz);
        }

        localStorage.setItem(this.STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));

        // Sync to server backend API (/api/quizzes)
        fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQuiz)
        }).catch(err => console.warn('Server quiz sync error:', err));

        // 1. Sync to Firebase Firestore
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                firestoreDb.collection('educational_content').doc(newQuiz.id).set({
                    ...newQuiz,
                    title: String(newQuiz.title || newQuiz.question || 'Quiz').slice(0, 250),
                    type: 'quiz'
                }, { merge: true }).catch(err => console.warn('Firestore quiz sync:', err));
            } catch (e) {}
        }

        // 2. Auto-sync to Google Drive of the connected account
        if (window.GoogleDriveService && window.GoogleDriveService.getAccessToken()) {
            window.GoogleDriveService.backupEducationalItem(newQuiz).catch(err => {
                console.warn('Google Drive auto-backup error for quiz:', err);
            });
        }

        try {
            window.dispatchEvent(new CustomEvent('educational-content-changed', {
                detail: { id: newQuiz.id, type: 'quiz', status: newQuiz.status }
            }));
        } catch (e) {}

        return newQuiz;
    }

    saveQuizzesBatch(quizzesArray) {
        if (!Array.isArray(quizzesArray) || quizzesArray.length === 0) return [];
        const saved = [];
        const baseTs = Date.now();
        quizzesArray.forEach((item, idx) => {
            if (!item || !item.question) return;
            const res = this.saveQuiz({
                ...item,
                id: item.id || `q_${baseTs}_${idx}_${Math.floor(Math.random() * 1000)}`,
                createdAt: baseTs + idx
            });
            saved.push(res);
        });
        return saved;
    }

    // ==========================================
    // FLASHCARDS CRUD & BATCH SAVE
    // ==========================================
    getAllFlashcards(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let cards = JSON.parse(localStorage.getItem(this.STORAGE_KEY_FLASHCARDS) || '[]');
            if (filterLang) {
                cards = cards.filter(c => (c.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                cards = cards.filter(c => c.status === 'approved');
            } else if (teacherId) {
                cards = cards.filter(c => c.teacherId === teacherId);
            }
            return cards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (e) {
            return DEFAULT_FLASHCARDS;
        }
    }

    saveFlashcard(cardData) {
        const cards = JSON.parse(localStorage.getItem(this.STORAGE_KEY_FLASHCARDS) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = cardData.lang || this.getActiveLanguage();
        const frontText = String(cardData.front || '').trim();
        const backText = String(cardData.back || '').trim();

        const newCard = {
            id: cardData.id || ('fc_' + Date.now() + '_' + Math.floor(Math.random() * 10000)),
            teacherId: cardData.teacherId || 't_hussein',
            teacherName: cardData.teacherName || 'ئەدمین',
            grade: String(cardData.grade || '12'),
            subject: cardData.subject || 'کیمیا',
            chapter: cardData.chapter || '',
            title: String(cardData.title || frontText || 'فلاش کارت').slice(0, 250),
            front: frontText,
            back: backText,
            hint: String(cardData.hint || '').trim(),
            lang: activeLang,
            type: 'flashcard',
            status: isSuperAdmin ? 'approved' : (cardData.status || 'pending'),
            createdAt: cardData.createdAt || Date.now()
        };

        const existingIdx = cards.findIndex(c => c.id === newCard.id);
        if (existingIdx >= 0) {
            cards[existingIdx] = newCard;
        } else {
            cards.unshift(newCard);
        }

        localStorage.setItem(this.STORAGE_KEY_FLASHCARDS, JSON.stringify(cards));

        // Sync to server backend API (/api/flashcards)
        fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCard)
        }).catch(err => console.warn('Server flashcard sync error:', err));

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                firestoreDb.collection('educational_content').doc(newCard.id).set({
                    ...newCard,
                    title: String(newCard.title || newCard.front || 'Flashcard').slice(0, 250),
                    type: 'flashcard'
                }, { merge: true }).catch(err => console.warn('Firestore flashcard sync:', err));
            } catch (e) {}
        }

        if (window.GoogleDriveService && window.GoogleDriveService.getAccessToken()) {
            window.GoogleDriveService.backupEducationalItem(newCard).catch(err => {
                console.warn('Google Drive auto-backup error for flashcard:', err);
            });
        }

        try {
            window.dispatchEvent(new CustomEvent('educational-content-changed', {
                detail: { id: newCard.id, type: 'flashcard', status: newCard.status }
            }));
        } catch (e) {}

        return newCard;
    }

    saveFlashcardsBatch(cardsArray) {
        if (!Array.isArray(cardsArray) || cardsArray.length === 0) return [];
        const saved = [];
        const baseTs = Date.now();
        cardsArray.forEach((item, idx) => {
            if (!item || !item.front || !item.back) return;
            const res = this.saveFlashcard({
                ...item,
                id: item.id || `fc_${baseTs}_${idx}_${Math.floor(Math.random() * 1000)}`,
                createdAt: baseTs + idx
            });
            saved.push(res);
        });
        return saved;
    }

    getAllMalzamas(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]');
            if (filterLang) {
                malzamas = malzamas.filter(m => (m.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                malzamas = malzamas.filter(m => m.status === 'approved');
            } else if (teacherId) {
                malzamas = malzamas.filter(m => m.teacherId === teacherId);
            }
            return malzamas.sort((a, b) => (b.views || 0) - (a.views || 0));
        } catch (e) {
            return DEFAULT_MALZAMAS;
        }
    }

    saveMalzama(malzamaData) {
        const malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = malzamaData.lang || this.getActiveLanguage();

        const resolvedHtml = malzamaData.htmlContent || (malzamaData.fileType === 'html' ? (malzamaData.fileData || '') : '');
        const newMalzama = {
            id: malzamaData.id || 'm_' + Date.now(),
            teacherId: malzamaData.teacherId,
            teacherName: malzamaData.teacherName,
            grade: String(malzamaData.grade),
            subject: malzamaData.subject || 'کیمیا',
            chapter: malzamaData.chapter || '',
            title: malzamaData.title,
            fileType: malzamaData.fileType || 'pdf', // 'pptx', 'html', 'image', 'pdf'
            fileUrl: malzamaData.fileUrl || '',
            fileName: malzamaData.fileName || 'file',
            fileSize: malzamaData.fileSize || 'N/A',
            fileData: malzamaData.fileData || '',
            htmlContent: resolvedHtml || '',
            description: malzamaData.description || '',
            views: malzamaData.views || 0,
            lang: activeLang,
            type: 'malzama',
            status: isSuperAdmin ? 'approved' : (malzamaData.status || 'pending'),
            createdAt: Date.now()
        };

        const existingIdx = malzamas.findIndex(m => m.id === newMalzama.id);
        if (existingIdx >= 0) {
            malzamas[existingIdx] = newMalzama;
        } else {
            malzamas.unshift(newMalzama);
        }

        try {
            localStorage.setItem(this.STORAGE_KEY_MALZAMAS, JSON.stringify(malzamas));
        } catch (storageErr) {
            console.warn('localStorage quota handling for malzama:', storageErr);
            // In case of quota error with large files, ensure essential htmlContent is kept
            try {
                const slimMalzamas = malzamas.map(m => {
                    if (m.fileData && m.fileData.length > 500000 && m.fileType !== 'html') {
                        return { ...m, fileData: '' };
                    }
                    return m;
                });
                localStorage.setItem(this.STORAGE_KEY_MALZAMAS, JSON.stringify(slimMalzamas));
            } catch (e) {}
        }

        // 1. Sync to Firebase Firestore
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                // Omit very large base64 from Firestore doc if > 800KB to respect Firestore limits
                const firestoreData = { ...newMalzama, type: 'malzama' };
                if (firestoreData.fileData && firestoreData.fileData.length > 800000) {
                    delete firestoreData.fileData;
                }
                firestoreDb.collection('educational_content').doc(newMalzama.id).set(firestoreData, { merge: true }).catch(err => console.warn('Firestore malzama sync:', err));
            } catch (e) {}
        }

        // 2. Auto-sync to Google Drive of the connected account
        if (window.GoogleDriveService && window.GoogleDriveService.getAccessToken()) {
            const rawFile = malzamaData.fileBlob || malzamaData.fileData || null;
            window.GoogleDriveService.backupEducationalItem(newMalzama, rawFile).catch(err => {
                console.warn('Google Drive auto-backup error for malzama:', err);
            });
        }

        return newMalzama;
    }

    // Resolves and decodes HTML content from an educational item with 100% fidelity and instant speed
    getHtmlContentFromItem(item) {
        if (!item) return '';
        // 1. Direct clean HTML string
        if (item.htmlContent && typeof item.htmlContent === 'string' && item.htmlContent.trim().length > 0) {
            if (item.htmlContent.includes('<') || item.htmlContent.includes('<!DOCTYPE') || item.htmlContent.includes('<html')) {
                return item.htmlContent;
            }
        }
        // 2. Check fileData (may be raw HTML or Base64 Data URL)
        const source = item.fileData || item.fileUrl || '';
        if (typeof source === 'string' && source.length > 0) {
            if (source.startsWith('data:') && source.includes(';base64,')) {
                try {
                    const b64 = source.split(';base64,')[1];
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const decoded = new TextDecoder('utf-8').decode(bytes);
                    if (decoded && decoded.trim().length > 0) return decoded;
                } catch (e) {
                    console.warn('Base64 HTML decode fallback error:', e);
                }
            } else if (source.includes('<html') || source.includes('<!DOCTYPE') || source.includes('<body') || source.includes('<head') || source.includes('<div')) {
                return source;
            }
        }
        return item.htmlContent || '';
    }

    deleteContent(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;
        else if (type === 'flashcard') storageKey = this.STORAGE_KEY_FLASHCARDS;

        if (!storageKey) return false;

        try {
            const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const filtered = list.filter(item => item.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(filtered));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                firebase.firestore().collection('educational_content').doc(id).delete().catch(() => {});
            }
            try {
                window.dispatchEvent(new CustomEvent('educational-content-changed', {
                    detail: { id, type, status: 'deleted' }
                }));
            } catch (e) {}
            return true;
        } catch (e) {
            return false;
        }
    }

    // Google Drive Bulk Sync & Restore Helpers
    async backupAllToGoogleDrive() {
        if (!window.GoogleDriveService || !window.GoogleDriveService.getAccessToken()) {
            throw new Error('NOT_AUTHENTICATED');
        }
        const vids = this.getAllVideos(false, null, true);
        const qzs = this.getAllQuizzes(false, null, true);
        const mlzs = this.getAllMalzamas(false, null, true);
        const fcs = this.getAllFlashcards(false, null, true);
        let count = 0;
        for (const v of vids) {
            try {
                await window.GoogleDriveService.backupEducationalItem(v);
                count++;
            } catch (e) { console.warn(e); }
        }
        for (const q of qzs) {
            try {
                await window.GoogleDriveService.backupEducationalItem(q);
                count++;
            } catch (e) { console.warn(e); }
        }
        for (const m of mlzs) {
            try {
                await window.GoogleDriveService.backupEducationalItem(m);
                count++;
            } catch (e) { console.warn(e); }
        }
        for (const fc of fcs) {
            try {
                await window.GoogleDriveService.backupEducationalItem(fc);
                count++;
            } catch (e) { console.warn(e); }
        }
        return count;
    }

    // ==========================================
    // ADMIN APPROVAL WORKFLOW
    // ==========================================
    getPendingSubmissions() {
        const videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]')
            .filter(v => v.status === 'pending')
            .map(v => ({ ...v, type: 'video' }));
        const quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]')
            .filter(q => q.status === 'pending')
            .map(q => ({ ...q, type: 'quiz' }));
        const malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]')
            .filter(m => m.status === 'pending')
            .map(m => ({ ...m, type: 'malzama' }));
        const flashcards = JSON.parse(localStorage.getItem(this.STORAGE_KEY_FLASHCARDS) || '[]')
            .filter(c => c.status === 'pending')
            .map(c => ({ ...c, type: 'flashcard' }));

        const allPending = [...videos, ...quizzes, ...malzamas, ...flashcards].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        allPending.videos = videos;
        allPending.quizzes = quizzes;
        allPending.malzamas = malzamas;
        allPending.flashcards = flashcards;
        allPending.totalPending = allPending.length;
        return allPending;
    }

    getPendingSubmissionsCount() {
        const p = this.getPendingSubmissions();
        return p.length;
    }

    approveSubmission(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;
        else if (type === 'flashcard') storageKey = this.STORAGE_KEY_FLASHCARDS;

        if (!storageKey) return false;

        const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const idx = list.findIndex(item => item.id === id);
        if (idx >= 0) {
            list[idx].status = 'approved';
            list[idx].approvedAt = Date.now();
            list[idx].approvedBy = SUPER_ADMIN_EMAIL;
            localStorage.setItem(storageKey, JSON.stringify(list));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                    firestoreDb.collection('educational_content').doc(id).set({
                        status: 'approved',
                        approvedAt: Date.now(),
                        approvedBy: SUPER_ADMIN_EMAIL
                    }, { merge: true }).catch(() => {});
                } catch (e) {}
            }

            try {
                window.dispatchEvent(new CustomEvent('educational-content-changed', {
                    detail: { id, type, status: 'approved' }
                }));
            } catch (e) {}

            return true;
        }
        return false;
    }

    approveItem(id, type) {
        return this.approveSubmission(id, type);
    }

    rejectSubmission(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;
        else if (type === 'flashcard') storageKey = this.STORAGE_KEY_FLASHCARDS;

        if (!storageKey) return false;

        const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const idx = list.findIndex(item => item.id === id);
        if (idx >= 0) {
            list[idx].status = 'rejected';
            list[idx].rejectedAt = Date.now();
            localStorage.setItem(storageKey, JSON.stringify(list));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    const firestoreDb = (typeof db !== 'undefined' && db) ? db : firebase.firestore();
                    firestoreDb.collection('educational_content').doc(id).set({
                        status: 'rejected',
                        rejectedAt: Date.now()
                    }, { merge: true }).catch(() => {});
                } catch (e) {}
            }

            try {
                window.dispatchEvent(new CustomEvent('educational-content-changed', {
                    detail: { id, type, status: 'rejected' }
                }));
            } catch (e) {}

            return true;
        }
        return false;
    }

    rejectItem(id, type) {
        return this.rejectSubmission(id, type);
    }

    deleteItem(id, type) {
        return this.deleteContent(id, type);
    }

    submitVideo(videoData) {
        return this.saveVideo(videoData);
    }

    submitQuiz(quizData) {
        return this.saveQuiz(quizData);
    }

    submitMalzama(malzamaData) {
        return this.saveMalzama(malzamaData);
    }

    submitFlashcard(cardData) {
        return this.saveFlashcard(cardData);
    }

    getYoutubeId(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : '';
    }

    getAllUniversityDepartments() {
        return UNIVERSITY_DEPARTMENTS;
    }

    getUniversityDepartmentById(id) {
        return UNIVERSITY_DEPARTMENTS.find(d => d.id === id);
    }

    getDepartmentsByScore(studentScore, branch = 'all', category = 'all', university = 'all') {
        const score = parseFloat(studentScore) || 0;
        return UNIVERSITY_DEPARTMENTS.filter(dept => {
            if (branch && branch !== 'all') {
                if (dept.branch !== 'both' && dept.branch !== branch) return false;
            }
            if (category && category !== 'all' && dept.category !== category) return false;
            if (university && university !== 'all' && !dept.universities.includes(university)) return false;
            return true;
        }).map(dept => {
            let status = 'accepted';
            let diff = score - dept.minScoreGeneral;
            if (score >= dept.minScoreGeneral) {
                status = 'accepted';
            } else if (score >= dept.minScoreParallel) {
                status = 'parallel';
            } else if (diff >= -3.0) {
                status = 'borderline';
            } else {
                status = 'low';
            }
            return {
                ...dept,
                status,
                scoreDiff: diff.toFixed(1)
            };
        }).sort((a, b) => b.minScoreGeneral - a.minScoreGeneral);
    }
}

// =========================================================================
// CODE / FILE CONVERTER FOR FLASHCARDS & QUIZZES (JSON / JS / HTML / CSV / TXT)
// =========================================================================
window.StudyCodeParser = {
    extractBalancedJsonBlocks(text) {
        const blocks = [];
        const src = String(text || '');
        for (let i = 0; i < src.length; i++) {
            const ch = src[i];
            if (ch !== '[' && ch !== '{') continue;
            const closeCh = ch === '[' ? ']' : '}';
            let depth = 0;
            let inStr = false;
            let quote = '';
            let escaped = false;
            for (let j = i; j < src.length; j++) {
                const c = src[j];
                if (inStr) {
                    if (escaped) escaped = false;
                    else if (c === '\\') escaped = true;
                    else if (c === quote) inStr = false;
                } else {
                    if (c === '"' || c === "'" || c === '`') {
                        inStr = true;
                        quote = c;
                    } else if (c === ch) {
                        depth++;
                    } else if (c === closeCh) {
                        depth--;
                        if (depth === 0) {
                            const candidate = src.slice(i, j + 1);
                            if (candidate.length >= 12) blocks.push(candidate);
                            i = j;
                            break;
                        }
                    }
                }
            }
        }
        return blocks;
    },

    tryEvalOrJsonParse(block) {
        try {
            return JSON.parse(block);
        } catch (_) {}
        try {
            const cleaned = block
                .replace(/\/\/[^\n\r]*/g, '')
                .replace(/\/\*[\s\S]*?\*\//g, '');
            const fn = new Function('"use strict"; return (' + cleaned + ');');
            return fn();
        } catch (_) {
            return null;
        }
    },

    collectCandidateArrays(root) {
        const arrays = [];
        if (!root) return arrays;
        if (Array.isArray(root)) arrays.push(root);
        else if (typeof root === 'object') {
            ['flashcards', 'cards', 'items', 'questions', 'quizzes', 'quiz', 'data', 'deck', 'list'].forEach(k => {
                if (Array.isArray(root[k])) arrays.push(root[k]);
            });
            Object.values(root).forEach(v => {
                if (Array.isArray(v)) arrays.push(v);
            });
        }
        return arrays;
    },

    normalizeFlashcardObj(obj, defaultChapter = '') {
        if (!obj || typeof obj !== 'object') return null;
        const front = String(
            obj.front ?? obj.question ?? obj.term ?? obj.q ?? obj.prompt ?? obj.title ?? obj.word ?? obj.concept ?? ''
        ).trim();
        const back = String(
            obj.back ?? obj.answer ?? obj.definition ?? obj.a ?? obj.meaning ?? obj.explanation ?? obj.translation ?? obj.solution ?? ''
        ).trim();
        if (!front || !back) return null;
        const hint = String(obj.hint ?? obj.clue ?? obj.tip ?? obj.note ?? '').trim();
        const chapter = String(obj.chapter ?? obj.unit ?? obj.topic ?? defaultChapter ?? '').trim();
        return { front, back, hint, chapter };
    },

    normalizeQuizObj(obj, defaultChapter = '') {
        if (!obj || typeof obj !== 'object') return null;
        const question = String(obj.question ?? obj.q ?? obj.prompt ?? obj.title ?? obj.text ?? '').trim();
        let options = obj.options ?? obj.choices ?? obj.answers ?? obj.variants ?? obj.opts;
        if (!Array.isArray(options) && (obj.a || obj.A || obj.optionA)) {
            options = [obj.a ?? obj.A ?? obj.optionA, obj.b ?? obj.B ?? obj.optionB, obj.c ?? obj.C ?? obj.optionC, obj.d ?? obj.D ?? obj.optionD].filter(Boolean);
        }
        if (!question || !Array.isArray(options) || options.length < 2) return null;
        const cleanOpts = options.map(o => String(o ?? '').trim()).filter(Boolean).slice(0, 4);
        if (cleanOpts.length < 2) return null;
        while (cleanOpts.length < 4) cleanOpts.push(`بژاردە ${cleanOpts.length + 1}`);

        let correctIndex = 0;
        if (typeof obj.correctIndex === 'number') correctIndex = obj.correctIndex;
        else if (typeof obj.correct_index === 'number') correctIndex = obj.correct_index;
        else if (typeof obj.answerIndex === 'number') correctIndex = obj.answerIndex;
        else if (typeof obj.correct === 'number') correctIndex = obj.correct;
        else if (typeof obj.answer === 'number') correctIndex = obj.answer;
        else {
            const ansStr = String(obj.correct ?? obj.answer ?? obj.correctAnswer ?? '').trim();
            const upper = ansStr.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(upper)) correctIndex = ['A', 'B', 'C', 'D'].indexOf(upper);
            else if (['1', '2', '3', '4'].includes(ansStr)) correctIndex = Number(ansStr) - 1;
            else if (ansStr) {
                const matchIdx = cleanOpts.findIndex(o => o.toLowerCase() === ansStr.toLowerCase());
                if (matchIdx >= 0) correctIndex = matchIdx;
            }
        }
        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= cleanOpts.length) correctIndex = 0;

        return {
            question,
            options: cleanOpts,
            correctIndex,
            explanation: String(obj.explanation ?? obj.reason ?? obj.hint ?? obj.feedback ?? '').trim(),
            chapter: String(obj.chapter ?? obj.unit ?? obj.topic ?? defaultChapter ?? '').trim(),
            difficulty: String(obj.difficulty ?? 'ناوەند').trim()
        };
    },

    parseHtmlDomFlashcards(rawHtml, defaultChapter = '') {
        if (!rawHtml || !rawHtml.includes('<')) return [];
        try {
            const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
            const out = [];

            // 1. Definition lists <dt> / <dd>
            const dts = doc.querySelectorAll('dt');
            dts.forEach(dt => {
                const dd = dt.nextElementSibling;
                if (dd && dd.tagName.toLowerCase() === 'dd') {
                    const front = dt.textContent.trim();
                    const back = dd.textContent.trim();
                    if (front && back) out.push({ front, back, hint: '', chapter: defaultChapter });
                }
            });

            // 2. Cards with data-front / data-back or .flashcard / .card
            doc.querySelectorAll('[data-front][data-back]').forEach(el => {
                const front = el.getAttribute('data-front')?.trim() || '';
                const back = el.getAttribute('data-back')?.trim() || '';
                const hint = el.getAttribute('data-hint')?.trim() || '';
                if (front && back) out.push({ front, back, hint, chapter: defaultChapter });
            });

            if (out.length === 0) {
                doc.querySelectorAll('.flashcard, .flip-card, .card, .study-card').forEach(card => {
                    const fEl = card.querySelector('.front, .flashcard-front, .card-front, .question, .term, h3, h4');
                    const bEl = card.querySelector('.back, .flashcard-back, .card-back, .answer, .definition, p');
                    const front = fEl ? fEl.textContent.trim() : '';
                    const back = bEl && bEl !== fEl ? bEl.textContent.trim() : '';
                    if (front && back) out.push({ front, back, hint: '', chapter: defaultChapter });
                });
            }

            // 3. Table rows <tr><td>front</td><td>back</td></tr>
            if (out.length === 0) {
                doc.querySelectorAll('tr').forEach(tr => {
                    const cells = tr.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const front = cells[0].textContent.trim();
                        const back = cells[1].textContent.trim();
                        const hint = cells[2] ? cells[2].textContent.trim() : '';
                        if (front && back) out.push({ front, back, hint, chapter: defaultChapter });
                    }
                });
            }
            return out;
        } catch (_) {
            return [];
        }
    },

    parseCodeToFlashcards(rawText, defaultChapter = '') {
        const text = String(rawText || '').trim();
        if (!text) return [];
        const results = [];
        const seen = new Set();
        const pushCard = (c) => {
            if (!c || !c.front || !c.back) return;
            const key = c.front + '||' + c.back;
            if (seen.has(key)) return;
            seen.add(key);
            results.push(c);
        };

        // 1. JSON / JS object or array extraction
        const trimmed = text.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
        const directParsed = this.tryEvalOrJsonParse(trimmed);
        if (directParsed) {
            this.collectCandidateArrays(directParsed).forEach(arr => {
                arr.forEach(item => pushCard(this.normalizeFlashcardObj(item, defaultChapter)));
            });
        }

        if (results.length === 0) {
            const blocks = this.extractBalancedJsonBlocks(text);
            blocks.forEach(b => {
                const parsed = this.tryEvalOrJsonParse(b);
                if (parsed) {
                    this.collectCandidateArrays(parsed).forEach(arr => {
                        arr.forEach(item => pushCard(this.normalizeFlashcardObj(item, defaultChapter)));
                    });
                }
            });
        }

        // 2. HTML DOM parsing
        if (results.length === 0 && text.includes('<')) {
            this.parseHtmlDomFlashcards(text, defaultChapter).forEach(pushCard);
        }

        // 3. Q: / A: blocks
        if (results.length === 0) {
            const qaBlocks = text.split(/\n\s*\n/);
            qaBlocks.forEach(blk => {
                const qMatch = blk.match(/^(?:Q|پ|پرسیار|Front|Term)\s*[:：\-]\s*(.+)$/im);
                const aMatch = blk.match(/^(?:A|و|وەڵام|بەرسڤ|Back|Def(?:inition)?)\s*[:：\-]\s*(.+)$/im);
                if (qMatch && aMatch) {
                    const hMatch = blk.match(/^(?:Hint|تێبینی|Clue)\s*[:：\-]\s*(.+)$/im);
                    pushCard({
                        front: qMatch[1].trim(),
                        back: aMatch[1].trim(),
                        hint: hMatch ? hMatch[1].trim() : '',
                        chapter: defaultChapter
                    });
                }
            });
        }

        // 4. CSV / TSV / Pipe / Double-colon delimited lines
        if (results.length === 0) {
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            lines.forEach((line, idx) => {
                if (line.startsWith('<') || line.startsWith('//') || line.startsWith('#')) return;
                let parts = null;
                if (line.includes('::')) parts = line.split('::');
                else if (line.includes('|')) parts = line.split('|');
                else if (line.includes('->')) parts = line.split('->');
                else if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(',') && line.split(',').length <= 4) parts = line.split(',');
                if (parts && parts.length >= 2) {
                    const f = parts[0].replace(/^["']|["']$/g, '').trim();
                    const b = parts[1].replace(/^["']|["']$/g, '').trim();
                    const h = (parts[2] || '').replace(/^["']|["']$/g, '').trim();
                    if (idx === 0 && /^(front|question|term|پرسیار)$/i.test(f)) return;
                    if (f && b) pushCard({ front: f, back: b, hint: h, chapter: defaultChapter });
                }
            });
        }

        return results;
    },

    parseCodeToQuizzes(rawText, defaultChapter = '') {
        const text = String(rawText || '').trim();
        if (!text) return [];
        const results = [];
        const seen = new Set();
        const pushQuiz = (q) => {
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return;
            if (seen.has(q.question)) return;
            seen.add(q.question);
            results.push(q);
        };

        // 1. JSON / JS array extraction
        const trimmed = text.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
        const directParsed = this.tryEvalOrJsonParse(trimmed);
        if (directParsed) {
            this.collectCandidateArrays(directParsed).forEach(arr => {
                arr.forEach(item => pushQuiz(this.normalizeQuizObj(item, defaultChapter)));
            });
        }

        if (results.length === 0) {
            const blocks = this.extractBalancedJsonBlocks(text);
            blocks.forEach(b => {
                const parsed = this.tryEvalOrJsonParse(b);
                if (parsed) {
                    this.collectCandidateArrays(parsed).forEach(arr => {
                        arr.forEach(item => pushQuiz(this.normalizeQuizObj(item, defaultChapter)));
                    });
                }
            });
        }

        // 2. HTML DOM quizzes (.quiz-item / .question-block / [data-question])
        if (results.length === 0 && text.includes('<')) {
            try {
                const doc = new DOMParser().parseFromString(text, 'text/html');
                doc.querySelectorAll('.quiz-item, .question-card, .question-block, [data-question]').forEach(el => {
                    const qText =
                        el.getAttribute('data-question') ||
                        (el.querySelector('.question-text, .question, h3, h4, p')?.textContent || '');
                    const optEls = el.querySelectorAll('.option, .choice, li, button[data-option]');
                    const opts = Array.from(optEls).map(o => o.textContent.trim()).filter(Boolean).slice(0, 4);
                    if (qText.trim() && opts.length >= 2) {
                        const ansAttr = el.getAttribute('data-correct') ?? el.getAttribute('data-answer') ?? '0';
                        let idx = Number(ansAttr);
                        if (!Number.isInteger(idx) || idx < 0 || idx >= opts.length) idx = 0;
                        while (opts.length < 4) opts.push(`بژاردە ${opts.length + 1}`);
                        pushQuiz({
                            question: qText.trim(),
                            options: opts,
                            correctIndex: idx,
                            explanation: el.getAttribute('data-explanation') || '',
                            chapter: defaultChapter,
                            difficulty: 'ناوەند'
                        });
                    }
                });
            } catch (_) {}
        }

        // 3. Text quiz blocks (1. Question \n A) ... B) ... C) ... D) ... Answer: B)
        if (results.length === 0) {
            const chunks = text.split(/(?=^\s*(?:\d+[\.\)]|Q\d*[:\.]))/m).filter(c => c.trim());
            chunks.forEach(chunk => {
                const lines = chunk.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                if (lines.length < 3) return;
                const qLine = lines[0].replace(/^\s*(?:\d+[\.\)]|Q\d*[:\.])\s*/i, '').trim();
                const opts = [];
                let correctIndex = 0;
                let explanation = '';
                lines.slice(1).forEach(line => {
                    const optMatch = line.match(/^([A-Da-d1-4أ-د])[\)\.\:\-]\s*(.+)$/);
                    if (optMatch && opts.length < 4) {
                        let optText = optMatch[2].trim();
                        if (optText.includes('*') || optText.includes('✓')) {
                            correctIndex = opts.length;
                            optText = optText.replace(/[\*✓]/g, '').trim();
                        }
                        opts.push(optText);
                    } else {
                        const ansMatch = line.match(/^(?:Answer|Correct|Ans|وەڵام|بەرسڤ)\s*[:：\-]\s*([A-Da-d1-4])/i);
                        if (ansMatch) {
                            const tok = ansMatch[1].toUpperCase();
                            if (['A', 'B', 'C', 'D'].includes(tok)) correctIndex = ['A', 'B', 'C', 'D'].indexOf(tok);
                            else if (['1', '2', '3', '4'].includes(tok)) correctIndex = Number(tok) - 1;
                        }
                        const expMatch = line.match(/^(?:Explanation|ڕوونکردنەوە|شەرح)\s*[:：\-]\s*(.+)$/i);
                        if (expMatch) explanation = expMatch[1].trim();
                    }
                });
                if (qLine && opts.length >= 2) {
                    while (opts.length < 4) opts.push(`بژاردە ${opts.length + 1}`);
                    if (correctIndex < 0 || correctIndex >= 4) correctIndex = 0;
                    pushQuiz({
                        question: qLine,
                        options: opts,
                        correctIndex,
                        explanation,
                        chapter: defaultChapter,
                        difficulty: 'ناوەند'
                    });
                }
            });
        }

        return results;
    }
};

// Global Singleton Export
window.CURRICULUM_SUBJECTS = CURRICULUM_SUBJECTS;
window.GRADES_CONFIG = GRADES_CONFIG;
window.UNIVERSITY_DEPARTMENTS = UNIVERSITY_DEPARTMENTS;
window.SUPPORTED_LANGS = SUPPORTED_LANGS;
window.EducationalData = new EducationalDataStore();
window.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
