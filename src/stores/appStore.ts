import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Diary, DiaryRemark, UserRole, FlowerType, Todo, Customer, Worker, Vehicle, WorkPrice } from '../types/database';
import type { LocalUser } from '../lib/users';

// 花朵筛选类型
export type FlowerFilter = 'all' | FlowerType;

// 输入用户类型 (对应 LOCAL_USERS)
export type InputUser = 'QQrou' | 'QQfang' | 'QQwen';

// Session 过期时间 (24小时)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// 检查 session 是否有效（独立函数）
export function isSessionValid(): boolean {
  const state = useAppStore.getState();
  if (!state.userId || !state.loginTime) return false;
  return Date.now() - state.loginTime < SESSION_DURATION;
}

interface AppState {
  // 用户状态
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  loginTime: number | null;  // 登录时间戳

  // 数据
  diaries: Diary[];
  remarks: DiaryRemark[];
  todos: Todo[];

  // 主档数据
  customers: Customer[];
  workers: Worker[];
  vehicles: Vehicle[];
  workPrices: WorkPrice[];

  // UI 状态
  selectedDiary: Diary | null;
  isModalOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;

  // 新增: 筛选和输入状态
  flowerFilter: FlowerFilter;
  activeInputUser: InputUser;
  showRecordList: boolean;
  focusedFlowerId: string | null;

  // 选中的日期 (用于查看记录)
  selectedDate: Date | null;

  // 日历视图年月
  calendarYear: number;
  calendarMonth: number;

  // 只显示未填车号的记录
  showOnlyMissingVehicle: boolean;

  // 只显示未通知的记录
  showOnlyUnnotified: boolean;

  // Actions
  loginUser: (user: LocalUser) => void;
  logoutUser: () => void;
  setDiaries: (diaries: Diary[]) => void;
  addDiary: (diary: Diary) => void;
  updateDiary: (diary: Diary) => void;
  removeDiary: (id: string) => void;
  setRemarks: (remarks: DiaryRemark[]) => void;
  addRemark: (remark: DiaryRemark) => void;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  setSelectedDiary: (diary: Diary | null) => void;
  openModal: (diary?: Diary) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 新增 Actions
  setFlowerFilter: (filter: FlowerFilter) => void;
  setActiveInputUser: (user: InputUser) => void;
  toggleRecordList: () => void;
  setFocusedFlower: (id: string | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setCalendarYear: (year: number) => void;
  setCalendarMonth: (month: number) => void;
  toggleMissingVehicleFilter: () => void;
  toggleUnnotifiedFilter: () => void;
  batchUpdateDiaries: (ids: string[], updates: Partial<Diary>) => void;

  // 主档 Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  setWorkers: (workers: Worker[]) => void;
  addWorker: (worker: Worker) => void;
  updateWorker: (worker: Worker) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  setWorkPrices: (workPrices: WorkPrice[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      userId: null,
      userName: null,
      userRole: null,
      loginTime: null,
      diaries: [],
      remarks: [],
      todos: [],

      // 主档数据初始状态
      customers: [],
      workers: [],
      vehicles: [],
      workPrices: [],

      selectedDiary: null,
      isModalOpen: false,
      isEditing: false,
      isLoading: false,
      error: null,

      // 新增状态
      flowerFilter: 'all',
      activeInputUser: 'QQrou',
      showRecordList: false,
      focusedFlowerId: null,
      selectedDate: null,
      calendarYear: new Date().getFullYear(),
      calendarMonth: new Date().getMonth(),
      showOnlyMissingVehicle: false,
      showOnlyUnnotified: false,

      // Actions
      loginUser: (user) => set({
        userId: user.id,
        userName: user.displayName,
        userRole: user.role,
        loginTime: Date.now(),
      }),

      logoutUser: () => set({
        userId: null,
        userName: null,
        userRole: null,
        loginTime: null,
      }),

      setDiaries: (diaries: Diary[]) => set({ diaries }),

      addDiary: (diary: Diary) => set((state) => {
        // 检查是否已存在相同 ID 的记录，防止重复添加
        if (state.diaries.some(d => d.id === diary.id)) {
          return state; // 已存在，不添加
        }
        return { diaries: [diary, ...state.diaries] };
      }),

      updateDiary: (diary: Diary) => set((state) => ({
        diaries: state.diaries.map((d) => d.id === diary.id ? diary : d),
        selectedDiary: state.selectedDiary?.id === diary.id ? diary : state.selectedDiary,
      })),

      removeDiary: (id: string) => set((state) => ({
        diaries: state.diaries.filter((d) => d.id !== id),
        selectedDiary: state.selectedDiary?.id === id ? null : state.selectedDiary,
      })),

      setRemarks: (remarks: DiaryRemark[]) => set({ remarks }),

      addRemark: (remark: DiaryRemark) => set((state) => ({
        remarks: [...state.remarks, remark],
      })),

      setTodos: (todos: Todo[]) => set({ todos }),

      addTodo: (todo: Todo) => set((state) => ({
        todos: [todo, ...state.todos]
      })),

      updateTodo: (todo: Todo) => set((state) => ({
        todos: state.todos.map((t) => t.id === todo.id ? todo : t),
      })),

      removeTodo: (id: string) => set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
      })),

