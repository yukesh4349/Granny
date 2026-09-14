// ============================================================================
// i18n Translation Engine for Granny Mobile (Tamil & English)
// Ported from web i18n/index.ts
// ============================================================================

export type Language = 'en' | 'ta';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand
    app_name: 'Granny',
    tagline: 'Happy Memories & Daily Care for Elders',
    
    // Auth
    auth_welcome_title: 'Grandpa & Grandma Care',
    auth_welcome_sub: 'Sign in or register to care for Grandpa & Grandma',
    full_name: 'Full Name / Username',
    phone_number: 'Phone Number (e.g. +91 9876543210)',
    email_address: 'Email Address',
    password: 'Password',
    role_label: 'Select Role',
    role_elder: '👵👴 Elder (Grandma / Grandpa)',
    role_caregiver: '👨‍👩‍👧 Caregiver / Family Member',
    auth_submit_login: 'Sign In',
    auth_submit_register: 'Create Account',
    or_demo: 'Or try directly:',
    demo_elder_btn: '👵👴 Elder Demo (Paati & Thatha)',
    demo_caregiver_btn: '👥 Caregiver Demo',
    auth_loading: 'Connecting...',
    sign_in: 'Sign In',
    register: 'Register',
    sign_out: 'Sign Out',
    
    // Nav
    nav_home: 'Home',
    nav_companion: 'Asha AI',
    nav_family: 'Family',
    nav_games: 'Games',
    nav_health: 'Health',
    nav_memory: 'Memories',
    nav_settings: 'Settings',
    nav_caretaker_insights: 'Caregiver Home',
    nav_overview: 'Activity',
    nav_alarms: 'Alarms',
    nav_medical: 'Medical',
    nav_upload_memories: 'Memories',
    nav_contacts: 'Contacts',
    nav_link_elder: 'Link Elder',
    
    // Home
    hello_user: 'Hello',
    how_feeling: 'How are you feeling today?',
    talk_to_granny: 'Talk to Asha',
    voice_companion_chat: 'Patient and friendly voice chat',
    family_circle: 'Call Family',
    family_circle_desc: 'Call loved ones in 1 tap',
    play_games: 'Play Games',
    ten_memory_games: '20 Nostalgia Games',
    health_and_meds: 'Health & Alarms',
    reminders_schedule: 'Medication schedule',
    memories: 'Memories',
    your_life_stories: 'Family photos & stories',
    emergency_sos: '🚨 Emergency SOS',
    
    // Games
    games_title: '20 Classic Memory Games',
    games_cat_all: 'All 20 Games',
    games_cat_outdoor: 'Outdoor & Street',
    games_cat_indoor: 'Indoor & Board',
    games_cat_cinema: 'Tamil Cinema & Music',
    
    // Link code
    your_link_code: 'Your Elder Link Code:',
    share_link_code_sub: 'Share this code with your caregiver.',
    copy_code: 'Copy Code',
    code_copied: 'Copied!',
    link_code_title: 'Connect Elder Device',
    link_code_placeholder: 'e.g. GRN-7294',
    link_button: 'Connect to Elder',
    link_success: 'Successfully connected to',
    
    // Medical
    med_reports_title: 'Medical Reports & Prescriptions',
    upload_new_report: '+ Add Medical Report',
    save_report: 'Save Report',
    report_title_label: 'Report Title',
    doctor_name_label: 'Doctor / Hospital Name',
    category_label: 'Report Type',
    report_summary_label: 'Doctor Advice / Summary',
    report_notes_label: 'Caregiver Notes',
    
    // Alarms
    alarms_title: 'Alarms & Daily Reminders',
    add_alarm: '+ Set New Reminder',
    alarm_title_placeholder: 'e.g. Morning Blood Pressure Tablet',
    alarm_time: 'Alarm Time',
    alarm_type: 'Reminder Type',
    save_alarm: 'Save Alarm',
    
    // Contacts
    contacts_title: 'Family & Emergency Contacts',
    add_contact: '+ Add Family Member',
    contact_name: 'Name',
    contact_relation: 'Relationship',
    contact_phone: 'Phone Number',
    save_contact: 'Save Contact',
    call_now: '📞 Call Now',
    
    // Care guide
    care_guide_title: 'Elder Care Tips & Notes',
    save_guidelines: 'Save Care Tips',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
  },
  
  ta: {
    // Brand
    app_name: 'Granny',
    tagline: 'முதியோருக்கான அன்பான நினைவாற்றல் சரணாலயம்',
    
    // Auth
    auth_welcome_title: 'தாத்தா & பாட்டி சரணாலயம்',
    auth_welcome_sub: 'நினைவுகளைப் பாதுகாக்கவும் கண்காணிக்கவும் உள்நுழையவும்',
    full_name: 'முழு பெயர் / பயனர் பெயர்',
    phone_number: 'தொலைபேசி எண் (உதா: +91 9876543210)',
    email_address: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    role_label: 'பயனர் வகை',
    role_elder: '👵👴 தாத்தா / பாட்டி (முதியோர்)',
    role_caregiver: '👨‍👩‍👧 பராமரிப்பாளர் / குடும்ப உறுப்பினர்',
    auth_submit_login: 'உள்நுழைக',
    auth_submit_register: 'புதிய கணக்கை உருவாக்குக',
    or_demo: 'அல்லது நேரடியாக முயன்று பாருங்கள்:',
    demo_elder_btn: '👵👴 தாத்தா & பாட்டி சோதனை',
    demo_caregiver_btn: '👥 பராமரிப்பாளர் சோதனை',
    auth_loading: 'இணைக்கப்படுகிறது...',
    sign_in: 'உள்நுழைக',
    register: 'பதிவு செய்க',
    sign_out: 'வெளியேறு',
    
    // Nav
    nav_home: 'முகப்பு',
    nav_companion: 'ஆஷா AI',
    nav_family: 'குடும்பம்',
    nav_games: 'விளையாட்டுகள்',
    nav_health: 'உடல்நலம்',
    nav_memory: 'நினைவுகள்',
    nav_settings: 'அமைப்புகள்',
    nav_caretaker_insights: 'பராமரிப்பாளர் தளம்',
    nav_overview: 'செயல்பாடு',
    nav_alarms: 'அலாரங்கள்',
    nav_medical: 'மருத்துவம்',
    nav_upload_memories: 'நினைவுகள்',
    nav_contacts: 'தொடர்புகள்',
    nav_link_elder: 'முதியோரை இணைக்க',
    
    // Home
    hello_user: 'வணக்கம்',
    how_feeling: 'இன்று உங்கள் உடல்நலமும் மனநலமும் எப்படி உள்ளது?',
    talk_to_granny: 'ஆஷாவுடன் பேசுங்கள்',
    voice_companion_chat: 'அமைதியான குரல் உரையாடல்',
    family_circle: 'குடும்ப வட்டம்',
    family_circle_desc: 'ஒரே தொடுதலில் அன்பு அழைப்பு',
    play_games: 'விளையாட்டுகள்',
    ten_memory_games: '20 பாரம்பரிய விளையாட்டுகள்',
    health_and_meds: 'உடல்நலம் & அலாரங்கள்',
    reminders_schedule: 'மருந்து அட்டவணை',
    memories: 'நினைவுகள்',
    your_life_stories: 'குடும்ப புகைப்படங்கள் & கதைகள்',
    emergency_sos: '🚨 அவசர உதவி (SOS)',
    
    // Games
    games_title: '20 பாரம்பரிய நினைவாற்றல் விளையாட்டுகள்',
    games_cat_all: 'அனைத்து 20 விளையாட்டுகள்',
    games_cat_outdoor: 'வெளிப்புற & பாரம்பரியம்',
    games_cat_indoor: 'உட்புற & தாயக்கட்டம்',
    games_cat_cinema: 'தமிழ் சினிமா & இசை',
    
    // Link code
    your_link_code: 'உங்கள் இணைப்பு குறியீடு:',
    share_link_code_sub: 'இந்த குறியீட்டை உங்கள் பராமரிப்பாளரிடம் பகிருங்கள்.',
    copy_code: 'குறியீட்டை நகலெடு',
    code_copied: 'நகலெடுக்கப்பட்டது!',
    link_code_title: 'முதியோர் கணக்கை இணைத்தல்',
    link_code_placeholder: 'உதா: GRN-7294',
    link_button: 'முதியோர் கணக்கை இணைக்க',
    link_success: 'வெற்றிகரமாக இணைக்கப்பட்டது:',
    
    // Medical
    med_reports_title: 'மருத்துவ அறிக்கைகள் & மருந்துச் சீட்டுகள்',
    upload_new_report: '+ புதிய மருத்துவ அறிக்கை சேர்க்க',
    save_report: 'மருத்துவ அறிக்கையை சேமி',
    report_title_label: 'அறிக்கை தலைப்பு',
    doctor_name_label: 'மருத்துவர் / மருத்துவமனை பெயர்',
    category_label: 'அறிக்கை வகை',
    report_summary_label: 'மருத்துவர் ஆலோசனைக் குறிப்பு',
    report_notes_label: 'பராமரிப்பாளர் கவனிக்க வேண்டியவை',
    
    // Alarms
    alarms_title: 'அலாரங்கள் & தினசரி நினைவூட்டல்கள்',
    add_alarm: '+ புதிய அலாரம் அமைக்க',
    alarm_title_placeholder: 'உதா: காலை இரத்த அழுத்த மாத்திரை',
    alarm_time: 'அலாரம் நேரம்',
    alarm_type: 'நினைவூட்டல் வகை',
    save_alarm: 'அலாரம் சேமி',
    
    // Contacts
    contacts_title: 'குடும்ப எண்கள் & அவசர தொடர்புகள்',
    add_contact: '+ புதிய குடும்ப உறுப்பினரை சேர்க்க',
    contact_name: 'பெயர்',
    contact_relation: 'உறவுமுறை',
    contact_phone: 'தொலைபேசி எண்',
    save_contact: 'தொடர்பை சேமி',
    call_now: '📞 அழைப்பு விடுக்க',
    
    // Care guide
    care_guide_title: 'முதியோர் கவனிப்பு குறிப்புகள்',
    save_guidelines: 'கவனிப்பு குறிப்புகளை சேமி',
    
    // Common
    loading: 'ஏற்றுகிறது...',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    back: 'பின்செல்',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    add: 'சேர்',
    error: 'பிழை',
    success: 'வெற்றி',
    confirm: 'உறுதிப்படுத்து',
  },
};

export function t(key: string, lang: string = 'en'): string {
  const language = (lang === 'ta' ? 'ta' : 'en') as Language;
  return translations[language]?.[key] || translations['en']?.[key] || key;
}
