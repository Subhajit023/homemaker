import type { LanguageContent } from './types';

/** हिन्दी — भारतीय रसोई, त्योहार और जानी-पहचानी कहावतें। */
export const hiContent: LanguageContent = {
  quickAdd: [
    { emoji: '🥛', name: 'दूध', priority: 1, category: 'रसोई', quantity: 0, unit: 'L', minQuantity: 2, notes: '' },
    { emoji: '🌾', name: 'आटा', priority: 1, category: 'रसोई', quantity: 0, unit: 'kg', minQuantity: 5, notes: '' },
    { emoji: '🍚', name: 'चावल', priority: 1, category: 'रसोई', quantity: 0, unit: 'kg', minQuantity: 5, notes: '' },
    { emoji: '🫘', name: 'अरहर दाल', priority: 1, category: 'रसोई', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' },
    { emoji: '🍬', name: 'चीनी', priority: 1, category: 'रसोई', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' },
    { emoji: '🧈', name: 'घी', priority: 1, category: 'रसोई', quantity: 0, unit: 'L', minQuantity: 1, notes: '' },
    { emoji: '🫒', name: 'सरसों का तेल', priority: 1, category: 'रसोई', quantity: 0, unit: 'L', minQuantity: 1, notes: '' },
    { emoji: '🌶️', name: 'मसाले', priority: 1, category: 'रसोई', quantity: 0, unit: 'packets', minQuantity: 1, notes: 'हल्दी, मिर्च, धनिया' },
    { emoji: '🍵', name: 'चायपत्ती', priority: 1, category: 'रसोई', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🥔', name: 'आलू-प्याज़', priority: 1, category: 'रसोई', quantity: 0, unit: 'kg', minQuantity: 2, notes: '' },
    { emoji: '🫙', name: 'अचार', priority: 1, category: 'रसोई', quantity: 0, unit: 'bottles', minQuantity: 1, notes: '' },
    { emoji: '💊', name: 'दवाइयाँ', priority: 1, category: 'स्वास्थ्य', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🧼', name: 'साबुन', priority: 2, category: 'बाथरूम', quantity: 0, unit: 'pcs', minQuantity: 2, notes: '' },
    { emoji: '🧺', name: 'कपड़े धोने का पाउडर', priority: 2, category: 'सफ़ाई', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
    { emoji: '🍬', name: 'मिठाई', priority: 3, category: 'मेहमान', quantity: 0, unit: 'g', minQuantity: 500, notes: 'लड्डू या बर्फ़ी' },
    { emoji: '🪔', name: 'दीये', priority: 3, category: 'त्योहार', quantity: 0, unit: 'pcs', minQuantity: 21, notes: '' },
    { emoji: '🎂', name: 'जन्मदिन का केक', priority: 3, category: 'जन्मदिन', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
  ],

  templates: {
    daily: [
      '🍲 खाना तैयार है, आ जाओ!',
      '☕ चाय बन गई है, किसको चाहिए?',
      '🛒 बाज़ार जा रहा/रही हूँ, कुछ चाहिए?',
      '🍛 आज खाने में राजमा-चावल',
      '🏠 सुरक्षित घर पहुँच गया/गई',
      '🔑 घर से निकल रहा/रही हूँ, दरवाज़ा बंद है',
    ],
    reminders: [
      '💡 इस हफ़्ते बिजली का बिल भरना है',
      '🔥 गैस सिलेंडर बुक हो गया',
      '🧺 छत पर कपड़े सूख रहे हैं, बारिश हो तो उठा लेना',
      '🥛 दूधवाले का हिसाब करना है',
      '💊 दवाई लेना मत भूलना',
      '🚰 टंकी भर गई, मोटर बंद कर दो',
    ],
    wishes: [
      '🎂 जन्मदिन की ढेरों शुभकामनाएँ!',
      '💐 शादी की सालगिरह मुबारक हो!',
      '🎓 बहुत-बहुत बधाई! हमें आप पर गर्व है',
      '🤒 जल्दी ठीक हो जाओ',
      '🙏 आशीर्वाद बनाए रखना',
    ],
    festivals: [
      '🪔 दीपावली की हार्दिक शुभकामनाएँ!',
      '🎨 होली मुबारक!',
      '🪢 रक्षाबंधन की शुभकामनाएँ',
      '🙏 नवरात्रि की शुभकामनाएँ',
      '🌙 ईद मुबारक!',
      '🎉 नया साल मुबारक!',
    ],
  },

  proverbs: [
    {
      text: 'काल करे सो आज कर, आज करे सो अब।',
      source: 'कबीर',
      meaning: 'जो कल करना है, उसे आज करो; जो आज करना है, उसे अभी करो।',
      tip: 'जो चीज़ें कम हो रही हैं, उन्हें आज ही ले आएँ।',
      mood: 'restock',
    },
    {
      text: 'अब पछताए होत क्या, जब चिड़िया चुग गई खेत।',
      meaning: 'समय निकल जाने के बाद पछताने से कुछ नहीं होता।',
      tip: 'गैस या दूध ख़त्म होने से पहले ख़रीदारी की सूची देख लें।',
      mood: 'restock',
    },
    {
      text: 'बूँद-बूँद से घड़ा भरता है।',
      meaning: 'थोड़ी-थोड़ी बचत से ही बड़ी बचत होती है।',
      tip: 'ज़रूरत भर ही ख़रीदें, महीने के अंत में फ़र्क़ दिखेगा।',
      mood: 'save',
    },
    {
      text: 'तेते पाँव पसारिए, जेती लाँबी सौर।',
      meaning: 'जितनी चादर हो, उतने ही पैर फैलाओ; आमदनी देखकर ख़र्च करो।',
      tip: 'पहले ज़रूरी चीज़ें, फिर बाक़ी सब।',
      mood: 'save',
    },
    {
      text: 'चींटी गर्मियों में दाना जमा करती है, इसलिए सर्दियों में भूखी नहीं रहती।',
      source: 'चींटी और टिड्डे की कहानी',
      meaning: 'अच्छे समय में ही आगे की तैयारी कर लेनी चाहिए।',
      tip: 'गैस, आटा-दाल जैसी ज़रूरी चीज़ें थोड़ी ज़्यादा रखें।',
      mood: 'save',
    },
    {
      text: 'एक और एक ग्यारह होते हैं।',
      meaning: 'मिलकर काम करने से ताक़त कई गुना बढ़ जाती है।',
      tip: 'ख़रीदारी की सूची परिवार से साझा करें, जो जो ला सके, ले आए।',
      mood: 'family',
    },
    {
      text: 'सब्र का फल मीठा होता है।',
      meaning: 'धैर्य रखने का नतीजा हमेशा अच्छा होता है।',
      tip: 'घर में सब कुछ है। आज थोड़ा आराम करें।',
      mood: 'stocked',
    },
    {
      text: 'जैसा अन्न, वैसा मन।',
      meaning: 'जैसा खाना खाते हैं, वैसा ही मन बनता है।',
      tip: 'आज सब्ज़ियाँ और फल ताज़ा रखें।',
      mood: 'stocked',
    },
  ],
};
