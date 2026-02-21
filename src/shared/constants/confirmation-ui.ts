import { LanguageCode, ConfirmationUIStrings, RecordingUIStrings, PreviewUIStrings, UpgradeUIStrings } from '../types';

export const CONFIRMATION_STRINGS: Record<LanguageCode, ConfirmationUIStrings> = {
  // Hindi
  hi: {
    youSaid: 'आपने कहा:',
    isCorrect: 'क्या यह सही है?',
    edit: 'संपादित करें',
    objectiveLabel: 'आपका उद्देश्य क्या है?',
    options: {
      newFeature: 'नई सुविधा बनाना',
      bugFix: 'बग ठीक करना',
      design: 'डिज़ाइन सुधारना',
      other: 'अन्य',
    },
    contextLabel: 'अतिरिक्त संदर्भ (वैकल्पिक):',
    contextPlaceholder: 'कोई अतिरिक्त जानकारी यहाँ लिखें...',
    proceed: 'आगे बढ़ें',
    cancel: 'रद्द करें',
  },

  // Bengali
  bn: {
    youSaid: 'আপনি বললেন:',
    isCorrect: 'এটা কি সঠিক?',
    edit: 'সম্পাদনা করুন',
    objectiveLabel: 'আপনার উদ্দেশ্য কী?',
    options: {
      newFeature: 'নতুন ফিচার তৈরি করা',
      bugFix: 'বাগ ঠিক করা',
      design: 'ডিজাইন উন্নত করা',
      other: 'অন্যান্য',
    },
    contextLabel: 'অতিরিক্ত প্রসঙ্গ (ঐচ্ছিক):',
    contextPlaceholder: 'যেকোনো অতিরিক্ত তথ্য এখানে লিখুন...',
    proceed: 'এগিয়ে যান',
    cancel: 'বাতিল',
  },

  // Tamil
  ta: {
    youSaid: 'நீங்கள் சொன்னீர்கள்:',
    isCorrect: 'இது சரியா?',
    edit: 'திருத்து',
    objectiveLabel: 'உங்கள் நோக்கம் என்ன?',
    options: {
      newFeature: 'புதிய அம்சம் உருவாக்க',
      bugFix: 'பிழையை சரிசெய்ய',
      design: 'வடிவமைப்பை மேம்படுத்த',
      other: 'மற்றவை',
    },
    contextLabel: 'கூடுதல் சூழல் (விருப்பமானது):',
    contextPlaceholder: 'கூடுதல் தகவல் இங்கே எழுதவும்...',
    proceed: 'தொடரவும்',
    cancel: 'ரத்து செய்',
  },

  // Telugu
  te: {
    youSaid: 'మీరు చెప్పారు:',
    isCorrect: 'ఇది సరైనదా?',
    edit: 'సవరించు',
    objectiveLabel: 'మీ లక్ష్యం ఏమిటి?',
    options: {
      newFeature: 'కొత్త ఫీచర్ సృష్టించడం',
      bugFix: 'బగ్ సరిచేయడం',
      design: 'డిజైన్ మెరుగుపరచడం',
      other: 'ఇతర',
    },
    contextLabel: 'అదనపు సందర్భం (ఐచ్ఛికం):',
    contextPlaceholder: 'అదనపు సమాచారం ఇక్కడ రాయండి...',
    proceed: 'కొనసాగించు',
    cancel: 'రద్దు చేయి',
  },

  // Marathi
  mr: {
    youSaid: 'तुम्ही म्हणालात:',
    isCorrect: 'हे बरोबर आहे का?',
    edit: 'संपादित करा',
    objectiveLabel: 'तुमचे उद्दिष्ट काय आहे?',
    options: {
      newFeature: 'नवीन वैशिष्ट्य तयार करणे',
      bugFix: 'बग दुरुस्त करणे',
      design: 'डिझाइन सुधारणे',
      other: 'इतर',
    },
    contextLabel: 'अतिरिक्त संदर्भ (पर्यायी):',
    contextPlaceholder: 'कोणतीही अतिरिक्त माहिती येथे लिहा...',
    proceed: 'पुढे जा',
    cancel: 'रद्द करा',
  },

  // Kannada
  kn: {
    youSaid: 'ನೀವು ಹೇಳಿದಿರಿ:',
    isCorrect: 'ಇದು ಸರಿಯೇ?',
    edit: 'ಸಂಪಾದಿಸಿ',
    objectiveLabel: 'ನಿಮ್ಮ ಉದ್ದೇಶ ಏನು?',
    options: {
      newFeature: 'ಹೊಸ ವೈಶಿಷ್ಟ್ಯ ರಚಿಸಲು',
      bugFix: 'ಬಗ್ ಸರಿಪಡಿಸಲು',
      design: 'ವಿನ್ಯಾಸ ಸುಧಾರಿಸಲು',
      other: 'ಇತರ',
    },
    contextLabel: 'ಹೆಚ್ಚುವರಿ ಸಂದರ್ಭ (ಐಚ್ಛಿಕ):',
    contextPlaceholder: 'ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ ಇಲ್ಲಿ ಬರೆಯಿರಿ...',
    proceed: 'ಮುಂದುವರಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
  },

  // Gujarati
  gu: {
    youSaid: 'તમે કહ્યું:',
    isCorrect: 'આ સાચું છે?',
    edit: 'સંપાદિત કરો',
    objectiveLabel: 'તમારો ઉદ્દેશ શું છે?',
    options: {
      newFeature: 'નવી સુવિધા બનાવવી',
      bugFix: 'બગ ઠીક કરવો',
      design: 'ડિઝાઇન સુધારવી',
      other: 'અન્ય',
    },
    contextLabel: 'વધારાનો સંદર્ભ (વૈકલ્પિક):',
    contextPlaceholder: 'કોઈપણ વધારાની માહિતી અહીં લખો...',
    proceed: 'આગળ વધો',
    cancel: 'રદ કરો',
  },

  // Malayalam
  ml: {
    youSaid: 'നിങ്ങൾ പറഞ്ഞു:',
    isCorrect: 'ഇത് ശരിയാണോ?',
    edit: 'എഡിറ്റ് ചെയ്യുക',
    objectiveLabel: 'നിങ്ങളുടെ ലക്ഷ്യം എന്താണ്?',
    options: {
      newFeature: 'പുതിയ ഫീച്ചർ സൃഷ്ടിക്കുക',
      bugFix: 'ബഗ് പരിഹരിക്കുക',
      design: 'ഡിസൈൻ മെച്ചപ്പെടുത്തുക',
      other: 'മറ്റുള്ളവ',
    },
    contextLabel: 'അധിക സന്ദർഭം (ഓപ്ഷണൽ):',
    contextPlaceholder: 'ഏതെങ്കിലും അധിക വിവരങ്ങൾ ഇവിടെ എഴുതുക...',
    proceed: 'തുടരുക',
    cancel: 'റദ്ദാക്കുക',
  },

  // Punjabi
  pa: {
    youSaid: 'ਤੁਸੀਂ ਕਿਹਾ:',
    isCorrect: 'ਕੀ ਇਹ ਸਹੀ ਹੈ?',
    edit: 'ਸੰਪਾਦਿਤ ਕਰੋ',
    objectiveLabel: 'ਤੁਹਾਡਾ ਉਦੇਸ਼ ਕੀ ਹੈ?',
    options: {
      newFeature: 'ਨਵੀਂ ਵਿਸ਼ੇਸ਼ਤਾ ਬਣਾਉਣਾ',
      bugFix: 'ਬੱਗ ਠੀਕ ਕਰਨਾ',
      design: 'ਡਿਜ਼ਾਈਨ ਸੁਧਾਰਨਾ',
      other: 'ਹੋਰ',
    },
    contextLabel: 'ਵਾਧੂ ਸੰਦਰਭ (ਵਿਕਲਪਿਕ):',
    contextPlaceholder: 'ਕੋਈ ਵੀ ਵਾਧੂ ਜਾਣਕਾਰੀ ਇੱਥੇ ਲਿਖੋ...',
    proceed: 'ਅੱਗੇ ਵਧੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
  },

  // Odia
  or: {
    youSaid: 'ଆପଣ କହିଲେ:',
    isCorrect: 'ଏହା ସଠିକ୍ କି?',
    edit: 'ସମ୍ପାଦନା କରନ୍ତୁ',
    objectiveLabel: 'ଆପଣଙ୍କ ଉଦ୍ଦେଶ୍ୟ କ\'ଣ?',
    options: {
      newFeature: 'ନୂଆ ବୈଶିଷ୍ଟ୍ୟ ସୃଷ୍ଟି କରିବା',
      bugFix: 'ବଗ୍ ଠିକ୍ କରିବା',
      design: 'ଡିଜାଇନ୍ ସୁଧାରିବା',
      other: 'ଅନ୍ୟ',
    },
    contextLabel: 'ଅତିରିକ୍ତ ପ୍ରସଙ୍ଗ (ଐଚ୍ଛିକ):',
    contextPlaceholder: 'ଯେକୌଣସି ଅତିରିକ୍ତ ତଥ୍ୟ ଏଠାରେ ଲେଖନ୍ତୁ...',
    proceed: 'ଆଗକୁ ବଢ଼ନ୍ତୁ',
    cancel: 'ବାତିଲ୍ କରନ୍ତୁ',
  },

  // Assamese
  as: {
    youSaid: 'আপুনি কৈছিল:',
    isCorrect: 'এইটো সঠিক নেকি?',
    edit: 'সম্পাদনা কৰক',
    objectiveLabel: 'আপোনাৰ উদ্দেশ্য কি?',
    options: {
      newFeature: 'নতুন ফিচাৰ সৃষ্টি কৰা',
      bugFix: 'বাগ ঠিক কৰা',
      design: 'ডিজাইন উন্নত কৰা',
      other: 'অন্যান্য',
    },
    contextLabel: 'অতিৰিক্ত প্ৰসংগ (ঐচ্ছিক):',
    contextPlaceholder: 'যিকোনো অতিৰিক্ত তথ্য ইয়াত লিখক...',
    proceed: 'আগবাঢ়ক',
    cancel: 'বাতিল কৰক',
  },

  // Sanskrit
  sa: {
    youSaid: 'भवान् अवदत्:',
    isCorrect: 'किम् एतत् सम्यक्?',
    edit: 'सम्पादयतु',
    objectiveLabel: 'भवतः उद्देश्यं किम्?',
    options: {
      newFeature: 'नवं वैशिष्ट्यं निर्मातुम्',
      bugFix: 'दोषं समाधातुम्',
      design: 'विन्यासं सुधारयितुम्',
      other: 'अन्यत्',
    },
    contextLabel: 'अतिरिक्तः सन्दर्भः (ऐच्छिकम्):',
    contextPlaceholder: 'किमपि अतिरिक्तं सूचनाम् अत्र लिखतु...',
    proceed: 'अग्रे गच्छतु',
    cancel: 'निरस्तं करोतु',
  },

  // Nepali
  ne: {
    youSaid: 'तपाईंले भन्नुभयो:',
    isCorrect: 'के यो सही हो?',
    edit: 'सम्पादन गर्नुहोस्',
    objectiveLabel: 'तपाईंको उद्देश्य के हो?',
    options: {
      newFeature: 'नयाँ सुविधा बनाउने',
      bugFix: 'बग ठीक गर्ने',
      design: 'डिजाइन सुधार्ने',
      other: 'अन्य',
    },
    contextLabel: 'अतिरिक्त सन्दर्भ (वैकल्पिक):',
    contextPlaceholder: 'कुनै अतिरिक्त जानकारी यहाँ लेख्नुहोस्...',
    proceed: 'अगाडि बढ्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
  },

  // Kashmiri
  ks: {
    youSaid: 'تۄہی وۅنُو:',
    isCorrect: 'کیا یہ ٹھیک چھُہ?',
    edit: 'ترمیم کرو',
    objectiveLabel: 'تُہند مقصد کیا چھُہ?',
    options: {
      newFeature: 'نوٚو فیچر بناونہٕ',
      bugFix: 'بگ ٹھیک کرنہٕ',
      design: 'ڈیزائن بہتر کرنہٕ',
      other: 'باقی',
    },
    contextLabel: 'اضافی سیاق (اختیاری):',
    contextPlaceholder: 'کانہہ اضافی معلومات یتہِ لیکھو...',
    proceed: 'اگاڑ بڑو',
    cancel: 'منسوخ کرو',
  },

  // Spanish
  es: {
    youSaid: 'Dijiste:',
    isCorrect: '¿Es correcto?',
    edit: 'Editar',
    objectiveLabel: '¿Cuál es su objetivo?',
    options: {
      newFeature: 'Crear nueva función',
      bugFix: 'Corregir error',
      design: 'Mejorar diseño',
      other: 'Otro',
    },
    contextLabel: 'Contexto adicional (opcional):',
    contextPlaceholder: 'Escriba cualquier información adicional aquí...',
    proceed: 'Continuar',
    cancel: 'Cancelar',
  },

  // German
  de: {
    youSaid: 'Sie sagten:',
    isCorrect: 'Ist das korrekt?',
    edit: 'Bearbeiten',
    objectiveLabel: 'Was ist Ihr Ziel?',
    options: {
      newFeature: 'Neue Funktion erstellen',
      bugFix: 'Fehler beheben',
      design: 'Design verbessern',
      other: 'Sonstiges',
    },
    contextLabel: 'Zusätzlicher Kontext (optional):',
    contextPlaceholder: 'Schreiben Sie hier zusätzliche Informationen...',
    proceed: 'Fortfahren',
    cancel: 'Abbrechen',
  },

  // Mandarin Chinese
  zh: {
    youSaid: '您说：',
    isCorrect: '这正确吗？',
    edit: '编辑',
    objectiveLabel: '您的目标是什么？',
    options: {
      newFeature: '创建新功能',
      bugFix: '修复错误',
      design: '改进设计',
      other: '其他',
    },
    contextLabel: '额外背景（可选）：',
    contextPlaceholder: '在此处输入任何额外信息...',
    proceed: '继续',
    cancel: '取消',
  },

  // Bahasa Indonesia
  id: {
    youSaid: 'Anda berkata:',
    isCorrect: 'Apakah ini benar?',
    edit: 'Edit',
    objectiveLabel: 'Apa tujuan Anda?',
    options: {
      newFeature: 'Membuat fitur baru',
      bugFix: 'Memperbaiki bug',
      design: 'Memperbaiki desain',
      other: 'Lainnya',
    },
    contextLabel: 'Konteks tambahan (opsional):',
    contextPlaceholder: 'Tulis informasi tambahan di sini...',
    proceed: 'Lanjutkan',
    cancel: 'Batal',
  },
};

