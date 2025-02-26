interface TopicSug {
  cha_name: string;
  view_count: number;
  cid: string;
  group_id: string;
  tag: number;
}

interface WordsQueryRecord {
  info: string;
  words_source: string;
  query_id: string;
}

interface Extra {
  now: number;
  logid: string;
  fatal_item_ids: any[];
  search_request_id: string;
}

interface LogPb {
  impr_id: string;
}

export interface DouyinTopicsSugResponse {
  sug_list: TopicSug[];
  status_code: number;
  status_msg: string;
  rid: string;
  words_query_record: WordsQueryRecord;
  extra: Extra;
  log_pb: LogPb;
}
