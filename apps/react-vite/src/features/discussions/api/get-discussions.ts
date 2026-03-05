import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Discussion, Meta } from '@/types/api';

export const getDiscussions = (
  page = 1,
): Promise<{
  data: Discussion[];
  // page 데이터 형태는 ts 타입 정의 파일에.
  meta: Meta;
}> => {
  // response로 받은 promise 객체 반환.
  return api.get(`/discussions`, {
    params: {
      page,
    },
  });
};
/**
queryOptions 객체를 반환하는 함수
loader, create-, delete- 에서 재사용됨 
*/
export const getDiscussionsQueryOptions = ({
  page,
}: { page?: number } = {}) => {
  // queryOptions함수를 사용해 옵션 미리 정의 및 재사용 : queryKey, queryFn을 받음
  return queryOptions({
    // page 존재 여부에따라 키 배열의 모양이 달라짐: 다중 아이템 쿼리 키
    // queryKey는 쿼리 캐시에서 데이터 식별하는 중요한 단서.
    queryKey: page ? ['discussions', { page }] : ['discussions'],
    // default 값 page = 1 설정. 데이터를 가져오는 비동기 함수 : 데이터 or 오류 반환
    queryFn: () => getDiscussions(page),
  });
};

type UseDiscussionsOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getDiscussionsQueryOptions>;
};

export const useDiscussions = ({
  queryConfig,
  page,
}: UseDiscussionsOptions) => {
  return useQuery({
    ...getDiscussionsQueryOptions({ page }),
    ...queryConfig,
  });
};
