import React from "react";

const IconBase = ({ children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="16"
  >
    {children}
  </svg>
);

export const RostersIcon = () => (
  <IconBase>
    <circle cx="92" cy="96" r="40" />
    <circle cx="180" cy="104" r="32" />
    <path d="M24 216a68 68 0 0 1 136 0" />
    <path d="M152 168a56 56 0 0 1 80 48" />
  </IconBase>
);

export const DataIcon = () => (
  <IconBase>
    <line x1="48" y1="216" x2="208" y2="216" />
    <rect x="56" y="128" width="32" height="64" rx="4" />
    <rect x="112" y="88" width="32" height="104" rx="4" />
    <rect x="168" y="48" width="32" height="144" rx="4" />
  </IconBase>
);

export const SettingsIcon = () => (
  <IconBase>
    <circle cx="128" cy="128" r="32" />
    <path d="M128 40v24" />
    <path d="M128 192v24" />
    <path d="m65.8 65.8 17 17" />
    <path d="m173.2 173.2 17 17" />
    <path d="M40 128h24" />
    <path d="M192 128h24" />
    <path d="m65.8 190.2 17-17" />
    <path d="m173.2 82.8 17-17" />
  </IconBase>
);



export const HomeIcon = () => (
  <IconBase>
    <path d="M213.3815 109.61945 133.376 36.88436a8 8 0 0 0-10.76339.00036l-79.9945 72.73477A8 8 0 0 0 40 115.53855V208a8 8 0 0 0 8 8h160a8 8 0 0 0 8-8v-92.46113a8 8 0 0 0-2.6185-5.91942Z" />
  </IconBase>
);

export const GamesIcon = () => (
  <IconBase>
    <polyline points="76.201 132.201 152.201 40.201 216 40 215.799 103.799 123.799 179.799" />
    <line x1="100" y1="156" x2="160" y2="96" />
    <path d="m82.14214 197.45584-29.94114 29.94116a8 8 0 0 1-11.31371 0L28.603 215.11268a8 8 0 0 1 0-11.31371l29.94113-29.94112a8 8 0 0 0 0-11.31371l-20.88728-20.88729a8 8 0 0 1 0-11.3137l12.6863-12.6863a8 8 0 0 1 11.3137 0l76.6863 76.6863a8 8 0 0 1 0 11.3137l-12.6863 12.6863a8 8 0 0 1-11.3137 0l-20.88731-20.88731a8 8 0 0 0-11.3137 0Z" />
  </IconBase>
);

export const ChatIcon = () => (
  <IconBase>
    <path d="M45.42853 176.99811A95.95978 95.95978 0 1 1 79.00228 210.5717l-33.15634 9.4723a8 8 0 0 1-9.89-9.89l9.47331-33.15657Z" />
    <line x1="96" y1="112" x2="160" y2="112" />
    <line x1="96" y1="144" x2="160" y2="144" />
  </IconBase>
);

export const SearchIcon = () => (
  <IconBase>
    <circle cx="116" cy="116" r="84" />
    <line
      x1="175.39356"
      y1="175.40039"
      x2="223.99414"
      y2="224.00098"
    />
  </IconBase>
);

export const ProfileIcon = () => (
  <IconBase>
    <circle cx="128" cy="96" r="64" />
    <path d="M30.989 215.99064a112.03731 112.03731 0 0 1 194.02311.002" />
  </IconBase>
);