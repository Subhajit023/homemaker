import type { LanguageContent } from './types';

/** বাংলা — বাঙালি রান্নাঘর, পার্বণ আর চেনা প্রবাদ। */
export const bnContent: LanguageContent = {
  quickAdd: [
    { emoji: '🥛', name: 'দুধ', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'L', minQuantity: 2, notes: '' },
    { emoji: '🍚', name: 'চাল', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'kg', minQuantity: 5, notes: '' },
    { emoji: '🫘', name: 'মুসুর ডাল', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' },
    { emoji: '🐟', name: 'মাছ', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' },
    { emoji: '🥚', name: 'ডিম', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'pcs', minQuantity: 6, notes: '' },
    { emoji: '🥔', name: 'আলু', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'kg', minQuantity: 2, notes: '' },
    { emoji: '🧅', name: 'পেঁয়াজ', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' },
    { emoji: '🫒', name: 'সরষের তেল', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'L', minQuantity: 1, notes: '' },
    { emoji: '🥣', name: 'মুড়ি', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🍵', name: 'চা পাতা', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🥄', name: 'পোস্ত', priority: 1, category: 'রান্নাঘর', quantity: 0, unit: 'g', minQuantity: 100, notes: '' },
    { emoji: '💊', name: 'ওষুধ', priority: 1, category: 'স্বাস্থ্য', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🦟', name: 'মশার ধূপ', priority: 2, category: 'ঘর', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🧼', name: 'সাবান', priority: 2, category: 'বাথরুম', quantity: 0, unit: 'pcs', minQuantity: 2, notes: '' },
    { emoji: '🍬', name: 'মিষ্টি', priority: 3, category: 'অতিথি', quantity: 0, unit: 'pcs', minQuantity: 10, notes: 'রসগোল্লা বা সন্দেশ' },
    { emoji: '💐', name: 'রজনীগন্ধা', priority: 3, category: 'উপহার', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
    { emoji: '🎂', name: 'জন্মদিনের কেক', priority: 3, category: 'জন্মদিন', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
  ],

  templates: {
    daily: [
      '🍚 ভাত হয়ে গেছে, খেতে এসো!',
      '🐟 আজ দুপুরে মাছের ঝোল আর ভাত',
      '🛒 বাজারে যাচ্ছি, কিছু লাগবে?',
      '☕ চা হয়েছে, কে খাবে?',
      '🏠 নিরাপদে বাড়ি পৌঁছেছি',
      '🔑 বেরোচ্ছি, দরজায় তালা দেওয়া আছে',
    ],
    reminders: [
      '💡 এই সপ্তাহে বিদ্যুতের বিল দিতে হবে',
      '🔥 গ্যাস সিলিন্ডার বুক করা হয়েছে',
      '🧺 ছাদে জামাকাপড় শুকোচ্ছে, বৃষ্টি এলে তুলে নিও',
      '🦟 রাতে মশারি টাঙাতে ভুলো না',
      '💊 ওষুধ খেতে ভুলো না',
      '🚰 ট্যাঙ্ক ভরে গেছে, পাম্প বন্ধ করো',
    ],
    wishes: [
      '🎂 শুভ জন্মদিন! অনেক ভালো থেকো',
      '💐 শুভ বিবাহবার্ষিকী! অনেক ভালোবাসা',
      '🎓 অভিনন্দন! তোমাকে নিয়ে আমরা গর্বিত',
      '🤒 তাড়াতাড়ি সুস্থ হয়ে ওঠো',
      '🙏 প্রণাম নিও, আশীর্বাদ কোরো',
    ],
    festivals: [
      '🎉 শুভ নববর্ষ!',
      '🌺 পুজোয় কে কোথায় ঠাকুর দেখতে যাবে?',
      '🙏 শুভ বিজয়া! সবাইকে প্রণাম ও ভালোবাসা',
      '🪔 শুভ দীপাবলি!',
      '🎨 শুভ দোলযাত্রা!',
      '🪷 ভাইফোঁটার অনেক শুভেচ্ছা',
    ],
  },

  proverbs: [
    {
      text: 'সময়ের এক ফোঁড়, অসময়ের দশ ফোঁড়।',
      meaning: 'সময়মতো ছোট কাজটা সেরে রাখলে পরে অনেক ঝামেলা বাঁচে।',
      tip: 'যা কমে আসছে, ফুরিয়ে যাওয়ার আগেই আজ কিনে নিন।',
      mood: 'restock',
    },
    {
      text: 'নুন আনতে পান্তা ফুরোয়।',
      meaning: 'একটা জোগাড় করতে করতে আরেকটা ফুরিয়ে যায়।',
      tip: 'তালিকা ঠিক রাখলে এমন দশা হবে না। বাজারের তালিকাটা একবার দেখে নিন।',
      mood: 'restock',
    },
    {
      text: 'ছোট ছোট বালুকণা, বিন্দু বিন্দু জল, গড়ে তোলে মহাদেশ, সাগর অতল।',
      source: 'ছেলেবেলার ছড়া',
      meaning: 'ছোট ছোট সঞ্চয়ই একদিন বড় হয়ে ওঠে।',
      tip: 'দরকারের বেশি না কিনলে মাসের শেষে অনেকটা বাঁচে।',
      mood: 'save',
    },
    {
      text: 'পিঁপড়ে গরমকালে খাবার জমিয়ে রাখে, তাই শীতে তার অভাব হয় না।',
      source: 'পিঁপড়ে আর ফড়িংয়ের গল্প',
      meaning: 'ভালো সময়েই আগামী দিনের কথা ভেবে রাখতে হয়।',
      tip: 'গ্যাস, চাল-ডালের মতো জরুরি জিনিস একটু বেশি রেখে দিন।',
      mood: 'save',
    },
    {
      text: 'দশে মিলি করি কাজ, হারি জিতি নাহি লাজ।',
      meaning: 'সবাই মিলে কাজ করলে হার-জিত যা-ই হোক, লজ্জা নেই।',
      tip: 'বাজারের তালিকা ভাগ করে নিন, যে যেটা পারে এনে দিক।',
      mood: 'family',
    },
    {
      text: 'একতাই বল।',
      meaning: 'একসঙ্গে থাকলেই আসল শক্তি।',
      tip: 'পরিবারের বোর্ডে আজ কাউকে একটা ভালো কথা লিখে দিন।',
      mood: 'family',
    },
    {
      text: 'সবুরে মেওয়া ফলে।',
      meaning: 'ধৈর্য ধরলে ভালো ফল মেলে।',
      tip: 'ঘরে সব আছে। আজ একটু বিশ্রাম নিন।',
      mood: 'stocked',
    },
    {
      text: 'যেমন কর্ম, তেমন ফল।',
      meaning: 'যেমন কাজ করবে, তেমনই ফল পাবে।',
      tip: 'নিয়ম করে হিসেব রেখেছেন বলেই আজ ঘরে সব মজুত।',
      mood: 'stocked',
    },
  ],
};
