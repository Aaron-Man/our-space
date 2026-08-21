export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  couple_name: string | null;
  anniversary_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Status {
  id: number;
  user_id: string;
  content: string;
  mood: string | null;
  image_url: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Journal {
  id: number;
  user_id: string;
  title: string;
  content: string;
  mood: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export interface Dish {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  ingredients: string | null;
  difficulty: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
  category?: Category;
}

export interface Order {
  id: number;
  user_id: string;
  dish_id: number;
  note: string | null;
  status: 'pending' | 'cooking' | 'done' | 'cancelled';
  created_at: string;
  updated_at: string;
  dish?: Dish;
}

export interface Travel {
  id: number;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'ongoing' | 'completed';
  notes: string | null;
  cover_image: string | null;
  created_at: string;
}

export interface Memo {
  id: number;
  user_id: string;
  content: string;
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  user_id: string;
  image_url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
}

export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '🥰', label: '甜蜜' },
  { emoji: '😋', label: '嘴馋' },
  { emoji: '😴', label: '慵懒' },
  { emoji: '🤔', label: '思考' },
  { emoji: '😤', label: '生气' },
  { emoji: '🥺', label: '委屈' },
  { emoji: '🎉', label: '庆祝' },
];

export const ORDER_STATUS_MAP: Record<Order['status'], { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  cooking: { label: '烹饪中', color: 'primary' },
  done: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'danger' },
};

export const TRAVEL_STATUS_MAP: Record<Travel['status'], { label: string; color: string }> = {
  planning: { label: '计划中', color: 'primary' },
  ongoing: { label: '进行中', color: 'accent' },
  completed: { label: '已完成', color: 'success' },
};

export const MEMO_COLORS = [
  '#fef5f6', // 粉色
  '#f0f7f4', // 抹茶绿
  '#fef9e7', // 淡黄
  '#f0f4fe', // 淡蓝
  '#fdf0ff', // 淡紫
  '#fff5eb', // 淡橙
];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '简单',
  2: '较易',
  3: '中等',
  4: '较难',
  5: '困难',
};
