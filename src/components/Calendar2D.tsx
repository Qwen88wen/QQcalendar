import { useMemo, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { getFlowersByOperators, FLOWER_ICONS } from '../lib/flowers';
import type { Diary } from '../types/database';
import './Calendar2D.css';

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const YEARS = [2025, 2026];

export function Calendar2D() {
  const { diaries, openModal, selectedDate, setSelectedDate } = useAppStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // 点击日期选择
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, selectedMonth, day);
    // 如果点击同一天，取消选择（回到今天）
    if (selectedDate &&
        selectedDate.getFullYear() === clickedDate.getFullYear() &&
        selectedDate.getMonth() === clickedDate.getMonth() &&
        selectedDate.getDate() === clickedDate.getDate()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(clickedDate);
    }
  };

  // 检查日期是否被选中
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === currentYear &&
           selectedDate.getMonth() === selectedMonth &&
           selectedDate.getDate() === day;
  };

  // 按日期分组日记
  const diariesByDate = useMemo(() => {
    const map: Record<string, Diary[]> = {};
    diaries.forEach(diary => {
      const date = new Date(diary.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(diary);
    });
    return map;
  }, [diaries]);

  // 获取某月的天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取某月第一天是星期几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // 渲染日历格子
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(currentYear, selectedMonth);
    const days = [];

    // 空白格子
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // 日期格子
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${selectedMonth}-${day}`;
      const dayDiaries = diariesByDate[dateKey] || [];
      const isToday =
        new Date().getFullYear() === currentYear &&
        new Date().getMonth() === selectedMonth &&
        new Date().getDate() === day;

      days.push(
        <div
          key={day}
          className={`calendar-day ${dayDiaries.length > 0 ? 'has-records' : ''} ${isToday ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <span className="day-number">{day}</span>
          {dayDiaries.length > 0 && (
            <div className="day-flowers">
              {dayDiaries.slice(0, 3).map((diary) => {
                // 显示所有操作者的花朵
                const flowers = getFlowersByOperators(diary.operators);
                const displayFlowers = flowers.length > 0 ? flowers : [FLOWER_ICONS[diary.flower_type || 1]];

                const needsVehicle = !diary.vehicle;

                return (
                  <span
                    key={diary.id}
                    className={`flower-group ${needsVehicle ? 'needs-vehicle' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(diary);
                    }}
                    title={diary.customer || diary.user_name || ''}
                  >
                    {displayFlowers.map((f, i) => (
                      <span key={i} className="flower-icon">{f}</span>
                    ))}
                    {needsVehicle && <span className="vehicle-dot"></span>}
                  </span>
                );
              })}
              {dayDiaries.length > 3 && (
                <span className="more-count">+{dayDiaries.length - 3}</span>
              )}
            </div>
          )}
          {dayDiaries.length > 0 && (
            <div className="day-summary">
              <span className={`status-dot ${dayDiaries.every(d => d.status === 'complete') ? 'complete' : 'incomplete'}`}></span>
              <span className="record-count">{dayDiaries.length}条</span>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-2d">
      {/* 月份选择器 */}
      <div className="month-selector">
        <button
          className="month-nav"
          onClick={() => setSelectedMonth(m => m > 0 ? m - 1 : 11)}
        >
          ◀
        </button>
        <div className="month-tabs">
          {MONTHS.map((month, idx) => (
            <button
              key={month}
              className={`month-tab ${selectedMonth === idx ? 'active' : ''}`}
              onClick={() => setSelectedMonth(idx)}
            >
              {month}
            </button>
          ))}
        </div>
        <button
          className="month-nav"
          onClick={() => setSelectedMonth(m => m < 11 ? m + 1 : 0)}
        >
          ▶
        </button>
      </div>

      {/* 年份选择器 */}
      <div className="year-selector">
        {YEARS.map(year => (
          <button
            key={year}
            className={`year-btn ${currentYear === year ? 'active' : ''}`}
            onClick={() => setCurrentYear(year)}
          >
            {year}年
          </button>
        ))}
      </div>

      {/* 年月标题 */}
      <h2 className="year-title">{currentYear}年 {MONTHS[selectedMonth]}</h2>

      {/* 星期标题 */}
      <div className="weekday-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>
    </div>
  );
}
