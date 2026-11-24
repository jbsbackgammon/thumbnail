'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');
const start = html.indexOf('      function getStageRounds()');
const end = html.indexOf('      function applyTournamentMaster(', start);
assert.ok(start >= 0 && end > start, 'Round selector functions missing');
const fields = {
  series: { value: '盤聖戦' }, stage: { value: '１回戦' },
  supplement: { value: '' },
  stagePreset: { options: [], replaceChildren(...options) { this.options = options; }, add(option) { this.options.push(option); } }
};
const master = { id: 'bansei', name: '盤聖戦', nameEn: 'BANSEI' };
const fixtures = {
  bansei: [{ name: '決勝', nameEn: 'FINAL' }, { name: '１回戦', nameEn: 'ROUND OF 64' }],
  saiou: [{ name: '決勝', nameEn: 'FINAL' }, { name: '１回戦', nameEn: 'ROUND OF 32' }],
  japan: [{ name: '決勝', nameEn: 'FINAL' }, { name: '１回戦', nameEn: 'ROUND OF 16' }, { name: 'リーグ８回戦', nameEn: 'ROUND 8' }]
};
const api = Function('$', 'window', 'Option', 'findTournamentForCurrentFields',
  "let commonBrandReady = true; let lastAutoSupplement = ''; const LEGACY_STAGE_ENGLISH = {'決勝':'FINAL','準決勝':'SEMIFINAL','準々決勝':'QUARTERFINAL','１回戦':'ROUND 1'};\n"
  + html.slice(start, end) + '\nreturn { refreshStageOptions, stageEnglishFor, syncSupplementFromSelections, restoreAutoSupplement };')(
  id => fields[id], { JBSBrand: { getMatchRounds: id => fixtures[id] || [] } },
  function Option(text, value) { this.text = text; this.value = value; }, () => master);
api.refreshStageOptions();
assert.deepEqual(fields.stagePreset.options.map(o => o.value), ['', '決勝', '１回戦']);
api.syncSupplementFromSelections();
assert.equal(fields.supplement.value, 'JBS BANSEI ROUND OF 64');
master.id = 'saiou'; master.nameEn = 'SAIO';
api.refreshStageOptions();
api.syncSupplementFromSelections();
assert.equal(fields.supplement.value, 'JBS SAIO ROUND OF 32');
master.id = 'japan'; master.nameEn = 'JAPAN OPEN';
api.refreshStageOptions();
assert.deepEqual(fields.stagePreset.options.map(o => o.value), ['', '決勝', '１回戦', 'リーグ８回戦']);
assert.equal(api.stageEnglishFor('1回戦'), 'ROUND OF 16');
fields.supplement.value = 'JBS JAPAN OPEN ROUND 1';
api.restoreAutoSupplement(master);
assert.equal(fields.supplement.value, 'JBS JAPAN OPEN ROUND OF 16');
fields.stage.value = 'リーグ８回戦';
api.syncSupplementFromSelections();
assert.equal(fields.supplement.value, 'JBS JAPAN OPEN ROUND 8');
fields.supplement.value = '手入力のフッター';
api.restoreAutoSupplement(master);
assert.equal(fields.supplement.value, '手入力のフッター');
assert.equal(fields.stagePreset.value, '');
console.log('Thumbnail tournament-specific round choices and footer mapping passed.');
