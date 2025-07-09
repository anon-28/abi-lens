# ABI Lens

_A VS Code extension to help C++ developers inspect their Application Binary Interface (ABI) inline struct/class memory layouts, v-tables, and calling conventions at a glance._

## Features

- **Hover Inspection**  
  Hover over any user-defined `struct` or `class` to see its record layout: field offsets, sizes, alignment, padding.
  <img src="https://raw.githubusercontent.com/anon-28/extension-images/abi-lens/demo-video.gif" alt="Hover Inspection demo"/>

- **File Summary**  
  Run **“ABI Lens: Show File ABI”** to output layouts for all user-defined types in the active file into an output channel.
  <img src="https://raw.githubusercontent.com/anon-28/extension-images/abi-lens/demo-4.png" alt="Hover Inspection demo" width="250" height="250" />

- **Markdown Tooltips & Output**  
  ABI details are rendered as Markdown code blocks in both hover tooltips and the **ABI Lens** output channel.

## Usage

1. **Open the Command Palette**  
   Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).

2. **Type `ABI Lens:`**  
   Then pick **“Show File ABI”** to generate a summary for all user-defined types in the current file.

3. **Hover in editor**  
   Open any C/C++ file (`.cpp`, `.h`, etc.) and hover over a user-defined `struct` or `class` name to see its inline ABI layout.

## Requirements

- **Clang/LLVM** with `clang++` on your `PATH`  
  - **Linux:**  
    ```bash
    sudo apt install clang llvm
    ```  
  - **macOS:**  
    ```bash
    brew install llvm
    export PATH="$(brew --prefix llvm)/bin:$PATH"
    ```  
  - **Windows:**  
    Install LLVM via the official installer or Chocolatey:  
    ```powershell
    choco install llvm
    ```

## Extension Settings

This extension contributes no customizable settings.

## Known Issues

- Only user-defined types in the active file are shown; hovering on library or standard types is ignored.  
- Very large files with many types may take a few seconds to process the layout dump.  
- Requires a successful syntax-only compile; files with errors will not produce layouts.
- User-defined types must actually be used in the code; otherwise, the compiler may optimize them away and no information will be available.

## Changelog

### 0.1.0

- Initial release  
  - Hover Inspection for user types  
  - **Show File ABI** summary command  
  - Custom type filtering  
  - Markdown-formatted tooltips and output channel

---

*Enjoy crystal-clear ABI insights!*  
