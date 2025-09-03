@echo off
echo Creating GitHub Release for FlowLearn v0.1.0...

gh release create v0.1.0 release/0.1.0/FlowLearn-Windows-0.1.0-Setup.exe --title "FlowLearn v0.1.0" --notes "## FlowLearn v0.1.0

Initial release of FlowLearn - an automated vocabulary collection and review desktop application.

### Features
- **AI-Powered Processing**: Automatically generate vocabulary analysis using AI
- **Clipboard Monitoring**: Collect new words from clipboard activity
- **Spaced Repetition**: FSRS algorithm for efficient review scheduling
- **Multi-language Support**: Chinese and English interface
- **TTS Integration**: Text-to-speech for vocabulary learning
- **Backup System**: Automatic and manual backup functionality

### Installation
Download the Windows installer and run it to install FlowLearn on your system.

### System Requirements
- Windows 10 or later
- Internet connection for AI processing

🤖 Generated with [Claude Code](https://claude.ai/code)"

echo.
echo GitHub Release created successfully!
pause