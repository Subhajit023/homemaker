# Homemaker 🏠

A friendly household stock tracker. Keep an eye on everything your home runs on, from electricity, gas and groceries to bed sheets and birthday gifts, and always know what to buy next.

Built with [Expo](https://expo.dev) (SDK 58), React Native and Expo Router.

## Features

- **Home dashboard:** see how stocked your home is at a glance, what is running out, and how each priority group is doing.
- **Three priorities:**
  - ⚡ **Must-haves:** bills, fuel and daily food (electricity, gas, petrol, vegetables…)
  - 🛋️ **Home needs:** bedding, furnishing and gadgets (mattress, sofa covers, chargers, curtains…)
  - 🎁 **Special moments:** birthdays, anniversaries, gifts and treats
- **My items:** search, filter by priority, and tap ＋ / − as you buy or use things.
- **Shopping list:** everything below its "remind me" level, most important first. Tick items off (with undo) or share the list via WhatsApp/SMS.
- **Plan & share:** see who is using shared things (scooty, TV, laptop…), use them now or book them for later without double-booking, and keep personal plans (doctor visit, paying a bill…) for each family member.
- **Call / Text / WhatsApp:** reach a family member straight from the app, with a ready-made message.
- **Family sharing:** start a family, send an invite code over WhatsApp, and everyone's phone shows the same items, shopping list and plans, live. Powered by Supabase; setup steps in [`supabase/README.md`](supabase/README.md). Without it, the app works on one phone only.
- **Surprises 🤫:** hide an item, plan or message from someone (e.g. Dad's birthday cake), so it never shows on their phone.
- **Family board:** post messages and photos for the family, with reactions and one-tap messages like "Food is ready!".
- **Profile pictures:** take or pick a photo for each family member.
- **Languages:** English, বাংলা (Bengali) and हिन्दी (Hindi). Starts in the phone's language; change it anytime with the 🌐 button on Home. Translations live in `src/i18n/`.
- **Quick add:** one-tap presets, auto-suggested emoji icons, plain-language fields.
- Saved on the device, with light and dark mode, haptic feedback and smooth animations.

## Getting started

```bash
npm install
npx expo start
```

Then open the app on your phone with Expo Go (scan the QR code), or in an Android emulator / iOS simulator.

## Project structure

```
src/
  app/                    Screens (Expo Router)
    (tabs)/               Home, My items, Shopping tabs
    item/[id].tsx         Add / edit item screen
  components/             UI components (item cards, toast, press animation…)
  features/inventory/     Data model, store, priorities and sample data
  lib/                    Helpers (haptics)
```

## Scripts

```bash
npx expo lint      # lint
npx tsc --noEmit   # typecheck
```
