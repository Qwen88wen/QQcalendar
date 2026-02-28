// 用户角色
export type UserRole = 'editor' | 'viewer';

// 花类型 (1-5)
export type FlowerType = 1 | 2 | 3 | 4 | 5;

// 状态类型
export type DiaryStatus = 'complete' | 'incomplete';

// 工作类型
export type WorkType = 'HARVEST' | 'PRUNNING' | 'FERTILIZE' | 'POISON' | 'SEEDLING' | 'SAND/ STONE' | 'WELDING' | 'BUILDING HOUSE';

// 标签类型 (与工作类型相同)
export type DiaryTag = WorkType;

// 单位类型
export type UnitType = 'TON' | 'POKOK' | 'EKAR' | 'JOB' | 'BAG' | 'DAY' | 'HALF DAY';

// 薪资分组
export type SalaryGroup = 'TongHuat' | 'AhSeng';

// 工作类型对应的可用单位
export const WORK_TYPE_UNITS: Record<WorkType, UnitType[]> = {
  'POISON': ['DAY', 'HALF DAY'],
  'FERTILIZE': ['BAG', 'EKAR', 'JOB'],
  'PRUNNING': ['EKAR', 'POKOK', 'JOB'],
  'HARVEST': ['TON'],
  'SEEDLING': ['POKOK'],
  'SAND/ STONE': ['TON', 'JOB'],
  'WELDING': ['JOB'],
  'BUILDING HOUSE': ['JOB'],
};

// profiles 表
export interface Profile {
  id: string;
  role: UserRole;
}

// diaries 表
export interface Diary {
  id: string;
  user_id: string;
  user_name: string | null;
  status: DiaryStatus;            // 状态: complete/incomplete
  customer: string | null;        // 园主名称 (旧字段，保留兼容)
  customer_id: string | null;     // 园主ID (关联 customers 表)
  remark: string | null;          // 单位
  worker: string | null;          // 工人
  vehicle: string | null;         // 车号
  weight: string | null;          // 数量
  flower_type: FlowerType | null;
  operators: string[] | null;     // 操作过的用户列表
  notified: boolean;              // 是否已通知园主
  vehicle_dismissed: boolean;     // 是否已忽略车号提醒
  tag: DiaryTag | null;           // 工作类型
  customer_price: number | null;  // 向顾客收的价格 (用户自定义时)
  worker_price: number | null;    // 付给工人的价格 (用户自定义时)
  salary_group: SalaryGroup | null; // 薪资分组
  created_at: string;
  updated_at: string;
}

export interface DiaryInsert {
  user_id: string;
  user_name?: string | null;
  status?: DiaryStatus;
  customer?: string | null;
  customer_id?: string | null;
  remark?: string | null;
  worker?: string | null;
  vehicle?: string | null;
  weight?: string | null;
  flower_type?: FlowerType | null;
  operators?: string[] | null;
  notified?: boolean;
  vehicle_dismissed?: boolean;
  tag?: DiaryTag | null;
  customer_price?: number | null;
  worker_price?: number | null;
  salary_group?: SalaryGroup | null;
  created_at?: string;  // 允许指定创建日期
}

export interface DiaryUpdate {
  status?: DiaryStatus;
  customer?: string | null;
  customer_id?: string | null;
  remark?: string | null;
  worker?: string | null;
  vehicle?: string | null;
  weight?: string | null;
  flower_type?: FlowerType | null;
  operators?: string[] | null;
  notified?: boolean;
  vehicle_dismissed?: boolean;
  tag?: DiaryTag | null;
  customer_price?: number | null;
  worker_price?: number | null;
  salary_group?: SalaryGroup | null;
}

// diary_remarks 表 (无 user_id，只有 user_name)
export interface DiaryRemark {
  id: string;
  diary_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface DiaryRemarkInsert {
  diary_id: string;
  user_name: string;
  content: string;
}

// todos 表
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
  user_name: string | null;
  due_date?: string | null;
}

export interface TodoInsert {
  text: string;
  done?: boolean;
  created_at?: string;
  user_name?: string | null;
  due_date?: string | null;
}

export interface TodoUpdate {
  text?: string;
  done?: boolean;
  due_date?: string | null;
}

// customers 表 (园主主档)
export interface Customer {
  id: string;
  code: string | null;                    // 顾客代码 (如 A0001)
  name: string;
  notes: string | null;
  harvest_customer_price: number | null;  // HARVEST 向顾客收的价格/TON
  harvest_worker_price: number | null;    // HARVEST 付给工人的价格/TON
  salary_group_default: SalaryGroup | null; // 默认薪资分组
  is_active: boolean;
}

export interface CustomerInsert {
  code?: string | null;
  name: string;
  notes?: string | null;
  harvest_customer_price?: number | null;
  harvest_worker_price?: number | null;
  salary_group_default?: SalaryGroup | null;
  is_active?: boolean;
}

export interface CustomerUpdate {
  code?: string | null;
  name?: string;
  notes?: string | null;
  harvest_customer_price?: number | null;
  harvest_worker_price?: number | null;
  salary_group_default?: SalaryGroup | null;
  is_active?: boolean;
}

// workers 表 (工人主档)
export interface Worker {
  id: string;
  code: string | null;   // 工人代码
  name: string;
  is_active: boolean;
}

export interface WorkerInsert {
  code?: string | null;
  name: string;
  is_active?: boolean;
}

export interface WorkerUpdate {
  code?: string | null;
  name?: string;
  is_active?: boolean;
}

// vehicles 表 (车辆主档)
export interface Vehicle {
  id: string;
  plate_number: string;
  is_active: boolean;
}

export interface VehicleInsert {
  plate_number: string;
  is_active?: boolean;
}

export interface VehicleUpdate {
  plate_number?: string;
  is_active?: boolean;
}

// work_prices 表 (工作价格表)
export interface WorkPrice {
  id: string;
  work_type: WorkType;
  unit: UnitType;
  customer_price: number | null;  // 向顾客收的价格
  worker_price: number | null;    // 付给工人的价格
  is_fixed: boolean;              // 是否固定价格
}

export interface WorkPriceInsert {
  work_type: WorkType;
  unit: UnitType;
  customer_price?: number | null;
  worker_price?: number | null;
  is_fixed?: boolean;
}

export interface WorkPriceUpdate {
  work_type?: WorkType;
  unit?: UnitType;
  customer_price?: number | null;
  worker_price?: number | null;
  is_fixed?: boolean;
}

// 薪资明细
export interface SalaryDetail {
  date: string;
  customer: string;
  workType: WorkType;
  unit: string;
  quantity: number | null;  // 该工人分摊后的数量（为空时显示空白）
  unitPrice: number;
  subtotal: number;
}

// 工人薪资汇总
export interface SalarySummary {
  workerName: string;
  details: SalaryDetail[];
  total: number;
}

// Database 类型定义
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      diaries: {
        Row: Diary;
        Insert: DiaryInsert;
        Update: DiaryUpdate;
      };
      diary_remarks: {
        Row: DiaryRemark;
        Insert: DiaryRemarkInsert;
        Update: Partial<Omit<DiaryRemark, 'id' | 'created_at'>>;
      };
      todos: {
        Row: Todo;
        Insert: TodoInsert;
        Update: TodoUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      workers: {
        Row: Worker;
        Insert: WorkerInsert;
        Update: WorkerUpdate;
      };
      vehicles: {
        Row: Vehicle;
        Insert: VehicleInsert;
        Update: VehicleUpdate;
      };
      work_prices: {
        Row: WorkPrice;
        Insert: WorkPriceInsert;
        Update: WorkPriceUpdate;
      };
    };
  };
}