      setSelectedDiary: (diary: Diary | null) => set({ selectedDiary: diary }),

      openModal: (diary?: Diary) => set({
        isModalOpen: true,
        selectedDiary: diary ?? null,
        isEditing: !!diary,
      }),

      closeModal: () => set({
        isModalOpen: false,
        selectedDiary: null,
        isEditing: false,
      }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      // 新增 Actions
      setFlowerFilter: (filter: FlowerFilter) => set({ flowerFilter: filter }),
      setActiveInputUser: (user: InputUser) => set({ activeInputUser: user }),
      toggleRecordList: () => set((state) => ({ showRecordList: !state.showRecordList })),
      setFocusedFlower: (id: string | null) => set({ focusedFlowerId: id }),
      setSelectedDate: (date: Date | null) => set({ selectedDate: date }),
      setCalendarYear: (year: number) => set({ calendarYear: year }),
      setCalendarMonth: (month: number) => set({ calendarMonth: month }),
      toggleMissingVehicleFilter: () => set((state) => ({ showOnlyMissingVehicle: !state.showOnlyMissingVehicle })),
      toggleUnnotifiedFilter: () => set((state) => ({ showOnlyUnnotified: !state.showOnlyUnnotified })),
      batchUpdateDiaries: (ids, updates) => set((state) => ({
        diaries: state.diaries.map((d) => ids.includes(d.id) ? { ...d, ...updates } as Diary : d),
      })),

      // 主档 Actions
      setCustomers: (customers: Customer[]) => set({ customers }),
      addCustomer: (customer: Customer) => set((state) => ({
        customers: [...state.customers, customer].sort((a, b) => a.name.localeCompare(b.name)),
      })),
      updateCustomer: (customer: Customer) => set((state) => ({
        customers: state.customers.map((c) => c.id === customer.id ? customer : c),
      })),

      setWorkers: (workers: Worker[]) => set({ workers }),
      addWorker: (worker: Worker) => set((state) => ({
        workers: [...state.workers, worker].sort((a, b) => a.name.localeCompare(b.name)),
      })),
      updateWorker: (worker: Worker) => set((state) => ({
        workers: state.workers.map((w) => w.id === worker.id ? worker : w),
      })),

      setVehicles: (vehicles: Vehicle[]) => set({ vehicles }),
      addVehicle: (vehicle: Vehicle) => set((state) => ({
        vehicles: [...state.vehicles, vehicle].sort((a, b) => a.plate_number.localeCompare(b.plate_number)),
      })),
      updateVehicle: (vehicle: Vehicle) => set((state) => ({
        vehicles: state.vehicles.map((v) => v.id === vehicle.id ? vehicle : v),
      })),

      setWorkPrices: (workPrices: WorkPrice[]) => set({ workPrices }),
    }),
    {
      name: 'qq-calendar-auth',
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        userRole: state.userRole,
        loginTime: state.loginTime,
      }),
    }
  )
);
