# 3D Earth Visualization

This is a simple 3D Earth website I made. It shows a rotating Earth with real textures and lighting.

## What it does

- Shows a 3D Earth that rotates slowly
- Has day and night textures
- Stars in the background
- Simple controls to move around
- Background music plays automatically

## How to run

1. Download the files
2. Open terminal in the folder
3. Run `npm install`
4. Run `npm run dev` for development
5. Run `npm run build` for production
6. Run `npm run preview` to see the built version

## What I used

- Three.js for 3D graphics
- Vite for building
- GSAP for animations
- HTML and CSS for the loading screen

## Project structure

```
globe1/
├── src/
│   └── main.js          (3D Earth code)
├── public/
│   ├── earth-day.jpg     (Earth day texture)
│   ├── earth-night.jpg   (Earth night texture)
│   └── vision-slowed.mp3 (Background music)
├── index.html            (Main page)
├── package.json          (Dependencies)
└── vite.config.ts        (Build settings)
```

## Features

- Realistic Earth textures
- Smooth rotation
- Interactive camera controls
- Performance optimized
- Error handling
- Loading screen

## How it works

The main code is in `src/main.js`. It creates a 3D scene with:
- A sphere for Earth
- Textures for day and night
- Lighting for realism
- Stars in the background
- Camera controls for movement

The Earth rotates continuously and you can zoom in/out and move around with your mouse.

## Building for production

Run `npm run build` to create the production files in the `dist` folder. This makes the website faster and smaller.

## Notes

- Make sure you have the music file `vision-slowed.mp3` in the public folder
- The website needs WebGL support in your browser
- Works best on modern browsers

That's it. Simple 3D Earth website.


