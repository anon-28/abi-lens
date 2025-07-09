// src/extension.ts

import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

/**
 * Represents one record‐layout dump block.
 */
interface RecordLayout {
  name: string;
  lines: string[];
}

export function activate(context: vscode.ExtensionContext) {
  const abiOutput = vscode.window.createOutputChannel('ABI Lens');
  context.subscriptions.push(abiOutput);

  // Hover provider for ABI layout on struct/class
  const hoverProvider = vscode.languages.registerHoverProvider(
    ['c', 'cpp', 'cxx', 'h', 'hpp'],
    {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
        if (!range) {
          return;
        }
        const word = document.getText(range);
        // only types start uppercase
        if (!/^[A-Z]/.test(word)) {
          return;
        }

        const file = document.fileName;
        const cwd = path.dirname(file);
        const cmd = `clang++ -std=c++17 -Xclang -fdump-record-layouts -fsyntax-only "${file}"`;

        return new Promise<vscode.Hover | undefined>(resolve => {
          exec(cmd, { cwd, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
              console.error('ABI Lens error:', err);
              return resolve(undefined);
            }

            // parse all record layouts from stdout
            const records = parseAllRecordLayouts(stdout);
            const rec = records.find(r => r.name === word);
            if (!rec) {
              return resolve(undefined);
            }

            // log to output channel
            abiOutput.appendLine(`Hover layout for ${word}:\n${rec.lines.join('\n')}\n`);

            // build hover tooltip
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**ABI Layout for \`${word}\`:**\n\n`);
            md.appendCodeblock(rec.lines.join('\n'), 'plaintext');
            resolve(new vscode.Hover(md, range));
          });
        });
      }
    }
  );
  context.subscriptions.push(hoverProvider);

  // Command: summarize all record layouts in active file
  const summaryCmd = vscode.commands.registerCommand('abi-lens.showFileAbi', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor');
      return;
    }

    const doc = editor.document;
    const cwd = path.dirname(doc.fileName);
    const cmd = `clang++ -std=c++17 -Xclang -fdump-record-layouts -fsyntax-only "${doc.fileName}"`;

    abiOutput.clear();
    abiOutput.show(true);
    abiOutput.appendLine(`Running: ${cmd}\n`);

    exec(cmd, { cwd, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        abiOutput.appendLine(`Error: ${err.message}`);
        return;
      }

      const records = parseAllRecordLayouts(stdout);
      if (records.length === 0) {
        abiOutput.appendLine('No struct/class layouts found.');
        return;
      }

      for (const rec of records) {
        abiOutput.appendLine(`--- Layout: ${rec.name} ---`);
        abiOutput.appendLine(rec.lines.join('\n'));
        abiOutput.appendLine('');
      }
    });
  });
  context.subscriptions.push(summaryCmd);
}

export function deactivate() {}

/**
 * Parses Clang -fdump-record-layouts output and returns one RecordLayout per type.
 */
function parseAllRecordLayouts(output: string): RecordLayout[] {
  const lines = output.split('\n');
  const records: RecordLayout[] = [];
  let current: RecordLayout | null = null;

  for (let i = 0; i < lines.length; ++i) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Start of a new dump block
    if (trimmed.startsWith('*** Dumping AST Record Layout')) {
      // If we were in the middle of one, close it
      if (current) {
        records.push(current);
        current = null;
      }

      // Look ahead to the header line
      const headerLine = (lines[i + 1] || '').trim();
      const m = headerLine.match(/^\d+\s*\|\s*(class|struct)\s+(.+)$/);
      if (m) {
        const [, , fullName] = m;
        current = { name: fullName, lines: [ headerLine ] };
        // skip consuming headerLine in the next iteration
        i += 1;
      }
      continue;
    }

    // If we're inside a block, keep collecting until blank or next dump
    if (current) {
      if (trimmed === '' || trimmed.startsWith('*** Dumping AST Record Layout')) {
        records.push(current);
        current = null;
        // if it's the start of the next block, step back one so it's reprocessed
        if (trimmed.startsWith('***')) {
          i -= 1;
        }
      } else {
        current.lines.push(trimmed);
      }
    }
  }

  // flush any final record
  if (current) {
    records.push(current);
  }

  return records;
}

