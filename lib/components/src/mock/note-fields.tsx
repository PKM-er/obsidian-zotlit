import { useImmer } from "use-immer";
import type { NoteFieldsData } from "../components";
import { NoteFields } from "../components";

export function NoteFieldsMock() {
  const [fields, setFields] = useImmer<NoteFieldsData>(data);
  return (
    <NoteFields
      data={fields}
      onAdd={(field) =>
        setFields((draft) => {
          draft[field].push({ content: "", id: `${draft[field].length}` });
        })
      }
      onDelete={(field, index) =>
        setFields((draft) => {
          draft[field].splice(index, 1);
        })
      }
      onChange={(value, field, index) =>
        setFields((draft) => {
          draft[field][index].content = value;
        })
      }
    />
  );
}

const data = {
  question: [
    "What is the capital of India?",
    "What is the capital of USA?",
    "What is the capital of Germany?",
    "What is the capital of France?",
    "What is the capital of Japan?",
    "What is the capital of Canada?",
    "What is the capital of Australia?",
    "What is the capital of Brazil?",
    "What is the capital of Argentina?",
    "What is the capital of South Africa?",
    "What is the capital of China?",
    "What is the capital of Russia?",
    "What is the capital of Mexico?",
    "What is the capital of Spain?",
    "What is the capital of Italy?",
    "What is the capital of Poland?",
    "What is the capital of Sweden?",
    "What is the capital of Norway?",
    "What is the capital of Denmark?",
    "What is the capital of Finland?",
  ].map(toID),
  answer: [
    "Delhi",
    "Washington DC",
    "Berlin",
    "Paris",
    "Tokyo",
    "Ottawa",
    "Canberra",
    "Brasilia",
    "Buenos Aires",
    "Pretoria",
    "Beijing",
    "Moscow",
    "Mexico City",
    "Madrid",
    "Rome",
    "Warsaw",
    "Stockholm",
    "Oslo",
    "Copenhagen",
    "Helsinki",
  ].map(toID),
} satisfies NoteFieldsData;

function toID(content: string, index: number) {
  return { content, id: `${index}` };
}
