export type SavedLink = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  note: string | null;
  is_private: boolean;
  source: "web" | "pwa_share" | "extension";
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type LinkComment = {
  id: string;
  link_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