export const RECORDING_STRINGS: Record<LanguageCode, RecordingUIStrings> = {
  hi: {
    recording: 'रिकॉर्डिंग...',
    processing: 'प्रोसेसिंग...',
    transcribing: 'ऑडियो ट्रांसक्राइब हो रहा है...',
    detectingLanguage: 'भाषा का पता लगाया जा रहा है...',
    stopRecording: 'रिकॉर्डिंग बंद करें',
    speakInYourLanguage: 'अपनी भाषा में बोलें',
  },
  bn: {
    recording: 'রেকর্ডিং...',
    processing: 'প্রসেসিং...',
    transcribing: 'অডিও ট্রান্সক্রাইব হচ্ছে...',
    detectingLanguage: 'ভাষা সনাক্ত হচ্ছে...',
    stopRecording: 'রেকর্ডিং বন্ধ করুন',
    speakInYourLanguage: 'আপনার ভাষায় বলুন',
  },
  ta: {
    recording: 'பதிவு செய்கிறது...',
    processing: 'செயலாக்கம்...',
    transcribing: 'ஆடியோ டிரான்ஸ்கிரைப் செய்யப்படுகிறது...',
    detectingLanguage: 'மொழி கண்டறியப்படுகிறது...',
    stopRecording: 'பதிவை நிறுத்து',
    speakInYourLanguage: 'உங்கள் மொழியில் பேசுங்கள்',
  },
  te: {
    recording: 'రికార్డింగ్...',
    processing: 'ప్రాసెసింగ్...',
    transcribing: 'ఆడియో ట్రాన్స్‌క్రైబ్ చేయబడుతోంది...',
    detectingLanguage: 'భాష గుర్తించబడుతోంది...',
    stopRecording: 'రికార్డింగ్ ఆపండి',
    speakInYourLanguage: 'మీ భాషలో మాట్లాడండి',
  },
  mr: {
    recording: 'रेकॉर्डिंग...',
    processing: 'प्रोसेसिंग...',
    transcribing: 'ऑडिओ ट्रान्सक्राइब होत आहे...',
    detectingLanguage: 'भाषा शोधली जात आहे...',
    stopRecording: 'रेकॉर्डिंग थांबवा',
    speakInYourLanguage: 'तुमच्या भाषेत बोला',
  },
  kn: {
    recording: 'ರೆಕಾರ್ಡಿಂಗ್...',
    processing: 'ಪ್ರೊಸೆಸ್ ಆಗುತ್ತಿದೆ...',
    transcribing: 'ಆಡಿಯೋ ಟ್ರಾನ್ಸ್‌ಕ್ರೈಬ್ ಆಗುತ್ತಿದೆ...',
    detectingLanguage: 'ಭಾಷೆ ಪತ್ತೆ ಆಗುತ್ತಿದೆ...',
    stopRecording: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    speakInYourLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ',
  },
  gu: {
    recording: 'રેકોર્ડિંગ...',
    processing: 'પ્રોસેસિંગ...',
    transcribing: 'ઓડિયો ટ્રાન્સક્રાઇબ થઈ રહ્યું છે...',
    detectingLanguage: 'ભાષા શોધાઈ રહી છે...',
    stopRecording: 'રેકોર્ડિંગ બંધ કરો',
    speakInYourLanguage: 'તમારી ભાષામાં બોલો',
  },
  ml: {
    recording: 'റെക്കോർഡിംഗ്...',
    processing: 'പ്രോസസ്സിംഗ്...',
    transcribing: 'ഓഡിയോ ട്രാൻസ്ക്രൈബ് ചെയ്യുന്നു...',
    detectingLanguage: 'ഭാഷ കണ്ടെത്തുന്നു...',
    stopRecording: 'റെക്കോർഡിംഗ് നിർത്തുക',
    speakInYourLanguage: 'നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കുക',
  },
  pa: {
    recording: 'ਰਿਕਾਰਡਿੰਗ...',
    processing: 'ਪ੍ਰੋਸੈਸਿੰਗ...',
    transcribing: 'ਆਡੀਓ ਟ੍ਰਾਂਸਕ੍ਰਾਈਬ ਹੋ ਰਿਹਾ ਹੈ...',
    detectingLanguage: 'ਭਾਸ਼ਾ ਦਾ ਪਤਾ ਲਗਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
    stopRecording: 'ਰਿਕਾਰਡਿੰਗ ਬੰਦ ਕਰੋ',
    speakInYourLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ',
  },
  or: {
    recording: 'ରେକର୍ଡିଂ...',
    processing: 'ପ୍ରକ୍ରିୟାକରଣ...',
    transcribing: 'ଅଡିଓ ଟ୍ରାନ୍ସକ୍ରାଇବ୍ ହେଉଛି...',
    detectingLanguage: 'ଭାଷା ଚିହ୍ନଟ ହେଉଛି...',
    stopRecording: 'ରେକର୍ଡିଂ ବନ୍ଦ କରନ୍ତୁ',
    speakInYourLanguage: 'ଆପଣଙ୍କ ଭାଷାରେ କୁହନ୍ତୁ',
  },
  as: {
    recording: 'ৰেকৰ্ডিং...',
    processing: 'প্ৰক্ৰিয়াকৰণ...',
    transcribing: 'অডিঅ\' ট্ৰান্সক্ৰাইব হৈ আছে...',
    detectingLanguage: 'ভাষা চিনাক্ত হৈ আছে...',
    stopRecording: 'ৰেকৰ্ডিং বন্ধ কৰক',
    speakInYourLanguage: 'আপোনাৰ ভাষাত কওক',
  },
  sa: {
    recording: 'अभिलेखनम्...',
    processing: 'संस्करणम्...',
    transcribing: 'श्रव्यं लिप्यन्तरितं भवति...',
    detectingLanguage: 'भाषा ज्ञायते...',
    stopRecording: 'अभिलेखनं निवर्तयतु',
    speakInYourLanguage: 'भवतः भाषायां वदतु',
  },
  ne: {
    recording: 'रेकर्डिङ...',
    processing: 'प्रशोधन...',
    transcribing: 'अडियो ट्रान्सक्राइब भइरहेको छ...',
    detectingLanguage: 'भाषा पत्ता लगाइँदैछ...',
    stopRecording: 'रेकर्डिङ रोक्नुहोस्',
    speakInYourLanguage: 'आफ्नो भाषामा बोल्नुहोस्',
  },
  ks: {
    recording: 'ریکارڈنگ...',
    processing: 'پراسیسنگ...',
    transcribing: 'آڈیو ٹرانسکرائب ہیوٚ رؤد...',
    detectingLanguage: 'زبان معلوم ہیوٚ رؤد...',
    stopRecording: 'ریکارڈنگ بند کرو',
    speakInYourLanguage: 'پننہِ زبانہِ منٛز بولو',
  },
  es: {
    recording: 'Grabando...',
    processing: 'Procesando...',
    transcribing: 'Transcribiendo audio...',
    detectingLanguage: 'Detectando idioma...',
    stopRecording: 'Detener grabación',
    speakInYourLanguage: 'Hable en su idioma',
  },
  de: {
    recording: 'Aufnahme...',
    processing: 'Verarbeitung...',
    transcribing: 'Audio wird transkribiert...',
    detectingLanguage: 'Sprache wird erkannt...',
    stopRecording: 'Aufnahme beenden',
    speakInYourLanguage: 'Sprechen Sie in Ihrer Sprache',
  },
  zh: {
    recording: '录音中...',
    processing: '处理中...',
    transcribing: '正在转录音频...',
    detectingLanguage: '正在检测语言...',
    stopRecording: '停止录音',
    speakInYourLanguage: '用您的语言说话',
  },
  id: {
    recording: 'Merekam...',
    processing: 'Memproses...',
    transcribing: 'Mentranskrip audio...',
    detectingLanguage: 'Mendeteksi bahasa...',
    stopRecording: 'Hentikan perekaman',
    speakInYourLanguage: 'Bicara dalam bahasa Anda',
  },
};

export const PREVIEW_STRINGS: PreviewUIStrings = {
  elaboratedPrompt: 'Elaborated Prompt:',
  insertIntoLovable: 'Insert into Lovable',
  edit: 'Edit',
  cancel: 'Cancel',
};

export const UPGRADE_STRINGS: UpgradeUIStrings = {
  title: 'Daily Limit Reached',
  message: 'You have used all 5 free voice prompts for today. Upgrade to Pro for unlimited prompts.',
  upgradeButton: 'Upgrade to Pro',
  dismissButton: 'Maybe Later',
};

export function getConfirmationStrings(languageCode: LanguageCode): ConfirmationUIStrings {
  return CONFIRMATION_STRINGS[languageCode] || CONFIRMATION_STRINGS.hi;
}

export function getRecordingStrings(languageCode: LanguageCode): RecordingUIStrings {
  return RECORDING_STRINGS[languageCode] || RECORDING_STRINGS.hi;
}
