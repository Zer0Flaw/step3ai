export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          source_type: "youtube" | "loom" | "file";
          source_url: string | null;
          source_file_path: string | null;
          status: "pending" | "transcribing" | "extracting" | "done" | "error";
          error_message: string | null;
          transcript: string | null;
          manual_data: Json | null;
          estimated_time: string | null;
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["jobs"]["Row"],
          "id" | "created_at" | "updated_at"
        > &
          Partial<Pick<Database["public"]["Tables"]["jobs"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
      };
      job_sections: {
        Row: {
          id: string;
          job_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["job_sections"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["job_sections"]["Row"]>;
      };
      job_steps: {
        Row: {
          id: string;
          job_id: string;
          section_id: string | null;
          title: string;
          description: string;
          note: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["job_steps"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["job_steps"]["Row"]>;
      };
      user_usage: {
        Row: {
          id: string;
          user_id: string;
          conversion_count: number;
          plan: "free" | "pro";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_usage"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["user_usage"]["Row"]>;
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["waitlist"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["waitlist"]["Row"]>;
      };
    };
  };
}

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobSection =
  Database["public"]["Tables"]["job_sections"]["Row"];
export type JobStep = Database["public"]["Tables"]["job_steps"]["Row"];
export type UserUsage = Database["public"]["Tables"]["user_usage"]["Row"];
