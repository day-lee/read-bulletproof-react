/*
.* Vite 환경에서는 CRS 구조
.* Vite + React Query + React Router 
.* 브라우저가 모든걸 다 하고있음 
.* 
.* 리액트 라우터의 경우, SSR 환경에서는 react-router 대신 프레임워크 내장 라우터로 대체해서 사용: App Router, Page Router)
.* 리액트 쿼리의 경우, SSR환경에서도 많이 사용됨: 첫 렌더링 이후에는 SPA처럼 동장하므로 데이터 다시 가져올 경우 있음 
.* 비동기 데이터 캐싱과 서버 상태관리는 SSR에서도 필요함. 
.* RSC(React Server Component) next.13에서는 컴포넌트가 서버에서 실행됨. 서버에서 바로 데이터 페칭함           
*/

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
