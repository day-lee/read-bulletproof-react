import { QueryClient, useQueryClient } from '@tanstack/react-query';
// React-Query는 fetching, caching, synchronising and updating server state
// 서버 데이터를 다루는 복잡함을 해결한다.
import { useMemo } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/lib/auth';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';

/*
.* router.tsx는 url과 데이터를 매핑. 중앙 관리식 
.* code splitting, lazy loading, prefetching  등 라우터 레벨에서 페이지 최적화  
.* 
.* routes/app/discussions/discussions.tsx 에서 export 한 clientLoader가 여기서 사용됨  
.* 일반적으로는 URL 접근 -> 컴포넌트 렌더링 -> 데이터 fetch 순서이나 
.*
.* 이 플젝은 데이터 라우터 방식으로
.* URL 접근 -> (동시에) 데이터 fetch 시작 -> 컴포넌트 렌더링 
.* 사용자 /discussions 접근 -> router.tsx의 loader 실행 -> React Query 캐시 확인 
.* 캐시 없으면 - API 호출, 캐시 저장
.* 캐시 있으면 - 바로 사용
.* discussion 페이지 렌더링 (데이터는 이미 준비됨)
*/

/*
.* 커스텀 코드로 router와 query를 연결하기 위한 유틸리티 함수
.* 각 페이지 파일의 loader/action에 queryClient를 주입해주는 브릿지 역할
*/
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};
/* 
.* 1. lazy + import(): 코드 스플리팅 
.* 페이지에 실제 접근할 때만 해당 컴포넌트 코드를 로드 - 앱 최초 로딩시 모든 코드 한번에 받지 않아도 됨 
.* 
.* 2. 데이터 미리 준비 
.* convert(queryClient)
*/
export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/landing').then(convert(queryClient)),
    },
    {
      path: paths.auth.register.path,
      lazy: () => import('./routes/auth/register').then(convert(queryClient)),
    },
    {
      path: paths.auth.login.path,
      lazy: () => import('./routes/auth/login').then(convert(queryClient)),
    },
    {
      path: paths.app.root.path,
      element: (
        <ProtectedRoute>
          <AppRoot />
        </ProtectedRoute>
      ),
      ErrorBoundary: AppRootErrorBoundary,
      /*
      .* 사용자가 /discussions url 접근 
      .* lazy 실행 -> discussions.tsx 코드 다운로드
      .* convert(queryClient) 실행
      .* loader에 정의된 데이터 fetch 시작 (캐시 확인해서 없으면 API 호출)
      .* 코드와 데이터 모두 준비되면 페이지 렌더링
      */
      children: [
        {
          path: paths.app.discussions.path,
          lazy: () =>
            import('./routes/app/discussions/discussions').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.discussion.path,
          lazy: () =>
            import('./routes/app/discussions/discussion').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.users.path,
          lazy: () => import('./routes/app/users').then(convert(queryClient)),
        },
        {
          path: paths.app.profile.path,
          lazy: () => import('./routes/app/profile').then(convert(queryClient)),
        },
        {
          path: paths.app.dashboard.path,
          lazy: () =>
            import('./routes/app/dashboard').then(convert(queryClient)),
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
