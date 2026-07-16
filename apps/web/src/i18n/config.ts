import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      tagline: '“Game Khelo, Duniya Bachao, Aur Padhai Apne Aap Ho Jayegi.”',
      dashboard: 'Dashboard',
      adventureGame: 'Adventure Game',
      learningReels: 'Learning Reels',
      subjects: 'Subjects',
      dailyQuests: 'Daily Quests',
      clans: 'Clans',
      tournaments: 'Tournaments',
      leaderboard: 'Leaderboard',
      rewardsStore: 'Rewards Shop',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      energy: 'Energy',
      streak: 'Streak',
      coins: 'Coins',
      gems: 'Gems',
      level: 'Level',
      weakTopicWarning: 'Guruji Flags: Practice Needed!',
      recommendedVideo: 'Recommended Video',
      completedMissions: 'Missions Cleared',
      studyTime: 'Study Time',
      accuracy: 'Accuracy',
      continueQuest: 'Continue learning',
      tutorGreeting: 'Namaste! I am Guruji, your learning companion. Ask me any doubts!',
      explainWrong: 'Explain my wrong answer',
      chatPlaceholder: 'Ask Guruji a query...',
    },
  },
  hi: {
    translation: {
      tagline: '“गेम खेलो, दुनिया बचाओ, और पढ़ाई अपने आप हो जाएगी।”',
      dashboard: 'डैशबोर्ड',
      adventureGame: 'एडवेंचर गेम',
      learningReels: 'लर्निंग रील्स',
      subjects: 'विषय',
      dailyQuests: 'दैनिक प्रश्न',
      clans: 'कुनबा (क्लैन)',
      tournaments: 'टूर्नामेंट',
      leaderboard: 'लीडरबोर्ड',
      rewardsStore: 'इनाम स्टोर',
      profile: 'प्रोफ़ाइल',
      settings: 'सेटिंग्स',
      logout: 'लॉगआउट',
      energy: 'ऊर्जा',
      streak: 'लगातार दिन',
      coins: 'सिक्के',
      gems: 'रत्न',
      level: 'स्तर',
      weakTopicWarning: 'गुरुजी की सलाह: अभ्यास की आवश्यकता!',
      recommendedVideo: 'अनुशंसित वीडियो',
      completedMissions: 'पूर्ण मिशन',
      studyTime: 'अध्ययन समय',
      accuracy: 'सटीकता',
      continueQuest: 'पढ़ाई जारी रखें',
      tutorGreeting: 'नमस्ते! मैं हूँ गुरुजी, आपका अध्ययन मित्र। कोई भी संदेह पूछें!',
      explainWrong: 'गलत उत्तर समझाएं',
      chatPlaceholder: 'गुरुजी से कुछ पूछें...',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
