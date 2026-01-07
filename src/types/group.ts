// Tipos compartidos para grupos

export interface GroupMember {
  user_id: string;
  name: string;
  avatar?: string;
}

export interface JoinRequest {
  user_id: string;
  name: string;
  avatar?: string;
}

export interface GroupMessage {
  name: string;
  content: string;
  created_at: string;
}

export interface Group {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  owner_id: string;
  owner_name: string;
  members: GroupMember[];
  max_members: number;
  mode: string;
  language: string;
  level: string;
  status: string;
  requirements?: string;
  schedule?: string;
  discord_link?: string;
  joinRequests?: JoinRequest[];
}
