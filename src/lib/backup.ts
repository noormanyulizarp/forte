import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function backupConfig(toolId: string, configPath: string): Promise<void> {
  const forteDir = path.join(os.homedir(), '.forte');
  const backupDir = path.join(forteDir, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `${toolId}-${timestamp}.bak`;
  const backupPath = path.join(backupDir, backupName);
  
  fs.copyFileSync(configPath, backupPath);
  console.log(`  📦 Backed up to ${backupPath}`);
}

export function listBackups(): string[] {
  const backupDir = path.join(os.homedir(), '.forte', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  return fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.bak'))
    .sort()
    .reverse();
}

export function restoreBackup(backupName: string, targetPath: string): void {
  const backupDir = path.join(os.homedir(), '.forte', 'backups');
  const backupPath = path.join(backupDir, backupName);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupName}`);
  }
  
  fs.copyFileSync(backupPath, targetPath);
  console.log(`✓ Restored from ${backupName}`);
}

export function cleanOldBackups(maxBackups: number = 10): void {
  const backupDir = path.join(os.homedir(), '.forte', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    return;
  }
  
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.bak'))
    .sort();
  
  while (backups.length > maxBackups) {
    const oldBackup = backups.shift();
    if (oldBackup) {
      fs.unlinkSync(path.join(backupDir, oldBackup));
    }
  }
}
