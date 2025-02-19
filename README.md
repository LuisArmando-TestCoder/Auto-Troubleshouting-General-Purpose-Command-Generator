# Auto-Troubleshouting-General-Purpose-Command-Generator

## 🚀 Overview
This script integrates OpenAI's ChatGPT API with Deno to generate and execute terminal commands based on user input. It detects the user's shell (PowerShell, CMD, or Bash) and executes the generated command accordingly.

## 📥 Installation Guide

### 1. Prerequisites

Ensure you have **Deno** installed. If not, install it using one of the following methods:

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Or using **Homebrew** on macOS:

```sh
brew install deno
```

### 2. Clone or Download the Script

```sh
git clone https://github.com/yourusername/deno-chatgpt-runner.git
cd deno-chatgpt-runner
```

### 3. Install as a Global Command

To make the script globally available as `acg`, install it using:

```sh
deno install --global --allow-env --allow-run --allow-net -f --name acg ./auto.ts
```

### 4. Add Deno's Bin Directory to Your PATH

After installation, ensure your terminal can recognize the `acg` command:

#### **Windows**

- **Temporary (current session only):**

  ```powershell
  $env:PATH += ";C:\\Users\\<YourUsername>\\.deno\\bin"
  ```

- **Permanent:**
  1. Open "Edit the system environment variables".
  2. Under "System Properties", click "Environment Variables".
  3. Edit `PATH` and add:
     ```
     C:\Users\<YourUsername>\.deno\bin
     ```
  4. Restart your terminal.

#### **macOS / Linux**

```sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc  # Use .zshrc if on Zsh
```

---

## 🔑 API Key Setup

1. Create a `.env` file in the script directory:

   ```ini
   API_KEY=your_openai_api_key
   ```

2. Ensure this file remains in the same directory as the script.

---

## 🚀 Usage Guide

Once installed, simply run:

```sh
acg
```

Follow the interactive prompts:

1. **Describe a terminal command you want to generate.**
2. **ChatGPT will generate and execute the command in your shell.**
3. **If an error occurs, the script will attempt to refine and re-run the command.**

---

## 🛠 How It Works

1. **Shell Detection:**
   - Windows: Checks for PowerShell or CMD.
   - Linux/macOS: Detects Bash, Zsh, or other shells.

2. **ChatGPT API Call:**
   - Sends the user’s prompt and OS/shell details to OpenAI.
   - Extracts the response as a command.

3. **Command Execution:**
   - Runs the command using Deno’s `Deno.run`.
   - Captures output and errors.

4. **Error Handling & Iteration:**
   - If an error occurs, the output is sent back to ChatGPT for refinement.
   - The refined command is re-executed until successful.

---

## 📝 Example Usage

### User Input:

```
Your dream command: List all files modified in the last 7 days.
```

### Generated Command (Example Output):

```sh
find . -type f -mtime -7
```

### Command Execution Output:

```
./file1.txt
./file2.sh
./logs/error.log
```

---

## ✅ Features

✔️ **Interactive ChatGPT Integration** – Dynamically generates terminal commands.  
✔️ **Automatic Shell Detection** – Runs in the appropriate shell environment.  
✔️ **Iterative Error Correction** – Refines failed commands and retries execution.  
✔️ **Runs as a Global CLI Tool** – Easily accessible from anywhere.  
