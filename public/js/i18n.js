const TRANSLATIONS = {
  en: {
    dir: 'ltr',
    lang: 'en',
    brandName: 'PatientRFID',
    brandSub: 'Clinical Manager',
    navMain: 'Main',
    navDashboard: 'Dashboard',
    navReadCard: 'Read Card',
    navRegisterCard: 'Register Card',
    navManagePatients: 'Manage Patients',
    readerReady: 'Reader Ready',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',

    dashboardTitle: 'Dashboard',
    dashboardSubtitle: "Overview of your clinic's patient records",
    readCardTitle: 'Read Card',
    readCardSubtitle: "Scan a patient's RFID card to view their profile",
    registerCardTitle: 'Register Card',
    registerCardSubtitle: 'Link a new RFID card to a patient profile',
    managePatientsTitle: 'Manage Patients',
    managePatientsSubtitle: 'Search, edit, and manage all patient records',

    statTotalPatients: 'Total Patients',
    statActiveCards: 'Active Cards',
    statInactiveCards: 'Inactive Cards',
    statSystemStatus: 'System Status',
    statReady: 'Ready',

    lastActivity: 'Last Activity',
    noPatients: 'No patients registered yet',
    quickActions: 'Quick Actions',
    qaReadCard: 'Read Card',
    qaReadCardHint: "Scan a patient's RFID card",
    qaRegister: 'Register New Patient',
    qaRegisterHint: 'Link a new card to a patient',
    qaManage: 'Manage Patients',
    qaManageHint: 'Search, edit, and manage records',

    scanTitle: 'Scan Patient Card',
    scanHint: 'Place the RFID card on the reader to scan',
    enterRfidUid: 'Enter RFID UID...',
    scan: 'Scan',

    registerTitle: 'Register New Patient Card',
    registerHint: 'Scan a new RFID card, then complete the patient profile',
    checkCard: 'Check Card',
    patientInfo: 'Patient Information',
    fullName: 'Full Name',
    required: '*',
    enterFullName: 'Enter patient full name',
    requiredForId: 'Required for identification',
    age: 'Age',
    gender: 'Gender',
    selectGender: '-- Select --',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    diagnosis: 'Diagnosis',
    primaryDiagnosis: 'Primary diagnosis',
    notes: 'Notes',
    notesPlaceholder: 'Clinical observations, session notes...',
    customFields: 'Custom Fields',
    addField: 'Add Field',
    cancel: 'Cancel',
    registerPatient: 'Register Patient',

    allPatients: 'All Patients',
    searchPlaceholder: 'Search by name, RFID, or diagnosis...',
    refresh: 'Refresh',
    noPatientsFound: 'No patients found',
    tryDifferentSearch: 'Try a different search term',
    registerFromManage: 'Register patients using the Register Card tab',
    active: 'Active',
    inactive: 'Inactive',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    noDiagnosis: 'No diagnosis',

    editPatient: 'Edit Patient',
    saveChanges: 'Save Changes',
    fieldName: 'Field name',
    value: 'Value',
    remove: 'Remove',

    unregisteredCard: 'Unregistered Card',
    unregisteredText: 'This RFID card is not registered. Would you like to register a new patient with this card?',
    registerNewPatient: 'Register New Patient',

    confirmAction: 'Confirm Action',
    confirm: 'Confirm',

    deactivateTitle: 'Deactivate Patient Card',
    deactivateMsg: 'Are you sure you want to deactivate the card for "{name}"? The patient data will be preserved but the card will no longer work for scanning.',
    reactivateTitle: 'Reactivate Patient Card',
    reactivateMsg: 'Are you sure you want to reactivate the card for "{name}"? The patient will become active again.',

    alertEnterUid: 'Please scan or enter an RFID UID',
    alertCardRegistered: 'This card is already registered to: ',
    alertCardDeactivated: 'This card was previously deactivated. Use a new card or reactivate it from Manage.',
    alertCardAvailable: 'Card is available for registration!',
    alertNameRequired: 'Patient name is required',
    alertRegistered: 'Patient registered successfully!',
    alertUpdated: 'Patient updated successfully!',
    alertDeactivated: 'Patient card deactivated',
    alertReactivated: 'Patient card reactivated',

    cardDeactivatedTitle: 'Card Deactivated',
    cardDeactivatedMsg: 'This card was previously deactivated. You can reactivate it from the Manage tab.',

    scanning: 'Scanning...',
    cardDetected: 'Card Detected',
    scanError: 'Scan Error',
    unknownCard: 'Unknown Card',

    profileFullName: 'Full Name',
    profileAge: 'Age',
    profileGender: 'Gender',
    profileDiagnosis: 'Diagnosis',
    profileNotes: 'Notes',
    profileNoNotes: 'No notes',
    profileNA: 'N/A',
    profileRegistered: 'Registered',
    profileUpdated: 'Updated',
    additionalFields: 'Additional Fields',
    edit: 'Edit',

    justNow: 'Just now',
    mAgo: '{n}m ago',
    hAgo: '{n}h ago',
    dAgo: '{n}d ago',
  },

  ar: {
    dir: 'rtl',
    lang: 'ar',
    brandName: 'PatientRFID',
    brandSub: 'مدير العيادة',
    navMain: 'الرئيسية',
    navDashboard: 'لوحة القيادة',
    navReadCard: 'قراءة البطاقة',
    navRegisterCard: 'تسجيل بطاقة',
    navManagePatients: 'إدارة المرضى',
    readerReady: 'القارئ جاهز',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',

    dashboardTitle: 'لوحة القيادة',
    dashboardSubtitle: 'نظرة عامة على سجلات المرضى في عيادتك',
    readCardTitle: 'قراءة البطاقة',
    readCardSubtitle: 'امسح بطاقة RFID للمريض لعرض ملفه الشخصي',
    registerCardTitle: 'تسجيل بطاقة',
    registerCardSubtitle: 'ربط بطاقة RFID جديدة بملف مريض',
    managePatientsTitle: 'إدارة المرضى',
    managePatientsSubtitle: 'البحث والتعديل وإدارة جميع سجلات المرضى',

    statTotalPatients: 'إجمالي المرضى',
    statActiveCards: 'البطاقات النشطة',
    statInactiveCards: 'البطاقات غير النشطة',
    statSystemStatus: 'حالة النظام',
    statReady: 'جاهز',

    lastActivity: 'آخر نشاط',
    noPatients: 'لا يوجد مرضى مسجلون بعد',
    quickActions: 'إجراءات سريعة',
    qaReadCard: 'قراءة البطاقة',
    qaReadCardHint: 'امسح بطاقة RFID للمريض',
    qaRegister: 'تسجيل مريض جديد',
    qaRegisterHint: 'ربط بطاقة جديدة بمريض',
    qaManage: 'إدارة المرضى',
    qaManageHint: 'البحث والتعديل وإدارة السجلات',

    scanTitle: 'مسح بطاقة المريض',
    scanHint: 'ضع بطاقة RFID على القارئ للمسح',
    enterRfidUid: 'أدخل معرف RFID...',
    scan: 'مسح',

    registerTitle: 'تسجيل بطاقة مريض جديدة',
    registerHint: 'امسح بطاقة RFID جديدة، ثم أكمل ملف المريض',
    checkCard: 'فحص البطاقة',
    patientInfo: 'معلومات المريض',
    fullName: 'الاسم الكامل',
    required: '*',
    enterFullName: 'أدخل الاسم الكامل للمريض',
    requiredForId: 'مطلوب للتعريف',
    age: 'العمر',
    gender: 'الجنس',
    selectGender: '-- اختر --',
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    diagnosis: 'التشخيص',
    primaryDiagnosis: 'التشخيص الأولي',
    notes: 'ملاحظات',
    notesPlaceholder: 'ملاحظات سريرية، ملاحظات الجلسة...',
    customFields: 'حقول مخصصة',
    addField: 'إضافة حقل',
    cancel: 'إلغاء',
    registerPatient: 'تسجيل المريض',

    allPatients: 'جميع المرضى',
    searchPlaceholder: 'البحث بالاسم أو RFID أو التشخيص...',
    refresh: 'تحديث',
    noPatientsFound: 'لم يتم العثور على مرضى',
    tryDifferentSearch: 'جرب مصطلح بحث مختلف',
    registerFromManage: 'سجل المرضى باستخدام تبويب تسجيل البطاقة',
    active: 'نشط',
    inactive: 'غير نشط',
    deactivate: 'تعطيل',
    reactivate: 'إعادة تفعيل',
    noDiagnosis: 'بدون تشخيص',

    editPatient: 'تعديل المريض',
    saveChanges: 'حفظ التغييرات',
    fieldName: 'اسم الحقل',
    value: 'القيمة',
    remove: 'حذف',

    unregisteredCard: 'بطاقة غير مسجلة',
    unregisteredText: 'هذه البطاقة غير مسجلة. هل تريد تسجيل مريض جديد بهذه البطاقة؟',
    registerNewPatient: 'تسجيل مريض جديد',

    confirmAction: 'تأكيد الإجراء',
    confirm: 'تأكيد',

    deactivateTitle: 'تعطيل بطاقة المريض',
    deactivateMsg: 'هل أنت متأكد من تعطيل البطاقة لـ "{name}"؟ سيتم الاحتفاظ ببيانات المريض لكن البطاقة لن تعمل للمسح.',
    reactivateTitle: 'إعادة تفعيل بطاقة المريض',
    reactivateMsg: 'هل أنت متأكد من إعادة تفعيل البطاقة لـ "{name}"؟ سيصبح المريض نشطاً مرة أخرى.',

    alertEnterUid: 'يرجى مسح أو إدخال معرف RFID',
    alertCardRegistered: 'هذه البطاقة مسجلة بالفعل لـ: ',
    alertCardDeactivated: 'تم تعطيل هذه البطاقة سابقاً. استخدم بطاقة جديدة أو أعد تفعيلها من الإدارة.',
    alertCardAvailable: 'البطاقة متاحة للتسجيل!',
    alertNameRequired: 'اسم المريض مطلوب',
    alertRegistered: 'تم تسجيل المريض بنجاح!',
    alertUpdated: 'تم تحديث المريض بنجاح!',
    alertDeactivated: 'تم تعطيل بطاقة المريض',
    alertReactivated: 'تم إعادة تفعيل بطاقة المريض',

    cardDeactivatedTitle: 'البطاقة معطلة',
    cardDeactivatedMsg: 'تم تعطيل هذه البطاقة سابقاً. يمكنك إعادة تفعيلها من تبويب الإدارة.',

    scanning: 'جاري المسح...',
    cardDetected: 'تم كشف البطاقة',
    scanError: 'خطأ في المسح',
    unknownCard: 'بطاقة غير معروفة',

    profileFullName: 'الاسم الكامل',
    profileAge: 'العمر',
    profileGender: 'الجنس',
    profileDiagnosis: 'التشخيص',
    profileNotes: 'ملاحظات',
    profileNoNotes: 'لا توجد ملاحظات',
    profileNA: 'غ/م',
    profileRegistered: 'تاريخ التسجيل',
    profileUpdated: 'آخر تحديث',
    additionalFields: 'حقول إضافية',
    edit: 'تعديل',

    justNow: 'الآن',
    mAgo: 'منذ {n} دقيقة',
    hAgo: 'منذ {n} ساعة',
    dAgo: 'منذ {n} يوم',
  },

  fr: {
    dir: 'ltr',
    lang: 'fr',
    brandName: 'PatientRFID',
    brandSub: 'Gestionnaire Clinique',
    navMain: 'Principal',
    navDashboard: 'Tableau de bord',
    navReadCard: 'Lire la carte',
    navRegisterCard: 'Enregistrer carte',
    navManagePatients: 'Gérer les patients',
    readerReady: 'Lecteur prêt',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    language: 'Langue',

    dashboardTitle: 'Tableau de bord',
    dashboardSubtitle: "Vue d'ensemble des dossiers patients de votre clinique",
    readCardTitle: 'Lire la carte',
    readCardSubtitle: "Scannez la carte RFID d'un patient pour voir son profil",
    registerCardTitle: 'Enregistrer carte',
    registerCardSubtitle: "Associer une nouvelle carte RFID à un profil patient",
    managePatientsTitle: 'Gérer les patients',
    managePatientsSubtitle: 'Rechercher, modifier et gérer tous les dossiers patients',

    statTotalPatients: 'Total patients',
    statActiveCards: 'Cartes actives',
    statInactiveCards: 'Cartes inactives',
    statSystemStatus: 'État du système',
    statReady: 'Prêt',

    lastActivity: 'Dernière activité',
    noPatients: 'Aucun patient enregistré',
    quickActions: 'Actions rapides',
    qaReadCard: 'Lire la carte',
    qaReadCardHint: "Scanner la carte RFID d'un patient",
    qaRegister: 'Nouveau patient',
    qaRegisterHint: 'Associer une nouvelle carte à un patient',
    qaManage: 'Gérer les patients',
    qaManageHint: 'Rechercher, modifier et gérer les dossiers',

    scanTitle: 'Scanner la carte patient',
    scanHint: 'Placez la carte RFID sur le lecteur pour scanner',
    enterRfidUid: "Entrez l'UID RFID...",
    scan: 'Scanner',

    registerTitle: 'Enregistrer une nouvelle carte patient',
    registerHint: 'Scannez une nouvelle carte RFID, puis complétez le profil du patient',
    checkCard: 'Vérifier la carte',
    patientInfo: 'Informations du patient',
    fullName: 'Nom complet',
    required: '*',
    enterFullName: 'Entrez le nom complet du patient',
    requiredForId: "Requis pour l'identification",
    age: 'Âge',
    gender: 'Genre',
    selectGender: '-- Sélectionner --',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
    diagnosis: 'Diagnostic',
    primaryDiagnosis: 'Diagnostic principal',
    notes: 'Notes',
    notesPlaceholder: 'Observations cliniques, notes de séance...',
    customFields: 'Champs personnalisés',
    addField: 'Ajouter un champ',
    cancel: 'Annuler',
    registerPatient: 'Enregistrer le patient',

    allPatients: 'Tous les patients',
    searchPlaceholder: 'Rechercher par nom, RFID ou diagnostic...',
    refresh: 'Actualiser',
    noPatientsFound: 'Aucun patient trouvé',
    tryDifferentSearch: 'Essayez un autre terme de recherche',
    registerFromManage: "Enregistrez des patients via l'onglet Enregistrer carte",
    active: 'Actif',
    inactive: 'Inactif',
    deactivate: 'Désactiver',
    reactivate: 'Réactiver',
    noDiagnosis: 'Aucun diagnostic',

    editPatient: 'Modifier le patient',
    saveChanges: 'Enregistrer',
    fieldName: 'Nom du champ',
    value: 'Valeur',
    remove: 'Supprimer',

    unregisteredCard: 'Carte non enregistrée',
    unregisteredText: "Cette carte RFID n'est pas enregistrée. Souhaitez-vous enregistrer un nouveau patient avec cette carte ?",
    registerNewPatient: 'Enregistrer nouveau patient',

    confirmAction: "Confirmer l'action",
    confirm: 'Confirmer',

    deactivateTitle: 'Désactiver la carte patient',
    deactivateMsg: 'Êtes-vous sûr de vouloir désactiver la carte de "{name}" ? Les données seront conservées mais la carte ne fonctionnera plus.',
    reactivateTitle: 'Réactiver la carte patient',
    reactivateMsg: 'Êtes-vous sûr de vouloir réactiver la carte de "{name}" ? Le patient redeviendra actif.',

    alertEnterUid: 'Veuillez scanner ou entrer un UID RFID',
    alertCardRegistered: 'Cette carte est déjà enregistrée pour : ',
    alertCardDeactivated: "Cette carte a été désactivée. Utilisez une nouvelle carte ou réactivez-la depuis l'onglet Gestion.",
    alertCardAvailable: "La carte est disponible pour l'enregistrement !",
    alertNameRequired: 'Le nom du patient est requis',
    alertRegistered: 'Patient enregistré avec succès !',
    alertUpdated: 'Patient mis à jour avec succès !',
    alertDeactivated: 'Carte patient désactivée',
    alertReactivated: 'Carte patient réactivée',

    cardDeactivatedTitle: 'Carte désactivée',
    cardDeactivatedMsg: "Cette carte a été désactivée. Vous pouvez la réactiver depuis l'onglet Gestion.",

    scanning: 'Analyse en cours...',
    cardDetected: 'Carte détectée',
    scanError: "Erreur d'analyse",
    unknownCard: 'Carte inconnue',

    profileFullName: 'Nom complet',
    profileAge: 'Âge',
    profileGender: 'Genre',
    profileDiagnosis: 'Diagnostic',
    profileNotes: 'Notes',
    profileNoNotes: 'Aucune note',
    profileNA: 'N/D',
    profileRegistered: 'Enregistré le',
    profileUpdated: 'Mis à jour le',
    additionalFields: 'Champs supplémentaires',
    edit: 'Modifier',

    justNow: "À l'instant",
    mAgo: 'Il y a {n} min',
    hAgo: 'Il y a {n}h',
    dAgo: 'Il y a {n}j',
  }
};

let currentLang = 'en';

function t(key, replacements = {}) {
  const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let text = translations[key] || TRANSLATIONS.en[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('rfid-lang', lang);

  const dir = TRANSLATIONS[lang].dir;
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);

  applyTranslations();
  updatePageConfig();

  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = lang;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });

  const themeLabel = document.querySelector('.theme-label');
  if (themeLabel) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    themeLabel.textContent = currentTheme === 'dark' ? t('lightMode') : t('darkMode');
  }
}

function updatePageConfig() {
  PAGE_CONFIG.dashboard = { title: t('dashboardTitle'), subtitle: t('dashboardSubtitle') };
  PAGE_CONFIG.reading   = { title: t('readCardTitle'),  subtitle: t('readCardSubtitle') };
  PAGE_CONFIG.manage    = { title: t('managePatientsTitle'), subtitle: t('managePatientsSubtitle') };

  const config = PAGE_CONFIG[currentMode];
  if (config) {
    document.getElementById('page-title').textContent = config.title;
    document.getElementById('page-subtitle').textContent = config.subtitle;
  }
}

function initLanguage() {
  const saved = localStorage.getItem('rfid-lang');
  currentLang = saved && TRANSLATIONS[saved] ? saved : 'en';
  setLanguage(currentLang);
}
