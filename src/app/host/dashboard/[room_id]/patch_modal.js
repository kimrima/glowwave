const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add imports if not present
if (!content.includes("import { CustomAlertModal, CustomConfirmModal }")) {
  const importTarget = "import { isSupabaseConfigured } from '@/lib/supabase';";
  const importReplace = `import { isSupabaseConfigured } from '@/lib/supabase';\nimport { CustomAlertModal, CustomConfirmModal } from '@/components/CustomModal';`;
  content = content.replace(importTarget, importReplace);
}

// 2. Add states & showAlert/showConfirm helpers
if (!content.includes("const [customAlert, setCustomAlert]")) {
  const stateTarget = "  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);";
  const stateReplace = `  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; message: string; title?: string } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ isOpen: boolean; message: string; title?: string; onConfirm: () => void } | null>(null);
  const showAlert = (message: string, title?: string) => {
    setCustomAlert({ isOpen: true, message, title });
  };
  const showConfirm = (message: string, onConfirm: () => void, title?: string) => {
    setCustomConfirm({ isOpen: true, message, onConfirm, title });
  };`;
  content = content.replace(stateTarget, stateReplace);
}

// 3. Mount JSX Custom Modals at the bottom (right before the last wrapper </div>)
if (!content.includes("<CustomAlertModal")) {
  const lastTarget = `      {/* Invisible silent video loop to force-keep iOS devices awake */}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        style={{ position: 'fixed', opacity: 0.001, pointerEvents: 'none', width: '4px', height: '4px', left: '0px', bottom: '0px', zIndex: -100 }}
        src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0"
      />`;
      
  const lastReplace = `${lastTarget}

      <CustomAlertModal 
        isOpen={!!customAlert?.isOpen} 
        title={customAlert?.title} 
        message={customAlert?.message || ''} 
        onClose={() => setCustomAlert(null)} 
      />
      <CustomConfirmModal 
        isOpen={!!customConfirm?.isOpen} 
        title={customConfirm?.title} 
        message={customConfirm?.message || ''} 
        onConfirm={() => {
          customConfirm?.onConfirm();
          setCustomConfirm(null);
        }}
        onCancel={() => setCustomConfirm(null)} 
      />`;
  content = content.replace(lastTarget, lastReplace);
}

// 4. Replace alerts with showAlert
content = content.replace(/\balert\(/g, 'showAlert(');

// 5. Replace confirm() branches in host dashboard
// Case A: Font change confirm (line 279)
const searchFont = `      if (confirm(confirmFontMsg)) {
        handleFontSelect(fontVal, isEdit);
      }`;
const replaceFont = `      showConfirm(confirmFontMsg, () => {
        handleFontSelect(fontVal, isEdit);
      });`;
content = content.replace(searchFont, replaceFont);

// Case B: delete slot confirm (line 1178)
const searchDeleteSlot = `    if (confirm(confirmDeleteSlot)) {
      const newPresets = [...presets];
      newPresets[index] = {
        name: \`\${t('preset', activeLocale)} \${index + 1}\`,
        bg_color: '#0B0B0F',
        text: 'GlowWave',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        is_empty: true,
      };
      setPresets(newPresets);
      savePresets(newPresets);
      if (activePresetIndex === index) {
        setActivePresetIndex(null);
        handleSendPreset(null);
      }
    }`;
const replaceDeleteSlot = `    showConfirm(confirmDeleteSlot, () => {
      const newPresets = [...presets];
      newPresets[index] = {
        name: \`\${t('preset', activeLocale)} \${index + 1}\`,
        bg_color: '#0B0B0F',
        text: 'GlowWave',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        is_empty: true,
      };
      setPresets(newPresets);
      savePresets(newPresets);
      if (activePresetIndex === index) {
        setActivePresetIndex(null);
        handleSendPreset(null);
      }
    });`;
content = content.replace(searchDeleteSlot, replaceDeleteSlot);

// Case C: Reset all presets (line 1186)
const searchReset = `    if (confirm(t('confirm_reset_all', activeLocale))) {
      handleResetAll();
    }`;
const replaceReset = `    showConfirm(t('confirm_reset_all', activeLocale), () => {
      handleResetAll();
    });`;
content = content.replace(searchReset, replaceReset);

// Case D: Exit room confirm (line 1929)
const searchExit = `                if (confirm(exitConfirmMsg)) {
                  onClose();
                }`;
const replaceExit = `                showConfirm(exitConfirmMsg, () => {
                  onClose();
                });`;
content = content.replace(searchExit, replaceExit);

// Case E: Template select confirm (line 2322)
const searchTemplate = `                        if (confirm(confirmTemplateMsg)) {
                          handleSelectTemplate(tmpl);
                        }`;
const replaceTemplate = `                        showConfirm(confirmTemplateMsg, () => {
                          handleSelectTemplate(tmpl);
                        });`;
content = content.replace(searchTemplate, replaceTemplate);

// Case F: Custom bg change confirm (line 2676)
const searchBg = `                            if (confirm(confirmCustomBgMsg)) {
                              handleBgColorChange(colorVal, isEdit);
                            }`;
const replaceBg = `                            showConfirm(confirmCustomBgMsg, () => {
                              handleBgColorChange(colorVal, isEdit);
                            });`;
content = content.replace(searchBg, replaceBg);

// Case G: Custom text change confirm (line 2759)
const searchText = `                            if (confirm(confirmCustomTextMsg)) {
                              handleTextChange(textVal, isEdit);
                            }`;
const replaceText = `                            showConfirm(confirmCustomTextMsg, () => {
                              handleTextChange(textVal, isEdit);
                            });`;
content = content.replace(searchText, replaceText);

// Case H: Special effect change confirm (line 2960)
const searchEffect1 = `                              if (confirm(confirmSpecialEffectMsg)) {
                                handleEffectSelect(effectVal, isEdit);
                              }`;
const replaceEffect1 = `                              showConfirm(confirmSpecialEffectMsg, () => {
                                handleEffectSelect(effectVal, isEdit);
                              });`;
content = content.replace(searchEffect1, replaceEffect1);

// Case I: Special effect 2 change confirm (line 4183)
const searchEffect2 = `                            if (confirm(confirmSpecialEffectMsg)) {
                              handleEffectSelect(effectVal, isEdit);
                            }`;
const replaceEffect2 = `                            showConfirm(confirmSpecialEffectMsg, () => {
                              handleEffectSelect(effectVal, isEdit);
                            });`;
content = content.replace(searchEffect2, replaceEffect2);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully completed host dashboard modal patch script execution!');
