// 카테고리 이름·색·아이콘 — 한 객체에 모은다 (06 문서 2절). 목록은 서버(others/constants.py)와 같아야 한다.

import {
  BookOpen, Bus, Coffee, Ellipsis, HeartPulse, House, ShoppingBag, Ticket, Utensils, Wallet,
  type LucideIcon,
} from 'lucide-react';

export type Category = {
  name: string;
  color: string; // 그래프·배경 (배경은 14% 투명도로 쓴다)
  iconColor: string;
  Icon: LucideIcon;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { name: '식비', color: '#FF7A45', iconColor: '#B8420C', Icon: Utensils },
  { name: '카페·간식', color: '#B07A4F', iconColor: '#7A4B22', Icon: Coffee },
  { name: '교통', color: '#3B82F6', iconColor: '#1D5FD1', Icon: Bus },
  { name: '쇼핑', color: '#EC4899', iconColor: '#BE1F72', Icon: ShoppingBag },
  { name: '생활', color: '#6D7BE8', iconColor: '#4352C4', Icon: House },
  { name: '의료·건강', color: '#E5484D', iconColor: '#C42B31', Icon: HeartPulse },
  { name: '문화·여가', color: '#F5B301', iconColor: '#8F6A00', Icon: Ticket },
  { name: '교육', color: '#2BB3D6', iconColor: '#0B7C99', Icon: BookOpen },
  { name: '기타', color: '#98A2B3', iconColor: '#5B6678', Icon: Ellipsis },
];

// 수입 카테고리는 모두 같은 색·아이콘을 쓴다.
export const INCOME_CATEGORIES: Category[] = ['급여', '용돈', '기타수입'].map((name) => ({
  name, color: '#00A67E', iconColor: '#005F45', Icon: Wallet,
}));

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// 모르는 이름이 오면 '기타' 모양으로 보여 준다.
export function getCategory(name: string): Category {
  return ALL.find((category) => category.name === name) ?? { ...EXPENSE_CATEGORIES[8], name };
}

// 카테고리 색에 14% 투명도(16진수 24)를 붙인 배경색
export function softColor(color: string): string {
  return `${color}24`;
}
