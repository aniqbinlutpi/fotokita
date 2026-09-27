export interface Wedding {
  id: string;
  name: string;
  slug: string;
  date: string;
  createdAt: string;
}

export interface CreateWeddingInput {
  name: string;
  slug: string;
  date: string;
}
