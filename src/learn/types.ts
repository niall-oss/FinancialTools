export interface LearnSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export interface LearnTopic {
  id: string;
  title: string;
  body: string;
  sourceIds: string[];
}

export interface LearnContent {
  overview: string;
  topics: LearnTopic[];
  sources: LearnSource[];
}
