# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.6 application with React 19, TypeScript, and Tailwind CSS 4. It's a fresh project bootstrapped with `create-next-app` using the App Router architecture.

## Development Commands

- **Development server**: `npm run dev` - Starts the Next.js development server on http://localhost:3000
- **Build**: `npm run build` - Creates an optimized production build
- **Start production**: `npm run start` - Runs the production build locally
- **Lint**: `npm run lint` - Runs ESLint with Next.js and TypeScript configurations

## Architecture

- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono from Google Fonts
- **Path aliases**: `@/*` maps to `./src/*`

### File Structure
- `src/app/` - App Router pages and layouts
- `src/app/layout.tsx` - Root layout with font configuration
- `src/app/page.tsx` - Home page component
- `src/app/globals.css` - Global styles
- `public/` - Static assets (SVG icons)

## Configuration Files

- **TypeScript**: Configured with strict mode and Next.js plugin
- **ESLint**: Uses Next.js core-web-vitals and TypeScript configs
- **Tailwind**: Configured through PostCSS plugin
- **Next.js**: Standard configuration (currently empty)

## Key Technologies

- React Server Components (App Router default)
- TypeScript with strict type checking
- Tailwind CSS for utility-first styling
- Next.js Image optimization
- Geist font family optimization