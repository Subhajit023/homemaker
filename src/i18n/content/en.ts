import type { LanguageContent } from './types';

export const enContent: LanguageContent = {
  quickAdd: [
    { emoji: '🥛', name: 'Milk', priority: 1, category: 'Kitchen', quantity: 0, unit: 'L', minQuantity: 2, notes: '' },
    { emoji: '🥚', name: 'Eggs', priority: 1, category: 'Kitchen', quantity: 0, unit: 'pcs', minQuantity: 6, notes: '' },
    { emoji: '🍞', name: 'Bread', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🧈', name: 'Butter', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '☕', name: 'Coffee', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🥣', name: 'Cereal', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🍝', name: 'Pasta', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🫒', name: 'Cooking oil', priority: 1, category: 'Kitchen', quantity: 0, unit: 'L', minQuantity: 1, notes: '' },
    { emoji: '💊', name: 'Medicines', priority: 1, category: 'Health', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🧼', name: 'Detergent', priority: 2, category: 'Cleaning', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🪥', name: 'Toothpaste', priority: 2, category: 'Bathroom', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
    { emoji: '🧻', name: 'Tissues', priority: 2, category: 'Bathroom', quantity: 0, unit: 'packets', minQuantity: 2, notes: '' },
    { emoji: '💡', name: 'Light bulbs', priority: 2, category: 'Gadgets', quantity: 0, unit: 'pcs', minQuantity: 2, notes: '' },
    { emoji: '💐', name: 'Flowers', priority: 3, category: 'Gifts', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
    { emoji: '🎂', name: 'Birthday cake', priority: 3, category: 'Birthday', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
  ],

  templates: {
    daily: [
      '🍲 Food is ready!',
      '🛒 Going to the market. Need anything?',
      '☕ Tea time! Who wants a cup?',
      '🏠 Reached home safely',
      '🔑 Leaving the house, door is locked',
      '🍿 Movie night tonight?',
    ],
    reminders: [
      '💡 Electricity bill is due this week',
      '🔥 Gas cylinder is booked',
      '🧺 Clothes are drying outside',
      '🗑️ Garbage goes out tonight',
      '💊 Don’t forget your medicines',
      '🚰 Water tank is full, switch off the motor',
    ],
    wishes: [
      '🎂 Happy birthday! Have a wonderful year ahead',
      '💐 Happy anniversary! Lots of love',
      '🎓 Congratulations! So proud of you',
      '🤒 Get well soon',
      '❤️ Thank you for everything',
    ],
    festivals: [
      '🎉 Happy New Year!',
      '🪔 Happy Diwali!',
      '🎨 Happy Holi!',
      '🎄 Merry Christmas!',
      '🌙 Eid Mubarak!',
    ],
  },

  proverbs: [
    {
      text: 'A stitch in time saves nine.',
      meaning: 'Fixing a small problem early saves a lot of trouble later.',
      tip: 'Restock what’s running low today, before it runs out.',
      mood: 'restock',
    },
    {
      text: 'Don’t put off till tomorrow what you can do today.',
      meaning: 'Do it now, while you remember.',
      tip: 'Pick one thing from the shopping list and get it today.',
      mood: 'restock',
    },
    {
      text: 'Waste not, want not.',
      meaning: 'If you don’t waste things, you won’t run short.',
      tip: 'Use up what’s already at home before buying more.',
      mood: 'save',
    },
    {
      text: 'Little drops of water make the mighty ocean.',
      meaning: 'Small savings add up to something big.',
      tip: 'Buy only what you need. It adds up by the end of the month.',
      mood: 'save',
    },
    {
      text: 'The ant stores food in summer, so it never goes hungry in winter.',
      source: 'The Ant and the Grasshopper',
      meaning: 'Plan ahead while times are good.',
      tip: 'Keep a little extra of the must-haves, like gas and rice.',
      mood: 'save',
    },
    {
      text: 'Many hands make light work.',
      meaning: 'A job is easier when everyone helps.',
      tip: 'Share the shopping list so everyone can pick something up.',
      mood: 'family',
    },
    {
      text: 'Home is where the heart is.',
      meaning: 'Home is wherever the people we love are.',
      tip: 'Leave a kind message on the family board today.',
      mood: 'family',
    },
    {
      text: 'Well begun is half done.',
      meaning: 'A good start makes the rest easy.',
      tip: 'Your home is well stocked. A great start to the week!',
      mood: 'stocked',
    },
    {
      text: 'Patience is a virtue.',
      meaning: 'Good things come to those who wait calmly.',
      tip: 'Everything’s in place. Take a moment to relax today.',
      mood: 'stocked',
    },
  ],
};
