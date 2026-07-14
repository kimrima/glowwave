const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Target the "글자 색상" block inside host dashboard/page.tsx (L4024-L4109 approx)
const searchStr = `                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '글자 색상',
                        en: 'Text Color',
                        ja: '文字色',
                        es: 'Color del texto',
                        'zh-TW': '文字顏色',
                        'zh-HK': '文字顏色'
                      }[activeLocale] || '글자 색상'
                    }
                  </label>
                  <div className="grid grid-cols-3 gap-2 h-10 items-center font-medium">
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#FFFFFF' }))}
                      className={\`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 \${
                        editingPreset.text_color === '#FFFFFF'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }\`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white border border-black/20" />
                      <span>
                        {
                          {
                            ko: '흰색',
                            en: 'White',
                            ja: '白',
                            es: 'Blanco',
                            'zh-TW': '白色',
                            'zh-HK': '白色'
                          }[activeLocale] || '흰색'
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#000000' }))}
                      className={\`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 \${
                        editingPreset.text_color === '#000000'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }\`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black border border-white/20" />
                      <span>
                        {
                          {
                            ko: '검은색',
                            en: 'Black',
                            ja: '黒',
                            es: 'Negro',
                            'zh-TW': '黑色',
                            'zh-HK': '黑色'
                          }[activeLocale] || '검은색'
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#FFD700' }))}
                      className={\`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 \${
                        editingPreset.text_color === '#FFD700'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }\`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#FFD700] border border-white/10" />
                      <span>
                        {
                          {
                            ko: '노란색',
                            en: 'Yellow',
                            ja: '黄',
                            es: 'Amarillo',
                            'zh-TW': '黃色',
                            'zh-HK': '黃色'
                          }[activeLocale] || '노란색'
                        }
                      </span>
                    </button>
                  </div>
                </div>`;

const replaceStr = `                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '글자 색상',
                        en: 'Text Color',
                        ja: '文字色',
                        es: 'Color del texto',
                        'zh-TW': '文字顏色',
                        'zh-HK': '文字顏色'
                      }[activeLocale] || '글자 색상'
                    }
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                      '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'
                    ].map((hex) => {
                      const isSelected = editingPreset.text_color === hex;
                      const dotColor = hex === '#FFFFFF' ? '#000000' : '#FFFFFF';
                      const isDark = hex === '#000000';
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: hex }))}
                          className={\`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center \${
                            isSelected 
                              ? 'border-white scale-105 shadow-md' 
                              : \`border-white/10 hover:border-white/30 \${isDark ? 'border-white/25 bg-black' : ''}\`
                          }\`}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                          )}
                        </button>
                      );
                    })}

                    {/* Custom Color Palette Picker for Paid Tiers */}
                    {room?.tier !== 'free' ? (
                      <div 
                        className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title={
                          {
                            ko: '커스텀 글자 색상 선택',
                            en: 'Select custom text color',
                          }[activeLocale] || '커스텀 글자 색상 선택'
                        }
                      >
                        <input
                          type="color"
                          value={editingPreset.text_color || '#FFFFFF'}
                          onChange={(e) => setEditingPreset(prev => ({ ...prev!, text_color: e.target.value }))}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                        />
                        {editingPreset.text_color && !['#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                          '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'].includes(editingPreset.text_color) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = {
                            ko: '원하는 글자 색상을 자유롭게 선택하는 커스텀 색상 기능은 유료 요금제(Lite 이상) 전용 혜택입니다. 업그레이드하시겠습니까?',
                            en: 'Custom text color palette is exclusive to paid plans (Lite or higher). Would you like to upgrade?',
                          }[activeLocale] || '커스텀 색상 기능은 유료 요금제 전용 혜택입니다. 업그레이드하시겠습니까?';
                          if (confirm(confirmMsg)) {
                            setSelectedUpgradeTier(null);
                            setUpgradeStep('select');
                            setIsUpgradeModalOpen(true);
                          }
                        }}
                        className="h-9 rounded-lg border border-white/10 bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                        title="Locked"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully patched host dashboard text color editor!');
} else {
  console.log('Search block not found. Trying regex.');
  // Regex version
  const regexText = /\{\/\*\s*글자\s+색상\s*\*\/\}[\s\S]*?<div\s+className="grid\s+grid-cols-3\s+gap-2[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;
  if (regexText.test(content)) {
    content = content.replace(regexText, replaceStr);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully patched host dashboard text color editor via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
