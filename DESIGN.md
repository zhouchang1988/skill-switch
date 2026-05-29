---
version: "alpha"
name: "Skill Switch"
description: "A quiet, utility-first design system for managing local skill themes and target directories."
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-soft: "#E8F0FF"
  background: "#F5F7FB"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  surface-muted: "#EEF2F7"
  surface-hover: "#E8EDF5"
  border: "#D9E0EA"
  border-strong: "#BCC7D6"
  text-main: "#182230"
  text-muted: "#526071"
  text-subtle: "#8390A3"
  success: "#168552"
  success-soft: "#E7F6EE"
  warning: "#A15C07"
  warning-soft: "#FFF4DA"
  error: "#C73636"
  error-soft: "#FDECEC"
typography:
  heading1:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: "750"
    lineHeight: "1.2"
    letterSpacing: "0"
  heading2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: "700"
    lineHeight: "1.35"
    letterSpacing: "0"
  cardTitle:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: "700"
    lineHeight: "1.35"
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "0"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "1.35"
    letterSpacing: "0"
  code:
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace"
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "0"
spacing:
  0: "0"
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
  10: "40px"
  12: "48px"
rounded:
  none: "0"
  sm: "6px"
  md: "8px"
  full: "9999px"
shadow:
  sm: "0 1px 2px rgba(15, 23, 42, 0.04)"
  lg: "0 18px 50px rgba(15, 23, 42, 0.16)"
components:
  app-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-main}"
    typography: "{typography.body}"
  topbar:
    backgroundColor: "rgba(255, 255, 255, 0.92)"
    borderColor: "{colors.border}"
    height: "57px"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.4}"
    shadow: "{shadow.sm}"
  card-hover:
    borderColor: "{colors.border-strong}"
    shadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "7px 13px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    padding: "7px 13px"
  button-danger:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    borderColor: "{colors.error-soft}"
    rounded: "{rounded.sm}"
    padding: "7px 13px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    height: "38px"
    padding: "8px 11px"
  tag:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    typography: "{typography.caption}"
    padding: "3px 8px"
  badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    typography: "{typography.caption}"
    padding: "2px 8px"
  modal:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
    shadow: "{shadow.lg}"
---

## Overview

Skill Switch uses a calm, utility-focused interface for repeated configuration work. The visual system should feel like a compact operations panel: clear hierarchy, low decorative weight, predictable controls, and enough breathing room to scan paths, themes, and skill tags quickly.

The design favors a light neutral surface, blue as the only primary action color, and soft status treatments for destructive or system feedback. Avoid marketing-style hero layouts, oversized illustration, or decorative gradients; this product should open directly into the usable workflow.

## Colors

The palette is built around a cool light page background, white cards, slate text, and a restrained blue accent. Use `primary` only for the main action in a section, active focus states, and the app badge. Use `error` for destructive actions and destructive hover states. Use muted surfaces for skill tags and content previews.

Text hierarchy should remain strong: `text-main` for titles and primary values, `text-muted` for descriptions and paths, and `text-subtle` for low-priority metadata such as counts. Borders are visible but soft, so cards read as organized panels rather than heavy containers.

## Typography

Use the system UI stack for all interface text. The app is dense and operational, so type sizes should stay compact: 28px for the main page title, 18px for section headings, 15px for card titles, 14px for body text, and 12px for tags or captions.

Letter spacing is always `0`. Do not scale font sizes with viewport width. Use the mono stack only for paths, JSON, and skill document previews.

## Layout

The primary layout width is capped at 1120px with 24px desktop side padding and 16px mobile side padding. The dashboard stacks sections vertically with 28px between major groups. Within cards, use 16px padding and 12px gaps between related rows.

Cards are simple rectangular panels. Directory cards use a full-width stacked list; theme cards use a responsive grid with a minimum card width of 220px. On mobile, controls stack vertically and fill the available width to avoid cramped action rows.

## Elevation & Depth

Depth is deliberately subtle. Cards use only a tiny shadow to separate them from the page background. Hover elevation may increase slightly on target and theme cards, but should never become a floating marketing card effect.

Modals are the highest layer and use the large shadow token with a translucent slate overlay. Toasts share the high shadow treatment because they float above page content.

## Shapes

Use 8px as the default radius for cards, modals, empty states, and larger panels. Use 6px for controls, tags, inputs, and the brand mark. Use a full radius only for status badges.

Avoid large rounded rectangles for standard app panels. The product should feel precise and work-focused, not pillowy.

## Components

Primary buttons are blue with white text and are reserved for add, save, scan, and start actions. Secondary buttons are white with a light border. Danger buttons use a soft red background by default and turn solid red on hover.

Inputs and selects have 38px minimum height, 6px radius, and a blue focus ring. Tags are compact inline-flex chips with muted backgrounds and should wrap naturally without changing layout height unexpectedly.

Cards should not be nested inside other cards. Use cards for repeated target/theme items, modals, and framed configuration panels. Page sections themselves should remain unframed.

## Do's and Don'ts

Do keep all operational controls compact, aligned, and easy to scan.

Do expose the current theme and skill count near each target directory.

Do wrap long paths and skill names instead of clipping important information.

Do use the same button sizes and tag styles across setup, dashboard, modals, and toasts.

Don't introduce new accent colors for ordinary actions.

Don't use gradients, decorative blobs, or illustration-first layouts.

Don't make cards rounder than 8px unless the token set changes.

Don't place cards inside cards or use page sections as floating cards.
