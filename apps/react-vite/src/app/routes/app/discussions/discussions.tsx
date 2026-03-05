/*
.* 화면 view > 로직 > API 순서로 파고들기 
.* app 폴더 아래 routes의 역할
.* URL: localhost:3000/app/discussions
.* 최종 페이지에 features 폴더에 있는 컴포넌트들로 조립하여 완성
.* 가장 큰 단위 컴포넌트: 어떤 URL에 어떤 페이지를 매핑해서 보여줄지 결정하는 로직을 담음
*/
import { QueryClient, useQueryClient } from '@tanstack/react-query'; // query: fetch, cache - server side state
import { LoaderFunctionArgs } from 'react-router'; // mapping url to page

// @/component: at alias, at prefix to avoid relative path
// 상대경로보다는 절대 경로 권장, 파일이 포함된 폴더 레벨에서 지정됨
import { ContentLayout } from '@/components/layouts';
import { getInfiniteCommentsQueryOptions } from '@/features/comments/api/get-comments';
import { getDiscussionsQueryOptions } from '@/features/discussions/api/get-discussions';
import { CreateDiscussion } from '@/features/discussions/components/create-discussion';
import { DiscussionsList } from '@/features/discussions/components/discussions-list';

/*
.* clientLoader는 리액트 라우터의 로더 기능과 리액트 쿼리를 연결해주는 코드
.* 리액트 라우터가 페이지를 이동하기 전에 이 로더 함수를 먼저 실행시켜서 
.* 화면 그리기 전에 데이터 부터 준비해라는 뜻 
.* router.tsx의 converter에 queryClient가 있긴함 
*/

// url과 데이터가 연결되는 지점
export const clientLoader =
  (queryClient: QueryClient) =>
  // 1단계: queryClient 받고나서
  // 커링, 클로저 구조
  // request 객체를 디스트럭쳐링해서 사용. React Router가 현재 URL 정보가 담긴 request를 던져줌
  async ({ request }: LoaderFunctionArgs) => {
    // 2단계: request 객체 받기
    // request.url 현재 주소를 분석해서 (url 파싱-분석해서)
    const url = new URL(request.url);
    // web API: url 쿼리스트링의 페이지 번호를 추출 (페이지 정보 추출) ?page=1 에서 값만 추출, 스트링형태이므로 Number() 로 변환
    const page = Number(url.searchParams.get('page') || 1);
    // queryClient.prefetchInfiniteQuery()에서 이 데이터는 목록 형태 list 이고,
    // 앞으로 계속 이어 붙일 데이터다 (infinite scroll) 특성 추가
    // 서버에 요청보냄 캐시에 반환된 데이터 저장함. 나중에 컴포넌트가 찾으러 올테니 미리 캐시 창고에 넣어놔야지
    const query = getDiscussionsQueryOptions({ page });
    // queryOptions 함수로 옵션에 따라 재사용

    return (
      // queryKey로 캐시에서 데이터 찾거나 새로 fetch해서 캐시에 저장한 다음 반환
      // 패턴 queryClient.getQueryData() or fetchQuery()
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };
// DiscussionsRoute는 페이지 컴포넌트
const DiscussionsRoute = () => {
  // useQueryClient는 react-query에서 가져온 데이터 준비, 관리 도구
  // prefetchInfiniteQuery 내장 기능을 사용해 데이터 미리 가져오기를 수행할 수 있음
  // 최상위에서 만들어진 queryClient 인스턴스를 컴포넌트 내부에서 가져와서 쓰려면 useQueryClient 훅을 사용한다.
  const queryClient = useQueryClient();
  // queryClient 내부는 키,벨류 형태의 거대 자바스크립트 객체를 들고있다. 브라우저의 메모리, 즉 자바스크립트 변수안에 캐싱/저장이 된다.
  return (
    <ContentLayout title="Discussions: here goes the prop">
      {/* 글로벌로 쓰이는 contentLayout으로 children prop을 사용해 불필요한 리렌더링을 제한해 성능 향상함 
      - 부모에의한 리렌더링을 제한한 독립된 virtual dom 구조  */}
      <div className="flex justify-end">
        <CreateDiscussion />
        {/* 컴포넌트: create Discussion button이 있고 mutation으로 사이드 모달 폼이 나오게 됨*/}
      </div>
      <div className="mt-4">
        <DiscussionsList
          // 컴포넌트: 테이블 형태의 discussion 리스트 컴포넌트 prefect로 호버시 미리 데이터 로드해 성능 최적화
          onDiscussionPrefetch={(id) => {
            // Prefetch the comments data when the user hovers over the link in the list
            // 위에서 react-query의 useQueryClient의 인스턴스를 가져왔고,
            // prefetchInfiniteQuery 내장 메소드로 미리 데이터 가져오기를 수행함
            // infinite scrolling을 지원하는 앱에 적합
            // prefetchQuery도 있음. 아래 아티클 참고
            // https://medium.com/@emiklad/a-beginners-guide-to-react-query-tanstack-v5-part-5-using-the-queryclient-fc143166977f
            queryClient.prefetchInfiniteQuery(
              // getInfiniteCommentsQueryOptions()는 커스텀 헬퍼 함수로 어떤 쿼리 키로 어떤 API함수를 부를지 설정값 가져옴
              getInfiniteCommentsQueryOptions(id),
            );
          }}
        />
      </div>
    </ContentLayout>
  );
};
/* 리액트는 뷰만 담당하는 라이브러리. 페이지 이동과 데이터 관리 기능을 보충해줘야한다. 
.* 리액트 라우터: URL을 보고 어떤 컴포넌트 페이지를 화면에 그릴지 결정 -> 이 주소로 오면 이 페이지 보여줘
.* 리액트 쿼리: 서버에서 데이터 가져오고(fetch) 보관(cache) 
.* 
.* 순서
.* React router: url과 컴포넌트 (페이지) 매핑, 사용자가 /discussions/1 페이지로 가고싶다.
.* React query: 그럼 이동전에 미리 서버에서 데이터 챙겨놓을게 fetch, 캐시에 저장. query key -> data 
.* React Router: 컴포넌트 데이터와 함께 렌더링, 화면 보여주기 
*/
export default DiscussionsRoute;
// export { clientLoader }; -> Best Practice는 하단에 named, default export 둘다 명시 하는 것

/**
 * router.tsx에서 import('./routes/app/discussions/discussions')로 동적으로 불러와지면
 * Module Namespace object를 resolve하는 Promise를 반환한다.
 * ES6 모듈 규칙에 의해 named export, default export 를 참고해 해당 이름 키로 들어간다.
 *
 * 모듈 객체
 * {
 * clientLoader: [Function],
 * default: [Function: DiscussionsRoute]
 * [Symbol(Symbol.toStringTag)]: "Module"
 * }
 *
 */
