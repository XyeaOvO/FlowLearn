import { defineConfig } from 'electron-builder'

export default defineConfig({
  appId: 'com.flowlearn.app',
  productName: 'FlowLearn',
  directories: {
    output: 'release',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
  ],
  mac: {
    category: 'public.app-category.education',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
    ],
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  dmg: {
    title: 'FlowLearn',
    icon: 'public/icon.icns',
  },
})