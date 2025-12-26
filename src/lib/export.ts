import { supabase } from './supabase';
import type { Diary, DiaryRemark } from '../types/database';

interface ExportData {
  exportedAt: string;
  version: string;
  diaries: Diary[];
  remarks: DiaryRemark[];
}

// 导出所有数据为 JSON
export async function exportAllData(): Promise<void> {
  try {
    // 获取所有日记
    const { data: diaries, error: diariesError } = await supabase
      .from('diaries')
      .select('*')
      .order('created_at', { ascending: false });

    if (diariesError) {
      throw new Error(`获取日记失败: ${diariesError.message}`);
    }

    // 获取所有备注
    const { data: remarks, error: remarksError } = await supabase
      .from('diary_remarks')
      .select('*')
      .order('created_at', { ascending: true });

    if (remarksError) {
      throw new Error(`获取备注失败: ${remarksError.message}`);
    }

    // 构建导出数据
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      diaries: (diaries as Diary[]) || [],
      remarks: (remarks as DiaryRemark[]) || [],
    };

    // 生成文件名（包含日期）
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `QQcalendar-backup-${dateStr}.json`;

    // 创建 Blob 并下载
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理 URL
    URL.revokeObjectURL(url);

    console.log(`[Export] 数据导出成功: ${fileName}`);
    console.log(`[Export] 共 ${exportData.diaries.length} 条记录, ${exportData.remarks.length} 条备注`);

    alert(`导出成功!\n\n文件: ${fileName}\n记录: ${exportData.diaries.length} 条\n备注: ${exportData.remarks.length} 条`);

  } catch (error) {
    console.error('[Export] 导出失败:', error);
    alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
