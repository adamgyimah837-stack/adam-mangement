-- Create school_info table
CREATE TABLE IF NOT EXISTS public.school_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT,
  contact_email TEXT,
  phone_number TEXT,
  address TEXT,
  about TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fee_categories table
CREATE TABLE IF NOT EXISTS public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create timetables table
CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create class_assignments table for tracking teacher-class relationships
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable RLS
ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- School info policies
CREATE POLICY "Admins can manage school info"
ON public.school_info FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view school info"
ON public.school_info FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fee categories policies
CREATE POLICY "Admins can manage fee categories"
ON public.fee_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view fee categories"
ON public.fee_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Timetables policies
CREATE POLICY "Admins can manage timetables"
ON public.timetables FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view timetables"
ON public.timetables FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Payments policies
CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents can view their child payments"
ON public.payments FOR SELECT
USING (
  has_role(auth.uid(), 'parent') AND
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.parent_user_id = auth.uid()
  )
);

CREATE POLICY "Students can view their payments"
ON public.payments FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

-- Class assignments policies
CREATE POLICY "Admins can manage class assignments"
ON public.class_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their assignments"
ON public.class_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  )
);

-- Attendance policies
CREATE POLICY "Admins can manage attendance"
ON public.attendance FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage attendance for their classes"
ON public.attendance FOR ALL
USING (
  has_role(auth.uid(), 'teacher') AND
  class_id IN (
    SELECT ca.class_id FROM public.class_assignments ca
    WHERE ca.teacher_id IN (
      SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Students can view their attendance"
ON public.attendance FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their child attendance"
ON public.attendance FOR SELECT
USING (
  has_role(auth.uid(), 'parent') AND
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.parent_user_id = auth.uid()
  )
);
