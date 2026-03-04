import { nanoid } from 'nanoid';
import { create } from 'zustand';

// 알림 시스템 정의, 타입을 4가지로 분류
// 알림이 생길때마다 화면에 쌓여서 표시됨 maxHeight에 따라 숫자 제한이 있고, x버튼 누르면 하나씩 사라짐
export type Notification = {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message?: string;
};

// 알림 저장 store, 알림추가.제거 함수 타입 포함
type NotificationsStore = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
};

// zustand는 경량 상태 관리 라이브러리 redux 대신 사용
export const useNotifications = create<NotificationsStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: nanoid(), ...notification },
      ],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    })),
}));
