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
