const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const filesToFix = [
  'low_battery_soft.mp3', 'low_battery_medium.mp3', 'low_battery_critical.mp3',
  'bt_connected_soft.mp3', 'bt_connected_medium.mp3', 'bt_connected_critical.mp3',
  'bt_lost_soft.mp3', 'bt_lost_medium.mp3', 'bt_lost_critical.mp3'
];

const targetI = -12;
const targetTP = -1;

const soundsDir = path.join(__dirname, 'public', 'sounds');
const reportLines = [];
reportLines.push('# AuraPing Targeted Audio Asset Normalization Report');
reportLines.push('');
reportLines.push('| Filename | Old LUFS | New LUFS | Gain Applied (dB) |');
reportLines.push('| :--- | :--- | :--- | :--- |');

for (const file of filesToFix) {
  const filePath = path.join(soundsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }

  const tempPath = path.join(soundsDir, 'temp_' + file);

  // 1. Measure input loudness using loudnorm first pass
  const measureResult = spawnSync(ffmpegPath, [
    '-hide_banner', '-i', filePath,
    '-af', `loudnorm=I=${targetI}:TP=${targetTP}:print_format=json`,
    '-f', 'null', '-'
  ], { encoding: 'utf8' });

  // Parse JSON from stderr
  const stderr = measureResult.stderr;
  const jsonMatch = stderr.match(/\{[\s\S]*?\}/);
  
  let oldLUFS = 'N/A';
  let measuredTP = 'N/A';
  let measuredI = -99;
  
  if (jsonMatch) {
    try {
      const stats = JSON.parse(jsonMatch[0]);
      oldLUFS = parseFloat(stats.input_i).toFixed(1);
      measuredI = parseFloat(stats.input_i);
      measuredTP = parseFloat(stats.input_tp);
    } catch (e) {
      console.error('Failed to parse loudnorm output', e);
    }
  }

  const gainApplied = (targetI - measuredI).toFixed(1);

  // 2. Perform volume boost
  const normFilter = `volume=3.0`;

  const normResult = spawnSync(ffmpegPath, [
    '-y', '-hide_banner', '-i', filePath,
    '-af', normFilter,
    '-c:a', 'libmp3lame', '-q:a', '2', // High quality VBR
    tempPath
  ], { encoding: 'utf8' });

  if (normResult.status !== 0) {
    console.error(`Failed to boost ${file}`);
    continue;
  }

  // 3. Replace original file
  fs.renameSync(tempPath, filePath);

  console.log(`Boosted ${file} by 3x amplitude`);
  reportLines.push(`| **${file}** | N/A | N/A | 3x Amplitude (+9.5dB) |`);
}

const reportContent = reportLines.join('\n');
fs.writeFileSync('targeted_audio_fix_report.md', reportContent);
console.log('Report generated: targeted_audio_fix_report.md');
