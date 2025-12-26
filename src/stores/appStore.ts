import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Diary, DiaryRemark, UserRole, FlowerType } from '../types/database';
import type { LocalUser } from '../lib/users';

// 花朵筛选类型
export type FlowerFilter = 'all' | FlowerType;

// 输入用户类型 (对应 LOCAL_USERS)
export type InputUser = 'QQrou' | 'QQfang' | 'QQwen';

interface AppState {
  // 用户状态
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;

  // 数据
  diaries: Diary[];
  remarks: DiaryRemark[];

  // UI 状态
  selectedDiary: Diary | null;
  isModalOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;

  // 新增: 筛选和输入状态
  flowerFilter: FlowerFilter;
  activeInputUser: InputUser;
  showRecordList: boolean;
  focusedFlowerId: string | null;

  // Actions
  loginUser: (user: LocalUser) => void;
  logoutUser: () => void;
  setDiaries: (diaries: Diary[]) => void;
  addDiary: (diary: Diary) => void;
  updateDiary: (diary: Diary) => void;
  removeDiary: (id: string) => void;
  setRemarks: (remarks: DiaryRemark[]) => void;
  addRemark: (remark: DiaryRemark) => void;
  setSelectedDiary: (diary: Diary | null) => void;
  openModal: (diary?: Diary) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;

  // 新增 Actions
  setFlowerFilter: (filter: FlowerFilter) => void;
  setActiveInputUser: (user: InputUser) => void;
  toggleRecordList: () => void;
  setFocusedFlower: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      userId: null,
      userName: null,
      userRole: null,
      diaries: [],
      remarks: [],
      selectedDiary: null,
      isModalOpen: false,
      isEditing: false,
      isLoading: false,

      // 新增状态
      flowerFilter: 'all',
      activeInputUser: 'QQrou',
      showRecordList: false,
      focusedFlowerId: null,

      // Actions
      loginUser: (user) => set({
        userId: user.id,
        userName: user.displayName,
        userRole: user.role,
      }),

      logoutUser: () => set({
        userId: null,
        userName: null,
        userRole: null,
      }),

      setDiaries: (diaries) => set({ diaries }),

      addDiary: (diary) => set((state) => ({
        diaries: [diary, ...state.diaries]
      })),

      updateDiary: (diary) => set((state) => ({
        diaries: state.diaries.map((d) => d.id === diary.id ? diary : d),
        selectedDiary: state.selectedDiary?.id === diary.id ? diary : state.selectedDiary,
      })),

      removeDiary: (id) => set((state) => ({
        diaries: state.diaries.filter((d) => d.id !== id),
        selectedDiary: state.selectedDiary?.id === id ? null : state.selectedDiary,
      })),

      setRemarks: (remarks) => set({ remarks }),

      addRemark: (remark) => set((state) => ({
        remarks: [...state.remarks, remark],
      })),

      setSelectedDiary: (diary) => set({ selectedDiary: diary }),

      openModal: (diary) => set({
        isModalOpen: true,
        selectedDiary: diary ?? null,
        isEditing: !!diary,
      }),

      closeModal: () => set({
        isModalOpen: false,
        selectedDiary: null,
        isEditing: false,
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      // 新增 Actions
      setFlowerFilter: (filter) => set({ flowerFilter: filter }),
      setActiveInputUser: (user) => set({ activeInputUser: user }),
      toggleRecordList: () => set((state) => ({ showRecordList: !state.showRecordList })),
      setFocusedFlower: (id) => set({ focusedFlowerId: id }),
    }),
    {
      name: 'qq-calendar-auth',
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        userRole: state.userRole,
      }),
    }
  )
);
