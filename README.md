# Material 3 Expressive Scientific Calculator

A modern, responsive scientific calculator web application designed with Google's **Material 3 Expressive** design system and **Google Sans Flex** typography with roundness 100 (`'ROND' 100`).

---

## ✨ Key Features

### 🧮 Comprehensive Scientific Engine
- **Basic & Advanced Arithmetic**: Addition, subtraction, multiplication, division, modulo, and percentage.
- **Trigonometry**: `sin`, `cos`, `tan`, and their inverses (`sin⁻¹`, `cos⁻¹`, `tan⁻¹` via the **INV** toggle).
- **Hyperbolic Functions**: `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`.
- **Logarithms & Exponents**: `ln` (natural log), `log` (base 10), `log2`, `eˣ`, `10ˣ`, `xʸ`, `1/x`.
- **Roots & Powers**: Square root ($\sqrt{x}$), cube root, powers ($x^2$, $x^y$).
- **Combinatorics & Factorials**: $n!$ (factorial), $nPr$ (permutations), $nCr$ (combinations).
- **Constants**: $\pi$ (Pi $\approx 3.14159$), $e$ (Euler's number $\approx 2.71828$), $\phi$ (Golden Ratio $\approx 1.61803$).
- **Angle Modes**: Real-time switching between **DEG** (degrees), **RAD** (radians), and **GRAD** (gradians).
- **Implicit Multiplication**: Supports natural mathematical expressions like `2π`, `5(3+4)`, `3sin(90)`, and `(2)(3)`.
- **High-Precision Formatting**: Eliminates floating-point rounding errors (e.g., $0.1 + 0.2 = 0.3$), cleanly handles scientific notation for very large/small numbers.
- **Live Preview**: Automatically evaluates valid sub-expressions and previews the result in real-time as you type.

### 🔀 Layout Switcher (Basic vs. Full Button Mode)
- **Segmented Pill Switcher**: Easily switch between **Basic** mode (compact 4-column arithmetic keypad) and **Full** mode (complete 5-column scientific keypad with trigonometry, logarithms, hyperbolics, and combinatorics).
- **Polished Basic Mode Layout**: When switching to Basic mode, the calculator card cleanly resizes to 420px, hides irrelevant angle units (DEG/RAD/GRAD), centers the keypad, spaces the memory register buttons evenly, and organizes the header into a clean 2-row layout with no cramped elements or overflow.
- **Dedicated Shortcuts**: Press `b` for Basic Keypad, `f` for Full Scientific Keypad.

### 🌗 Circular Dark Mode Button & Device Theme Check
- **Uniform 40×40 Circular Button**: The Dark Mode button is an exact circular icon button matching the other header buttons (`Sound`, `Palette`, `Help`, `History`).
- **OS Theme Detection**: Detects device color scheme via `window.matchMedia('(prefers-color-scheme: dark)')` to check whether your device/OS uses dark or light mode.
- **Real-Time OS Sync**: Listens to system color scheme changes in real-time, automatically transitioning the calculator's appearance when your device schedule changes.
- **Device Theme Inspector Modal**: Access detailed device query diagnostics and one-click synchronization via the Theme dropdown or shortcut `a`.
- **Flexible Theme Control**: Switch between **Auto (Follow Device)**, **Always Light**, or **Always Dark** by clicking the circular button or selecting in the Theme dropdown.

### 🎨 Material 3 Expressive GUI
- **Google Sans Flex Font**: Rendered with variable font axis `'ROND' 100` for rounded glyphs.
- **Expressive Pill Shapes**: Dynamic pill buttons (`shape-full`), squircle container cards, and animated chips.
- **5 Dynamic Color Palettes (Material You)**:
  1. 🟣 **Violet (Iris)** – Classic Google Pixel flagship theme
  2. 🟢 **Mint (Emerald)** – Refreshing sage and teal tones
  3. 🟠 **Coral (Sunset)** – Warm terracotta and peach
  4. 🔵 **Ocean (Cyan)** – Crisp azure and navy
  5. 🟡 **Honey (Amber)** – Earthy ochre and warm gold
- **Dark & Light Mode**: Seamless switching with tonal surface elevations and contrast-aware typography.
- **Expressive Spring Physics**: Natural bouncy press animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`) and touch ripple feedback.
- **Tactile Audio & Haptics**: Procedural acoustic clicks synthesized via the Web Audio API (with toggle to mute).

### 📋 History Tape & Memory
- **Calculation History Tape**: Slide-out drawer tracking previous calculations with timestamps, click-to-recall, and one-click copy to clipboard.
- **Memory Registers**: `MC` (Clear), `MR` (Recall), `M+` (Add), `M-` (Subtract), `MS` (Store) with active memory status pill.
- **Local Persistence**: Saves history, memory, preferred theme, angle mode, layout mode, and sound settings in `localStorage`.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` - `9` | Input digits |
| `.` | Decimal separator |
| `+`, `-`, `*`, `/` | Addition, Subtraction, Multiplication, Division |
| `^`, `%` | Exponent, Modulo/Percentage |
| `(` and `)` | Parentheses |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last character / token |
| `Escape` | All Clear (`AC`) |
| `s` | Square root (`sqrt(`) |
| `p` | Constant $\pi$ |
| `e` | Constant $e$ |
| `h` | Toggle History Tape drawer |
| `d` | Cycle Theme Mode (Auto / Light / Dark) |
| `b` | Switch to Basic Keypad |
| `f` | Switch to Full Scientific Keypad |
| `a` | Auto-sync theme with Device Dark Mode |

---

## 🚀 How to Run

Because this project is built with vanilla HTML5, CSS3, and modern JavaScript, **no build step or npm install is required**.

### Option 1: Open Directly in Browser
Double-click `index.html` or open it with your browser of choice.

### Option 2: Run with Local HTTP Server (Python / Node)
```bash
# Python 3
python -m http.server 8000

# or Node.js npx
npx serve .
```
Then navigate to `http://localhost:8000`.

---

## 📂 Project Architecture

```
├── index.html              # Semantic HTML5 layout with M3 accessibility roles
├── css/
│   ├── material3-tokens.css # Design system tokens, dynamic themes, ROND 100 font
│   └── calculator.css       # Keypad grid, display, responsive layout, animations
├── js/
│   ├── engine.js            # Tokenizer, Shunting-Yard parser, and AST math evaluator
│   ├── audio.js             # Web Audio API tactile feedback synthesizer
│   └── app.js               # Reactive UI controller, event handlers, keyboard bindings
└── README.md                # Project documentation
```
This repo is 100% AI slop generated.