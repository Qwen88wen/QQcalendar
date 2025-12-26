import { create } from 'zustand';
import type { Diary, DiaryRemark, Profile, UserRole } from '../types/database';

interface AppState {
  // 用户状态
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  profile: Profile | null;

  // 数据
  diaries: Diary[];
  remarks: DiaryRemark[];

  // UI 状态
  selectedDiary: Diary | null;
  isModalOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;

  // Actions
  setUser: (userId: string | null, userName: string | null) => void;
  setProfile: (profile: Profile | null) => void;
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
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  userId: null,
  userName: null,
  userRole: null,
  profile: null,
  diaries: [],
  remarks: [],
  selectedDiary: null,
  isModalOpen: false,
  isEditing: false,
  isLoading: true,

  // Actions
  setUser: (userId, userName) => set({ userId, userName }),

  setProfile: (profile) => set({
    profile,
    userRole: profile?.role ?? null
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
}));
