import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

import { MainErrorFallback } from '@/components/errors/main';
import { Notifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { AuthLoader } from '@/lib/auth';
import { queryConfig } from '@/lib/react-query';

type AppProviderProps = {
  children: React.ReactNode;
};
/**
앱 시작시 main.tsx -> AppProvider 컴포넌트가 렌더링됨
하나의 QueryClient 인스턴스를 앱 전체에서 공유하기 위한 최상위단 생성

queryClient는 브라우저 RAM(JS 힙 메모리)에 존재함
localStorage나 indexedDB 같은 브라우저 저장소보다 JS 변수 메모리에서 값 꺼내오는것이 훨씬 빠름
브라우저 새로고침하면 객체 사라짐, 컴포넌트 마운트시 데이터 없으면 다시 서버에서 가져와서 채워넣음 

쿼리 클라이언트 데이터 형태 예시 (데이터 + 메타)
  queryCache = { '["discussions", {"page":1}]': {
    data: [{ id: 1, title: 'first title'}, {..}],
    status: 'success', - pending, error 등의 상태 
    dataUpdatedAt: 123444,
    staleTime: 60000, - 신선함 기준 
    isStale: false, - 유통기한 지났는지
    observer: 2, - 현재 이 데이터 구독하는 컴포넌트 수
    }, ... } 
*/

/*
실무 팁
1. 메모리가 터지지 않을까? (Garbage Collection, gcTime)
- 사용자가 브라우저 안닫고 하루종일 돌아다니면 캐시가 쌓여 느려지면 어떡해?
gcTime 옵션으로 데이터가 화면에 보이지 않은지 오래된 데이터는(언마운트) 이제 안쓰는구나 하고 메모리에서 삭제함(garbage collection)

2. stale time이 지났을 때 오래된 데이터로인해 로딩 스피너가 돌면어떡해?
- 오래된 데이터라도 일단 화면에 보여주고, 백그라운드에서 최신 데이터 fetch해서 최신 데이터 도착시 화면 업뎃함
로딩 속도를 고려한 전략
*/

/**
Lazy Initialization(지연 초기화) 패턴
*/
export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            {import.meta.env.DEV && <ReactQueryDevtools />}
            <Notifications />
            <AuthLoader
              renderLoading={() => (
                <div className="flex h-screen w-screen items-center justify-center">
                  <Spinner size="xl" />
                </div>
              )}
            >
              {children}
            </AuthLoader>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
