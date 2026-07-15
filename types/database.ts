export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRole = "admin" | "teacher" | "viewer";
export type RecordingMode = "score_only" | "status_only" | "score_and_status";
export type AssignmentStatus =
  | "submitted"
  | "missing"
  | "revision"
  | "passed"
  | "pending_review"
  | "absent"
  | "exempt";
export type StudentStatus = "active" | "transferred" | "graduated" | "inactive";

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: ProfileRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AcademicTermRow = {
  id: string;
  academic_year: number;
  semester: number;
  is_active: boolean;
  created_at: string;
};

type ClassroomRow = {
  id: string;
  name: string;
  grade_level: number;
  room: string;
  academic_term_id: string;
  teacher_id: string;
  cover_image_url: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type StudentRow = {
  id: string;
  student_code: string;
  identity_number: string | null;
  first_name: string;
  last_name: string;
  nickname: string | null;
  number_in_class: number | null;
  avatar_url: string | null;
  pin_hash: string;
  status: StudentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ClassroomStudentRow = {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
  is_active: boolean;
};

type SubjectRow = {
  id: string;
  name: string;
  subject_code: string;
  icon: string;
  color: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ClassroomSubjectRow = {
  id: string;
  classroom_id: string;
  subject_id: string;
  teacher_id: string;
};

type AssignmentTemplateRow = {
  id: string;
  teacher_id: string;
  title: string;
  assignment_type: string;
  recording_mode: RecordingMode;
  default_max_score: number;
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AssignmentRow = {
  id: string;
  classroom_id: string;
  subject_id: string;
  template_id: string | null;
  title: string;
  assignment_type: string;
  recording_mode: RecordingMode;
  unit_name: string | null;
  category: string;
  description: string | null;
  preview_image_path: string | null;
  resource_url: string | null;
  max_score: number;
  activity_date: string;
  due_date: string | null;
  allow_bonus: boolean;
  auto_reward_enabled: boolean;
  is_locked: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type StudentAssignmentRecordRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  status: AssignmentStatus;
  submitted_at: string | null;
  revised_at: string | null;
  note: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type RewardTransactionRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  assignment_id: string | null;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
};

type BadgeRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  condition_type: string;
  condition_value: number | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
};

type StudentBadgeRow = {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_by: string;
  awarded_at: string;
};

type ActivityLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  created_at: string;
};

type AppSettingRow = {
  id: string;
  teacher_id: string;
  setting_key: string;
  setting_value: Json;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      academic_terms: TableDefinition<AcademicTermRow>;
      classrooms: TableDefinition<ClassroomRow>;
      students: TableDefinition<StudentRow>;
      classroom_students: TableDefinition<ClassroomStudentRow>;
      subjects: TableDefinition<SubjectRow>;
      classroom_subjects: TableDefinition<ClassroomSubjectRow>;
      assignment_templates: TableDefinition<AssignmentTemplateRow>;
      assignments: TableDefinition<AssignmentRow>;
      student_assignment_records: TableDefinition<StudentAssignmentRecordRow>;
      reward_transactions: TableDefinition<RewardTransactionRow>;
      badges: TableDefinition<BadgeRow>;
      student_badges: TableDefinition<StudentBadgeRow>;
      activity_logs: TableDefinition<ActivityLogRow>;
      app_settings: TableDefinition<AppSettingRow>;
    };
    Views: Record<string, never>;
    Functions: {
      get_dashboard_overview: {
        Args: { p_term_id?: string | null };
        Returns: Json;
      };
      is_admin: {
        Args: { request_user_id?: string };
        Returns: boolean;
      };
      can_access_classroom: {
        Args: { target_classroom_id: string; request_user_id?: string };
        Returns: boolean;
      };
      can_access_student: {
        Args: { target_student_id: string; request_user_id?: string };
        Returns: boolean;
      };
      can_access_subject: {
        Args: { target_subject_id: string; request_user_id?: string };
        Returns: boolean;
      };
      upsert_student_with_pin: {
        Args: {
          p_student_id?: string | null;
          p_student_code?: string | null;
          p_identity_number?: string | null;
          p_first_name?: string | null;
          p_last_name?: string | null;
          p_nickname?: string | null;
          p_number_in_class?: number | null;
          p_classroom_id?: string | null;
          p_status?: StudentStatus;
          p_pin?: string | null;
        };
        Returns: string;
      };
      verify_student_pin: {
        Args: {
          p_student_code: string;
          p_pin: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      profile_role: ProfileRole;
      recording_mode: RecordingMode;
      assignment_status: AssignmentStatus;
      student_status: StudentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
