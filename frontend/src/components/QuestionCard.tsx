'use client';

export type Option = { key: string; text: string };
export type ServedQuestion = { id: string; versionId: string; body: string; options: Option[] };
export type ReviewItem = {
  questionId: string;
  response: string | null;
  isCorrect: boolean | null;
  answerKey: string | null;
  explanation: string | null;
  body: string | null;
};

type Props = {
  question: ServedQuestion;
  number: number;
  selected: string | undefined;
  onSelect: (key: string) => void;
};

export function QuestionCard({ question, number, selected, onSelect }: Props) {
  return (
    <fieldset className="flex flex-col gap-2 rounded border p-3">
      <legend className="px-1 font-medium">
        {number}. {question.body}
      </legend>
      {question.options.map((o) => (
        <label
          key={o.key}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 hover:bg-gray-50"
        >
          <input
            type="radio"
            name={question.id}
            value={o.key}
            checked={selected === o.key}
            onChange={() => onSelect(o.key)}
            className="h-5 w-5"
          />
          <span>
            {o.key}. {o.text}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function ReviewList({ items }: { items: ReviewItem[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={item.questionId} className="rounded border p-3">
          <p className="font-medium">
            {i + 1}. {item.body}
          </p>
          <p className={item.isCorrect ? 'text-green-800' : 'text-red-700'}>
            {item.isCorrect
              ? 'Correct'
              : `Your answer: ${item.response ?? '—'} · Correct answer: ${item.answerKey ?? '—'}`}
          </p>
          {item.explanation && <p className="text-sm text-gray-700">{item.explanation}</p>}
        </li>
      ))}
    </ol>
  );
}

export function toAnswers(questions: ServedQuestion[], answers: Record<string, string>) {
  return questions.flatMap((q) => {
    const response = answers[q.id];
    return response ? [{ questionVersionId: q.versionId, response }] : [];
  });
}
