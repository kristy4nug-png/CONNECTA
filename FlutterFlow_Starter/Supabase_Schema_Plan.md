# Atlas future Supabase schema

Use this only after the local prototype is tested. Real sensitive data requires professional
security, governance and data-protection review.

## Tables

### profiles
- id uuid, primary key, references auth.users
- display_name text
- accessibility_preferences jsonb
- created_at timestamptz

### safety_checkins
- id uuid
- user_id uuid
- status text: steady | struggling | unsafe
- created_at timestamptz

### personal_tasks
- id uuid
- user_id uuid
- task_text text
- completed boolean
- due_at timestamptz nullable

### meetings
- id uuid
- user_id uuid
- fellowship text
- meeting_name text
- meeting_date date
- meeting_time time
- format text
- location_or_link text
- private_notes text

### reflections
- id uuid
- user_id uuid
- reflection_date date
- feeling text
- need text
- safe_action text
- journal text

### support_contacts
- id uuid
- user_id uuid
- display_order integer
- name_or_role text
- phone text
- support_note text

### service_promises
- id uuid
- user_id uuid
- promise_text text
- action_owner text
- due_date date
- status text
- evidence_note text

### transition_items
- id uuid
- user_id uuid
- item_key text
- completed boolean
- completed_at timestamptz

## Security rule
Enable Row Level Security on every personal table. Each authenticated user may only access
rows where user_id = auth.uid(). Staff access must be built later through explicit,
limited consent scopes, never through broad unrestricted access.
