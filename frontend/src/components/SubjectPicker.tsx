'use client';

import { useEffect, useState } from 'react';

import { ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';

type Exam = { id: string; name: string };
type Subject = { id: string; name: string };

/** Exam first, then subject, so learners never scroll through every subject of every exam. */
export function SubjectPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (subjectId: string) => void;
}) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Exam[]>('/exams')
      .then(setExams)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load exams')));
  }, []);

  useEffect(() => {
    setSubjects([]);
    if (!examId) return;
    api<Subject[]>(`/subjects?examId=${examId}`)
      .then(setSubjects)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load subjects')));
  }, [examId]);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Exam">
        <select
          value={examId}
          onChange={(e) => {
            setExamId(e.target.value);
            onChange('');
          }}
          className={inputClass}
        >
          <option value="">Choose an exam</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Subject">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!examId}
          className={inputClass}
        >
          <option value="">Choose a subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <ErrorText message={error} />
    </div>
  );
}
