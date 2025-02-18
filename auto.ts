import { config } from "https://deno.land/x/dotenv/mod.ts";

// Load environment variables from the .env file
const env = config();

// Extract the API key from environment variables
const API_KEY = env["API_KEY"];

// Check if the API key is present, if not, log an error message and exit
if (!API_KEY) {
  console.error("API_KEY not found in the .env file");
  Deno.exit(1);
}

// Function to call ChatGPT API with user's prompt and return the response
async function callChatGPT(
  promptTexts: string[], // Array of strings containing prompts and responses
  apiKey: string // API key for authentication
): Promise<string> {
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "developer",
        content: `
        Give me the answer in a triple backtips block of code. 
        When answering a fix, don't mention the previous code in triple backtips blocks of code, only its fix.
        When fixing, don't fix yourself on one type of answer only, look for alternative ways.
        When constructing complex commands, separate with line breaks.
        If one way doesn't work, take in account previous messages, to notice when one approach is not fit.
        Take in account that ${Deno.build.os} is your current OS.
        You shall test solutions the ${await detectShell()} terminal.
      `,
      },
      ...promptTexts.map((promptText, index) => ({
        role: index % 2 ? "assistant" : "user",
        content: promptText,
      })),
    ],
  };

  // Send a request to the API and handle the response or error
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  // Extract and return the content from the API response.
  return data?.choices[0].message.content;
}

// Function to extract code block content from a string
function getBackTipsContent(content: string) {
  const backtipsContentRegex = /```.*?$([\s\S]*?)^```/gm;

  return backtipsContentRegex.exec(content)?.[1] || content;
}

// Function to execute a command and return its stdout output
async function runCommand(cmd: string[]): Promise<string> {
  const proc = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "null",
  });
  const output = await proc.output();
  proc.close();
  return new TextDecoder().decode(output).trim();
}

// Function to detect shell based on user input and a list of candidates
function detectCandidate(
  candidates: { pattern: RegExp; shell: string }[],
  input: string
): string | null {
  for (const candidate of candidates) {
    if (candidate.pattern.test(input)) {
      return candidate.shell;
    }
  }
  return null;
}

// Function to detect the current shell in use, based on the OS environment
async function detectShell(): Promise<string> {
  if (Deno.build.os === "windows") {
    if (Deno.env.get("PSModulePath")) return "powershell";

    const comSpec = Deno.env.get("ComSpec") || "";
    if (comSpec.toLowerCase().includes("cmd.exe")) return "cmd";

    const output = (
      await runCommand([
        "wmic",
        "process",
        "get",
        "ParentProcessId,CommandLine",
      ])
    ).toLowerCase();
    return (
      detectCandidate(
        [
          { pattern: /powershell\.exe/, shell: "powershell" },
          { pattern: /cmd\.exe/, shell: "cmd" },
        ],
        output
      ) || "unknown"
    );
  } else {
    const shellEnv = Deno.env.get("SHELL") || "";
    const candidates = [
      { pattern: /bash/, shell: "bash" },
      { pattern: /zsh/, shell: "zsh" },
      { pattern: /fish/, shell: "fish" },
      { pattern: /sh/, shell: "sh" },
    ];
    const detected = detectCandidate(candidates, shellEnv);
    if (detected) return detected;

    const output = await runCommand(["sh", "-c", "echo $0"]);
    return detectCandidate(candidates, output) || "unknown";
  }
}

// Main function to run the application logic
async function main() {
  const command = prompt("Your dream command:") || ""; // Prompt user for a command
  const LLMUserPrompt = `Make a ${Deno.build.os} terminal command that ${command}`;
  const messages = [LLMUserPrompt];

  // Continuously interact with the ChatGPT API, refining the command until it executes successfully
  while (1) {
    const response = await callChatGPT(messages, API_KEY);
    const code = getBackTipsContent(response);

    console.log("response", response);
    console.log(`Executing: ${code}`);

    const process = Deno.run({
      cmd:
        Deno.build.os === "windows" ? ["powershell", "-Command", code] : [code],
      stdout: "piped", // Capture standard output
      stderr: "piped", // Capture errors
    });

    const rawOutput = await process.output();
    const rawError = await process.stderrOutput();

    const output = new TextDecoder().decode(rawOutput);
    const error = new TextDecoder().decode(rawError);

    const status = output || error;

    messages.push(status);

    if (!error) break; // If there's no error, break the loop

    console.error(error);

    console.log("Fixing..."); // Log that the program is trying to fix the error
  }
}

main();