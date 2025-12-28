-- Create exam terms/periods table
CREATE TABLE public.exam_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create student scores table
CREATE TABLE public.student_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  exam_term_id UUID NOT NULL REFERENCES public.exam_terms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_score DECIMAL(5,2) DEFAULT 0,
  quiz_score DECIMAL(5,2) DEFAULT 0,
  exam_score DECIMAL(5,2) DEFAULT 0,
  attendance_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) GENERATED ALWAYS AS (
    COALESCE(class_score, 0) + COALESCE(quiz_score, 0) + COALESCE(exam_score, 0) + COALESCE(attendance_score, 0)
  ) STORED,
  grade TEXT,
  remarks TEXT,
  is_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_id, exam_term_id)
);

-- Enable RLS
ALTER TABLE public.exam_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;

-- Exam terms policies
CREATE POLICY "Admins can manage exam terms"
ON public.exam_terms FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view exam terms"
ON public.exam_terms FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Student scores policies
CREATE POLICY "Admins can manage all scores"
ON public.student_scores FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can insert scores for their assignments"
ON public.student_scores FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher') AND
  teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update their submitted scores"
ON public.student_scores FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher') AND
  teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  ) AND
  is_submitted = false
);

CREATE POLICY "Teachers can view scores they submitted"
ON public.student_scores FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Students can view their published scores"
ON public.student_scores FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  ) AND
  exam_term_id IN (
    SELECT et.id FROM public.exam_terms et WHERE et.is_published = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_student_scores_updated_at
BEFORE UPDATE ON public.student_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();