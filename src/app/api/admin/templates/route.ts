import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { LOCALIZED_TEMPLATES } from '@/lib/templates';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      templates: LOCALIZED_TEMPLATES
    });
  } catch (error) {
    console.error('[Admin Templates GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templates } = body;
    if (!templates) {
      return NextResponse.json({ error: 'Templates data is required' }, { status: 400 });
    }

    // Path to templates.ts
    const filePath = path.join(process.cwd(), 'src', 'lib', 'templates.ts');

    // Generate templates.ts content dynamically code-generation
    const fileContent = `import { Preset } from './types';
import { Locale } from './translations';

export interface TemplateCategory {
  id: 'anniversary' | 'busking' | 'sports' | 'party' | 'store';
  label: string;
  icon: string;
  presets: Preset[];
}

export const getDefaultsByLocale = (locale: Locale): Preset[] => {
  switch (locale) {
    case 'en':
      return [
        { bg_color: '#0B0B0F', text: 'Solid Color', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#3B82F6', text: 'Soft Blink', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#FFFFFF', text: 'Psychedelic', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#0B0B0F', text: 'Winner!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: 'Good luck next time!', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'en' },
        { bg_color: '#F97316', text: 'Scroll', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#8B5CF6', text: 'Countdown', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'START', font_family: 'sans-thin', font_size: 100, locale: 'en' }
      ];
    case 'ja':
      return [
        { bg_color: '#0B0B0F', text: '単色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#3B82F6', text: 'ゆっくり点滅', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#FFFFFF', text: 'サイケデリック', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'アタリ！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '残念！また今度ね..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'ja' },
        { bg_color: '#F97316', text: 'スクロール', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#8B5CF6', text: 'カウントダウン', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'スタート', font_family: 'sans-thin', font_size: 100, locale: 'ja' }
      ];
    case 'es':
      return [
        { bg_color: '#0B0B0F', text: 'Color Sólido', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#3B82F6', text: 'Parpadeo Suave', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#FFFFFF', text: '¡A BAILAR!', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#0B0B0F', text: '¡GANADOR!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '¡Suerte la próxima!', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'es' },
        { bg_color: '#F97316', text: 'Desplazar', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#8B5CF6', text: 'Cuenta Atrás', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '¡EMPEZAR!', font_family: 'sans-thin', font_size: 100, locale: 'es' }
      ];
    case 'zh-TW':
      return [
        { bg_color: '#0B0B0F', text: '單色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#3B82F6', text: '呼吸閃爍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#FFFFFF', text: '狂歡霓虹', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '中獎！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '沒中，再接再厲！', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'zh-TW' },
        { bg_color: '#F97316', text: '滾動跑馬燈', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#8B5CF6', text: '倒數計時', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '開始', font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' }
      ];
    case 'zh-HK':
      return [
        { bg_color: '#0B0B0F', text: '單色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#3B82F6', text: '呼吸閃爍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#FFFFFF', text: '狂歡霓虹', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '中獎！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '冇中，下次好運！', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'zh-HK' },
        { bg_color: '#F97316', text: '滾動跑馬燈', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#8B5CF6', text: '倒數計時', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '開始', font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' }
      ];
    default:
      return [
        { bg_color: '#0B0B0F', text: '단색', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#3B82F6', text: '부드러운 깜빡이', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#FFFFFF', text: '사이키', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#0B0B0F', text: '당첨!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '아쉽네요! 다음 기회에..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'ko' },
        { bg_color: '#F97316', text: '스크롤', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#8B5CF6', text: '카운트다운', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'START', font_family: 'sans-thin', font_size: 100, locale: 'ko' }
      ];
  }
};

export const defaults: Preset[] = getDefaultsByLocale('ko');

export const LOCALIZED_TEMPLATES: Record<Locale, TemplateCategory[]> = ${JSON.stringify(templates, null, 2)};
`;

    fs.writeFileSync(filePath, fileContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Templates database updated successfully'
    });
  } catch (error) {
    console.error('[Admin Templates POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
