import { AppProvider } from './provider';
import { AppRouter } from './router';

/*
.* app > routes > app(인증된 사용자만 접근 가능) / auth 는 크게 비공개/ 공개 영역으로 폴더를 나눴다. 
*/
export const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};
