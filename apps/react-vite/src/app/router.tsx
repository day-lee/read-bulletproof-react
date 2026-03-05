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

/* router.tsx는 url과 컴포넌트, 데이터를 매핑. 중앙 관리식
 code splitting, lazy loading, prefetching 등 라우터 레벨에서 페이지 최적화

 routes/app/discussions/discussions.tsx 에서 export 한 clientLoader가 여기서 사용됨
 일반적으로는 URL 접근 -> 컴포넌트 렌더링 -> 데이터 fetch 순서이나
 이 플젝은 데이터 라우터 방식으로
 URL 접근 -> JS 코드 다운로드 -> convert 함수 실행 -> loader 실행(데이터 fetch) -> 데이터 준비 완료 -> 컴포넌트 렌더링

 사용자 /discussions 접근 -> router.tsx의 loader 실행 -> React Query 캐시 확인
 캐시 없으면 - API 호출, 캐시 저장
 캐시 있으면 - 바로 사용
 discussion 페이지 렌더링 (데이터는 이미 준비됨)
 * */

/*
* convert 함수
 커스텀 코드로 router와 query를 연결하기 위한 유틸리티 함수
 각 페이지 파일의 loader에 queryClient를 주입해주는 브릿지 역할
 convert 함수는 라우터가 lazy 로딩으로 해당 페이지의 JS코드를 다운로드하자마자, 
 UI를 화면에 그리는 작업과 데이터를 서버에서 가져오는 작업을 병렬 처리함 
 convert가 필요한 이유는 
 React Router lazy 속성이 { component, loader, action} 형태의 객체를 요구하기 때문에 변환이 필요함. 
*/

/*
 * 시간차 예약 테크닉
 인자를 두번에 나누어서 받는 것은 커링 curring, 고차함수 higher-order-function 패턴
 이 방식을 사용하는 이유는 두 인자가 준비되는 시간에 차이가 있기 때문 
 앱이 처음 켜질때, 첫 번째 인자 queryClient가 준비됨. 
 두 번째 인자 m은 모듈을 뜻하며 사용자가 해당 페이지로 이동해서 import 파일 다운로드가 끝난 후에야 생성됨 
 그래서 한번에 묶어서 부를 수가 없는 것 
 라우터 세팅시 convert(queryClient) 가 1차로 실행되고
 새로운 함수 (m) => {..} 가 반환됨, queryClient를 기억하고 있음 -> 클로저 
 파일 다운로드가 끝나면 .then()이 알아서 그 함수에 m을 넣어주며 실행함 
*/
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  // react-router가 요구하는 객체 형태로 변환
  return {
    ...rest,
    // 함수를 즉시 실행하지않고, 함수 자체를 전달함. 옵셔널 체이닝 ?.으로 clientLoader가 undefined면 호출하지 않음
    loader: clientLoader?.(queryClient), // 결과 async ({ request }: LoaderFunctionArgs) => {...}
    // 결과적으로 loader에는 데이터가 들어가게 됨. React Router는 이 loader 함수를 페이지 렌더링 전에 실행해서 데이터를 준비함
    action: clientAction?.(queryClient), // 형식상 존재, undefined 무시
    Component, // 모듈 객체 default 키의 DiscussionsRoute 컴포넌트 할당
  };
};
/**
* router의 lazy 와 query의 loader를 결합한 코드임 
* 1. lazy + import(): 코드 스플리팅 
* 페이지에 실제 접근할 때만 해당 컴포넌트 코드를 로드 - 앱 최초 로딩시 모든 코드 한번에 받지 않아도 됨 
*  
  lazy: () => import(...).then(convert(queryClient)) 의 최종 결과물은 아래의 객체
*       {
*         loader: async ({ request }) => // url 파싱하고 캐시 확인/fetch 하는 함수
*         action: undefined,
*         Component: function DiscussionsRoute() // 화면 렌더링 로직 
*       }
* 
* 2. 데이터 미리 준비 
* convert(queryClient)
*/
export const createAppRouter = (queryClient: QueryClient) =>
  // 공식 API: 라우터가 화면을 그리기 전에 js객체 형태로 경로와 데이터 미리 파악하려고 배열형태로 정보 받는 함수
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
            // 첫 import에서 discussions.tsx 모듈 전체를 m으로 받고,
            // module 객체는 이렇게 생김: { clientLoader, clientAction, default: Component, ...rest }
            // convert(queryClient)로 변환된 함수에 m을 넣어서 실행
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

/**
요약: 전체 흐름도
사용자가 /app/discussions URL에 접근하면 다음과 같은 연쇄 작용이 일어납니다.

React Router: "어? 여기 lazy가 걸려있네? 파일을 동적으로 불러오자." -> import() 실행.
Network: discussions.tsx 파일을 다운로드함.
JavaScript Engine: 다운받은 파일의 export 문들을 읽어서 위에서 본 Module Namespace Object(m)를 생성함.
Promise.then: 생성된 모듈 객체 m이 .then(convert(queryClient))로 넘어가서 가공됨.
React Router: 가공된 최종 객체에서 loader를 발견하고, 화면을 그리기 전에 loader를 먼저 실행하여 React Query로 데이터를 미리 Fetch/Cache 해둠.
React Router: 데이터 준비가 끝나면, Component (즉, DiscussionsRoute)를 화면에 렌더링함!
*/
