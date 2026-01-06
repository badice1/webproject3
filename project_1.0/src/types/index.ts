export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'member' | 'admin';
  membership_level?: string;
  membership_status?: 'active' | 'inactive' | 'pending';
  membership_duration_days?: number; // 会员剩余时长（天）
  payment_status?: string;
  join_date?: string;
  phone?: string;
  institution?: string; // For "Student" or work place
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  full_name: string;
  content: string; // Could be JSON string
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AppMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  message_type: 'text' | 'event_application';
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile; // Joined
  receiver?: Profile; // Joined
}

export interface AppEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  location: string;
  event_time: string;
  max_participants: number;
  created_at: string;
  creator?: Profile; // Joined
  participant_count?: number; // Calculated or joined
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile; // Joined
}
